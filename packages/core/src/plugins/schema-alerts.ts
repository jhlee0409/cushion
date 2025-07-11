import type { SchemaChangeEvent } from './schema-monitor';

export interface AlertConfig {
  /** Enable different alert types */
  enableMissingFieldAlerts?: boolean;
  enableTypeChangeAlerts?: boolean;
  enableNewFieldAlerts?: boolean;
  enableMappingFailureAlerts?: boolean;
  
  /** Threshold for alerts */
  failureRateThreshold?: number; // 0-100, alert when failure rate exceeds this
  consecutiveFailuresThreshold?: number; // Alert after N consecutive failures
  
  /** Custom alert handlers */
  onAlert?: (alert: SchemaAlert) => void;
  onCriticalAlert?: (alert: SchemaAlert) => void;
  
  /** Notification settings */
  slackWebhook?: string;
  emailConfig?: {
    apiKey: string;
    from: string;
    to: string[];
  };
  
  /** Development mode settings */
  developmentMode?: boolean;
  suppressConsoleAlerts?: boolean;
}

export interface SchemaAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'missing_field' | 'type_change' | 'new_field' | 'mapping_failure' | 'high_failure_rate';
  title: string;
  description: string;
  url: string;
  timestamp: Date;
  metadata: any;
  suggestedAction?: string;
}

export class SchemaAlertSystem {
  private config: Required<AlertConfig>;
  private alertHistory: SchemaAlert[] = new Map();
  private urlFailureCount: Map<string, number> = new Map();
  private lastAlertTime: Map<string, Date> = new Map();
  private readonly ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  constructor(config: AlertConfig = {}) {
    this.config = {
      enableMissingFieldAlerts: config.enableMissingFieldAlerts ?? true,
      enableTypeChangeAlerts: config.enableTypeChangeAlerts ?? true,
      enableNewFieldAlerts: config.enableNewFieldAlerts ?? true,
      enableMappingFailureAlerts: config.enableMappingFailureAlerts ?? true,
      failureRateThreshold: config.failureRateThreshold ?? 20,
      consecutiveFailuresThreshold: config.consecutiveFailuresThreshold ?? 3,
      onAlert: config.onAlert ?? (() => {}),
      onCriticalAlert: config.onCriticalAlert ?? (() => {}),
      slackWebhook: config.slackWebhook ?? '',
      emailConfig: config.emailConfig ?? {
        apiKey: '',
        from: '',
        to: [],
      },
      developmentMode: config.developmentMode ?? process.env.NODE_ENV === 'development',
      suppressConsoleAlerts: config.suppressConsoleAlerts ?? false,
    };
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private shouldAlert(alertKey: string): boolean {
    const lastAlert = this.lastAlertTime.get(alertKey);
    if (!lastAlert) return true;
    
    return Date.now() - lastAlert.getTime() > this.ALERT_COOLDOWN;
  }

  private async sendSlackAlert(alert: SchemaAlert): Promise<void> {
    if (!this.config.slackWebhook) return;

    const payload = {
      text: `🚨 Cushion Schema Alert: ${alert.title}`,
      attachments: [
        {
          color: this.getSeverityColor(alert.severity),
          fields: [
            {
              title: 'URL',
              value: alert.url,
              short: true,
            },
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Description',
              value: alert.description,
              short: false,
            },
            {
              title: 'Suggested Action',
              value: alert.suggestedAction || 'Review schema mapping configuration',
              short: false,
            },
          ],
          footer: 'Cushion Schema Monitor',
          ts: Math.floor(alert.timestamp.getTime() / 1000),
        },
      ],
    };

    try {
      await fetch(this.config.slackWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('[Cushion Schema Alert] Failed to send Slack notification:', error);
    }
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return '#ffeb3b';
      case 'low': return 'good';
      default: return '#cccccc';
    }
  }

  private async sendEmailAlert(alert: SchemaAlert): Promise<void> {
    if (!this.config.emailConfig.apiKey) return;

    // This is a placeholder for email integration
    // You would integrate with services like SendGrid, Mailgun, etc.
    console.log('[Cushion Schema Alert] Email alert would be sent:', alert);
  }

  private createAlert(
    type: SchemaAlert['type'],
    severity: SchemaAlert['severity'],
    title: string,
    description: string,
    url: string,
    metadata: any = {},
    suggestedAction?: string
  ): SchemaAlert {
    return {
      id: this.generateAlertId(),
      severity,
      type,
      title,
      description,
      url,
      timestamp: new Date(),
      metadata,
      suggestedAction,
    };
  }

  private async processAlert(alert: SchemaAlert): Promise<void> {
    const alertKey = `${alert.type}_${alert.url}`;
    
    if (!this.shouldAlert(alertKey)) {
      return; // Skip due to cooldown
    }

    // Store alert
    this.alertHistory.set(alert.id, alert);
    this.lastAlertTime.set(alertKey, alert.timestamp);

    // Console output
    if (!this.config.suppressConsoleAlerts) {
      const severityEmoji = {
        low: '🟡',
        medium: '🟠',
        high: '🔴',
        critical: '💀',
      }[alert.severity];

      console.warn(
        `${severityEmoji} [Cushion Schema Alert] ${alert.title}`,
        {
          url: alert.url,
          description: alert.description,
          suggestedAction: alert.suggestedAction,
          metadata: alert.metadata,
        }
      );
    }

    // Call custom handlers
    this.config.onAlert(alert);
    
    if (alert.severity === 'critical') {
      this.config.onCriticalAlert(alert);
    }

    // Send external notifications
    if (this.config.slackWebhook) {
      await this.sendSlackAlert(alert);
    }
    
    if (this.config.emailConfig.apiKey) {
      await this.sendEmailAlert(alert);
    }
  }

  public async handleSchemaChange(event: SchemaChangeEvent): Promise<void> {
    let alert: SchemaAlert;

    switch (event.changeType) {
      case 'missing':
        if (!this.config.enableMissingFieldAlerts) return;
        
        alert = this.createAlert(
          'missing_field',
          'high',
          `Missing Field Detected: ${event.fieldName}`,
          `The field "${event.fieldName}" is returning undefined, which may indicate a schema change.`,
          event.url,
          { fieldName: event.fieldName },
          `Check if the server field mapping for "${event.fieldName}" is correct in your Cushion configuration.`
        );
        break;

      case 'type_changed':
        if (!this.config.enableTypeChangeAlerts) return;
        
        alert = this.createAlert(
          'type_change',
          'medium',
          `Type Change Detected: ${event.fieldName}`,
          `The field "${event.fieldName}" changed from ${event.expectedType} to ${event.actualType}.`,
          event.url,
          {
            fieldName: event.fieldName,
            expectedType: event.expectedType,
            actualType: event.actualType,
            oldValue: event.oldValue,
            newValue: event.newValue,
          },
          `Verify if this type change is expected and update your type definitions accordingly.`
        );
        break;

      case 'new_field':
        if (!this.config.enableNewFieldAlerts) return;
        
        alert = this.createAlert(
          'new_field',
          'low',
          `New Field Detected: ${event.fieldName}`,
          `A new field "${event.fieldName}" appeared in the response.`,
          event.url,
          {
            fieldName: event.fieldName,
            newValue: event.newValue,
          },
          `Consider if this new field should be mapped in your Cushion configuration.`
        );
        break;

      case 'mapping_failed':
        if (!this.config.enableMappingFailureAlerts) return;
        
        alert = this.createAlert(
          'mapping_failure',
          'high',
          `Mapping Failure: ${event.url}`,
          `Failed to apply mapping transformations for ${event.url}.`,
          event.url,
          event,
          `Review your mapping configuration and check server response format.`
        );
        break;

      default:
        return;
    }

    await this.processAlert(alert);
  }

  public async handleFailureRate(url: string, failureRate: number): Promise<void> {
    if (failureRate < this.config.failureRateThreshold) {
      return;
    }

    const alert = this.createAlert(
      'high_failure_rate',
      failureRate > 50 ? 'critical' : 'high',
      `High Failure Rate: ${url}`,
      `The failure rate for ${url} is ${failureRate.toFixed(1)}%, which exceeds the threshold of ${this.config.failureRateThreshold}%.`,
      url,
      { failureRate, threshold: this.config.failureRateThreshold },
      `Investigate potential schema changes or mapping issues for this endpoint.`
    );

    await this.processAlert(alert);
  }

  public async handleConsecutiveFailures(url: string, count: number): Promise<void> {
    if (count < this.config.consecutiveFailuresThreshold) {
      return;
    }

    const alert = this.createAlert(
      'mapping_failure',
      'critical',
      `Consecutive Failures: ${url}`,
      `${count} consecutive mapping failures detected for ${url}.`,
      url,
      { consecutiveFailures: count },
      `This endpoint may have undergone a major schema change. Review and update the mapping configuration immediately.`
    );

    await this.processAlert(alert);
  }

  public getAlertHistory(): SchemaAlert[] {
    return Array.from(this.alertHistory.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getAlertsForUrl(url: string): SchemaAlert[] {
    return this.getAlertHistory().filter(alert => alert.url === url);
  }

  public clearAlertHistory(): void {
    this.alertHistory.clear();
    this.lastAlertTime.clear();
  }

  public exportAlertReport(): string {
    const alerts = this.getAlertHistory();
    const summary = {
      total: alerts.length,
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length,
        low: alerts.filter(a => a.severity === 'low').length,
      },
      byType: {
        missing_field: alerts.filter(a => a.type === 'missing_field').length,
        type_change: alerts.filter(a => a.type === 'type_change').length,
        new_field: alerts.filter(a => a.type === 'new_field').length,
        mapping_failure: alerts.filter(a => a.type === 'mapping_failure').length,
        high_failure_rate: alerts.filter(a => a.type === 'high_failure_rate').length,
      },
    };

    return JSON.stringify({
      generatedAt: new Date().toISOString(),
      summary,
      alerts: alerts.slice(0, 50), // Last 50 alerts
    }, null, 2);
  }
}

export default SchemaAlertSystem;