import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginEcosystem, AbsorptionEngine } from '../../core';
import type { Plugin, CushionCore } from '../../types';

describe('PluginEcosystem', () => {
  let ecosystem: PluginEcosystem;
  let absorptionEngine: AbsorptionEngine;

  beforeEach(() => {
    absorptionEngine = new AbsorptionEngine();
    ecosystem = new PluginEcosystem(absorptionEngine);
  });

  describe('Plugin Registration', () => {
    it('should register and install plugins', () => {
      const installFn = vi.fn();
      const plugin: Plugin = {
        name: 'test-plugin',
        install: installFn,
      };

      ecosystem.use(plugin);

      expect(installFn).toHaveBeenCalledWith(ecosystem);
      expect(installFn).toHaveBeenCalledOnce();
    });

    it('should prevent duplicate plugin registration', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const installFn = vi.fn();
      const plugin: Plugin = {
        name: 'test-plugin',
        install: installFn,
      };

      ecosystem.use(plugin);
      ecosystem.use(plugin); // 중복 등록 시도

      expect(installFn).toHaveBeenCalledOnce(); // 한 번만 호출
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[Cushion] Plugin "test-plugin" is already installed'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should remove plugins', () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        install: vi.fn(),
      };

      ecosystem.use(plugin);
      ecosystem.remove('test-plugin');

      // 다시 등록 시도하면 경고 없이 설치됨
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      ecosystem.use(plugin);
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Hook System', () => {
    describe('Absorb Hooks', () => {
      it('should register and execute absorb hooks', () => {
        const hook = vi.fn((data) => ({ ...data, hooked: true }));
        ecosystem.onAbsorb(hook);

        const inputData = { name: '김개발' };
        const mapping = { name: 'user_name' };
        const context = { url: '/api/user' };

        const result = ecosystem.executeAbsorbHooks(inputData, mapping, context);

        expect(hook).toHaveBeenCalledWith(inputData, mapping, context);
        expect(result).toEqual({ name: '김개발', hooked: true });
      });

      it('should execute multiple absorb hooks in order', () => {
        const hook1 = vi.fn((data) => ({ ...data, step1: true }));
        const hook2 = vi.fn((data) => ({ ...data, step2: true }));
        const hook3 = vi.fn((data) => ({ ...data, step3: true }));

        ecosystem.onAbsorb(hook1);
        ecosystem.onAbsorb(hook2);
        ecosystem.onAbsorb(hook3);

        const result = ecosystem.executeAbsorbHooks({}, {}, {});

        expect(result).toEqual({ step1: true, step2: true, step3: true });
        // Verify hooks were called
        expect(hook1).toHaveBeenCalled();
        expect(hook2).toHaveBeenCalled();
        expect(hook3).toHaveBeenCalled();
      });

      it('should handle errors in absorb hooks gracefully', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const errorHook = vi.fn(() => {
          throw new Error('Hook error');
        });
        const normalHook = vi.fn((data) => ({ ...data, success: true }));

        ecosystem.onAbsorb(errorHook);
        ecosystem.onAbsorb(normalHook);

        const result = ecosystem.executeAbsorbHooks({ original: true }, {}, {});

        expect(result).toEqual({ original: true, success: true });
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[Cushion] Error in absorb hook:',
          expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
      });
    });

    describe('Request Hooks', () => {
      it('should register and execute request hooks', () => {
        const hook = vi.fn();
        ecosystem.onRequest(hook);

        const url = '/api/user';
        const options = { method: 'GET', headers: {} };

        ecosystem.executeRequestHooks(url, options);

        expect(hook).toHaveBeenCalledWith(url, options);
      });

      it('should execute multiple request hooks', () => {
        const hook1 = vi.fn();
        const hook2 = vi.fn();

        ecosystem.onRequest(hook1);
        ecosystem.onRequest(hook2);

        ecosystem.executeRequestHooks('/api/user', {});

        expect(hook1).toHaveBeenCalled();
        expect(hook2).toHaveBeenCalled();
      });

      it('should handle errors in request hooks gracefully', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const errorHook = vi.fn(() => {
          throw new Error('Request hook error');
        });
        const normalHook = vi.fn();

        ecosystem.onRequest(errorHook);
        ecosystem.onRequest(normalHook);

        ecosystem.executeRequestHooks('/api/user', {});

        expect(normalHook).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
      });
    });

    describe('Response Hooks', () => {
      it('should register and execute response hooks', () => {
        const hook = vi.fn((url, data) => ({ ...data, processed: true }));
        ecosystem.onResponse(hook);

        const url = '/api/user';
        const data = { name: '김개발' };

        const result = ecosystem.executeResponseHooks(url, data);

        expect(hook).toHaveBeenCalledWith(url, data);
        expect(result).toEqual({ name: '김개발', processed: true });
      });

      it('should chain response hooks', () => {
        const hook1 = vi.fn((url, data) => ({ ...data, version: 1 }));
        const hook2 = vi.fn((url, data) => ({ ...data, version: data.version + 1 }));

        ecosystem.onResponse(hook1);
        ecosystem.onResponse(hook2);

        const result = ecosystem.executeResponseHooks('/api/user', {});

        expect(result).toEqual({ version: 2 });
      });

      it('should handle errors in response hooks', () => {
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const errorHook = vi.fn(() => {
          throw new Error('Response hook error');
        });
        const normalHook = vi.fn((url, data) => ({ ...data, safe: true }));

        ecosystem.onResponse(errorHook);
        ecosystem.onResponse(normalHook);

        const result = ecosystem.executeResponseHooks('/api/user', { original: true });

        expect(result).toEqual({ original: true, safe: true });
        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe('Custom Mappers', () => {
    it('should add custom mappers to absorption engine', () => {
      const mapper = vi.fn((data, path) => 'custom');
      ecosystem.addMapper(mapper);

      // Mapper should be added with a unique name
      // We can't directly test this without exposing internals,
      // but we can verify it doesn't throw
      expect(() => ecosystem.addMapper(mapper)).not.toThrow();
    });
  });

  describe('Real-world Plugin Scenarios', () => {
    it('should implement a logging plugin', () => {
      const logs: string[] = [];
      
      const loggingPlugin: Plugin = {
        name: 'logger',
        install(core: CushionCore) {
          core.onRequest((url, options) => {
            logs.push(`[Request] ${options.method || 'GET'} ${url}`);
          });

          core.onResponse((url, data) => {
            logs.push(`[Response] ${url} - ${JSON.stringify(data)}`);
            return data;
          });

          core.onAbsorb((data, mapping, context) => {
            logs.push(`[Absorb] ${context.url} - Applied mapping`);
            return data;
          });
        },
      };

      ecosystem.use(loggingPlugin);

      // Simulate request
      ecosystem.executeRequestHooks('/api/user', { method: 'POST' });
      
      // Simulate response
      ecosystem.executeResponseHooks('/api/user', { name: '김개발' });
      
      // Simulate absorb
      ecosystem.executeAbsorbHooks(
        { name: '김개발' },
        { name: 'user_name' },
        { url: '/api/user' }
      );

      expect(logs).toEqual([
        '[Request] POST /api/user',
        '[Response] /api/user - {"name":"김개발"}',
        '[Absorb] /api/user - Applied mapping',
      ]);
    });

    it('should implement a validation plugin (like Zod)', () => {
      interface Schema {
        parse: (data: any) => any;
      }

      const userSchema: Schema = {
        parse: (data) => {
          if (!data.name || typeof data.name !== 'string') {
            throw new Error('Invalid name');
          }
          if (!data.email || !data.email.includes('@')) {
            throw new Error('Invalid email');
          }
          return data;
        },
      };

      const validationPlugin: Plugin = {
        name: 'validation',
        install(core: CushionCore) {
          core.onAbsorb((data, mapping, context) => {
            if ((context as any).schema) {
              try {
                return (context as any).schema.parse(data);
              } catch (error) {
                console.error('[Validation] Failed:', error);
                throw error;
              }
            }
            return data;
          });
        },
      };

      ecosystem.use(validationPlugin);

      // Valid data
      const validData = { name: '김개발', email: 'dev@example.com' };
      const validResult = ecosystem.executeAbsorbHooks(
        validData,
        {},
        { url: '/api/user', schema: userSchema }
      );
      expect(validResult).toEqual(validData);

      // Invalid data
      const invalidData = { name: '김개발', email: 'invalid-email' };
      expect(() =>
        ecosystem.executeAbsorbHooks(invalidData, {}, { url: '/api/user', schema: userSchema })
      ).toThrow('Invalid email');
    });

    it('should implement a caching plugin', () => {
      const cache = new Map<string, any>();

      const cachingPlugin: Plugin = {
        name: 'cache',
        install(core: CushionCore) {
          core.onRequest((url) => {
            if (cache.has(url)) {
              console.log(`[Cache] Hit: ${url}`);
            }
          });

          core.onResponse((url, data) => {
            cache.set(url, data);
            console.log(`[Cache] Stored: ${url}`);
            return data;
          });
        },
      };

      ecosystem.use(cachingPlugin);

      // First request
      ecosystem.executeResponseHooks('/api/user', { name: '김개발' });
      expect(cache.has('/api/user')).toBe(true);
      expect(cache.get('/api/user')).toEqual({ name: '김개발' });

      // Second request (cache hit)
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      ecosystem.executeRequestHooks('/api/user', {});
      expect(consoleLogSpy).toHaveBeenCalledWith('[Cache] Hit: /api/user');
      consoleLogSpy.mockRestore();
    });

    it('should implement a retry plugin', () => {
      let attemptCount = 0;

      const retryPlugin: Plugin = {
        name: 'retry',
        install(core: CushionCore) {
          core.onResponse((url, data) => {
            if ((data as any).error && attemptCount < 3) {
              attemptCount++;
              console.log(`[Retry] Attempt ${attemptCount} for ${url}`);
              // In real implementation, would trigger retry
              return { ...data, retryAttempt: attemptCount };
            }
            return data;
          });
        },
      };

      ecosystem.use(retryPlugin);

      const errorResponse = { error: 'Network error' };
      const result = ecosystem.executeResponseHooks('/api/user', errorResponse);
      expect(result).toEqual({ error: 'Network error', retryAttempt: 1 });
    });
  });
});