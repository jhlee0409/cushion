// ================================
// Cushion Absorb Module
// "Manual absorption for one-off transformations"
// ================================

import { AbsorptionEngine } from "./core.js";
import type { AbsorbOptions, MappingConfig } from "./types.js";

// Create a singleton absorption engine for manual use
const engine = new AbsorptionEngine();

/**
 * Manually absorb data transformations
 *
 * @example
 * ```typescript
 * const transformed = absorb(serverData, {
 *   name: 'user_name',
 *   email: 'contact.email',
 *   age: (data) => new Date().getFullYear() - data.birth_year
 * });
 * ```
 */
export function absorb<T = any>(
  data: any,
  mapping: MappingConfig,
  options?: AbsorbOptions
): T {
  if (!data) {
    return data;
  }

  try {
    const result = engine.absorb<T>(data, mapping);

    if (options?.deepClone) {
      return JSON.parse(JSON.stringify(result));
    }

    return result;
  } catch (error) {
    if (options?.onError) {
      return options.onError(error as Error, "root") as T;
    }
    throw error;
  }
}

/**
 * Create a reusable absorber function
 *
 * @example
 * ```typescript
 * const userAbsorber = createAbsorber({
 *   name: 'username',
 *   email: 'user_email'
 * });
 *
 * const user1 = userAbsorber(data1);
 * const user2 = userAbsorber(data2);
 * ```
 */
export function createAbsorber<T = any>(
  mapping: MappingConfig,
  options?: AbsorbOptions
): (data: any) => T {
  return (data: any) => absorb<T>(data, mapping, options);
}

/**
 * Batch absorb multiple items
 *
 * @example
 * ```typescript
 * const users = batchAbsorb(usersData, {
 *   name: 'username',
 *   email: 'user_email'
 * });
 * ```
 */
export function batchAbsorb<T = any>(
  dataArray: any[],
  mapping: MappingConfig,
  options?: AbsorbOptions
): T[] {
  if (!Array.isArray(dataArray)) {
    throw new TypeError("[Cushion] batchAbsorb expects an array");
  }

  return dataArray.map((item) => absorb<T>(item, mapping, options));
}

/**
 * Conditionally absorb based on data content
 *
 * @example
 * ```typescript
 * const result = conditionalAbsorb(data, {
 *   condition: (d) => d.version === 2,
 *   mapping: { name: 'v2_name' },
 *   fallback: { name: 'legacy_name' }
 * });
 * ```
 */
export function conditionalAbsorb<T = any>(
  data: any,
  config: {
    condition: (data: any) => boolean;
    mapping: MappingConfig;
    fallback?: MappingConfig;
  },
  options?: AbsorbOptions
): T {
  const shouldApplyMapping = config.condition(data);

  if (shouldApplyMapping) {
    return absorb<T>(data, config.mapping, options);
  } else if (config.fallback) {
    return absorb<T>(data, config.fallback, options);
  }

  return data;
}

/**
 * Merge multiple mappings together
 *
 * @example
 * ```typescript
 * const combined = mergeMappings(
 *   { name: 'username' },
 *   { email: 'user_email' }
 * );
 * ```
 */
export function mergeMappings(...mappings: MappingConfig[]): MappingConfig {
  return Object.assign({}, ...mappings);
}

/**
 * Create nested mapping from dot notation
 *
 * @example
 * ```typescript
 * const mapping = createNestedMapping({
 *   'user.name': 'profile.displayName',
 *   'user.email': 'contact.email'
 * });
 * ```
 */
export function createNestedMapping(
  flatMapping: Record<string, string>
): MappingConfig {
  const result: any = {};

  for (const [targetPath, sourcePath] of Object.entries(flatMapping)) {
    const keys = targetPath.split(".");
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = sourcePath;
  }

  return result;
}

/**
 * Validate absorbed data against expected shape
 *
 * @example
 * ```typescript
 * const isValid = validateAbsorbed(data, {
 *   name: 'string',
 *   age: 'number',
 *   email: 'string'
 * });
 * ```
 */
export function validateAbsorbed(
  data: any,
  expectedShape: Record<string, string>
): boolean {
  if (!data || typeof data !== "object") {
    return false;
  }

  for (const [key, expectedType] of Object.entries(expectedShape)) {
    const actualType = typeof data[key];

    if (expectedType === "array") {
      if (!Array.isArray(data[key])) {
        return false;
      }
    } else if (
      actualType !== expectedType &&
      data[key] !== null &&
      data[key] !== undefined
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Create a type-safe absorber with validation
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   email: string;
 * }
 *
 * const userAbsorber = createTypedAbsorber<User>(
 *   { name: 'username', email: 'user_email' },
 *   { name: 'string', email: 'string' }
 * );
 * ```
 */
export function createTypedAbsorber<T>(
  mapping: MappingConfig,
  shape: Record<string, string>,
  options?: AbsorbOptions
): (data: any) => T | null {
  return (data: any) => {
    const absorbed = absorb<T>(data, mapping, options);

    if (!validateAbsorbed(absorbed, shape)) {
      console.warn("[Cushion] Absorbed data does not match expected shape");
      return null;
    }

    return absorbed;
  };
}

// Re-export types for convenience
export type { MappingConfig, FieldMapping, AbsorbOptions } from "./types.js";
