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
