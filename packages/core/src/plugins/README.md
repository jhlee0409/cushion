# Cushion Schema Monitoring Plugins

This directory contains advanced schema monitoring and alerting plugins for the Cushion library. These plugins help you detect, track, and respond to server-side schema changes automatically.

## Overview

The schema monitoring system provides:

- **Real-time schema change detection** - Automatically detect when server APIs change their structure
- **Comprehensive analytics** - Track performance metrics, error rates, and schema evolution over time
- **Intelligent alerting** - Get notified when schema changes might impact your application
- **Integration support** - Send alerts to Slack, webhooks, dashboards, and more
- **Predictive insights** - Analyze trends and predict potential schema changes

## Quick Start

### Basic Schema Monitoring

```typescript
import { use } from 'cushion';
import { createSchemaMonitorPlugin } from 'cushion/plugins';

// Set up basic schema monitoring
const schemaMonitor = createSchemaMonitorPlugin({
  enableLogging: true,
  trackNewFields: true,
  trackTypeChanges: true,
  onSchemaChange: (event) => {
    console.log('Schema change detected:', event);
  },
});

use(schemaMonitor);
```

### Comprehensive Monitoring with Alerts

```typescript
import { use } from 'cushion';
import { createComprehensiveSchemaMonitorPlugin } from 'cushion/plugins';

// Set up comprehensive monitoring
const comprehensiveMonitor = createComprehensiveSchemaMonitorPlugin({
  // Schema monitoring configuration
  monitor: {
    trackNewFields: true,
    trackTypeChanges: true,
    monitorUrls: ['/api/*'], // Monitor all API endpoints
  },
  
  // Alert system configuration
  alerts: {
    enableMissingFieldAlerts: true,
    enableTypeChangeAlerts: true,
    failureRateThreshold: 10, // Alert when error rate > 10%
    consecutiveFailuresThreshold: 3,
  },
  
  // Analytics configuration
  analytics: {
    enablePerformanceMetrics: true,
    enableHealthScore: true,
    enablePredictiveAnalytics: true,
  },
  
  // Integration configuration
  integrations: {
    slack: {
      webhook: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
      channel: '#api-alerts',
    },
    webhook: {
      url: 'https://your-monitoring-system.com/webhooks/cushion',
      events: ['schema_change', 'alert'],
    },
  },
  
  // Reporting configuration
  reporting: {
    dailyReports: true,
    weeklyReports: true,
    format: 'html',
  },
});

use(comprehensiveMonitor);
```

## Core Components

### 1. Schema Monitor (`createSchemaMonitorPlugin`)

The basic schema monitoring plugin that detects and tracks schema changes.

**Features:**
- Detects missing fields (undefined values in transformed data)
- Tracks new fields appearing in server responses
- Monitors type changes in existing fields
- Records transformation success/failure metrics
- Provides schema change history

**Configuration:**
```typescript
interface SchemaMonitorConfig {
  enableLogging?: boolean;
  onSchemaChange?: (event: SchemaChangeEvent) => void;
  monitorUrls?: string[];
  trackNewFields?: boolean;
  trackTypeChanges?: boolean;
  maxHistorySize?: number;
}
```

### 2. Schema Alert System (`SchemaAlertSystem`)

Intelligent alerting system that sends notifications when schema changes occur.

**Features:**
- Configurable alert types (missing fields, type changes, new fields)
- Failure rate thresholds
- Alert cooldown periods to prevent spam
- Slack and webhook integrations
- Email notifications (with configuration)
- Severity levels (low, medium, high, critical)

**Configuration:**
```typescript
interface AlertConfig {
  enableMissingFieldAlerts?: boolean;
  enableTypeChangeAlerts?: boolean;
  enableNewFieldAlerts?: boolean;
  failureRateThreshold?: number;
  consecutiveFailuresThreshold?: number;
  onAlert?: (alert: SchemaAlert) => void;
  slackWebhook?: string;
  emailConfig?: EmailConfig;
}
```

### 3. Schema Analytics (`SchemaAnalytics`)

Advanced analytics engine that tracks metrics and provides insights.

**Features:**
- Performance metrics (response times, error rates, throughput)
- Schema evolution tracking (changes over time)
- Health score calculation
- Predictive analytics
- URL-specific breakdowns
- Exportable reports (JSON, CSV, Prometheus)

**Configuration:**
```typescript
interface AnalyticsConfig {
  enablePerformanceMetrics?: boolean;
  enableSchemaEvolution?: boolean;
  enableHealthScore?: boolean;
  enablePredictiveAnalytics?: boolean;
  retentionDays?: number;
  samplingRate?: number;
  exportFormat?: 'json' | 'csv' | 'prometheus';
}
```

### 4. Comprehensive Monitor (`createComprehensiveSchemaMonitorPlugin`)

All-in-one monitoring solution that integrates all components.

**Features:**
- Combines schema monitoring, alerting, and analytics
- Multiple integration options (Slack, webhooks, dashboards)
- Automated reporting (daily/weekly)
- Configurable alert routing
- Performance optimization
- Resource cleanup

## Schema Change Types

The monitoring system detects several types of schema changes:

### 1. Missing Fields
When a field that was previously present is now undefined:
```typescript
// Before
{ name: "John", email: "john@example.com" }

// After (email field missing from server)
{ name: "John", email: undefined }
```

### 2. Type Changes
When a field's data type changes:
```typescript
// Before
{ age: 30 }

// After
{ age: "30" }
```

### 3. New Fields
When new fields appear in server responses:
```typescript
// Before
{ name: "John", email: "john@example.com" }

// After
{ name: "John", email: "john@example.com", avatar: "avatar.jpg" }
```

### 4. Mapping Failures
When the transformation process fails due to schema changes:
```typescript
// Cushion mapping configuration expects 'user_name'
// but server now sends 'userName'
```

## Usage Examples

### Development Mode Monitoring

```typescript
// Enable detailed logging for development
const devMonitor = createSchemaMonitorPlugin({
  enableLogging: true,
  trackNewFields: true,
  trackTypeChanges: true,
  onSchemaChange: (event) => {
    console.group('🔍 Schema Change Detected');
    console.log('URL:', event.url);
    console.log('Field:', event.fieldName);
    console.log('Type:', event.changeType);
    console.log('Time:', event.timestamp);
    console.groupEnd();
  },
});

use(devMonitor);
```

### Production Monitoring with Alerts

```typescript
// Production-ready monitoring with Slack alerts
const prodMonitor = createComprehensiveSchemaMonitorPlugin({
  monitor: {
    enableLogging: false, // Disable console logging in production
    trackNewFields: true,
    trackTypeChanges: true,
    monitorUrls: ['/api/*'],
  },
  alerts: {
    enableMissingFieldAlerts: true,
    enableTypeChangeAlerts: true,
    failureRateThreshold: 5, // Alert at 5% error rate
    consecutiveFailuresThreshold: 3,
    suppressConsoleAlerts: true,
  },
  integrations: {
    slack: {
      webhook: process.env.SLACK_WEBHOOK_URL,
      channel: '#api-monitoring',
    },
  },
  analytics: {
    enablePerformanceMetrics: true,
    enableHealthScore: true,
    samplingRate: 0.1, // 10% sampling for performance
  },
});

use(prodMonitor);
```

### Custom Alert Handling

```typescript
const customMonitor = createComprehensiveSchemaMonitorPlugin({
  alerts: {
    onAlert: (alert) => {
      // Custom alert handling
      if (alert.severity === 'critical') {
        // Send to incident management system
        sendToIncidentManagement(alert);
      }
      
      // Log to custom analytics
      logToAnalytics('schema_alert', {
        url: alert.url,
        severity: alert.severity,
        type: alert.type,
      });
    },
  },
});

use(customMonitor);
```

### Metrics Dashboard Integration

```typescript
const dashboardMonitor = createComprehensiveSchemaMonitorPlugin({
  integrations: {
    dashboard: {
      endpoint: 'https://your-dashboard.com/api/metrics',
      apiKey: process.env.DASHBOARD_API_KEY,
      interval: 60, // Send metrics every hour
    },
  },
  analytics: {
    enablePerformanceMetrics: true,
    enableHealthScore: true,
    exportFormat: 'json',
  },
});

use(dashboardMonitor);
```

## API Reference

### Utility Functions

All monitoring plugins provide utility functions:

```typescript
// Get current metrics
const metrics = monitor.getMetrics();

// Get schema change history
const changes = monitor.getSchemaChanges();
const userChanges = monitor.getSchemaChanges('/api/user');

// Export comprehensive report
const report = monitor.exportReport();

// Clear history
monitor.clearHistory();

// Get dashboard data (comprehensive monitor only)
const dashboard = monitor.getDashboard();
```

### Event Types

```typescript
interface SchemaChangeEvent {
  url: string;
  fieldName: string;
  changeType: 'missing' | 'type_changed' | 'new_field' | 'mapping_failed';
  expectedType?: string;
  actualType?: string;
  oldValue?: any;
  newValue?: any;
  timestamp: Date;
}

interface SchemaAlert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'missing_field' | 'type_change' | 'new_field' | 'mapping_failure';
  title: string;
  description: string;
  url: string;
  timestamp: Date;
  suggestedAction?: string;
}
```

## Best Practices

### 1. Configure Appropriate Monitoring Scope

```typescript
// Monitor only critical APIs
const monitor = createSchemaMonitorPlugin({
  monitorUrls: [
    '/api/user/*',
    '/api/orders/*',
    '/api/payments/*',
  ],
});
```

### 2. Set Reasonable Alert Thresholds

```typescript
// Avoid alert fatigue
const monitor = createComprehensiveSchemaMonitorPlugin({
  alerts: {
    failureRateThreshold: 10, // 10% error rate
    consecutiveFailuresThreshold: 5, // 5 consecutive failures
  },
});
```

### 3. Use Sampling in High-Traffic Applications

```typescript
// Reduce overhead in high-traffic scenarios
const monitor = createComprehensiveSchemaMonitorPlugin({
  analytics: {
    samplingRate: 0.1, // Monitor 10% of requests
  },
});
```

### 4. Implement Proper Error Handling

```typescript
const monitor = createComprehensiveSchemaMonitorPlugin({
  alerts: {
    onAlert: (alert) => {
      try {
        // Your alert handling logic
        handleAlert(alert);
      } catch (error) {
        console.error('Alert handling failed:', error);
      }
    },
  },
});
```

### 5. Clean Up Resources

```typescript
// Clean up when application shuts down
process.on('SIGTERM', () => {
  monitor.destroy();
});
```

## Performance Considerations

- **Sampling**: Use sampling rates to reduce overhead in high-traffic applications
- **History limits**: Configure appropriate history sizes to prevent memory leaks
- **Monitoring scope**: Monitor only critical endpoints to reduce noise
- **Alert cooldowns**: Use cooldown periods to prevent alert spam

## Troubleshooting

### Common Issues

1. **Too many alerts**: Increase alert thresholds or use cooldown periods
2. **Missing alerts**: Check monitoring URL patterns and feature flags
3. **Performance impact**: Reduce sampling rate or monitoring scope
4. **Integration failures**: Verify webhook URLs and API keys

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const monitor = createSchemaMonitorPlugin({
  enableLogging: true,
  onSchemaChange: (event) => {
    console.log('Debug:', event);
  },
});
```

## Contributing

When adding new monitoring features:

1. Add comprehensive tests
2. Update type definitions
3. Document configuration options
4. Consider performance impact
5. Add usage examples

## License

This plugin system is part of the Cushion library and follows the same license terms.