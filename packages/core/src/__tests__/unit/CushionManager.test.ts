import { describe, it, expect, beforeEach } from "vitest";
import { CushionManager } from "../../core";

describe("CushionManager (ConfigManager)", () => {
  let manager: CushionManager;

  beforeEach(() => {
    manager = new CushionManager();
  });

  describe("Rule Storage and Retrieval", () => {
    it("should store and retrieve cushion rules by exact URL", () => {
      // Given: API 변환 규칙 설정
      const rule = {
        mapping: {
          name: "user_name",
          email: "user_email",
        },
      };

      // When: 규칙 저장
      manager.setCushion("/api/user", rule);

      // Then: 규칙 조회 가능
      const retrieved = manager.getCushion("/api/user");
      expect(retrieved).toEqual(rule);
    });

    it("should return null for unregistered URLs", () => {
      const result = manager.getCushion("/api/unknown");
      expect(result).toBeNull();
    });

    it("should overwrite existing rules", () => {
      const oldRule = {
        mapping: { name: "user_name" },
      };
      const newRule = {
        mapping: { name: "userName" }, // 백엔드가 변경됨
      };

      manager.setCushion("/api/user", oldRule);
      manager.setCushion("/api/user", newRule);

      const retrieved = manager.getCushion("/api/user");
      expect(retrieved).toEqual(newRule);
    });
  });

  describe("URL Pattern Matching", () => {
    it("should support wildcard patterns (/api/user/*)", () => {
      const rule = {
        mapping: {
          name: "user_name",
          email: "user_email",
        },
      };

      manager.setCushion("/api/user/*", rule);

      // All these should match
      expect(manager.getCushion("/api/user/123")).toEqual(rule);
      expect(manager.getCushion("/api/user/profile")).toEqual(rule);
      expect(manager.getCushion("/api/user/settings")).toEqual(rule);

      // This should not match
      expect(manager.getCushion("/api/users")).toBeNull();
    });

    it("should support parameter patterns (/api/user/:id)", () => {
      const rule = {
        mapping: {
          name: "user_name",
          email: "user_email",
        },
      };

      manager.setCushion("/api/user/:id", rule);

      // These should match
      expect(manager.getCushion("/api/user/123")).toEqual(rule);
      expect(manager.getCushion("/api/user/abc-def")).toEqual(rule);

      // These should not match
      expect(manager.getCushion("/api/user")).toBeNull();
      expect(manager.getCushion("/api/user/123/profile")).toBeNull();
    });

    it("should prioritize exact matches over patterns", () => {
      const exactRule = {
        mapping: { name: "exact_name" },
      };
      const patternRule = {
        mapping: { name: "pattern_name" },
      };

      manager.setCushion("/api/user/123", exactRule);
      manager.setCushion("/api/user/:id", patternRule);

      // Exact match should win
      expect(manager.getCushion("/api/user/123")).toEqual(exactRule);
      // Pattern should work for others
      expect(manager.getCushion("/api/user/456")).toEqual(patternRule);
    });

    it("should handle query parameters", () => {
      const rule = {
        mapping: { name: "user_name" },
      };

      manager.setCushion("/api/user?version=v2", rule);

      // Should match with exact query params
      expect(manager.getCushion("/api/user?version=v2")).toEqual(rule);
      // Should not match without query params
      expect(manager.getCushion("/api/user")).toBeNull();
      // Should not match with different query params
      expect(manager.getCushion("/api/user?version=v1")).toBeNull();
    });
  });

  describe("Rule Management", () => {
    it("should remove specific cushion rules", () => {
      const rule = {
        mapping: { name: "user_name" },
      };

      manager.setCushion("/api/user", rule);
      expect(manager.getCushion("/api/user")).toEqual(rule);

      manager.removeCushion("/api/user");
      expect(manager.getCushion("/api/user")).toBeNull();
    });

    it("should clear all rules", () => {
      manager.setCushion("/api/user", { mapping: { name: "user_name" } });
      manager.setCushion("/api/posts", { mapping: { title: "post_title" } });
      manager.setCushion("/api/comments/*", {
        mapping: { text: "comment_text" },
      });

      manager.clearAll();

      expect(manager.getCushion("/api/user")).toBeNull();
      expect(manager.getCushion("/api/posts")).toBeNull();
      expect(manager.getCushion("/api/comments/123")).toBeNull();
    });

    it("should handle pattern removal correctly", () => {
      const rule = {
        mapping: { name: "user_name" },
      };

      manager.setCushion("/api/user/:id", rule);
      expect(manager.getCushion("/api/user/123")).toEqual(rule);

      manager.removeCushion("/api/user/:id");
      expect(manager.getCushion("/api/user/123")).toBeNull();
    });
  });

  describe("Complex Pattern Scenarios", () => {
    it("should handle multiple pattern types together", () => {
      manager.setCushion("/api/v1/*", { mapping: { version: "v1" } });
      manager.setCushion("/api/v2/*", { mapping: { version: "v2" } });
      manager.setCushion("/api/v2/user/:id", {
        mapping: { version: "v2", type: "user" },
      });

      expect(manager.getCushion("/api/v1/posts")).toEqual({
        mapping: { version: "v1" },
      });
      expect(manager.getCushion("/api/v2/posts")).toEqual({
        mapping: { version: "v2" },
      });
      expect(manager.getCushion("/api/v2/user/123")).toEqual({
        mapping: { version: "v2", type: "user" },
      });
    });

    it("should handle nested wildcard patterns", () => {
      const rule = {
        mapping: { content: "comment_content" },
      };

      manager.setCushion("/api/posts/*/comments/*", rule);

      expect(manager.getCushion("/api/posts/123/comments/456")).toEqual(rule);
      expect(manager.getCushion("/api/posts/abc/comments/def")).toEqual(rule);
      expect(manager.getCushion("/api/posts/123/comments")).toBeNull();
    });
  });

  describe("Real-world Configuration Scenarios", () => {
    it("should handle 단계적 API 버전 마이그레이션", () => {
      // v1 API 규칙
      manager.setCushion("/api/v1/user", {
        mapping: {
          name: "user_name",
          email: "user_email",
        },
      });

      // v2 API 규칙 (새로운 스키마)
      manager.setCushion("/api/v2/user", {
        mapping: {
          name: "userName",
          email: "userEmail",
        },
      });

      // 각 버전별로 다른 매핑 적용
      expect(manager.getCushion("/api/v1/user")?.mapping.name).toBe(
        "user_name"
      );
      expect(manager.getCushion("/api/v2/user")?.mapping.name).toBe("userName");
    });

    it("should handle 마이크로서비스별 다른 컨벤션", () => {
      // User 서비스: snake_case
      manager.setCushion("/api/user-service/*", {
        mapping: {
          name: "user_name",
          email: "user_email",
        },
      });

      // Order 서비스: camelCase
      manager.setCushion("/api/order-service/*", {
        mapping: {
          orderId: "order_id",
          totalAmount: "total_amount",
        },
      });

      // Product 서비스: 다른 구조
      manager.setCushion("/api/product-service/*", {
        mapping: {
          title: "product.name",
          price: "product.pricing.amount",
        },
      });

      // 각 서비스별로 적절한 매핑 적용
      expect(manager.getCushion("/api/user-service/profile")).toBeDefined();
      expect(manager.getCushion("/api/order-service/list")).toBeDefined();
      expect(manager.getCushion("/api/product-service/search")).toBeDefined();
    });

    it("should handle A/B 테스트 시나리오", () => {
      // 기본 규칙
      manager.setCushion("/api/user", {
        mapping: { name: "user_name" },
        fallback: { name: "username" },
      });

      // 특정 사용자 그룹을 위한 규칙
      manager.setCushion("/api/user?group=beta", {
        mapping: { name: "userName" },
      });

      // 일반 사용자는 기본 규칙
      expect(manager.getCushion("/api/user")?.mapping.name).toBe("user_name");
      // 베타 그룹은 새로운 규칙
      expect(manager.getCushion("/api/user?group=beta")?.mapping.name).toBe(
        "userName"
      );
    });
  });
});
