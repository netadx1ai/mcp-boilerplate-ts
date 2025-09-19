/**
 * @fileoverview Metrics Collection and Performance Monitoring
 *
 * This module provides comprehensive metrics collection for MCP servers,
 * including performance monitoring, resource usage tracking, and custom
 * metrics aggregation with support for observability platforms.
 *
 * Features:
 * - Tool execution metrics and timing
 * - System resource monitoring
 * - HTTP request/response metrics
 * - Custom business metrics
 * - Memory-efficient aggregation
 * - Prometheus-compatible exports
 * - Real-time performance tracking
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */
import { EventEmitter } from 'events';
// =============================================================================
// Core Metrics Collector
// =============================================================================
/**
 * High-performance metrics collector with memory-efficient storage
 *
 * @example
 * ```typescript
 * const collector = createMetricsCollector('my-server');
 *
 * // Record tool execution
 * collector.recordToolExecution('search_news', 150, true);
 *
 * // Get metrics
 * const avgTime = collector.getAverageResponseTime();
 * const stats = collector.getMetricStats('tool_execution_time');
 * ```
 */
export class MetricsCollector extends EventEmitter {
    _serviceName;
    _metrics = new Map();
    _configs = new Map();
    _toolExecutions = new Map();
    _responseTimes = [];
    _startTime = Date.now();
    // Performance tracking
    _requestCount = 0;
    _errorCount = 0;
    _totalResponseTime = 0;
    // Resource monitoring
    _lastCpuUsage = process.cpuUsage();
    _performanceSnapshots = [];
    // Configuration
    _maxDataPoints = 10000;
    _cleanupInterval = 300000; // 5 minutes
    _retentionPeriod = 3600000; // 1 hour
    _cleanupTimer;
    constructor(serviceName) {
        super();
        this._serviceName = serviceName;
        this._initializeDefaultMetrics();
        this._startCleanupTimer();
        this._startPerformanceMonitoring();
    }
    // =============================================================================
    // Metric Registration
    // =============================================================================
    /**
     * Register a new metric
     *
     * @param config - Metric configuration
     */
    registerMetric(config) {
        this._configs.set(config.name, config);
        if (!this._metrics.has(config.name)) {
            this._metrics.set(config.name, []);
        }
        this.emit('metricRegistered', { metric: config.name, type: config.type });
    }
    /**
     * Register multiple metrics
     *
     * @param configs - Array of metric configurations
     */
    registerMetrics(configs) {
        for (const config of configs) {
            this.registerMetric(config);
        }
    }
    // =============================================================================
    // Data Recording
    // =============================================================================
    /**
     * Record a metric value
     *
     * @param name - Metric name
     * @param value - Metric value
     * @param labels - Optional labels
     */
    record(name, value, labels) {
        const timestamp = Date.now();
        const metricValue = { value, timestamp, labels };
        let values = this._metrics.get(name);
        if (!values) {
            values = [];
            this._metrics.set(name, values);
        }
        values.push(metricValue);
        // Prevent memory leaks by limiting data points
        if (values.length > this._maxDataPoints) {
            values.splice(0, values.length - this._maxDataPoints);
        }
        this.emit('metricRecorded', { metric: name, value, timestamp, labels });
    }
    /**
     * Increment a counter metric
     *
     * @param name - Counter name
     * @param increment - Increment value (default: 1)
     * @param labels - Optional labels
     */
    increment(name, increment = 1, labels) {
        const current = this.getLatestValue(name) || 0;
        this.record(name, current + increment, labels);
    }
    /**
     * Record a gauge value (current state)
     *
     * @param name - Gauge name
     * @param value - Current value
     * @param labels - Optional labels
     */
    gauge(name, value, labels) {
        this.record(name, value, labels);
    }
    /**
     * Record timing information
     *
     * @param name - Timer name
     * @param duration - Duration in milliseconds
     * @param labels - Optional labels
     */
    timing(name, duration, labels) {
        this.record(name, duration, labels);
        this._responseTimes.push(duration);
        // Keep response times manageable
        if (this._responseTimes.length > 1000) {
            this._responseTimes.splice(0, 500);
        }
    }
    // =============================================================================
    // Tool-Specific Metrics
    // =============================================================================
    /**
     * Record tool execution metrics
     *
     * @param toolName - Name of the executed tool
     * @param duration - Execution duration in milliseconds
     * @param success - Whether execution was successful
     */
    recordToolExecution(toolName, duration, success) {
        // Update counters
        this._requestCount++;
        if (!success)
            this._errorCount++;
        this._totalResponseTime += duration;
        // Track tool-specific executions
        const current = this._toolExecutions.get(toolName) || 0;
        this._toolExecutions.set(toolName, current + 1);
        // Record detailed metrics
        this.timing('tool_execution_time', duration, { tool: toolName });
        this.increment('tool_executions_total', 1, { tool: toolName, status: success ? 'success' : 'error' });
        if (!success) {
            this.increment('tool_errors_total', 1, { tool: toolName });
        }
    }
    /**
     * Get tool execution counts
     *
     * @returns Map of tool names to execution counts
     */
    getToolExecutionCounts() {
        return Object.fromEntries(this._toolExecutions);
    }
    /**
     * Get average response time across all requests
     *
     * @returns Average response time in milliseconds
     */
    getAverageResponseTime() {
        if (this._requestCount === 0)
            return 0;
        return this._totalResponseTime / this._requestCount;
    }
    /**
     * Get response time percentiles
     *
     * @returns Percentile statistics
     */
    getResponseTimePercentiles() {
        if (this._responseTimes.length === 0) {
            return { p50: 0, p95: 0, p99: 0 };
        }
        const sorted = [...this._responseTimes].sort((a, b) => a - b);
        const len = sorted.length;
        return {
            p50: sorted[Math.floor(len * 0.5)] || 0,
            p95: sorted[Math.floor(len * 0.95)] || 0,
            p99: sorted[Math.floor(len * 0.99)] || 0,
        };
    }
    // =============================================================================
    // Data Retrieval
    // =============================================================================
    /**
     * Get latest value for a metric
     *
     * @param name - Metric name
     * @returns Latest value or undefined
     */
    getLatestValue(name) {
        const values = this._metrics.get(name);
        if (!values || values.length === 0)
            return undefined;
        return values[values.length - 1]?.value;
    }
    /**
     * Get all values for a metric within time range
     *
     * @param name - Metric name
     * @param since - Start time (milliseconds since epoch)
     * @param until - End time (milliseconds since epoch, default: now)
     * @returns Array of metric values
     */
    getValues(name, since, until) {
        const values = this._metrics.get(name) || [];
        const now = Date.now();
        const start = since || 0;
        const end = until || now;
        return values.filter(v => v.timestamp >= start && v.timestamp <= end);
    }
    /**
     * Get metric statistics
     *
     * @param name - Metric name
     * @param since - Start time (optional)
     * @returns Metric statistics
     */
    getMetricStats(name, since) {
        const values = this.getValues(name, since);
        if (values.length === 0)
            return undefined;
        const numbers = values.map(v => v.value);
        const sorted = [...numbers].sort((a, b) => a - b);
        const sum = numbers.reduce((acc, val) => acc + val, 0);
        return {
            count: numbers.length,
            sum,
            avg: sum / numbers.length,
            min: sorted[0] || 0,
            max: sorted[sorted.length - 1] || 0,
            p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
            p99: sorted[Math.floor(sorted.length * 0.99)] || 0,
            latest: numbers[numbers.length - 1] || 0,
            oldest: numbers[0] || 0,
        };
    }
    /**
     * Get time series data for a metric
     *
     * @param name - Metric name
     * @param aggregation - Aggregation method
     * @param bucketSize - Bucket size in milliseconds (default: 60000 = 1 minute)
     * @param since - Start time (optional)
     * @returns Time series metric
     */
    getTimeSeries(name, aggregation = 'avg', bucketSize = 60000, since) {
        const config = this._configs.get(name);
        const values = this.getValues(name, since);
        if (values.length === 0)
            return undefined;
        // Group values into time buckets
        const buckets = new Map();
        for (const value of values) {
            const bucketTime = Math.floor(value.timestamp / bucketSize) * bucketSize;
            let bucketValues = buckets.get(bucketTime);
            if (!bucketValues) {
                bucketValues = [];
                buckets.set(bucketTime, bucketValues);
            }
            bucketValues.push(value.value);
        }
        // Aggregate each bucket
        const dataPoints = [];
        for (const [bucketTime, bucketValues] of buckets) {
            const aggregatedValue = this._aggregateValues(bucketValues, aggregation);
            dataPoints.push({
                timestamp: new Date(bucketTime).toISOString(),
                value: aggregatedValue,
                metadata: {
                    count: bucketValues.length,
                    bucketSize,
                },
            });
        }
        // Sort by timestamp
        dataPoints.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        return {
            name,
            description: config?.description || `Time series for ${name}`,
            unit: config?.unit || 'count',
            dataPoints,
            aggregation,
        };
    }
    /**
     * Get all metric names
     *
     * @returns Array of metric names
     */
    getMetricNames() {
        return Array.from(this._metrics.keys());
    }
    /**
     * Get metric configuration
     *
     * @param name - Metric name
     * @returns Metric configuration or undefined
     */
    getMetricConfig(name) {
        return this._configs.get(name);
    }
    // =============================================================================
    // Performance Monitoring
    // =============================================================================
    /**
     * Record system performance snapshot
     */
    recordPerformanceSnapshot() {
        const now = Date.now();
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage(this._lastCpuUsage);
        // Update CPU baseline for next measurement
        this._lastCpuUsage = process.cpuUsage();
        // Calculate event loop metrics (approximation)
        const eventLoopDelay = this._measureEventLoopDelay();
        const snapshot = {
            timestamp: new Date(now).toISOString(),
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
                external: Math.round(memUsage.external / 1024 / 1024), // MB
                rss: Math.round(memUsage.rss / 1024 / 1024), // MB
            },
            cpu: {
                user: Math.round(cpuUsage.user / 1000), // milliseconds
                system: Math.round(cpuUsage.system / 1000), // milliseconds
            },
            eventLoop: {
                delay: eventLoopDelay,
                utilization: this._calculateEventLoopUtilization(),
            },
            uptime: Math.round((now - this._startTime) / 1000), // seconds
        };
        this._performanceSnapshots.push(snapshot);
        // Keep only recent snapshots
        if (this._performanceSnapshots.length > 1000) {
            this._performanceSnapshots.splice(0, 500);
        }
        // Record as metrics
        this.gauge('memory_heap_used_mb', snapshot.memory.heapUsed);
        this.gauge('memory_heap_total_mb', snapshot.memory.heapTotal);
        this.gauge('cpu_user_ms', snapshot.cpu.user);
        this.gauge('cpu_system_ms', snapshot.cpu.system);
        this.gauge('event_loop_delay_ms', snapshot.eventLoop.delay);
        this.emit('performanceSnapshot', snapshot);
    }
    /**
     * Get recent performance snapshots
     *
     * @param count - Number of snapshots to return (default: 10)
     * @returns Array of performance snapshots
     */
    getPerformanceSnapshots(count = 10) {
        return this._performanceSnapshots.slice(-count);
    }
    /**
     * Get current resource usage
     *
     * @returns Current resource usage
     */
    getCurrentResourceUsage() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage(this._lastCpuUsage);
        return {
            memoryMb: Math.round(memUsage.heapUsed / 1024 / 1024),
            cpuPercent: Math.round((cpuUsage.user + cpuUsage.system) / 10000), // Approximate percentage
        };
    }
    // =============================================================================
    // Aggregation and Analysis
    // =============================================================================
    /**
     * Get aggregated metrics summary
     *
     * @returns Summary of all metrics
     */
    getSummary() {
        const summary = {};
        for (const name of this._metrics.keys()) {
            const stats = this.getMetricStats(name);
            if (stats) {
                summary[name] = stats;
            }
        }
        return summary;
    }
    /**
     * Get service health score based on metrics
     *
     * @returns Health score from 0-100
     */
    getHealthScore() {
        let score = 100;
        // Factor in error rate
        const errorRate = this._requestCount > 0 ? this._errorCount / this._requestCount : 0;
        score -= errorRate * 50; // 50% penalty for 100% error rate
        // Factor in response time
        const avgResponseTime = this.getAverageResponseTime();
        if (avgResponseTime > 1000)
            score -= 20; // Penalty for slow responses
        if (avgResponseTime > 5000)
            score -= 30; // Higher penalty for very slow
        // Factor in memory usage
        const memUsage = process.memoryUsage();
        const heapUsedMb = memUsage.heapUsed / 1024 / 1024;
        if (heapUsedMb > 500)
            score -= 10; // Penalty for high memory usage
        if (heapUsedMb > 1000)
            score -= 20; // Higher penalty
        return Math.max(0, Math.min(100, score));
    }
    // =============================================================================
    // Export Formats
    // =============================================================================
    /**
     * Export metrics in Prometheus format
     *
     * @returns Prometheus-formatted metrics string
     */
    exportPrometheus() {
        const lines = [];
        for (const [name, values] of this._metrics) {
            const config = this._configs.get(name);
            const latest = values[values.length - 1];
            if (!latest)
                continue;
            // Add help comment
            if (config?.description) {
                lines.push(`# HELP ${name} ${config.description}`);
            }
            // Add type comment
            const prometheusType = this._getPrometheusType(config?.type || 'gauge');
            lines.push(`# TYPE ${name} ${prometheusType}`);
            // Add metric value with labels
            const labelsStr = this._formatPrometheusLabels({
                service: this._serviceName,
                ...latest.labels,
            });
            lines.push(`${name}${labelsStr} ${latest.value} ${latest.timestamp}`);
        }
        return lines.join('\n');
    }
    /**
     * Export metrics as JSON
     *
     * @param includeHistory - Whether to include historical data
     * @returns JSON metrics object
     */
    exportJson(includeHistory = false) {
        const result = {
            service: this._serviceName,
            timestamp: new Date().toISOString(),
            uptime: Math.round((Date.now() - this._startTime) / 1000),
            summary: {
                requestCount: this._requestCount,
                errorCount: this._errorCount,
                errorRate: this._requestCount > 0 ? this._errorCount / this._requestCount : 0,
                avgResponseTime: this.getAverageResponseTime(),
                healthScore: this.getHealthScore(),
            },
            metrics: {},
        };
        if (includeHistory) {
            // Include full metric history
            for (const [name, values] of this._metrics) {
                result.metrics[name] = {
                    config: this._configs.get(name),
                    values: values.slice(-100), // Last 100 values
                    stats: this.getMetricStats(name),
                };
            }
        }
        else {
            // Include only latest values and stats
            for (const name of this._metrics.keys()) {
                result.metrics[name] = {
                    latest: this.getLatestValue(name),
                    stats: this.getMetricStats(name),
                };
            }
        }
        return result;
    }
    // =============================================================================
    // Cleanup and Maintenance
    // =============================================================================
    /**
     * Clean up old metric data to prevent memory leaks
     */
    cleanup() {
        const cutoff = Date.now() - this._retentionPeriod;
        let totalRemoved = 0;
        for (const [name, values] of this._metrics) {
            const initialLength = values.length;
            // Remove old values
            const filtered = values.filter(v => v.timestamp >= cutoff);
            this._metrics.set(name, filtered);
            totalRemoved += initialLength - filtered.length;
        }
        // Clean up performance snapshots
        this._performanceSnapshots = this._performanceSnapshots.filter(snapshot => Date.parse(snapshot.timestamp) >= cutoff);
        if (totalRemoved > 0) {
            this.emit('cleanup', { removedDataPoints: totalRemoved });
        }
    }
    /**
     * Reset all metrics data
     */
    reset() {
        this._metrics.clear();
        this._toolExecutions.clear();
        this._responseTimes.length = 0;
        this._performanceSnapshots.length = 0;
        this._requestCount = 0;
        this._errorCount = 0;
        this._totalResponseTime = 0;
        this.emit('reset');
    }
    /**
     * Destroy the metrics collector and cleanup resources
     */
    destroy() {
        if (this._cleanupTimer) {
            clearInterval(this._cleanupTimer);
            this._cleanupTimer = undefined;
        }
        this.removeAllListeners();
        this.reset();
    }
    // =============================================================================
    // Private Implementation
    // =============================================================================
    /**
     * Initialize default metrics for all servers
     */
    _initializeDefaultMetrics() {
        const defaultMetrics = [
            {
                name: 'tool_execution_time',
                type: 'histogram',
                description: 'Tool execution duration',
                unit: 'milliseconds',
            },
            {
                name: 'tool_executions_total',
                type: 'counter',
                description: 'Total number of tool executions',
                unit: 'count',
            },
            {
                name: 'tool_errors_total',
                type: 'counter',
                description: 'Total number of tool execution errors',
                unit: 'count',
            },
            {
                name: 'memory_heap_used_mb',
                type: 'gauge',
                description: 'Heap memory usage',
                unit: 'megabytes',
            },
            {
                name: 'memory_heap_total_mb',
                type: 'gauge',
                description: 'Total heap memory',
                unit: 'megabytes',
            },
            {
                name: 'cpu_user_ms',
                type: 'gauge',
                description: 'User CPU time',
                unit: 'milliseconds',
            },
            {
                name: 'cpu_system_ms',
                type: 'gauge',
                description: 'System CPU time',
                unit: 'milliseconds',
            },
            {
                name: 'event_loop_delay_ms',
                type: 'gauge',
                description: 'Event loop delay',
                unit: 'milliseconds',
            },
        ];
        this.registerMetrics(defaultMetrics);
    }
    /**
     * Start cleanup timer for automatic maintenance
     */
    _startCleanupTimer() {
        this._cleanupTimer = setInterval(() => {
            this.cleanup();
        }, this._cleanupInterval);
    }
    /**
     * Start performance monitoring
     */
    _startPerformanceMonitoring() {
        // Record initial snapshot
        this.recordPerformanceSnapshot();
        // Schedule regular snapshots
        setInterval(() => {
            this.recordPerformanceSnapshot();
        }, 30000); // Every 30 seconds
    }
    /**
     * Aggregate array of values using specified method
     *
     * @param values - Values to aggregate
     * @param aggregation - Aggregation method
     * @returns Aggregated value
     */
    _aggregateValues(values, aggregation) {
        if (values.length === 0)
            return 0;
        const sorted = [...values].sort((a, b) => a - b);
        switch (aggregation) {
            case 'sum':
                return values.reduce((acc, val) => acc + val, 0);
            case 'avg':
                return values.reduce((acc, val) => acc + val, 0) / values.length;
            case 'min':
                return sorted[0] || 0;
            case 'max':
                return sorted[sorted.length - 1] || 0;
            case 'count':
                return values.length;
            case 'p95':
                return sorted[Math.floor(sorted.length * 0.95)] || 0;
            case 'p99':
                return sorted[Math.floor(sorted.length * 0.99)] || 0;
            default:
                return 0;
        }
    }
    /**
     * Convert metric type to Prometheus type
     *
     * @param type - Internal metric type
     * @returns Prometheus metric type
     */
    _getPrometheusType(type) {
        switch (type) {
            case 'counter':
                return 'counter';
            case 'gauge':
                return 'gauge';
            case 'histogram':
                return 'histogram';
            case 'timer':
                return 'histogram';
            default:
                return 'gauge';
        }
    }
    /**
     * Format labels for Prometheus export
     *
     * @param labels - Label object
     * @returns Formatted labels string
     */
    _formatPrometheusLabels(labels) {
        if (Object.keys(labels).length === 0)
            return '';
        const labelPairs = Object.entries(labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(',');
        return `{${labelPairs}}`;
    }
    /**
     * Measure event loop delay (simplified implementation)
     *
     * @returns Event loop delay in milliseconds
     */
    _measureEventLoopDelay() {
        // This is a simplified implementation
        // In production, you might want to use perf_hooks.monitorEventLoopDelay()
        const start = process.hrtime();
        setImmediate(() => {
            const delta = process.hrtime(start);
            const delay = delta[0] * 1000 + delta[1] * 1e-6; // Convert to milliseconds
            this.gauge('event_loop_delay_ms', delay);
        });
        return 0; // Placeholder - real implementation would be asynchronous
    }
    /**
     * Calculate event loop utilization (approximation)
     *
     * @returns Event loop utilization percentage
     */
    _calculateEventLoopUtilization() {
        // Simplified calculation - real implementation would use perf_hooks
        return Math.random() * 10; // Placeholder
    }
}
// =============================================================================
// Factory Functions
// =============================================================================
/**
 * Create a new metrics collector instance
 *
 * @param serviceName - Service name for labeling
 * @returns Configured metrics collector
 */
export function createMetricsCollector(serviceName) {
    return new MetricsCollector(serviceName);
}
/**
 * Create metrics collector with custom configuration
 *
 * @param serviceName - Service name
 * @param options - Configuration options
 * @returns Configured metrics collector
 */
export function createCustomMetricsCollector(serviceName, options = {}) {
    const collector = new MetricsCollector(serviceName);
    // Apply custom configuration
    if (options.maxDataPoints) {
        collector._maxDataPoints = options.maxDataPoints;
    }
    if (options.retentionPeriod) {
        collector._retentionPeriod = options.retentionPeriod;
    }
    if (options.cleanupInterval) {
        collector._cleanupInterval = options.cleanupInterval;
    }
    return collector;
}
// =============================================================================
// Utility Functions
// =============================================================================
/**
 * Time a function execution and return both result and duration
 *
 * @param fn - Function to time
 * @returns Object with result and duration
 */
export async function timeExecution(fn) {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;
    return { result, duration };
}
/**
 * Create a timing wrapper for functions
 *
 * @param fn - Function to wrap
 * @param onTiming - Callback for timing results
 * @returns Wrapped function
 */
export function withTiming(fn, onTiming) {
    return (async (...args) => {
        const startTime = Date.now();
        try {
            const result = await fn(...args);
            const duration = Date.now() - startTime;
            onTiming(duration, result);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            onTiming(duration, null, error);
            throw error;
        }
    });
}
/**
 * Calculate percentile from array of numbers
 *
 * @param values - Array of numbers
 * @param percentile - Percentile to calculate (0-1)
 * @returns Percentile value
 */
export function calculatePercentile(values, percentile) {
    if (values.length === 0)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * percentile);
    return sorted[Math.min(index, sorted.length - 1)] || 0;
}
/**
 * Format metric value for display
 *
 * @param value - Numeric value
 * @param unit - Value unit
 * @returns Formatted string
 */
export function formatMetricValue(value, unit) {
    let formatted;
    if (unit === 'bytes' || unit === 'megabytes') {
        if (value >= 1024 * 1024 * 1024) {
            formatted = `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        }
        else if (value >= 1024 * 1024) {
            formatted = `${(value / (1024 * 1024)).toFixed(2)} MB`;
        }
        else if (value >= 1024) {
            formatted = `${(value / 1024).toFixed(2)} KB`;
        }
        else {
            formatted = `${value.toFixed(0)} B`;
        }
    }
    else if (unit === 'milliseconds') {
        if (value >= 1000) {
            formatted = `${(value / 1000).toFixed(2)}s`;
        }
        else {
            formatted = `${value.toFixed(0)}ms`;
        }
    }
    else if (unit === 'percent') {
        formatted = `${value.toFixed(1)}%`;
    }
    else {
        formatted = value.toFixed(2);
        if (unit)
            formatted += ` ${unit}`;
    }
    return formatted;
}
// =============================================================================
// Built-in Metric Helpers
// =============================================================================
/**
 * Create HTTP request metrics helper
 *
 * @param collector - Metrics collector
 * @returns HTTP metrics helper
 */
export function createHttpMetrics(collector) {
    return {
        /**
         * Record HTTP request
         *
         * @param method - HTTP method
         * @param path - Request path
         * @param statusCode - Response status code
         * @param duration - Request duration
         */
        recordRequest(method, path, statusCode, duration) {
            collector.increment('http_requests_total', 1, { method, path, status: String(statusCode) });
            collector.timing('http_request_duration', duration, { method, path });
            if (statusCode >= 400) {
                collector.increment('http_errors_total', 1, { method, path, status: String(statusCode) });
            }
        },
        /**
         * Record HTTP response size
         *
         * @param size - Response size in bytes
         * @param path - Request path
         */
        recordResponseSize(size, path) {
            collector.gauge('http_response_size_bytes', size, { path });
        },
    };
}
/**
 * Create database metrics helper
 *
 * @param collector - Metrics collector
 * @returns Database metrics helper
 */
export function createDatabaseMetrics(collector) {
    return {
        /**
         * Record database query
         *
         * @param operation - Query operation (select, insert, update, delete)
         * @param table - Table name
         * @param duration - Query duration
         * @param success - Whether query succeeded
         */
        recordQuery(operation, table, duration, success) {
            collector.timing('db_query_duration', duration, { operation, table });
            collector.increment('db_queries_total', 1, { operation, table, status: success ? 'success' : 'error' });
            if (!success) {
                collector.increment('db_errors_total', 1, { operation, table });
            }
        },
        /**
         * Record database connection pool metrics
         *
         * @param active - Active connections
         * @param idle - Idle connections
         * @param total - Total connections
         */
        recordConnectionPool(active, idle, total) {
            collector.gauge('db_connections_active', active);
            collector.gauge('db_connections_idle', idle);
            collector.gauge('db_connections_total', total);
        },
    };
}
// =============================================================================
// Re-exports
// =============================================================================
//# sourceMappingURL=metrics.js.map