import type { SchemaChangeEvent, SchemaMetrics } from './schema-monitor';

export interface AnalyticsConfig {
  /** Enable different analytics features */
  enablePerformanceMetrics?: boolean;
  enableSchemaEvolution?: boolean;
  enableHealthScore?: boolean;
  enablePredictiveAnalytics?: boolean;
  
  /** Data retention settings */
  retentionDays?: number;
  maxDataPoints?: number;
  
  /** Sampling settings */
  samplingRate?: number; // 0-1, 1 = 100% sampling
  
  /** Export settings */
  exportInterval?: number; // minutes
  exportFormat?: 'json' | 'csv' | 'prometheus';
  
  /** Custom analytics handlers */
  onMetricsUpdate?: (metrics: AnalyticsMetrics) => void;
  onHealthScoreChange?: (score: number, previousScore: number) => void;
}

export interface PerformanceMetrics {
  totalRequests: number;
  successfulTransformations: number;
  failedTransformations: number;
  averageTransformTime: number;
  p95TransformTime: number;
  p99TransformTime: number;
  memoryUsage: number;
  errorRate: number;
  throughput: number; // requests per second
}

export interface SchemaEvolutionMetrics {
  totalFieldChanges: number;
  fieldAdditions: number;
  fieldRemovals: number;
  typeChanges: number;
  structureChanges: number;
  evolutionVelocity: number; // changes per day
  stabilityScore: number; // 0-100
}

export interface HealthScore {
  overall: number; // 0-100
  breakdown: {
    stability: number;
    performance: number;
    coverage: number;
    reliability: number;
  };
  factors: {
    schemaChangeFrequency: number;
    errorRate: number;
    responseTime: number;
    mappingCoverage: number;
  };
}

export interface PredictiveInsights {
  schemaStabilityTrend: 'improving' | 'stable' | 'degrading';
  predictedChanges: {
    url: string;
    fieldName: string;
    probability: number;
    reasoning: string;
  }[];
  recommendations: {
    priority: 'low' | 'medium' | 'high';
    category: 'performance' | 'stability' | 'maintenance';
    title: string;
    description: string;
    impact: string;
  }[];
}

export interface AnalyticsMetrics {
  timestamp: Date;
  performance: PerformanceMetrics;
  schemaEvolution: SchemaEvolutionMetrics;
  healthScore: HealthScore;
  predictiveInsights: PredictiveInsights;
  urlBreakdown: Record<string, {
    requests: number;
    errors: number;
    avgResponseTime: number;
    schemaChanges: number;
    lastChange: Date | null;
  }>;
}

export class SchemaAnalytics {
  private config: Required<AnalyticsConfig>;
  private dataPoints: AnalyticsMetrics[] = [];
  private transformTimes: number[] = [];
  private schemaChanges: SchemaChangeEvent[] = [];
  private urlStats: Map<string, {
    requests: number;
    errors: number;
    responseTimes: number[];
    schemaChanges: SchemaChangeEvent[];
    lastChange: Date | null;
  }> = new Map();
  private lastHealthScore: number = 100;
  private startTime: Date = new Date();

  constructor(config: AnalyticsConfig = {}) {
    this.config = {
      enablePerformanceMetrics: config.enablePerformanceMetrics ?? true,
      enableSchemaEvolution: config.enableSchemaEvolution ?? true,
      enableHealthScore: config.enableHealthScore ?? true,
      enablePredictiveAnalytics: config.enablePredictiveAnalytics ?? true,
      retentionDays: config.retentionDays ?? 30,
      maxDataPoints: config.maxDataPoints ?? 10000,
      samplingRate: config.samplingRate ?? 1.0,
      exportInterval: config.exportInterval ?? 60,
      exportFormat: config.exportFormat ?? 'json',
      onMetricsUpdate: config.onMetricsUpdate ?? (() => {}),
      onHealthScoreChange: config.onHealthScoreChange ?? (() => {}),
    };

    // Set up periodic data collection
    if (typeof window !== 'undefined' || typeof global !== 'undefined') {
      setInterval(() => this.collectMetrics(), this.config.exportInterval * 60 * 1000);
    }
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.samplingRate;
  }

  private cleanupOldData(): void {
    const cutoffTime = new Date(Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000);
    
    // Clean up data points
    this.dataPoints = this.dataPoints.filter(dp => dp.timestamp > cutoffTime);
    
    // Clean up schema changes
    this.schemaChanges = this.schemaChanges.filter(sc => sc.timestamp > cutoffTime);
    
    // Clean up URL stats
    for (const [url, stats] of this.urlStats.entries()) {
      stats.schemaChanges = stats.schemaChanges.filter(sc => sc.timestamp > cutoffTime);
    }
    
    // Limit data points by count
    if (this.dataPoints.length > this.config.maxDataPoints) {
      this.dataPoints = this.dataPoints.slice(-this.config.maxDataPoints);
    }
  }

  public recordTransformation(url: string, success: boolean, transformTime: number): void {
    if (!this.shouldSample()) return;

    // Record transform time
    this.transformTimes.push(transformTime);
    if (this.transformTimes.length > 1000) {
      this.transformTimes = this.transformTimes.slice(-1000);
    }

    // Update URL stats
    if (!this.urlStats.has(url)) {
      this.urlStats.set(url, {
        requests: 0,
        errors: 0,
        responseTimes: [],
        schemaChanges: [],
        lastChange: null,
      });
    }

    const stats = this.urlStats.get(url)!;
    stats.requests++;
    stats.responseTimes.push(transformTime);
    
    if (stats.responseTimes.length > 100) {
      stats.responseTimes = stats.responseTimes.slice(-100);
    }

    if (!success) {
      stats.errors++;
    }
  }

  public recordSchemaChange(event: SchemaChangeEvent): void {
    this.schemaChanges.push(event);
    
    // Update URL stats
    const stats = this.urlStats.get(event.url);
    if (stats) {
      stats.schemaChanges.push(event);
      stats.lastChange = event.timestamp;
    }
  }

  private calculatePerformanceMetrics(): PerformanceMetrics {
    const totalRequests = Array.from(this.urlStats.values())
      .reduce((sum, stats) => sum + stats.requests, 0);
    
    const totalErrors = Array.from(this.urlStats.values())
      .reduce((sum, stats) => sum + stats.errors, 0);
    
    const sortedTimes = [...this.transformTimes].sort((a, b) => a - b);
    const avgTime = sortedTimes.length > 0 
      ? sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length
      : 0;
    
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);
    
    const runtimeSeconds = (Date.now() - this.startTime.getTime()) / 1000;
    const throughput = totalRequests / Math.max(runtimeSeconds, 1);

    return {
      totalRequests,
      successfulTransformations: totalRequests - totalErrors,
      failedTransformations: totalErrors,
      averageTransformTime: avgTime,
      p95TransformTime: sortedTimes[p95Index] || 0,
      p99TransformTime: sortedTimes[p99Index] || 0,
      memoryUsage: this.getMemoryUsage(),
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0,
      throughput,
    };
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / 1024 / 1024; // MB
    }
    return 0;
  }

  private calculateSchemaEvolutionMetrics(): SchemaEvolutionMetrics {
    const totalChanges = this.schemaChanges.length;
    const fieldAdditions = this.schemaChanges.filter(sc => sc.changeType === 'new_field').length;
    const fieldRemovals = this.schemaChanges.filter(sc => sc.changeType === 'missing').length;
    const typeChanges = this.schemaChanges.filter(sc => sc.changeType === 'type_changed').length;
    const structureChanges = this.schemaChanges.filter(sc => sc.changeType === 'mapping_failed').length;
    
    // Calculate evolution velocity (changes per day)
    const daysRunning = Math.max(1, (Date.now() - this.startTime.getTime()) / (24 * 60 * 60 * 1000));
    const evolutionVelocity = totalChanges / daysRunning;
    
    // Calculate stability score (inverse of change frequency)
    const stabilityScore = Math.max(0, 100 - (evolutionVelocity * 10));

    return {
      totalFieldChanges: totalChanges,
      fieldAdditions,
      fieldRemovals,
      typeChanges,
      structureChanges,
      evolutionVelocity,
      stabilityScore,
    };
  }

  private calculateHealthScore(): HealthScore {
    const performance = this.calculatePerformanceMetrics();
    const evolution = this.calculateSchemaEvolutionMetrics();
    
    // Calculate individual scores
    const stabilityScore = Math.max(0, 100 - (evolution.evolutionVelocity * 20));
    const performanceScore = Math.max(0, 100 - performance.errorRate);
    const reliabilityScore = performance.totalRequests > 0 
      ? ((performance.successfulTransformations / performance.totalRequests) * 100)
      : 100;
    
    // Calculate coverage (simplified metric)
    const totalUrls = this.urlStats.size;
    const activeUrls = Array.from(this.urlStats.values())
      .filter(stats => stats.requests > 0).length;
    const coverageScore = totalUrls > 0 ? (activeUrls / totalUrls) * 100 : 100;
    
    // Calculate overall score
    const overallScore = (stabilityScore + performanceScore + reliabilityScore + coverageScore) / 4;

    return {
      overall: Math.round(overallScore),
      breakdown: {
        stability: Math.round(stabilityScore),
        performance: Math.round(performanceScore),
        coverage: Math.round(coverageScore),
        reliability: Math.round(reliabilityScore),
      },
      factors: {
        schemaChangeFrequency: evolution.evolutionVelocity,
        errorRate: performance.errorRate,
        responseTime: performance.averageTransformTime,
        mappingCoverage: coverageScore,
      },
    };
  }

  private generatePredictiveInsights(): PredictiveInsights {
    const recentChanges = this.schemaChanges.filter(
      sc => sc.timestamp > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    const changeFrequency = recentChanges.length;
    let trend: 'improving' | 'stable' | 'degrading' = 'stable';
    
    if (changeFrequency > 10) {
      trend = 'degrading';
    } else if (changeFrequency < 2) {
      trend = 'improving';
    }
    
    // Predict potential changes based on patterns
    const predictedChanges: PredictiveInsights['predictedChanges'] = [];
    const fieldChangeFrequency = new Map<string, number>();
    
    recentChanges.forEach(change => {
      const key = `${change.url}:${change.fieldName}`;
      fieldChangeFrequency.set(key, (fieldChangeFrequency.get(key) || 0) + 1);
    });
    
    for (const [key, frequency] of fieldChangeFrequency.entries()) {
      if (frequency > 2) {
        const [url, fieldName] = key.split(':');
        predictedChanges.push({
          url,
          fieldName,
          probability: Math.min(0.9, frequency / 10),
          reasoning: `Field has changed ${frequency} times in the last 7 days`,
        });
      }
    }
    
    // Generate recommendations
    const recommendations: PredictiveInsights['recommendations'] = [];
    
    if (changeFrequency > 10) {
      recommendations.push({
        priority: 'high',
        category: 'stability',
        title: 'High Schema Change Frequency',
        description: 'Your APIs are experiencing frequent schema changes',
        impact: 'This may lead to increased maintenance overhead and potential reliability issues',
      });
    }
    
    const performance = this.calculatePerformanceMetrics();
    if (performance.errorRate > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'performance',
        title: 'High Error Rate',
        description: `Current error rate is ${performance.errorRate.toFixed(1)}%`,
        impact: 'This may indicate mapping configuration issues or server-side problems',
      });
    }

    return {
      schemaStabilityTrend: trend,
      predictedChanges,
      recommendations,
    };
  }

  private collectMetrics(): void {
    const performance = this.calculatePerformanceMetrics();
    const evolution = this.calculateSchemaEvolutionMetrics();
    const healthScore = this.calculateHealthScore();
    const predictiveInsights = this.generatePredictiveInsights();
    
    const urlBreakdown: AnalyticsMetrics['urlBreakdown'] = {};
    for (const [url, stats] of this.urlStats.entries()) {
      const avgResponseTime = stats.responseTimes.length > 0
        ? stats.responseTimes.reduce((sum, time) => sum + time, 0) / stats.responseTimes.length
        : 0;
      
      urlBreakdown[url] = {
        requests: stats.requests,
        errors: stats.errors,
        avgResponseTime,
        schemaChanges: stats.schemaChanges.length,
        lastChange: stats.lastChange,
      };
    }

    const metrics: AnalyticsMetrics = {
      timestamp: new Date(),
      performance,
      schemaEvolution: evolution,
      healthScore,
      predictiveInsights,
      urlBreakdown,
    };

    this.dataPoints.push(metrics);
    this.cleanupOldData();
    
    // Trigger callbacks
    this.config.onMetricsUpdate(metrics);
    
    if (healthScore.overall !== this.lastHealthScore) {
      this.config.onHealthScoreChange(healthScore.overall, this.lastHealthScore);
      this.lastHealthScore = healthScore.overall;
    }
  }

  public getCurrentMetrics(): AnalyticsMetrics | null {
    return this.dataPoints.length > 0 ? this.dataPoints[this.dataPoints.length - 1] : null;
  }

  public getMetricsHistory(): AnalyticsMetrics[] {
    return [...this.dataPoints];
  }

  public getUrlAnalytics(url: string): {
    requests: number;
    errors: number;
    errorRate: number;
    avgResponseTime: number;
    schemaChanges: SchemaChangeEvent[];
    lastChange: Date | null;
  } | null {
    const stats = this.urlStats.get(url);
    if (!stats) return null;
    
    return {
      requests: stats.requests,
      errors: stats.errors,
      errorRate: stats.requests > 0 ? (stats.errors / stats.requests) * 100 : 0,
      avgResponseTime: stats.responseTimes.length > 0
        ? stats.responseTimes.reduce((sum, time) => sum + time, 0) / stats.responseTimes.length
        : 0,
      schemaChanges: [...stats.schemaChanges],
      lastChange: stats.lastChange,
    };
  }

  public exportMetrics(): string {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) return '{}';
    
    switch (this.config.exportFormat) {
      case 'json':
        return JSON.stringify(currentMetrics, null, 2);
      
      case 'csv':
        return this.exportToCsv(currentMetrics);
      
      case 'prometheus':
        return this.exportToPrometheus(currentMetrics);
      
      default:
        return JSON.stringify(currentMetrics, null, 2);
    }
  }

  private exportToCsv(metrics: AnalyticsMetrics): string {
    const headers = [
      'timestamp',
      'total_requests',
      'error_rate',
      'avg_transform_time',
      'health_score',
      'schema_changes',
      'stability_score',
    ];
    
    const values = [
      metrics.timestamp.toISOString(),
      metrics.performance.totalRequests,
      metrics.performance.errorRate,
      metrics.performance.averageTransformTime,
      metrics.healthScore.overall,
      metrics.schemaEvolution.totalFieldChanges,
      metrics.schemaEvolution.stabilityScore,
    ];
    
    return [headers.join(','), values.join(',')].join('\n');
  }

  private exportToPrometheus(metrics: AnalyticsMetrics): string {
    const timestamp = Math.floor(metrics.timestamp.getTime() / 1000);
    
    return [
      `# HELP cushion_requests_total Total number of requests processed`,
      `# TYPE cushion_requests_total counter`,
      `cushion_requests_total ${metrics.performance.totalRequests} ${timestamp}`,
      
      `# HELP cushion_error_rate Error rate percentage`,
      `# TYPE cushion_error_rate gauge`,
      `cushion_error_rate ${metrics.performance.errorRate} ${timestamp}`,
      
      `# HELP cushion_health_score Overall health score`,
      `# TYPE cushion_health_score gauge`,
      `cushion_health_score ${metrics.healthScore.overall} ${timestamp}`,
      
      `# HELP cushion_schema_changes_total Total schema changes`,
      `# TYPE cushion_schema_changes_total counter`,
      `cushion_schema_changes_total ${metrics.schemaEvolution.totalFieldChanges} ${timestamp}`,
    ].join('\n');
  }

  public generateInsightsReport(): string {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) return 'No metrics available';
    
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        healthScore: currentMetrics.healthScore.overall,
        totalRequests: currentMetrics.performance.totalRequests,
        errorRate: currentMetrics.performance.errorRate,
        schemaChanges: currentMetrics.schemaEvolution.totalFieldChanges,
        stabilityTrend: currentMetrics.predictiveInsights.schemaStabilityTrend,
      },
      insights: currentMetrics.predictiveInsights,
      recommendations: currentMetrics.predictiveInsights.recommendations,
      urlBreakdown: currentMetrics.urlBreakdown,
    };
    
    return JSON.stringify(report, null, 2);
  }
}

export default SchemaAnalytics;