import { createPlugin } from '../index';
import type { MappingConfig } from '../types';

export interface SchemaChangeEvent {
  url: string;
  fieldName: string;
  changeType: 'missing' | 'type_changed' | 'new_field' | 'mapping_failed';
  expectedType?: string;
  actualType?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

export interface SchemaMonitorConfig {
  /** Enable console logging for schema changes */
  enableLogging?: boolean;
  /** Custom callback for schema change events */
  onSchemaChange?: (event: SchemaChangeEvent) => void;
  /** URLs to monitor (if not provided, monitors all) */
  monitorUrls?: string[];
  /** Track new fields that appear in responses */
  trackNewFields?: boolean;
  /** Track type changes in existing fields */
  trackTypeChanges?: boolean;
  /** Maximum number of events to keep in history */
  maxHistorySize?: number;
}

export interface SchemaMetrics {
  totalTransformations: number;
  successfulTransformations: number;
  failedTransformations: number;
  schemaChanges: SchemaChangeEvent[];
  successRate: number;
  urlMetrics: Record<string, {
    total: number;
    successful: number;
    failed: number;
    lastAccess: Date;
  }>;
}

class SchemaMonitor {
  private config: Required<SchemaMonitorConfig>;
  private metrics: SchemaMetrics;
  private knownSchemas: Map<string, Record<string, any>> = new Map();
  private knownFields: Map<string, Set<string>> = new Map();

  constructor(config: SchemaMonitorConfig = {}) {
    this.config = {
      enableLogging: config.enableLogging ?? true,
      onSchemaChange: config.onSchemaChange ?? (() => {}),
      monitorUrls: config.monitorUrls ?? [],
      trackNewFields: config.trackNewFields ?? true,
      trackTypeChanges: config.trackTypeChanges ?? true,
      maxHistorySize: config.maxHistorySize ?? 100,
    };

    this.metrics = {
      totalTransformations: 0,
      successfulTransformations: 0,
      failedTransformations: 0,
      schemaChanges: [],
      successRate: 0,
      urlMetrics: {},
    };
  }

  private shouldMonitor(url: string): boolean {
    if (this.config.monitorUrls.length === 0) return true;
    return this.config.monitorUrls.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    });
  }

  private getFieldType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  private recordSchemaChange(event: SchemaChangeEvent): void {
    // Add to history
    this.metrics.schemaChanges.push(event);
    
    // Maintain history size limit
    if (this.metrics.schemaChanges.length > this.config.maxHistorySize) {
      this.metrics.schemaChanges.shift();
    }

    // Console logging
    if (this.config.enableLogging) {
      const message = `[Cushion Schema Monitor] ${event.changeType} detected`;
      console.warn(message, {
        url: event.url,
        field: event.fieldName,
        details: event
      });
    }

    // Custom callback
    this.config.onSchemaChange(event);
  }

  private analyzeFieldChanges(
    url: string,
    originalData: any,
    transformedData: any,
    mapping: MappingConfig
  ): void {
    // Check for missing fields (undefined values in transformed data)
    for (const [fieldName, value] of Object.entries(transformedData)) {
      if (value === undefined) {
        this.recordSchemaChange({
          url,
          fieldName,
          changeType: 'missing',
          timestamp: new Date(),
        });
      }
    }

    // Track new fields in original data
    if (this.config.trackNewFields && originalData && typeof originalData === 'object') {
      const currentFields = new Set(Object.keys(originalData));
      const knownFields = this.knownFields.get(url) || new Set();
      
      for (const field of currentFields) {
        if (!knownFields.has(field)) {
          this.recordSchemaChange({
            url,
            fieldName: field,
            changeType: 'new_field',
            newValue: originalData[field],
            timestamp: new Date(),
          });
        }
      }
      
      this.knownFields.set(url, currentFields);
    }

    // Track type changes
    if (this.config.trackTypeChanges) {
      const knownSchema = this.knownSchemas.get(url);
      if (knownSchema) {
        for (const [fieldName, value] of Object.entries(transformedData)) {
          if (value !== undefined && knownSchema[fieldName] !== undefined) {
            const currentType = this.getFieldType(value);
            const knownType = this.getFieldType(knownSchema[fieldName]);
            
            if (currentType !== knownType) {
              this.recordSchemaChange({
                url,
                fieldName,
                changeType: 'type_changed',
                expectedType: knownType,
                actualType: currentType,
                oldValue: knownSchema[fieldName],
                newValue: value,
                timestamp: new Date(),
              });
            }
          }
        }
      }
      
      // Update known schema
      this.knownSchemas.set(url, { ...transformedData });
    }
  }

  private updateMetrics(url: string, success: boolean): void {
    this.metrics.totalTransformations++;
    
    if (success) {
      this.metrics.successfulTransformations++;
    } else {
      this.metrics.failedTransformations++;
    }

    this.metrics.successRate = 
      (this.metrics.successfulTransformations / this.metrics.totalTransformations) * 100;

    // Update URL-specific metrics
    if (!this.metrics.urlMetrics[url]) {
      this.metrics.urlMetrics[url] = {
        total: 0,
        successful: 0,
        failed: 0,
        lastAccess: new Date(),
      };
    }

    const urlMetric = this.metrics.urlMetrics[url];
    urlMetric.total++;
    urlMetric.lastAccess = new Date();
    
    if (success) {
      urlMetric.successful++;
    } else {
      urlMetric.failed++;
    }
  }

  public monitorAbsorption(
    originalData: any,
    transformedData: any,
    mapping: MappingConfig,
    context: { url: string }
  ): any {
    if (!this.shouldMonitor(context.url)) {
      return transformedData;
    }

    try {
      // Analyze for schema changes
      this.analyzeFieldChanges(context.url, originalData, transformedData, mapping);
      
      // Update metrics
      this.updateMetrics(context.url, true);
      
      return transformedData;
    } catch (error) {
      this.recordSchemaChange({
        url: context.url,
        fieldName: 'unknown',
        changeType: 'mapping_failed',
        timestamp: new Date(),
      });
      
      this.updateMetrics(context.url, false);
      
      if (this.config.enableLogging) {
        console.error('[Cushion Schema Monitor] Error during monitoring:', error);
      }
      
      return transformedData;
    }
  }

  public getMetrics(): SchemaMetrics {
    return { ...this.metrics };
  }

  public getSchemaChanges(url?: string): SchemaChangeEvent[] {
    if (!url) return this.metrics.schemaChanges;
    return this.metrics.schemaChanges.filter(event => event.url === url);
  }

  public clearHistory(): void {
    this.metrics.schemaChanges = [];
  }

  public exportReport(): string {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalTransformations: this.metrics.totalTransformations,
        successRate: this.metrics.successRate,
        totalSchemaChanges: this.metrics.schemaChanges.length,
      },
      urlMetrics: this.metrics.urlMetrics,
      recentChanges: this.metrics.schemaChanges.slice(-10),
    };

    return JSON.stringify(report, null, 2);
  }
}

export const createSchemaMonitorPlugin = (config: SchemaMonitorConfig = {}) => {
  const monitor = new SchemaMonitor(config);

  return createPlugin('schema-monitor', (core) => {
    // Monitor absorb operations
    core.onAbsorb((data, mapping, context) => {
      return monitor.monitorAbsorption(context.originalData || data, data, mapping, context);
    });

    // Monitor response processing
    core.onResponse((url, data) => {
      if (monitor.shouldMonitor(url)) {
        monitor.updateMetrics(url, true);
      }
      return data;
    });

    // Expose monitoring utilities
    return {
      getMetrics: () => monitor.getMetrics(),
      getSchemaChanges: (url?: string) => monitor.getSchemaChanges(url),
      clearHistory: () => monitor.clearHistory(),
      exportReport: () => monitor.exportReport(),
    };
  });
};

export default createSchemaMonitorPlugin;