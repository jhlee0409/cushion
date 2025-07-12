// ================================
// Cushion Core Classes
// "Absorb the chaos, keep the peace"
// ================================

import type {
  AbsorbHook,
  CushionCore,
  CushionRule,
  CustomMapper,
  MappingConfig,
  Plugin,
  RequestHook,
  ResponseHook,
} from "./types.js";

/**
 * Change Absorption Engine - 변화를 흡수하는 핵심 엔진
 */
export class AbsorptionEngine {
  private customMappers: Map<string, CustomMapper> = new Map();

  /**
   * 외부 변화를 흡수하여 내부 안정성 제공
   */
  absorb<T = any>(data: any, mapping: MappingConfig): T {
    if (!data || typeof data !== "object") {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.absorb(item, mapping)) as T;
    }

    const cushioned: any = {};

    for (const [stableKey, changingPath] of Object.entries(mapping)) {
      if (typeof changingPath === "function") {
        try {
          cushioned[stableKey] = changingPath(data);
        } catch (error) {
          console.warn(
            `[Cushion] Failed to apply function mapping for key "${stableKey}":`,
            error
          );
          cushioned[stableKey] = undefined;
        }
      } else if (typeof changingPath === "string") {
        cushioned[stableKey] = this.extractNestedValue(data, changingPath);
      }
    }

    return cushioned;
  }

  /**
   * 중첩 경로에서 값 추출 (예: "user.profile.name")
   */
  private extractNestedValue(obj: any, path: string): any {
    // Handle array notation (e.g., "posts.*.author" or "items[0].name")
    if (path.includes("*")) {
      const parts = path.split(".*.");
      if (parts.length === 2) {
        const arrayPath = parts[0];
        const itemPath = parts[1];
        const array = this.extractNestedValue(obj, arrayPath);
        if (Array.isArray(array)) {
          return array.map((item) => this.extractNestedValue(item, itemPath));
        }
      }
    }

    // Handle regular dot notation
    return path.split(".").reduce((current, key) => {
      if (current === null || current === undefined) {
        return undefined;
      }

      // Handle array index notation [0]
      const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, propName, index] = arrayMatch;
        const array = current[propName];
        return Array.isArray(array)
          ? array[Number.parseInt(index, 10)]
          : undefined;
      }

      return current[key];
    }, obj);
  }

  /**
   * 커스텀 흡수 로직 추가
   */
  addMapper(name: string, mapper: CustomMapper): void {
    this.customMappers.set(name, mapper);
  }

  /**
   * 커스텀 매퍼 실행
   */
  applyCustomMapper(name: string, data: any, path: string): any {
    const mapper = this.customMappers.get(name);
    if (!mapper) {
      console.warn(`[Cushion] Custom mapper "${name}" not found`);
      return undefined;
    }
    return mapper(data, path);
  }
}

/**
 * 쿠션 설정 관리자
 */
export class CushionManager {
  private rules: Map<string, CushionRule> = new Map();
  private patterns: Array<{
    regex: RegExp;
    rule: CushionRule;
    pattern: string;
  }> = [];

  /**
   * URL 패턴에 대한 쿠션 규칙 설정
   */
  setCushion(urlPattern: string, rule: CushionRule): void {
    this.rules.set(urlPattern, rule);

    // 패턴 기반 매칭을 위한 정규식 생성
    if (urlPattern.includes("*") || urlPattern.includes(":")) {
      const regex = this.createPatternRegex(urlPattern);
      this.patterns.push({ regex, rule, pattern: urlPattern });
      // Sort patterns by specificity (more specific patterns first)
      this.patterns.sort((a, b) => b.pattern.length - a.pattern.length);
    }
  }

  /**
   * URL에 매칭되는 쿠션 규칙 조회
   */
  getCushion(url: string): CushionRule | null {
    // 정확한 매치 우선
    if (this.rules.has(url)) {
      return this.rules.get(url)!;
    }

    // 쿼리 파라미터 포함 매치
    const urlWithoutQuery = url.split("?")[0];

    // Check exact match with query params
    for (const [pattern, rule] of this.rules) {
      if (pattern.includes("?") && this.matchesWithQuery(url, pattern)) {
        return rule;
      }
    }

    // 패턴 매칭
    for (const { regex, rule } of this.patterns) {
      if (regex.test(urlWithoutQuery)) {
        return rule;
      }
    }

    return null;
  }

  /**
   * 쿼리 파라미터를 포함한 URL 매칭
   */
  private matchesWithQuery(url: string, pattern: string): boolean {
    const [urlPath, urlQuery] = url.split("?");
    const [patternPath, patternQuery] = pattern.split("?");

    if (urlPath !== patternPath) {
      return false;
    }

    if (!patternQuery) {
      return true;
    }

    const urlParams = new URLSearchParams(urlQuery || "");
    const patternParams = new URLSearchParams(patternQuery);

    for (const [key, value] of patternParams) {
      if (urlParams.get(key) !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * URL 패턴을 정규식으로 변환
   */
  private createPatternRegex(pattern: string): RegExp {
    const regexPattern = pattern
      // Escape special regex characters except * and :
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
      // Replace * with .*
      .replace(/\*/g, ".*")
      // Replace :param with named groups
      .replace(/:(\w+)/g, "(?<$1>[^/]+)");

    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * 모든 쿠션 제거
   */
  clearAll(): void {
    this.rules.clear();
    this.patterns = [];
  }

  /**
   * 특정 패턴의 쿠션 제거
   */
  removeCushion(urlPattern: string): void {
    this.rules.delete(urlPattern);
    this.patterns = this.patterns.filter((p) => p.pattern !== urlPattern);
  }
}

/**
 * HTTP 충격 흡수 인터셉터
 */
export class ShockAbsorber {
  private cushionManager: CushionManager;
  private absorptionEngine: AbsorptionEngine;
  private pluginEcosystem?: PluginEcosystem;
  private originalFetch: typeof fetch;
  private isActive = false;

  constructor(
    cushionManager: CushionManager,
    absorptionEngine: AbsorptionEngine,
    pluginEcosystem?: PluginEcosystem
  ) {
    this.cushionManager = cushionManager;
    this.absorptionEngine = absorptionEngine;
    this.pluginEcosystem = pluginEcosystem;
    this.originalFetch = globalThis.fetch; // Initialize with current fetch
  }

  /**
   * 충격 흡수 시작
   */
  activate(): void {
    if (this.isActive) return;

    // Store the current fetch (which might already be a mock in tests)
    this.originalFetch = globalThis.fetch;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();

      // Execute request hooks
      if (this.pluginEcosystem) {
        this.pluginEcosystem.executeRequestHooks(url, init || {});
      }

      const response = await this.originalFetch(input, init);

      if (!response.ok) {
        return response;
      }

      const cushion = this.cushionManager.getCushion(url);

      if (!cushion) {
        return response;
      }

      // Response 복제 (원본 유지)
      const clonedResponse = response.clone();

      try {
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          return response;
        }

        const rawData = await response.json();

        // Execute response hooks
        let processedData = rawData;
        if (this.pluginEcosystem) {
          processedData = this.pluginEcosystem.executeResponseHooks(
            url,
            rawData
          );
        }

        // 조건 확인
        if (cushion.condition && !cushion.condition(processedData)) {
          // Fallback 쿠션 사용
          if (cushion.fallback) {
            let cushionedData = this.absorptionEngine.absorb(
              processedData,
              cushion.fallback
            );

            // Execute absorb hooks
            if (this.pluginEcosystem) {
              cushionedData = this.pluginEcosystem.executeAbsorbHooks(
                cushionedData,
                cushion.fallback,
                { url, originalData: processedData }
              );
            }

            return this.createCushionedResponse(cushionedData, clonedResponse);
          }
          return clonedResponse;
        }

        // 변화 흡수
        let cushionedData = this.absorptionEngine.absorb(
          processedData,
          cushion.mapping
        );

        // Execute absorb hooks
        if (this.pluginEcosystem) {
          cushionedData = this.pluginEcosystem.executeAbsorbHooks(
            cushionedData,
            cushion.mapping,
            { url, originalData: processedData }
          );
        }

        return this.createCushionedResponse(cushionedData, clonedResponse);
      } catch (error) {
        console.error("[Cushion] Error processing response:", error);
        // JSON 파싱 실패 시 원본 반환
        return clonedResponse;
      }
    };

    this.isActive = true;
  }

  /**
   * 충격 흡수 중지
   */
  deactivate(): void {
    if (!this.isActive) return;

    globalThis.fetch = this.originalFetch;
    this.isActive = false;
  }

  /**
   * 쿠션된 데이터로 새 Response 생성
   */
  private createCushionedResponse(
    data: any,
    originalResponse: Response
  ): Response {
    const jsonString = JSON.stringify(data);

    return new Response(jsonString, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: originalResponse.headers,
    });
  }
}

/**
 * 플러그인 생태계
 */
export class PluginEcosystem implements CushionCore {
  private plugins: Map<string, Plugin> = new Map();
  private absorbHooks: AbsorbHook[] = [];
  private requestHooks: RequestHook[] = [];
  private responseHooks: ResponseHook[] = [];
  private absorptionEngine: AbsorptionEngine;

  constructor(absorptionEngine: AbsorptionEngine) {
    this.absorptionEngine = absorptionEngine;
  }

  /**
   * 플러그인 추가
   */
  use(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(`[Cushion] Plugin "${plugin.name}" is already installed`);
      return;
    }

    this.plugins.set(plugin.name, plugin);
    plugin.install(this);
  }

  /**
   * 플러그인 제거
   */
  remove(pluginName: string): void {
    this.plugins.delete(pluginName);
  }

  // CushionCore 인터페이스 구현
  onAbsorb(hook: AbsorbHook): void {
    this.absorbHooks.push(hook);
  }

  onRequest(hook: RequestHook): void {
    this.requestHooks.push(hook);
  }

  onResponse(hook: ResponseHook): void {
    this.responseHooks.push(hook);
  }

  addMapper(mapper: CustomMapper): void {
    // Generate unique name for mapper
    const mapperName = `plugin_mapper_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    this.absorptionEngine.addMapper(mapperName, mapper);
  }

  /**
   * 흡수 훅 실행
   */
  executeAbsorbHooks(data: any, mapping: MappingConfig, context: any): any {
    return this.absorbHooks.reduce((result, hook) => {
      try {
        return hook(result, mapping, context);
      } catch (error) {
        console.error("[Cushion] Error in absorb hook:", error);
        return result; // Return the previous result and continue
      }
    }, data);
  }

  /**
   * 요청 훅 실행
   */
  executeRequestHooks(url: string, options: any): void {
    this.requestHooks.forEach((hook) => {
      try {
        hook(url, options);
      } catch (error) {
        console.error("[Cushion] Error in request hook:", error);
      }
    });
  }

  /**
   * 응답 훅 실행
   */
  executeResponseHooks(url: string, data: any): any {
    return this.responseHooks.reduce((result, hook) => {
      try {
        return hook(url, result);
      } catch (error) {
        console.error("[Cushion] Error in response hook:", error);
        return result;
      }
    }, data);
  }

  /**
   * 플러그인 생태계 초기화 (테스트용)
   */
  reset(): void {
    this.plugins.clear();
    this.absorbHooks = [];
    this.requestHooks = [];
    this.responseHooks = [];
  }
}

/**
 * 메인 Cushion 클래스 - "변화를 흡수하는 편안한 쿠션"
 */
export class Cushion {
  private cushionManager: CushionManager;
  private absorptionEngine: AbsorptionEngine;
  private shockAbsorber: ShockAbsorber;
  private pluginEcosystem: PluginEcosystem;

  constructor() {
    this.cushionManager = new CushionManager();
    this.absorptionEngine = new AbsorptionEngine();
    this.pluginEcosystem = new PluginEcosystem(this.absorptionEngine);
    this.shockAbsorber = new ShockAbsorber(
      this.cushionManager,
      this.absorptionEngine,
      this.pluginEcosystem
    );
  }

  /**
   * 자동 충격 흡수 시작
   */
  activate(): void {
    this.shockAbsorber.activate();
  }

  /**
   * 자동 충격 흡수 중지
   */
  deactivate(): void {
    this.shockAbsorber.deactivate();
  }

  /**
   * 쿠션 설정 - 외부 변화를 흡수하는 규칙
   */
  setupCushion(urlPattern: string, rule: CushionRule | MappingConfig): void {
    const cushionRule: CushionRule =
      "mapping" in rule ? (rule as CushionRule) : { mapping: rule };

    this.cushionManager.setCushion(urlPattern, cushionRule);
  }

  /**
   * 여러 쿠션 일괄 설정
   */
  setupCushions(rules: Record<string, CushionRule | MappingConfig>): void {
    for (const [urlPattern, rule] of Object.entries(rules)) {
      this.setupCushion(urlPattern, rule);
    }
  }

  /**
   * 쿠션 제거
   */
  removeCushion(urlPattern: string): void {
    this.cushionManager.removeCushion(urlPattern);
  }

  /**
   * 수동 변화 흡수
   */
  absorb<T = any>(data: any, mapping: MappingConfig): T {
    return this.absorptionEngine.absorb<T>(data, mapping);
  }

  /**
   * 플러그인 사용
   */
  use(plugin: Plugin): void {
    this.pluginEcosystem.use(plugin);
  }

  /**
   * 플러그인 제거
   */
  removePlugin(pluginName: string): void {
    this.pluginEcosystem.remove(pluginName);
  }

  /**
   * 모든 쿠션 제거
   */
  reset(): void {
    this.cushionManager.clearAll();
    this.pluginEcosystem.reset();
    this.deactivate();
  }
}
