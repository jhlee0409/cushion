import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  setupCushion,
  setupCushions,
  removeCushion,
  absorb,
  use,
  removePlugin,
  activate,
  deactivate,
  reset,
  createPlugin,
} from '../../index';
import type { Plugin } from '../../types';

describe('Public API Integration Tests', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    reset(); // 각 테스트 전 초기화
    global.fetch = vi.fn(); // reset 후에 mock 설정
  });

  afterEach(() => {
    reset();
    global.fetch = originalFetch;
  });

  describe('setupCushion() - 기본 API 설정', () => {
    it('should setup transform and auto-activate (Simple things simple)', async () => {
      // Given: 서버가 snake_case 사용
      const serverResponse = {
        user_name: '김개발',
        user_email: 'dev@example.com',
      };

      const mockFetch = vi.fn();
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue(serverResponse),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetch.mockResolvedValue(mockResponse);
      global.fetch = mockFetch as any;

      // When: 한 곳에서만 설정
      setupCushion('/api/user', {
        name: 'user_name',
        email: 'user_email',
      });

      // Then: 이후 자동 변환
      const response = await fetch('/api/user');
      const user = await response.json();

      expect(user).toEqual({
        name: '김개발',
        email: 'dev@example.com',
      });
    });

    it('should handle 백엔드 팀의 갑작스러운 변경', async () => {
      // Scenario: "죄송합니다. 코딩 컨벤션 변경으로 모든 필드명이 snake_case → camelCase로 바뀝니다."

      // 1. 처음엔 snake_case
      let mockFetch = vi.fn();
      let mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({
          user_name: '김개발',
          user_email: 'dev@example.com',
        }),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetch.mockResolvedValue(mockResponse);
      global.fetch = mockFetch as any;

      setupCushion('/api/user', {
        name: 'user_name',
        email: 'user_email',
      });

      // 프론트엔드 코드
      const getUser = async () => {
        const response = await fetch('/api/user');
        return response.json();
      };

      let user = await getUser();
      expect(user.name).toBe('김개발');

      // 2. 백엔드가 갑자기 camelCase로 변경!
      mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({
          userName: '김개발',
          userEmail: 'dev@example.com',
        }),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // 3. api-config.ts 한 파일만 수정
      setupCushion('/api/user', {
        name: 'userName', // user_name → userName
        email: 'userEmail', // user_email → userEmail
      });

      // 4. 프론트엔드 200개 파일은 변경 없음!
      user = await getUser(); // 동일한 코드
      expect(user.name).toBe('김개발'); // 여전히 동작!
      expect(user.email).toBe('dev@example.com');
    });

    it('should handle conditional mapping (조건부 매핑)', async () => {
      // v2 API 응답
      const v2Response = {
        version: 'v2',
        userName: '김개발',
        userEmail: 'dev@example.com',
      };

      const mockFetch = vi.fn();
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue(v2Response),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetch.mockResolvedValue(mockResponse);
      global.fetch = mockFetch as any;

      // 조건부 쿠션 설정
      setupCushion('/api/user', {
        mapping: {
          name: 'userName',
          email: 'userEmail',
        },
        condition: (data) => data.version === 'v2',
        fallback: {
          name: 'user_name', // v1 버전용
          email: 'email',
        },
      });

      const response = await fetch('/api/user');
      const user = await response.json();

      expect(user.name).toBe('김개발');
      expect(user.email).toBe('dev@example.com');
    });

    it('should handle nested object mapping (중첩 객체 매핑)', async () => {
      // 서버가 구조를 변경: flat → nested
      const nestedResponse = {
        user: {
          profile: {
            name: '김개발',
            avatar_url: 'avatar.jpg',
          },
        },
      };

      const mockFetch = vi.fn();
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue(nestedResponse),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetch.mockResolvedValue(mockResponse);
      global.fetch = mockFetch as any;

      setupCushion('/api/profile', {
        name: 'user.profile.name',
        avatar: 'user.profile.avatar_url',
      });

      const response = await fetch('/api/profile');
      const profile = await response.json();

      expect(profile).toEqual({
        name: '김개발',
        avatar: 'avatar.jpg',
      });
    });
  });

  describe('setupCushions() - 여러 API 일괄 설정', () => {
    it('should setup multiple cushions at once', async () => {
      // Mock 먼저 설정
      const mockFetch = vi.fn();
      global.fetch = mockFetch as any;

      setupCushions({
        '/api/user': { name: 'user_name', email: 'user_email' },
        '/api/posts': { title: 'post_title', content: 'post_content' },
        '/api/comments/*': { text: 'comment_text', author: 'author_name' },
      });

      // User API
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({
          user_name: '김개발',
          user_email: 'dev@example.com',
        }),
        clone: vi.fn().mockReturnThis(),
      });

      const userResponse = await fetch('/api/user');
      const user = await userResponse.json();
      expect(user.name).toBe('김개발');

      // Posts API
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({
          post_title: '제목',
          post_content: '내용',
        }),
        clone: vi.fn().mockReturnThis(),
      });

      const postResponse = await fetch('/api/posts');
      const post = await postResponse.json();
      expect(post.title).toBe('제목');

      // Comments API (with pattern)
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({
          comment_text: '댓글',
          author_name: '박개발',
        }),
        clone: vi.fn().mockReturnThis(),
      });

      const commentResponse = await fetch('/api/comments/123');
      const comment = await commentResponse.json();
      expect(comment.text).toBe('댓글');
      expect(comment.author).toBe('박개발');
    });
  });

  describe('absorb() - 수동 변환', () => {
    it('should manually transform data', () => {
      const chaoticServerData = {
        post_title: '서버 스키마 변경',
        writer: {
          display_name: '김개발',
        },
      };

      const cushionedData = absorb(chaoticServerData, {
        title: 'post_title',
        author: 'writer.display_name',
      });

      expect(cushionedData).toEqual({
        title: '서버 스키마 변경',
        author: '김개발',
      });
    });
  });

  describe('Plugin System', () => {
    it('should use plugins with createPlugin helper', async () => {
      const logs: string[] = [];

      // 커스텀 플러그인 생성
      const loggingPlugin = createPlugin('logger', (core) => {
        core.onRequest((url, options) => {
          logs.push(`[Cushion] Request: ${url}`);
        });

        core.onAbsorb((data, mapping, context) => {
          logs.push(`[Cushion] Absorbed data for ${context.url}`);
          return data;
        });
      });

      // Mock 먼저 설정
      const mockFetch = vi.fn();
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ user_name: '김개발' }),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetch.mockResolvedValue(mockResponse);
      global.fetch = mockFetch as any;

      use(loggingPlugin);

      // Setup cushion
      setupCushion('/api/user', {
        name: 'user_name',
      });

      await fetch('/api/user');

      expect(logs).toContain('[Cushion] Request: /api/user');
      expect(logs).toContain('[Cushion] Absorbed data for /api/user');
    });

    it('should remove plugins', () => {
      const plugin = createPlugin('test', (core) => {
        core.onRequest(() => {});
      });

      use(plugin);
      removePlugin('test');

      // No error should occur
      expect(() => use(plugin)).not.toThrow();
    });
  });

  describe('Manual Control', () => {
    it('should activate and deactivate cushion manually', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch as any;

      deactivate(); // 비활성화

      setupCushion('/api/user', {
        name: 'user_name',
      });

      // 자동 활성화 후 다시 비활성화
      deactivate();

      // 변환이 적용되지 않음
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ user_name: '김개발' }),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const response = await fetch('/api/user');
      const data = await response.json();
      expect(data).toEqual({ user_name: '김개발' }); // 변환 안됨

      // 다시 활성화
      activate();

      const response2 = await fetch('/api/user');
      const data2 = await response2.json();
      expect(data2).toEqual({ name: '김개발' }); // 변환됨
    });

    it('should remove specific cushion', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch as any;

      setupCushion('/api/user', { name: 'user_name' });
      setupCushion('/api/posts', { title: 'post_title' });

      removeCushion('/api/user');

      // User API는 변환 안됨
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ user_name: '김개발' }),
        clone: vi.fn().mockReturnThis(),
      });

      const userResponse = await fetch('/api/user');
      const userData = await userResponse.json();
      expect(userData).toEqual({ user_name: '김개발' }); // 원본 그대로

      // Posts API는 여전히 변환됨
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ post_title: '제목' }),
        clone: vi.fn().mockReturnThis(),
      });

      const postResponse = await fetch('/api/posts');
      const postData = await postResponse.json();
      expect(postData).toEqual({ title: '제목' }); // 변환됨
    });

    it('should reset all cushions', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch as any;

      setupCushions({
        '/api/user': { name: 'user_name' },
        '/api/posts': { title: 'post_title' },
      });

      reset();

      // 모든 변환이 제거됨
      const mockResponse = {
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({ user_name: '김개발' }),
        clone: vi.fn().mockReturnThis(),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const response = await fetch('/api/user');
      const data = await response.json();
      expect(data).toEqual({ user_name: '김개발' }); // 원본 그대로
    });
  });

  describe('Real-world Integration Scenarios', () => {
    it('should handle 점진적 API 마이그레이션', async () => {
      // A/B 테스트로 점진적 변경
      const detectVersion = (data: any) => 'userName' in data;

      const mockFetch = vi.fn();
      global.fetch = mockFetch as any;

      setupCushion('/api/user', {
        mapping: {
          name: 'userName',
          email: 'userEmail',
        },
        fallback: {
          name: 'user_name', // 구버전 fallback
          email: 'user_email',
        },
        condition: detectVersion, // 새 버전 감지
      });

      // Old version user
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({
          user_name: '김개발',
          user_email: 'old@example.com',
        }),
        clone: vi.fn().mockReturnThis(),
      });

      let response = await fetch('/api/user');
      let user = await response.json();
      expect(user).toEqual({ name: '김개발', email: 'old@example.com' });

      // New version user
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({
          userName: '박개발',
          userEmail: 'new@example.com',
        }),
        clone: vi.fn().mockReturnThis(),
      });

      response = await fetch('/api/user');
      user = await response.json();
      expect(user).toEqual({ name: '박개발', email: 'new@example.com' });
    });

    it('should handle 마이크로서비스 환경', async () => {
      // 각 서비스별 다른 컨벤션
      const mockFetch = vi.fn();
      global.fetch = mockFetch as any;

      setupCushions({
        '/api/user-service/*': {
          // User 서비스: snake_case
          id: 'user_id',
          name: 'user_name',
        },
        '/api/order-service/*': {
          // Order 서비스: camelCase
          id: 'orderId',
          amount: 'totalAmount',
        },
        '/api/product-service/*': {
          // Product 서비스: nested
          id: 'product.id',
          name: 'product.name',
          price: 'product.pricing.amount',
        },
      });

      // User Service
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({
          user_id: '123',
          user_name: '김개발',
        }),
        clone: vi.fn().mockReturnThis(),
      });

      let response = await fetch('/api/user-service/profile');
      let data = await response.json();
      expect(data).toEqual({ id: '123', name: '김개발' });

      // Order Service
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({
          orderId: '456',
          totalAmount: 50000,
        }),
        clone: vi.fn().mockReturnThis(),
      });

      response = await fetch('/api/order-service/current');
      data = await response.json();
      expect(data).toEqual({ id: '456', amount: 50000 });

      // Product Service
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({
          product: {
            id: '789',
            name: '노트북',
            pricing: { amount: 1500000 },
          },
        }),
        clone: vi.fn().mockReturnThis(),
      });

      response = await fetch('/api/product-service/detail');
      data = await response.json();
      expect(data).toEqual({ id: '789', name: '노트북', price: 1500000 });
    });

    it('should demonstrate the complete workflow', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch as any;

      // 1. 초기 설정
      setupCushion('/api/user', {
        name: 'user_name',
        email: 'user_email',
        joinDate: 'created_at',
      });

      // 2. 플러그인 추가
      const metricsPlugin = createPlugin('metrics', (core) => {
        let transformCount = 0;
        core.onAbsorb((data) => {
          transformCount++;
          console.log(`Total transforms: ${transformCount}`);
          return data;
        });
      });
      use(metricsPlugin);

      // 3. 일반적인 사용
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: vi.fn().mockResolvedValue({
          user_name: '김개발',
          user_email: 'dev@example.com',
          created_at: '2024-01-01',
        }),
        clone: vi.fn().mockReturnThis(),
      });

      const response = await fetch('/api/user');
      const user = await response.json();

      expect(user).toEqual({
        name: '김개발',
        email: 'dev@example.com',
        joinDate: '2024-01-01',
      });

      // 4. 백엔드 변경 대응 (한 줄 수정!)
      setupCushion('/api/user', {
        name: 'userName', // 변경!
        email: 'userEmail', // 변경!
        joinDate: 'createdAt', // 변경!
      });

      // 프론트엔드 코드는 그대로 유지됨
    });
  });
});