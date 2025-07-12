import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  ShockAbsorber,
  CushionManager,
  AbsorptionEngine,
  PluginEcosystem,
} from "../../core";

describe("ShockAbsorber (InterceptorManager)", () => {
  let shockAbsorber: ShockAbsorber;
  let cushionManager: CushionManager;
  let absorptionEngine: AbsorptionEngine;
  let pluginEcosystem: PluginEcosystem;
  let originalFetch: typeof fetch;
  let mockFetchImplementation: any;

  beforeEach(() => {
    cushionManager = new CushionManager();
    absorptionEngine = new AbsorptionEngine();
    pluginEcosystem = new PluginEcosystem(absorptionEngine);
    shockAbsorber = new ShockAbsorber(
      cushionManager,
      absorptionEngine,
      pluginEcosystem
    );

    // Store original fetch and create a flexible mock
    originalFetch = global.fetch;
    mockFetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
      clone: vi.fn().mockReturnThis(),
    });
    global.fetch = vi.fn((...args) => mockFetchImplementation(...args)) as any;
  });

  afterEach(() => {
    // Restore original fetch
    shockAbsorber.deactivate();
    global.fetch = originalFetch;
  });

  describe("Activation and Deactivation", () => {
    it("should intercept fetch when activated", async () => {
      // Given: Mock response
      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue({ user_name: "김개발" }),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetchImplementation.mockResolvedValue(mockResponse);

      // When: 활성화
      shockAbsorber.activate();

      // Then: fetch가 intercepted됨
      expect(global.fetch).not.toBe(originalFetch);

      // 실제 fetch 호출
      const response = await fetch("/api/user");
      expect(response).toBeDefined();
    });

    it("should restore original fetch when deactivated", () => {
      const mockFetch = global.fetch;

      shockAbsorber.activate();
      expect(global.fetch).not.toBe(mockFetch);

      shockAbsorber.deactivate();
      expect(global.fetch).toBe(mockFetch);
    });

    it("should not activate twice", () => {
      shockAbsorber.activate();
      const firstInterceptor = global.fetch;

      shockAbsorber.activate();
      const secondInterceptor = global.fetch;

      expect(firstInterceptor).toBe(secondInterceptor);
    });
  });

  describe("HTTP Response Interception", () => {
    beforeEach(() => {
      shockAbsorber.activate();
    });

    it("should transform response data according to cushion rules", async () => {
      // Given: 서버 응답 (snake_case)
      const serverResponse = {
        user_name: "김개발",
        user_email: "dev@example.com",
      };

      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue(serverResponse),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetchImplementation.mockResolvedValue(mockResponse);

      // 변환 규칙 설정
      cushionManager.setCushion("/api/user", {
        mapping: {
          name: "user_name",
          email: "user_email",
        },
      });

      // When: fetch 호출
      const response = await fetch("/api/user");
      const data = await response.json();

      // Then: 데이터가 변환됨
      expect(data).toEqual({
        name: "김개발",
        email: "dev@example.com",
      });
    });

    it("should pass through responses without matching cushion rules", async () => {
      // Given: 규칙이 없는 API
      const serverResponse = {
        user_name: "김개발",
        user_email: "dev@example.com",
      };

      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue(serverResponse),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetchImplementation.mockResolvedValue(mockResponse);

      // When: 규칙 없이 fetch
      const response = await fetch("/api/unknown");
      const data = await response.json();

      // Then: 원본 그대로 반환
      expect(data).toEqual(serverResponse);
    });

    it("should handle non-JSON responses", async () => {
      // Given: HTML 응답
      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-type": "text/html" }),
        text: vi.fn().mockResolvedValue("<html>Test</html>"),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetchImplementation.mockResolvedValue(mockResponse);

      cushionManager.setCushion("/api/page", {
        mapping: { title: "page_title" },
      });

      // When: HTML 페이지 요청
      const response = await fetch("/api/page");

      // Then: 변환 없이 원본 반환
      expect(response).toBe(mockResponse);
    });

    it("should handle error responses", async () => {
      // Given: 에러 응답
      const mockResponse = {
        ok: false,
        status: 404,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue({ error: "Not found" }),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetchImplementation.mockResolvedValue(mockResponse);

      cushionManager.setCushion("/api/user", {
        mapping: { name: "user_name" },
      });

      // When: 404 응답
      const response = await fetch("/api/user");

      // Then: 변환 없이 에러 응답 반환
      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });
  });

  describe("Conditional Transformation", () => {
    beforeEach(() => {
      shockAbsorber.activate();
    });

    it("should apply conditional transformations", async () => {
      // Given: v2 API 응답
      const serverResponse = {
        version: "v2",
        userName: "김개발",
        userEmail: "dev@example.com",
      };

      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue(serverResponse),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetchImplementation.mockResolvedValue(mockResponse);

      // 조건부 규칙 설정
      cushionManager.setCushion("/api/user", {
        mapping: {
          name: "userName",
          email: "userEmail",
        },
        condition: (data) => data.version === "v2",
        fallback: {
          name: "user_name",
          email: "user_email",
        },
      });

      // When: v2 API 호출
      const response = await fetch("/api/user");
      const data = await response.json();

      // Then: v2 매핑 적용
      expect(data).toEqual({
        name: "김개발",
        email: "dev@example.com",
      });
    });

    it("should use fallback when condition fails", async () => {
      // Given: v1 API 응답
      const serverResponse = {
        version: "v1",
        user_name: "김개발",
        user_email: "dev@example.com",
      };

      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue(serverResponse),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetchImplementation.mockResolvedValue(mockResponse);

      cushionManager.setCushion("/api/user", {
        mapping: {
          name: "userName",
          email: "userEmail",
        },
        condition: (data) => data.version === "v2",
        fallback: {
          name: "user_name",
          email: "user_email",
        },
      });

      // When: v1 API 호출
      const response = await fetch("/api/user");
      const data = await response.json();

      // Then: fallback 매핑 적용
      expect(data).toEqual({
        name: "김개발",
        email: "dev@example.com",
      });
    });
  });

  describe("Plugin Integration", () => {
    beforeEach(() => {
      shockAbsorber.activate();
    });

    it("should execute request hooks", async () => {
      const requestHook = vi.fn();
      pluginEcosystem.onRequest(requestHook);

      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue({}),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetchImplementation.mockResolvedValue(mockResponse);

      await fetch("/api/user", { method: "GET" });

      expect(requestHook).toHaveBeenCalledWith("/api/user", { method: "GET" });
    });

    it("should execute response hooks", async () => {
      const responseHook = vi.fn((url, data) => ({ ...data, hooked: true }));
      pluginEcosystem.onResponse(responseHook);

      const serverResponse = { user_name: "김개발" };
      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue(serverResponse),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetchImplementation.mockResolvedValue(mockResponse);

      cushionManager.setCushion("/api/user", {
        mapping: { name: "user_name", hooked: "hooked" },
      });

      const response = await fetch("/api/user");
      const data = await response.json();

      expect(responseHook).toHaveBeenCalledWith("/api/user", serverResponse);
      expect(data).toHaveProperty("hooked", true);
    });

    it("should execute absorb hooks", async () => {
      const absorbHook = vi.fn((data, mapping, context) => ({
        ...data,
        absorbed: true,
      }));
      pluginEcosystem.onAbsorb(absorbHook);

      const serverResponse = { user_name: "김개발" };
      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue(serverResponse),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetchImplementation.mockResolvedValue(mockResponse);

      const mapping = { name: "user_name" };
      cushionManager.setCushion("/api/user", { mapping });

      const response = await fetch("/api/user");
      const data = await response.json();

      expect(absorbHook).toHaveBeenCalled();
      expect(data).toHaveProperty("absorbed", true);
    });
  });

  describe("Real-world Interception Scenarios", () => {
    beforeEach(() => {
      shockAbsorber.activate();
    });

    it("should handle 백엔드 팀의 갑작스러운 스키마 변경", async () => {
      // Scenario: 백엔드가 모든 API를 snake_case → camelCase로 변경

      // 1. 기존 API 응답
      const oldResponse = {
        user_name: "김개발",
        user_email: "dev@example.com",
        created_at: "2024-01-01",
      };

      // 2. 새로운 API 응답
      const newResponse = {
        userName: "김개발",
        userEmail: "dev@example.com",
        createdAt: "2024-01-01",
      };

      // 처음엔 old response
      let mockResponse = {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue(oldResponse),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetchImplementation.mockResolvedValue(mockResponse);

      // 기존 매핑
      cushionManager.setCushion("/api/user", {
        mapping: {
          name: "user_name",
          email: "user_email",
          joinDate: "created_at",
        },
      });

      const response1 = await fetch("/api/user");
      const data1 = await response1.json();
      expect(data1.name).toBe("김개발");

      // 백엔드 변경 발생!
      mockResponse = {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue(newResponse),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetchImplementation.mockResolvedValue(mockResponse);

      // 매핑만 업데이트 (한 곳만 수정!)
      cushionManager.setCushion("/api/user", {
        mapping: {
          name: "userName",
          email: "userEmail",
          joinDate: "createdAt",
        },
      });

      const response2 = await fetch("/api/user");
      const data2 = await response2.json();

      // 프론트엔드 코드는 여전히 name, email, joinDate 사용
      expect(data2.name).toBe("김개발");
      expect(data2.email).toBe("dev@example.com");
      expect(data2.joinDate).toBe("2024-01-01");
    });

    it("should handle 여러 마이크로서비스의 다른 컨벤션", async () => {
      // User Service: snake_case
      const userServiceResponse = {
        user_id: "123",
        user_name: "김개발",
      };

      // Order Service: camelCase
      const orderServiceResponse = {
        orderId: "456",
        totalAmount: 50000,
      };

      // 각 서비스별 매핑 설정
      cushionManager.setCushion("/api/user-service/*", {
        mapping: {
          id: "user_id",
          name: "user_name",
        },
      });

      cushionManager.setCushion("/api/order-service/*", {
        mapping: {
          id: "orderId",
          amount: "totalAmount",
        },
      });

      // User Service 호출
      mockFetchImplementation.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue(userServiceResponse),
        clone: vi.fn().mockReturnThis(),
      });

      const userResponse = await fetch("/api/user-service/profile");
      const userData = await userResponse.json();
      expect(userData).toEqual({ id: "123", name: "김개발" });

      // Order Service 호출
      mockFetchImplementation.mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue(orderServiceResponse),
        clone: vi.fn().mockReturnThis(),
      });

      const orderResponse = await fetch("/api/order-service/current");
      const orderData = await orderResponse.json();
      expect(orderData).toEqual({ id: "456", amount: 50000 });
    });

    it("should handle JSON parsing errors gracefully", async () => {
      const mockResponse = {
        ok: true,
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetchImplementation.mockResolvedValue(mockResponse);

      cushionManager.setCushion("/api/user", {
        mapping: { name: "user_name" },
      });

      // Should return cloned response on JSON parse error
      const response = await fetch("/api/user");
      expect(response).toBeDefined();
    });
  });
});
