// ================================
// Cushion Type Definitions
// "Absorb the chaos, keep the peace"
// ================================

/**
 * Field mapping configuration
 * Can be a string path or a custom transform function
 */
export type FieldMapping = string | ((data: any) => any);

/**
 * Object mapping configuration
 * Maps stable keys to changing field paths or transform functions
 */
export type MappingConfig = Record<string, FieldMapping>;

/**
 * Cushion rule for URL patterns
 */
export interface CushionRule {
  /** Main mapping configuration */
  mapping: MappingConfig;
  /** Optional condition to apply this rule */
  condition?: (data: any) => boolean;
  /** Fallback mapping if condition fails */
  fallback?: MappingConfig;
}

/**
 * Plugin interface for extending Cushion functionality
 */
export interface Plugin {
  /** Unique plugin name */
  name: string;
  /** Installation method called when plugin is added */
  install(core: CushionCore): void;
}

/**
 * Core interface exposed to plugins
 */
export interface CushionCore {
  /** Register a hook that runs after data absorption */
  onAbsorb: (hook: AbsorbHook) => void;
  /** Register a hook that runs before requests */
  onRequest: (hook: RequestHook) => void;
  /** Register a hook that runs after responses */
  onResponse: (hook: ResponseHook) => void;
  /** Add a custom field mapper */
  addMapper: (mapper: CustomMapper) => void;
}

/**
 * Hook types for plugin system
 */
export type AbsorbHook = (
  data: any,
  mapping: MappingConfig,
  context: any
) => any;
export type RequestHook = (url: string, options: any) => void;
export type ResponseHook = (url: string, data: any) => any;
export type CustomMapper = (data: any, path: string) => any;

/**
 * Options for absorb function
 */
export interface AbsorbOptions {
  /** Whether to preserve undefined values */
  preserveUndefined?: boolean;
  /** Whether to deep clone the result */
  deepClone?: boolean;
  /** Custom error handler */
  onError?: (error: Error, key: string) => any;
}

/**
 * Context passed to hooks
 */
export interface HookContext {
  /** Request URL */
  url: string;
  /** Original unprocessed data */
  originalData?: any;
  /** HTTP method */
  method?: string;
  /** Request headers */
  headers?: Record<string, string>;
}

// ================================
// Schema Monitoring Types
// ================================

/**
 * Schema change event types
 */
export type SchemaChangeType = 'missing' | 'type_changed' | 'new_field' | 'mapping_failed';

/**
 * Schema change event
 */
export interface SchemaChangeEvent {
  /** URL where the change occurred */
  url: string;
  /** Field name that changed */
  fieldName: string;
  /** Type of change detected */
  changeType: SchemaChangeType;
  /** Expected type (for type_changed events) */
  expectedType?: string;
  /** Actual type (for type_changed events) */
  actualType?: string;
  /** Old value (for type_changed events) */
  oldValue?: any;
  /** New value (for new_field events) */
  newValue?: any;
  /** Timestamp of the change */
  timestamp: Date;
}

/**
 * Schema alert severity levels
 */
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Schema alert types
 */
export type SchemaAlertType = 'missing_field' | 'type_change' | 'new_field' | 'mapping_failure' | 'high_failure_rate';

/**
 * Schema alert
 */
export interface SchemaAlert {
  /** Unique alert ID */
  id: string;
  /** Alert severity */
  severity: AlertSeverity;
  /** Alert type */
  type: SchemaAlertType;
  /** Alert title */
  title: string;
  /** Alert description */
  description: string;
  /** URL where alert occurred */
  url: string;
  /** Alert timestamp */
  timestamp: Date;
  /** Additional metadata */
  metadata?: any;
  /** Suggested action to resolve */
  suggestedAction?: string;
}

/**
 * Schema monitoring configuration
 */
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

/**
 * Schema metrics
 */
export interface SchemaMetrics {
  /** Total number of transformations */
  totalTransformations: number;
  /** Number of successful transformations */
  successfulTransformations: number;
  /** Number of failed transformations */
  failedTransformations: number;
  /** List of schema changes */
  schemaChanges: SchemaChangeEvent[];
  /** Success rate percentage */
  successRate: number;
  /** URL-specific metrics */
  urlMetrics: Record<string, {
    total: number;
    successful: number;
    failed: number;
    lastAccess: Date;
  }>;
}

/**
 * Plugin setup function type
 */
export type PluginSetup<T = any> = (core: CushionCore) => T;

/**
 * Enhanced plugin interface with setup function
 */
export interface EnhancedPlugin<T = any> {
  /** Unique plugin name */
  name: string;
  /** Setup function that returns plugin utilities */
  setup: PluginSetup<T>;
}
