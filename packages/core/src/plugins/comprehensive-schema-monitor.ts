import { createPlugin } from '../index';
import SchemaAlertSystem from './schema-alerts';
import SchemaAnalytics from './schema-analytics';
import type { MappingConfig, CushionCore } from '../types';
import type { SchemaChangeEvent, SchemaMonitorConfig } from './schema-monitor';
import type { AlertConfig } from './schema-alerts';
import type { AnalyticsConfig } from './schema-analytics';

export interface ComprehensiveMonitorConfig {
  /** Schema monitoring configuration */
  monitor?: SchemaMonitorConfig;
  
  /** Alert system configuration */
  alerts?: AlertConfig;
  
  /** Analytics configuration */
  analytics?: AnalyticsConfig;
  
  /** Global settings */
  enabled?: boolean;
  developmentMode?: boolean;
  
  /** Integration settings */
  integrations?: {
    /** Slack webhook URL for notifications */
    slack?: {
      webhook: string;
      channel?: string;
      username?: string;
      iconEmoji?: string;
    };
    
    /** Email configuration */
    email?: {
      provider: 'sendgrid' | 'mailgun' | 'aws-ses';
      apiKey: string;
      from: string;
      to: string[];
      templates?: {
        alert: string;
        report: string;
      };
    };
    
    /** Dashboard/monitoring tools */
    dashboard?: {
      endpoint: string;
      apiKey: string;
      interval: number; // minutes
    };
    
    /** Webhook for custom integrations */
    webhook?: {
      url: string;
      headers?: Record<string, string>;
      events?: ('schema_change' | 'alert' | 'metrics_update')[];
    };
  };
  
  /** Reporting configuration */
  reporting?: {
    /** Enable daily reports */
    dailyReports?: boolean;
    
    /** Enable weekly reports */
    weeklyReports?: boolean;
    
    /** Custom report schedule (cron expression) */
    customSchedule?: string;
    
    /** Report recipients */
    recipients?: string[];
    
    /** Report format */
    format?: 'json' | 'html' | 'markdown';
  };
}

export class ComprehensiveSchemaMonitor {
  private alertSystem: SchemaAlertSystem;
  private analytics: SchemaAnalytics;
  private config: ComprehensiveMonitorConfig;
  private reportingInterval?: NodeJS.Timeout;

  constructor(config: ComprehensiveMonitorConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      developmentMode: config.developmentMode ?? process.env.NODE_ENV === 'development',
      ...config,
    };

    // Initialize components
    this.alertSystem = new SchemaAlertSystem({
      ...config.alerts,
      slackWebhook: config.integrations?.slack?.webhook,
      emailConfig: config.integrations?.email ? {
        apiKey: config.integrations.email.apiKey,
        from: config.integrations.email.from,
        to: config.integrations.email.to,
      } : undefined,
      developmentMode: this.config.developmentMode,
    });

    this.analytics = new SchemaAnalytics({
      ...config.analytics,
      onMetricsUpdate: (metrics) => {
        this.handleMetricsUpdate(metrics);
      },
      onHealthScoreChange: (score, previousScore) => {
        this.handleHealthScoreChange(score, previousScore);
      },
    });

    // Set up reporting
    this.setupReporting();
  }

  private setupReporting(): void {
    if (!this.config.reporting?.dailyReports && !this.config.reporting?.weeklyReports) {
      return;
    }

    // Set up daily reports (every 24 hours)
    if (this.config.reporting?.dailyReports) {
      this.reportingInterval = setInterval(() => {
        this.generateAndSendReport('daily');
      }, 24 * 60 * 60 * 1000);
    }

    // Set up weekly reports (every 7 days)
    if (this.config.reporting?.weeklyReports) {
      setTimeout(() => {
        setInterval(() => {
          this.generateAndSendReport('weekly');
        }, 7 * 24 * 60 * 60 * 1000);
      }, this.getTimeUntilNextWeek());
    }
  }

  private getTimeUntilNextWeek(): number {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + (7 - now.getDay()));
    nextWeek.setHours(9, 0, 0, 0); // 9 AM on Sunday
    return nextWeek.getTime() - now.getTime();
  }

  private async handleMetricsUpdate(metrics: any): Promise<void> {
    // Send metrics to dashboard
    if (this.config.integrations?.dashboard) {
      await this.sendToDashboard(metrics);
    }

    // Send to webhook
    if (this.config.integrations?.webhook?.events?.includes('metrics_update')) {
      await this.sendToWebhook('metrics_update', metrics);
    }
  }

  private async handleHealthScoreChange(score: number, previousScore: number): Promise<void> {
    // Alert if health score drops significantly
    if (score < 70 && previousScore >= 70) {
      await this.alertSystem.processAlert({
        id: `health_score_${Date.now()}`,
        severity: 'high',
        type: 'high_failure_rate',
        title: 'Health Score Drop',
        description: `Health score dropped from ${previousScore} to ${score}`,
        url: 'system-wide',
        timestamp: new Date(),
        metadata: { previousScore, currentScore: score },
        suggestedAction: 'Review recent schema changes and error patterns',
      });
    }
  }

  private async sendToDashboard(data: any): Promise<void> {
    if (!this.config.integrations?.dashboard) return;

    try {
      await fetch(this.config.integrations.dashboard.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.integrations.dashboard.apiKey}`,
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.error('[Cushion Monitor] Failed to send to dashboard:', error);
    }
  }

  private async sendToWebhook(event: string, data: any): Promise<void> {
    if (!this.config.integrations?.webhook) return;

    try {
      await fetch(this.config.integrations.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.integrations.webhook.headers,
        },
        body: JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data,
        }),
      });
    } catch (error) {
      console.error('[Cushion Monitor] Failed to send to webhook:', error);
    }
  }

  private async generateAndSendReport(type: 'daily' | 'weekly'): Promise<void> {
    const report = this.generateReport(type);
    
    if (!this.config.reporting?.recipients?.length) {
      console.log(`[Cushion Monitor] ${type} report generated but no recipients configured`);
      return;
    }

    // Send via email if configured
    if (this.config.integrations?.email) {
      await this.sendReportViaEmail(report, type);
    }

    // Send via Slack if configured
    if (this.config.integrations?.slack) {
      await this.sendReportViaSlack(report, type);
    }
  }

  private generateReport(type: 'daily' | 'weekly'): string {
    const currentMetrics = this.analytics.getCurrentMetrics();
    const alerts = this.alertSystem.getAlertHistory();
    const timeframe = type === 'daily' ? '24 hours' : '7 days';
    
    const cutoffTime = new Date(Date.now() - (type === 'daily' ? 24 : 168) * 60 * 60 * 1000);
    const recentAlerts = alerts.filter(alert => alert.timestamp > cutoffTime);
    
    const report = {
      title: `Cushion Schema Monitor ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      period: timeframe,
      generatedAt: new Date().toISOString(),
      summary: {
        healthScore: currentMetrics?.healthScore.overall || 0,
        totalRequests: currentMetrics?.performance.totalRequests || 0,
        errorRate: currentMetrics?.performance.errorRate || 0,
        schemaChanges: currentMetrics?.schemaEvolution.totalFieldChanges || 0,
        alertsTriggered: recentAlerts.length,
        stabilityTrend: currentMetrics?.predictiveInsights.schemaStabilityTrend || 'stable',
      },
      alerts: recentAlerts.slice(0, 10), // Top 10 recent alerts
      recommendations: currentMetrics?.predictiveInsights.recommendations || [],
      urlBreakdown: currentMetrics?.urlBreakdown || {},
    };

    if (this.config.reporting?.format === 'html') {
      return this.generateHtmlReport(report);
    } else if (this.config.reporting?.format === 'markdown') {
      return this.generateMarkdownReport(report);
    } else {
      return JSON.stringify(report, null, 2);
    }
  }

  private generateHtmlReport(report: any): string {
    const healthColor = report.summary.healthScore > 80 ? 'green' : 
                      report.summary.healthScore > 60 ? 'orange' : 'red';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .health-score { color: ${healthColor}; font-size: 24px; font-weight: bold; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; }
          .alert { background: #fff3cd; padding: 10px; margin: 5px 0; border-left: 4px solid #ffc107; }
          .critical { border-left-color: #dc3545; background: #f8d7da; }
          .recommendation { background: #d4edda; padding: 10px; margin: 5px 0; border-left: 4px solid #28a745; }
        </style>
      </head>
      <body>
        <h1>${report.title}</h1>
        <p><strong>Period:</strong> ${report.period}</p>
        <p><strong>Generated:</strong> ${new Date(report.generatedAt).toLocaleString()}</p>
        
        <div class="summary">
          <h2>Summary</h2>
          <p><strong>Health Score:</strong> <span class="health-score">${report.summary.healthScore}</span></p>
          <p><strong>Total Requests:</strong> ${report.summary.totalRequests}</p>
          <p><strong>Error Rate:</strong> ${report.summary.errorRate.toFixed(2)}%</p>
          <p><strong>Schema Changes:</strong> ${report.summary.schemaChanges}</p>
          <p><strong>Alerts Triggered:</strong> ${report.summary.alertsTriggered}</p>
          <p><strong>Stability Trend:</strong> ${report.summary.stabilityTrend}</p>
        </div>
        
        <h2>Recent Alerts</h2>
        ${report.alerts.map((alert: any) => `
          <div class="alert ${alert.severity === 'critical' ? 'critical' : ''}">
            <strong>${alert.title}</strong> - ${alert.severity.toUpperCase()}<br>
            <small>${alert.url} - ${new Date(alert.timestamp).toLocaleString()}</small><br>
            ${alert.description}
          </div>
        `).join('')}
        
        <h2>Recommendations</h2>
        ${report.recommendations.map((rec: any) => `
          <div class="recommendation">
            <strong>${rec.title}</strong> - ${rec.priority.toUpperCase()}<br>
            ${rec.description}<br>
            <small><em>Impact: ${rec.impact}</em></small>
          </div>
        `).join('')}
      </body>
      </html>
    `;
  }

  private generateMarkdownReport(report: any): string {
    const healthEmoji = report.summary.healthScore > 80 ? '✅' : 
                       report.summary.healthScore > 60 ? '⚠️' : '❌';
    
    return `
# ${report.title}

**Period:** ${report.period}
**Generated:** ${new Date(report.generatedAt).toLocaleString()}

## Summary

- **Health Score:** ${healthEmoji} ${report.summary.healthScore}
- **Total Requests:** ${report.summary.totalRequests}
- **Error Rate:** ${report.summary.errorRate.toFixed(2)}%
- **Schema Changes:** ${report.summary.schemaChanges}
- **Alerts Triggered:** ${report.summary.alertsTriggered}
- **Stability Trend:** ${report.summary.stabilityTrend}

## Recent Alerts

${report.alerts.map((alert: any) => `
### ${alert.severity === 'critical' ? '🚨' : '⚠️'} ${alert.title} (${alert.severity.toUpperCase()})
- **URL:** ${alert.url}
- **Time:** ${new Date(alert.timestamp).toLocaleString()}
- **Description:** ${alert.description}
`).join('')}

## Recommendations

${report.recommendations.map((rec: any) => `
### ${rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '📋' : '💡'} ${rec.title}
- **Priority:** ${rec.priority.toUpperCase()}
- **Category:** ${rec.category}
- **Description:** ${rec.description}
- **Impact:** ${rec.impact}
`).join('')}

---
*Generated by Cushion Schema Monitor*
    `.trim();
  }

  private async sendReportViaEmail(report: string, type: string): Promise<void> {
    // Email sending implementation would go here
    console.log(`[Cushion Monitor] ${type} report would be sent via email`);
  }

  private async sendReportViaSlack(report: string, type: string): Promise<void> {
    if (!this.config.integrations?.slack?.webhook) return;

    const payload = {
      text: `📊 Cushion Schema Monitor ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
      attachments: [
        {
          color: 'good',
          text: report.substring(0, 3000), // Slack has message limits
          footer: 'Cushion Schema Monitor',
        },
      ],
    };

    try {
      await fetch(this.config.integrations.slack.webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('[Cushion Monitor] Failed to send Slack report:', error);
    }
  }

  public async handleSchemaChange(event: SchemaChangeEvent): Promise<void> {
    // Record in analytics
    this.analytics.recordSchemaChange(event);

    // Send to alert system
    await (this.alertSystem as any).handleSchemaChange(event);

    // Send to webhook
    if (this.config.integrations?.webhook?.events?.includes('schema_change')) {
      await this.sendToWebhook('schema_change', event);
    }
  }

  public recordTransformation(url: string, success: boolean, transformTime: number): void {
    this.analytics.recordTransformation(url, success, transformTime);
  }

  public getDashboard(): any {
    return {
      currentMetrics: this.analytics.getCurrentMetrics(),
      alerts: this.alertSystem.getAlertHistory(),
      analytics: this.analytics.getMetricsHistory(),
    };
  }

  public exportReport(): string {
    return this.generateReport('daily');
  }

  public destroy(): void {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }
  }
}

export const createComprehensiveSchemaMonitorPlugin = (config: ComprehensiveMonitorConfig = {}) => {
  const monitor = new ComprehensiveSchemaMonitor(config);

  return createPlugin('comprehensive-schema-monitor', (core: CushionCore) => {
    // Monitor absorb operations
    core.onAbsorb((data: any, mapping: MappingConfig, context: any) => {
      const startTime = Date.now();
      
      try {
        const result = data; // Data is already transformed at this point
        const transformTime = Date.now() - startTime;
        
        monitor.recordTransformation(context.url, true, transformTime);
        
        // Check for schema changes
        const hasUndefinedFields = Object.values(result).some(value => value === undefined);
        if (hasUndefinedFields) {
          for (const [fieldName, value] of Object.entries(result)) {
            if (value === undefined) {
              monitor.handleSchemaChange({
                url: context.url,
                fieldName,
                changeType: 'missing',
                timestamp: new Date(),
              });
            }
          }
        }
        
        return result;
      } catch (error) {
        const transformTime = Date.now() - startTime;
        monitor.recordTransformation(context.url, false, transformTime);
        
        monitor.handleSchemaChange({
          url: context.url,
          fieldName: 'unknown',
          changeType: 'mapping_failed',
          timestamp: new Date(),
        });
        
        return data;
      }
    });

    // Monitor response processing
    core.onResponse((url: string, data: any) => {
      monitor.recordTransformation(url, true, 0);
      return data;
    });

    // Expose monitoring utilities
    return {
      getDashboard: () => monitor.getDashboard(),
      exportReport: () => monitor.exportReport(),
      destroy: () => monitor.destroy(),
    };
  });
};

export default createComprehensiveSchemaMonitorPlugin;