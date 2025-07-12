// ================================
// Cushion Public API
// "Absorb the chaos, keep the peace"
// ================================

import { Cushion } from "./core.js";
import type {
  CushionCore,
  CushionRule,
  MappingConfig,
  Plugin,
} from "./types.js";

// ===== 전역 쿠션 인스턴스 =====
const cushion = new Cushion();

// ===== Public API =====

/**
 * 쿠션 설정 - 외부 변화를 흡수
 *
 * @example
 * ```typescript
 * setupCushion('/api/user', {
 *   name: 'username',
 *   email: 'user_email'
 * });
 * ```
 */
export function setupCushion(
  urlPattern: string,
  rule: CushionRule | MappingConfig
): void {
  cushion.setupCushion(urlPattern, rule);

  // 첫 번째 설정 시 자동으로 활성화
  cushion.activate();
}

/**
 * 여러 쿠션 일괄 설정
 *
 * @example
 * ```typescript
 * setupCushions({
 *   '/api/user': { name: 'username' },
 *   '/api/posts': { title: 'post_title' }
 * });
 * ```
 */
export function setupCushions(
  rules: Record<string, CushionRule | MappingConfig>
): void {
  cushion.setupCushions(rules);
  cushion.activate();
}

/**
 * 특정 URL 패턴의 쿠션 제거
 *
 * @example
 * ```typescript
 * removeCushion('/api/user');
 * ```
 */
export function removeCushion(urlPattern: string): void {
  cushion.removeCushion(urlPattern);
}

/**
 * 수동 변화 흡수
 *
 * @example
 * ```typescript
 * const cushioned = absorb(serverData, {
 *   name: 'username',
 *   email: 'user_email'
 * });
 * ```
 */
export function absorb<T = any>(data: any, mapping: MappingConfig): T {
  return cushion.absorb<T>(data, mapping);
}

/**
 * 플러그인 사용
 *
 * @example
 * ```typescript
 * import zodPlugin from 'cushion/zod';
 * use(zodPlugin);
 * ```
 */
export function use(plugin: Plugin): void {
  cushion.use(plugin);
}

/**
 * 플러그인 제거
 *
 * @example
 * ```typescript
 * removePlugin('zod');
 * ```
 */
export function removePlugin(pluginName: string): void {
  cushion.removePlugin(pluginName);
}

/**
 * 쿠션 활성화 (자동 흡수 시작)
 *
 * @example
 * ```typescript
 * activate();
 * ```
 */
export function activate(): void {
  cushion.activate();
}

/**
 * 쿠션 비활성화 (자동 흡수 중지)
 *
 * @example
 * ```typescript
 * deactivate();
 * ```
 */
export function deactivate(): void {
  cushion.deactivate();
}

/**
 * 모든 쿠션 제거 및 비활성화
 *
 * @example
 * ```typescript
 * reset();
 * ```
 */
export function reset(): void {
  cushion.reset();
}

// ===== 플러그인 생성 도우미 =====

/**
 * 커스텀 플러그인 생성 도우미
 *
 * @example
 * ```typescript
 * const myPlugin = createPlugin('my-plugin', (core) => {
 *   core.onAbsorb((data, mapping, context) => {
 *     console.log('Data absorbed:', data);
 *     return data;
 *   });
 * });
 * ```
 */
export function createPlugin(
  name: string,
  install: (core: CushionCore) => void
): Plugin {
  return { name, install };
}

// ===== 타입 내보내기 =====
export type {
  // Core types
  CushionRule,
  MappingConfig,
  FieldMapping,
  Plugin,
  // Hook types
  CushionCore,
  AbsorbHook,
  RequestHook,
  ResponseHook,
  CustomMapper,
  // Options
  AbsorbOptions,
} from "./types.js";

// ===== 클래스 내보내기 (고급 사용자용) =====
export {
  Cushion,
  AbsorptionEngine,
  CushionManager,
  ShockAbsorber,
  PluginEcosystem,
} from "./core.js";

// ===== 기본 내보내기 =====
export default cushion;

// ===== 사용 예시 =====

/*
// 🛏️ Cushion 기본 사용법
import { setupCushion } from 'cushion';

// 외부 변화를 흡수하는 편안한 쿠션 설정
setupCushion('/api/user', {
  name: 'username',      // 서버가 바꿔도 내 코드는 안전
  email: 'user_email'    // 쿠션이 변화를 흡수함
});

// 🎉 내 코드는 변화를 느끼지 못함 (쿠션 효과!)
const user = await fetch('/api/user').then(r => r.json());
console.log(user.name); // 항상 안정적으로 동작

// 🔧 조건부 쿠션 (더 똑똑한 흡수)
setupCushion('/api/user', {
  mapping: {
    name: 'username',
    email: 'user_email'
  },
  condition: (data) => data.version === 'v2',
  fallback: {
    name: 'user_name',    // v1 버전용 쿠션
    email: 'email'
  }
});

// 🎨 수동 흡수 (원할 때만)
import { absorb } from 'cushion';

const cushionedData = absorb(chaoticServerData, {
  title: 'post_title',
  author: 'writer.display_name'
});

// 🔌 플러그인 사용
import { use, createPlugin } from 'cushion';

const loggingPlugin = createPlugin('logger', (core) => {
  core.onRequest((url, options) => {
    console.log(`[Cushion] Request: ${url}`);
  });

  core.onAbsorb((data, mapping, context) => {
    console.log(`[Cushion] Absorbed data for ${context.url}`);
    return data;
  });
});

use(loggingPlugin);
*/
