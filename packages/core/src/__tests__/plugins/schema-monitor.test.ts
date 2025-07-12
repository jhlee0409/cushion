import { describe, it, expect, beforeEach, vi } from "vitest";
import { createSchemaMonitorPlugin } from "../../plugins/schema-monitor";
import { use, reset } from "../../index";
import type { SchemaChangeEvent } from "../../plugins/schema-monitor";

describe("Schema Monitor Plugin", () => {
  beforeEach(() => {
    reset();
    vi.clearAllMocks();
  });

  describe("Basic Monitoring", () => {
    it("should detect missing fields", async () => {
      const schemaChanges: SchemaChangeEvent[] = [];

      const plugin = createSchemaMonitorPlugin({
        enableLogging: false,
        trackNewFields: false, // Disable new field tracking for this test
        onSchemaChange: (event) => {
          schemaChanges.push(event);
        },
      });

      // Simulate absorption with undefined field - test setup function directly
      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      // Get the plugin function
      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      // Get the absorb hook
      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Simulate data with undefined field
      const transformedData = {
        name: "John",
        email: undefined, // Missing field
      };

      const originalData = {
        user_name: "John",
        // user_email is missing from server response
      };

      const mapping = {
        name: "user_name",
        email: "user_email",
      };

      const context = {
        url: "/api/user",
        originalData,
      };

      // Call the absorb hook
      const result = absorbHook(transformedData, mapping, context);

      expect(result).toEqual(transformedData);
      expect(schemaChanges).toHaveLength(1);
      expect(schemaChanges[0]).toMatchObject({
        url: "/api/user",
        fieldName: "email",
        changeType: "missing",
      });
    });

    it("should detect new fields", async () => {
      const schemaChanges: SchemaChangeEvent[] = [];

      const plugin = createSchemaMonitorPlugin({
        enableLogging: false,
        trackNewFields: true,
        onSchemaChange: (event) => {
          schemaChanges.push(event);
        },
      });

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // First call - establish baseline
      const originalData1 = {
        user_name: "John",
        user_email: "john@example.com",
      };

      const transformedData1 = {
        name: "John",
        email: "john@example.com",
      };

      const mapping = {
        name: "user_name",
        email: "user_email",
      };

      const context1 = {
        url: "/api/user",
        originalData: originalData1,
      };

      absorbHook(transformedData1, mapping, context1);

      // Second call - with new field
      const originalData2 = {
        user_name: "Jane",
        user_email: "jane@example.com",
        user_avatar: "avatar.jpg", // New field
      };

      const transformedData2 = {
        name: "Jane",
        email: "jane@example.com",
      };

      const context2 = {
        url: "/api/user",
        originalData: originalData2,
      };

      absorbHook(transformedData2, mapping, context2);

      expect(schemaChanges).toHaveLength(3); // user_name, user_email from first call + user_avatar from second call

      // Find the new field we're looking for
      const newFieldChange = schemaChanges.find(
        (change) => change.fieldName === "user_avatar"
      );
      expect(newFieldChange).toMatchObject({
        url: "/api/user",
        fieldName: "user_avatar",
        changeType: "new_field",
        newValue: "avatar.jpg",
      });
    });

    it("should detect type changes", async () => {
      const schemaChanges: SchemaChangeEvent[] = [];

      const plugin = createSchemaMonitorPlugin({
        enableLogging: false,
        trackTypeChanges: true,
        onSchemaChange: (event) => {
          schemaChanges.push(event);
        },
      });

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // First call - establish baseline
      const transformedData1 = {
        name: "John",
        age: 30, // number
      };

      const context1 = {
        url: "/api/user",
        originalData: {},
      };

      absorbHook(transformedData1, {}, context1);

      // Second call - with type change
      const transformedData2 = {
        name: "Jane",
        age: "25", // string instead of number
      };

      const context2 = {
        url: "/api/user",
        originalData: {},
      };

      absorbHook(transformedData2, {}, context2);

      expect(schemaChanges).toHaveLength(1);
      expect(schemaChanges[0]).toMatchObject({
        url: "/api/user",
        fieldName: "age",
        changeType: "type_changed",
        expectedType: "number",
        actualType: "string",
      });
    });

    it("should handle mapping failures", async () => {
      const schemaChanges: SchemaChangeEvent[] = [];

      const plugin = createSchemaMonitorPlugin({
        enableLogging: false,
        trackNewFields: false, // Disable new field tracking for this test
        onSchemaChange: (event) => {
          schemaChanges.push(event);
        },
      });

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Simulate an error during monitoring by passing invalid transformed data
      const invalidTransformedData = null; // This will cause Object.entries() to fail

      const mapping = {
        name: "user_name",
        email: "user_email",
      };

      const context = {
        url: "/api/user",
        originalData: { user_name: "John" },
      };

      // Mock console.error to avoid test noise
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const result = absorbHook(invalidTransformedData, mapping, context);

      expect(result).toEqual(invalidTransformedData);
      expect(schemaChanges).toHaveLength(1);
      expect(schemaChanges[0]).toMatchObject({
        url: "/api/user",
        fieldName: "unknown",
        changeType: "mapping_failed",
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Metrics Collection", () => {
    it("should track transformation metrics", async () => {
      const plugin = createSchemaMonitorPlugin({
        enableLogging: false,
      });

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];
      const responseHook = mockCore.onResponse.mock.calls[0][0];

      // Simulate successful transformations
      absorbHook({}, {}, { url: "/api/user" });
      absorbHook({}, {}, { url: "/api/user" });
      responseHook("/api/posts", {});

      const metrics = utilities.getMetrics();

      expect(metrics.totalTransformations).toBe(3);
      expect(metrics.successfulTransformations).toBe(3);
      expect(metrics.failedTransformations).toBe(0);
      expect(metrics.successRate).toBe(100);
    });

    it("should track URL-specific metrics", async () => {
      const plugin = createSchemaMonitorPlugin({
        enableLogging: false,
      });

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Simulate transformations for different URLs
      absorbHook({}, {}, { url: "/api/user" });
      absorbHook({}, {}, { url: "/api/user" });
      absorbHook({}, {}, { url: "/api/posts" });

      const metrics = utilities.getMetrics();

      expect(metrics.urlMetrics["/api/user"].total).toBe(2);
      expect(metrics.urlMetrics["/api/posts"].total).toBe(1);
    });
  });

  describe("Configuration", () => {
    it("should respect monitor URL patterns", async () => {
      const schemaChanges: SchemaChangeEvent[] = [];

      const plugin = createSchemaMonitorPlugin({
        enableLogging: false,
        monitorUrls: ["/api/user*"],
        trackNewFields: false, // Disable to focus on URL pattern testing
        onSchemaChange: (event) => {
          schemaChanges.push(event);
        },
      });

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Should monitor this URL
      absorbHook(
        { name: "John", email: undefined },
        { name: "user_name", email: "user_email" },
        { url: "/api/user/123" }
      );

      // Should NOT monitor this URL
      absorbHook(
        { title: "Post", content: undefined },
        { title: "post_title", content: "post_content" },
        { url: "/api/posts/456" }
      );

      // Only the user endpoint should trigger a schema change
      expect(schemaChanges).toHaveLength(1);
      expect(schemaChanges[0].url).toBe("/api/user/123");
    });

    it("should respect feature flags", async () => {
      const schemaChanges: SchemaChangeEvent[] = [];

      const plugin = createSchemaMonitorPlugin({
        enableLogging: false,
        trackNewFields: false,
        trackTypeChanges: false,
        onSchemaChange: (event) => {
          schemaChanges.push(event);
        },
      });

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Try to trigger new field detection (should be ignored)
      absorbHook(
        { name: "John" },
        { name: "user_name" },
        {
          url: "/api/user",
          originalData: { user_name: "John", new_field: "value" },
        }
      );

      // Try to trigger type change detection (should be ignored)
      absorbHook(
        { name: "John", age: 30 },
        { name: "user_name", age: "user_age" },
        { url: "/api/user", originalData: {} }
      );

      absorbHook(
        { name: "Jane", age: "25" },
        { name: "user_name", age: "user_age" },
        { url: "/api/user", originalData: {} }
      );

      expect(schemaChanges).toHaveLength(0);
    });
  });

  describe("Utility Functions", () => {
    it("should provide schema change history", async () => {
      const plugin = createSchemaMonitorPlugin({
        enableLogging: false,
        trackNewFields: false, // Focus on missing field detection only
      });

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Generate some schema changes
      absorbHook(
        { name: "John", email: undefined },
        { name: "user_name", email: "user_email" },
        { url: "/api/user" }
      );

      absorbHook(
        { title: "Post", content: undefined },
        { title: "post_title", content: "post_content" },
        { url: "/api/posts" }
      );

      const allChanges = utilities.getSchemaChanges();
      const userChanges = utilities.getSchemaChanges("/api/user");

      expect(allChanges).toHaveLength(2);
      expect(userChanges).toHaveLength(1);
      expect(userChanges[0].url).toBe("/api/user");
    });

    it("should provide exportable reports", async () => {
      const plugin = createSchemaMonitorPlugin({
        enableLogging: false,
      });

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Generate some activity
      absorbHook({}, {}, { url: "/api/user" });
      absorbHook({}, {}, { url: "/api/posts" });

      const report = utilities.exportReport();
      const parsedReport = JSON.parse(report);

      expect(parsedReport).toHaveProperty("generatedAt");
      expect(parsedReport).toHaveProperty("summary");
      expect(parsedReport).toHaveProperty("urlMetrics");
      expect(parsedReport.summary.totalTransformations).toBe(2);
    });

    it("should clear history when requested", async () => {
      const plugin = createSchemaMonitorPlugin({
        enableLogging: false,
        trackNewFields: false, // Focus on missing field detection only
      });

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Generate some schema changes
      absorbHook(
        { name: "John", email: undefined },
        { name: "user_name", email: "user_email" },
        { url: "/api/user" }
      );

      expect(utilities.getSchemaChanges()).toHaveLength(1);

      utilities.clearHistory();

      expect(utilities.getSchemaChanges()).toHaveLength(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle errors gracefully", async () => {
      const plugin = createSchemaMonitorPlugin({
        enableLogging: false,
      });

      const mockCore = {
        onAbsorb: vi.fn(),
        onResponse: vi.fn(),
        onRequest: vi.fn(),
      };

      const pluginFunction = plugin.setup;
      const utilities = pluginFunction(mockCore);

      const absorbHook = mockCore.onAbsorb.mock.calls[0][0];

      // Mock console.error to avoid test noise
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Should not throw when given invalid data
      expect(() => {
        absorbHook(null, {}, { url: "/api/user" });
      }).not.toThrow();

      expect(() => {
        absorbHook({}, null, { url: "/api/user" });
      }).not.toThrow();

      expect(() => {
        absorbHook({}, {}, null);
      }).not.toThrow();

      consoleErrorSpy.mockRestore();
    });
  });
});
