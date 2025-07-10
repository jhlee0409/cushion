import { describe, it, expect } from 'vitest';
import {
  absorb,
  createAbsorber,
  batchAbsorb,
  conditionalAbsorb,
  mergeMappings,
  createNestedMapping,
  validateAbsorbed,
  createTypedAbsorber,
} from '../../absorb';

describe('Advanced Scenarios - Absorb Module', () => {
  describe('createAbsorber() - Reusable Absorbers', () => {
    it('should create reusable absorber functions', () => {
      // Given: 사용자 데이터를 위한 재사용 가능한 absorber
      const userAbsorber = createAbsorber({
        name: 'username',
        email: 'user_email',
        age: 'user_age',
      });

      // When: 여러 사용자 데이터에 적용
      const user1 = userAbsorber({
        username: '김개발',
        user_email: 'kim@example.com',
        user_age: 30,
      });

      const user2 = userAbsorber({
        username: '박개발',
        user_email: 'park@example.com',
        user_age: 25,
      });

      // Then: 동일한 변환 규칙 적용
      expect(user1).toEqual({
        name: '김개발',
        email: 'kim@example.com',
        age: 30,
      });

      expect(user2).toEqual({
        name: '박개발',
        email: 'park@example.com',
        age: 25,
      });
    });

    it('should support options in absorber', () => {
      const userAbsorber = createAbsorber(
        {
          name: 'user_name',
          email: 'user_email',
        },
        {
          deepClone: true,
          onError: (error, key) => ({ error: true, key }),
        }
      );

      const result = userAbsorber({
        user_name: '김개발',
        user_email: 'dev@example.com',
      });

      // Deep clone ensures no reference to original
      expect(result).toEqual({
        name: '김개발',
        email: 'dev@example.com',
      });
    });
  });

  describe('batchAbsorb() - Array Processing', () => {
    it('should batch process arrays of data', () => {
      // Given: 여러 사용자 데이터
      const usersData = [
        { user_id: '1', user_name: '김개발', user_role: 'developer' },
        { user_id: '2', user_name: '박개발', user_role: 'designer' },
        { user_id: '3', user_name: '이개발', user_role: 'manager' },
      ];

      // When: 일괄 변환
      const users = batchAbsorb(usersData, {
        id: 'user_id',
        name: 'user_name',
        role: 'user_role',
      });

      // Then: 모든 항목이 변환됨
      expect(users).toEqual([
        { id: '1', name: '김개발', role: 'developer' },
        { id: '2', name: '박개발', role: 'designer' },
        { id: '3', name: '이개발', role: 'manager' },
      ]);
    });

    it('should handle empty arrays', () => {
      const result = batchAbsorb([], { name: 'user_name' });
      expect(result).toEqual([]);
    });

    it('should throw error for non-array input', () => {
      expect(() => batchAbsorb({} as any, { name: 'user_name' })).toThrow(
        '[Cushion] batchAbsorb expects an array'
      );
    });
  });

  describe('conditionalAbsorb() - Conditional Transformation', () => {
    it('should apply mapping based on condition', () => {
      // Given: 버전에 따라 다른 구조의 데이터
      const v2Data = {
        version: 2,
        userName: '김개발',
        userEmail: 'dev@example.com',
      };

      const v1Data = {
        version: 1,
        user_name: '박개발',
        user_email: 'dev2@example.com',
      };

      const config = {
        condition: (data: any) => data.version === 2,
        mapping: {
          name: 'userName',
          email: 'userEmail',
        },
        fallback: {
          name: 'user_name',
          email: 'user_email',
        },
      };

      // When: 조건부 변환
      const v2Result = conditionalAbsorb(v2Data, config);
      const v1Result = conditionalAbsorb(v1Data, config);

      // Then: 각 버전에 맞는 매핑 적용
      expect(v2Result).toEqual({
        name: '김개발',
        email: 'dev@example.com',
      });

      expect(v1Result).toEqual({
        name: '박개발',
        email: 'dev2@example.com',
      });
    });

    it('should return original data when no fallback and condition fails', () => {
      const data = { version: 1, legacy_field: 'value' };
      
      const result = conditionalAbsorb(data, {
        condition: (d) => d.version === 2,
        mapping: { field: 'new_field' },
      });

      expect(result).toEqual(data);
    });
  });

  describe('mergeMappings() - Combining Mappings', () => {
    it('should merge multiple mapping configurations', () => {
      // Given: 여러 매핑 설정
      const userMapping = {
        name: 'user_name',
        email: 'user_email',
      };

      const profileMapping = {
        avatar: 'profile_image',
        bio: 'profile_bio',
      };

      const socialMapping = {
        twitter: 'twitter_handle',
        github: 'github_username',
      };

      // When: 매핑 병합
      const combinedMapping = mergeMappings(userMapping, profileMapping, socialMapping);

      // Then: 모든 매핑이 하나로 합쳐짐
      expect(combinedMapping).toEqual({
        name: 'user_name',
        email: 'user_email',
        avatar: 'profile_image',
        bio: 'profile_bio',
        twitter: 'twitter_handle',
        github: 'github_username',
      });

      // 실제 사용
      const result = absorb(
        {
          user_name: '김개발',
          user_email: 'dev@example.com',
          profile_image: 'avatar.jpg',
          profile_bio: '개발자입니다',
          twitter_handle: '@kimdev',
          github_username: 'kimdev',
        },
        combinedMapping
      );

      expect(result.name).toBe('김개발');
      expect(result.avatar).toBe('avatar.jpg');
      expect(result.twitter).toBe('@kimdev');
    });
  });

  describe('createNestedMapping() - Dot Notation Support', () => {
    it('should create nested mapping from dot notation', () => {
      // Given: dot notation 매핑
      const flatMapping = {
        'user.name': 'profile.displayName',
        'user.email': 'contact.email',
        'user.address.city': 'location.city',
        'user.address.country': 'location.country',
      };

      // When: 중첩 매핑으로 변환
      const nestedMapping = createNestedMapping(flatMapping);

      // Then: 중첩 구조 생성
      expect(nestedMapping).toEqual({
        user: {
          name: 'profile.displayName',
          email: 'contact.email',
          address: {
            city: 'location.city',
            country: 'location.country',
          },
        },
      });
    });
  });

  describe('validateAbsorbed() - Data Validation', () => {
    it('should validate absorbed data against expected shape', () => {
      const userData = {
        name: '김개발',
        age: 30,
        email: 'dev@example.com',
        hobbies: ['coding', 'reading'],
      };

      const validShape = {
        name: 'string',
        age: 'number',
        email: 'string',
        hobbies: 'array',
      };

      expect(validateAbsorbed(userData, validShape)).toBe(true);
    });

    it('should return false for invalid types', () => {
      const invalidData = {
        name: '김개발',
        age: '30', // string instead of number
        email: 'dev@example.com',
      };

      const shape = {
        name: 'string',
        age: 'number',
        email: 'string',
      };

      expect(validateAbsorbed(invalidData, shape)).toBe(false);
    });

    it('should handle null and undefined values', () => {
      const dataWithNulls = {
        name: '김개발',
        age: null,
        email: undefined,
      };

      const shape = {
        name: 'string',
        age: 'number',
        email: 'string',
      };

      // null과 undefined는 허용됨
      expect(validateAbsorbed(dataWithNulls, shape)).toBe(true);
    });
  });

  describe('createTypedAbsorber() - Type-safe Absorption', () => {
    interface User {
      name: string;
      email: string;
      age: number;
    }

    it('should create type-safe absorber with validation', () => {
      const userAbsorber = createTypedAbsorber<User>(
        {
          name: 'username',
          email: 'user_email',
          age: 'user_age',
        },
        {
          name: 'string',
          email: 'string',
          age: 'number',
        }
      );

      // Valid data
      const validResult = userAbsorber({
        username: '김개발',
        user_email: 'dev@example.com',
        user_age: 30,
      });

      expect(validResult).toEqual({
        name: '김개발',
        email: 'dev@example.com',
        age: 30,
      });

      // Invalid data (wrong type)
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const invalidResult = userAbsorber({
        username: '김개발',
        user_email: 'dev@example.com',
        user_age: '30', // string instead of number
      });

      expect(invalidResult).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Cushion] Absorbed data does not match expected shape'
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Complex Real-world Scenarios', () => {
    it('should handle 복잡한 API 응답 변환', () => {
      // 복잡한 서버 응답
      const serverResponse = {
        data: {
          user_info: {
            user_id: '123',
            user_name: '김개발',
            user_details: {
              email_address: 'dev@example.com',
              phone_number: '010-1234-5678',
            },
          },
          user_posts: [
            { post_id: '1', post_title: '첫 글', created_at: '2024-01-01' },
            { post_id: '2', post_title: '두번째 글', created_at: '2024-01-02' },
          ],
          user_stats: {
            total_posts: 2,
            total_likes: 100,
            follower_count: 50,
          },
        },
        meta: {
          api_version: 'v2',
          response_time: 150,
        },
      };

      // 복잡한 매핑 규칙
      const complexMapping = {
        id: 'data.user_info.user_id',
        name: 'data.user_info.user_name',
        email: 'data.user_info.user_details.email_address',
        phone: 'data.user_info.user_details.phone_number',
        posts: 'data.user_posts',
        stats: (data: any) => ({
          posts: data.data.user_stats.total_posts,
          likes: data.data.user_stats.total_likes,
          followers: data.data.user_stats.follower_count,
        }),
        apiVersion: 'meta.api_version',
      };

      const result = absorb(serverResponse, complexMapping);

      expect(result).toEqual({
        id: '123',
        name: '김개발',
        email: 'dev@example.com',
        phone: '010-1234-5678',
        posts: [
          { post_id: '1', post_title: '첫 글', created_at: '2024-01-01' },
          { post_id: '2', post_title: '두번째 글', created_at: '2024-01-02' },
        ],
        stats: {
          posts: 2,
          likes: 100,
          followers: 50,
        },
        apiVersion: 'v2',
      });
    });

    it('should handle 단계별 데이터 변환 파이프라인', () => {
      // 1단계: 원본 데이터
      const rawData = {
        USR_ID: '123',
        USR_NM: '김개발',
        USR_EMAIL: 'dev@example.com',
        CREATED_DT: '2024-01-01T00:00:00Z',
      };

      // 2단계: 레거시 시스템 → 중간 형태
      const step1Mapping = {
        userId: 'USR_ID',
        userName: 'USR_NM',
        userEmail: 'USR_EMAIL',
        createdDate: 'CREATED_DT',
      };

      const intermediateData = absorb(rawData, step1Mapping);

      // 3단계: 중간 형태 → 최종 형태
      const step2Mapping = {
        id: 'userId',
        name: 'userName',
        email: 'userEmail',
        joinDate: (data: any) => new Date(data.createdDate).toLocaleDateString('ko-KR'),
      };

      const finalData = absorb(intermediateData, step2Mapping);

      expect(finalData).toEqual({
        id: '123',
        name: '김개발',
        email: 'dev@example.com',
        joinDate: '2024. 1. 1.',
      });
    });

    it('should handle 다중 소스 데이터 통합', () => {
      // 여러 API에서 온 데이터들
      const userServiceData = {
        user_id: '123',
        user_name: '김개발',
      };

      const profileServiceData = {
        userId: '123',
        profileImage: 'avatar.jpg',
        bio: '열정적인 개발자',
      };

      const statsServiceData = {
        user: {
          id: '123',
          statistics: {
            posts: 50,
            followers: 1000,
          },
        },
      };

      // 각 서비스별 absorber
      const userAbsorber = createAbsorber({
        id: 'user_id',
        name: 'user_name',
      });

      const profileAbsorber = createAbsorber({
        avatar: 'profileImage',
        bio: 'bio',
      });

      const statsAbsorber = createAbsorber({
        postCount: 'user.statistics.posts',
        followerCount: 'user.statistics.followers',
      });

      // 데이터 통합
      const userData = userAbsorber(userServiceData);
      const profileData = profileAbsorber(profileServiceData);
      const statsData = statsAbsorber(statsServiceData);

      const combinedUser = {
        ...userData,
        ...profileData,
        ...statsData,
      };

      expect(combinedUser).toEqual({
        id: '123',
        name: '김개발',
        avatar: 'avatar.jpg',
        bio: '열정적인 개발자',
        postCount: 50,
        followerCount: 1000,
      });
    });
  });
});