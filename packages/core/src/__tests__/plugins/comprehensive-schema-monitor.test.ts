import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createComprehensiveSchemaMonitorPlugin } from '../../plugins/comprehensive-schema-monitor';
import { use, reset } from '../../index';

describe('Comprehensive Schema Monitor Plugin', () => {
  beforeEach(() => {
    reset();
    vi.clearAllMocks();
  });

  describe('Integration Tests', () => {
    it('should integrate all monitoring components', async () => {
      const alerts: any[] = [];
      const metrics: any[] = [];
      
      const plugin = createComprehensiveSchemaMonitorPlugin({
        enabled: true,
        developmentMode: true,
        monitor: {
          enableLogging: false,
          trackNewFields: true,
          trackTypeChanges: true,
        },
        alerts: {
          enableMissingFieldAlerts: true,
          enableTypeChangeAlerts: true,
          enableNewFieldAlerts: true,
          onAlert: (alert) => alerts.push(alert),
          suppressConsoleAlerts: true,
        },
        analytics: {
          enablePerformanceMetrics: true,
          enableSchemaEvolution: true,
          onMetricsUpdate: (metric) => metrics.push(metric),
        },
      });

      use(plugin);

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Simulate various scenarios
      
      // 1. Normal operation
      absorbHook(
        { name: 'John', email: 'john@example.com' },
        { name: 'user_name', email: 'user_email' },
        { url: '/api/user' }
      );

      // 2. Missing field (should trigger alert)
      absorbHook(
        { name: 'Jane', email: undefined },
        { name: 'user_name', email: 'user_email' },
        { url: '/api/user' }
      );

      // 3. Error case
      try {
        absorbHook(
          null,
          { name: 'user_name' },
          { url: '/api/user' }
        );
      } catch (error) {
        // Expected to be handled gracefully
      }

      // Verify alerts were triggered
      expect(alerts.length).toBeGreaterThan(0);
      
      // Verify utilities are available
      expect(utilities).toHaveProperty('getDashboard');
      expect(utilities).toHaveProperty('exportReport');
      expect(utilities).toHaveProperty('destroy');

      const dashboard = utilities.getDashboard();
      expect(dashboard).toHaveProperty('currentMetrics');
      expect(dashboard).toHaveProperty('alerts');
      expect(dashboard).toHaveProperty('analytics');
    });

    it('should handle webhook integrations', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const plugin = createComprehensiveSchemaMonitorPlugin({
        integrations: {
          webhook: {
            url: 'https://example.com/webhook',
            headers: { 'Authorization': 'Bearer token' },
            events: ['schema_change', 'alert'],
          },
        },
      });

      use(plugin);

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Trigger a schema change that should send webhook
      absorbHook(
        { name: 'John', email: undefined },
        { name: 'user_name', email: 'user_email' },
        { url: '/api/user' }
      );

      // Give webhook time to send
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify webhook was called
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token',
          }),
          body: expect.stringContaining('schema_change'),
        })
      );
    });

    it('should handle Slack notifications', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const plugin = createComprehensiveSchemaMonitorPlugin({
        integrations: {
          slack: {
            webhook: 'https://hooks.slack.com/services/test',
            channel: '#alerts',
            username: 'Cushion Bot',
          },
        },
        alerts: {
          enableMissingFieldAlerts: true,
          suppressConsoleAlerts: true,
        },
      });

      use(plugin);

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Trigger an alert that should send Slack notification
      absorbHook(
        { name: 'John', email: undefined },
        { name: 'user_name', email: 'user_email' },
        { url: '/api/user' }
      );

      // Give Slack webhook time to send
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify Slack webhook was called
      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/services/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('Schema Alert'),
        })
      );
    });

    it('should generate comprehensive reports', async () => {
      const plugin = createComprehensiveSchemaMonitorPlugin({
        developmentMode: true,
        reporting: {
          format: 'json',
        },
      });

      use(plugin);

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Generate some activity
      absorbHook(
        { name: 'John', email: 'john@example.com' },
        { name: 'user_name', email: 'user_email' },
        { url: '/api/user' }
      );

      absorbHook(
        { name: 'Jane', email: undefined },
        { name: 'user_name', email: 'user_email' },
        { url: '/api/user' }
      );

      const report = utilities.exportReport();
      const parsedReport = JSON.parse(report);

      expect(parsedReport).toHaveProperty('title');
      expect(parsedReport).toHaveProperty('period');
      expect(parsedReport).toHaveProperty('summary');
      expect(parsedReport).toHaveProperty('alerts');
      expect(parsedReport).toHaveProperty('recommendations');
      expect(parsedReport).toHaveProperty('urlBreakdown');
      
      expect(parsedReport.summary).toHaveProperty('healthScore');
      expect(parsedReport.summary).toHaveProperty('totalRequests');
      expect(parsedReport.summary).toHaveProperty('errorRate');
      expect(parsedReport.summary).toHaveProperty('schemaChanges');
    });
  });

  describe('Configuration Options', () => {
    it('should respect enabled flag', async () => {
      const plugin = createComprehensiveSchemaMonitorPlugin({
        enabled: false,
      });

      use(plugin);

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      // Plugin should still provide utilities even when disabled
      expect(utilities).toHaveProperty('getDashboard');
      expect(utilities).toHaveProperty('exportReport');
    });

    it('should handle dashboard integration', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true });
      global.fetch = mockFetch;

      const plugin = createComprehensiveSchemaMonitorPlugin({
        integrations: {
          dashboard: {
            endpoint: 'https://dashboard.example.com/api/metrics',
            apiKey: 'test-key',
            interval: 1, // 1 minute
          },
        },
        analytics: {
          enablePerformanceMetrics: true,
          exportInterval: 0.1, // 6 seconds for testing
        },
      });

      use(plugin);

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Generate some metrics
      absorbHook(
        { name: 'John', email: 'john@example.com' },
        { name: 'user_name', email: 'user_email' },
        { url: '/api/user' }
      );

      // Wait for metrics to be sent to dashboard
      await new Promise(resolve => setTimeout(resolve, 200));

      // Note: In a real scenario, metrics would be sent periodically
      // For testing purposes, we just verify the setup doesn't break
      expect(utilities.getDashboard()).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle integration failures gracefully', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      global.fetch = mockFetch;

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const plugin = createComprehensiveSchemaMonitorPlugin({
        integrations: {
          webhook: {
            url: 'https://example.com/webhook',
            events: ['schema_change'],
          },
          slack: {
            webhook: 'https://hooks.slack.com/services/test',
          },
        },
      });

      use(plugin);

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // This should not throw even if webhooks fail
      expect(() => {
        absorbHook(
          { name: 'John', email: undefined },
          { name: 'user_name', email: 'user_email' },
          { url: '/api/user' }
        );
      }).not.toThrow();

      // Wait for webhook attempts
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify error was logged but didn't crash
      expect(consoleErrorSpy).toHaveBeenCalled();
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle malformed configuration', async () => {
      const plugin = createComprehensiveSchemaMonitorPlugin({
        integrations: {
          // @ts-expect-error Testing invalid config
          webhook: {
            // Missing required URL
            events: ['schema_change'],
          },
          slack: {
            // Missing webhook URL
            channel: '#alerts',
          },
        },
      });

      use(plugin);

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      // Should not throw with malformed config
      expect(() => {
        const pluginFunction = plugin.setup;
        const utilities = pluginFunction(mockCore);
      }).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('should handle high-frequency operations', async () => {
      const plugin = createComprehensiveSchemaMonitorPlugin({
        analytics: {
          samplingRate: 0.1, // 10% sampling to reduce overhead
        },
      });

      use(plugin);

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Simulate high-frequency operations
      const startTime = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        absorbHook(
          { name: `User${i}`, email: `user${i}@example.com` },
          { name: 'user_name', email: 'user_email' },
          { url: '/api/user' }
        );
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);

      // Should still provide valid dashboard
      const dashboard = utilities.getDashboard();
      expect(dashboard).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', async () => {
      const plugin = createComprehensiveSchemaMonitorPlugin({
        reporting: {
          dailyReports: true,
        },
      });

      use(plugin);

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      // Should not throw
      expect(() => {
        utilities.destroy();
      }).not.toThrow();
    });
  });
});