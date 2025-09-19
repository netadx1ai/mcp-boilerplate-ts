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
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from 'events';
import { TimeSeriesMetric, ResourceUsage } from '../types/index.js';
/**
 * Metric types for categorization
 */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer';
/**
 * Metric aggregation methods
 */
export type AggregationType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'p95' | 'p99';
/**
 * Metric configuration
 */
export interface MetricConfig {
    readonly name: string;
    readonly type: MetricType;
    readonly description: string;
    readonly unit: string;
    readonly labels?: Record<string, string>;
    readonly retention?: number;
}
/**
 * Metric value with metadata
 */
export interface MetricValue {
    readonly value: number;
    readonly timestamp: number;
    readonly labels?: Record<string, string>;
}
/**
 * Aggregated metric statistics
 */
export interface MetricStats {
    readonly count: number;
    readonly sum: number;
    readonly avg: number;
    readonly min: number;
    readonly max: number;
    readonly p95: number;
    readonly p99: number;
    readonly latest: number;
    readonly oldest: number;
}
/**
 * Performance snapshot
 */
export interface PerformanceSnapshot {
    readonly timestamp: string;
    readonly memory: {
        readonly heapUsed: number;
        readonly heapTotal: number;
        readonly external: number;
        readonly rss: number;
    };
    readonly cpu: {
        readonly user: number;
        readonly system: number;
    };
    readonly eventLoop: {
        readonly delay: number;
        readonly utilization: number;
    };
    readonly uptime: number;
}
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
export declare class MetricsCollector extends EventEmitter {
    private readonly _serviceName;
    private readonly _metrics;
    private readonly _configs;
    private readonly _toolExecutions;
    private readonly _responseTimes;
    private readonly _startTime;
    private _requestCount;
    private _errorCount;
    private _totalResponseTime;
    private _lastCpuUsage;
    private _performanceSnapshots;
    private readonly _maxDataPoints;
    private readonly _cleanupInterval;
    private readonly _retentionPeriod;
    private _cleanupTimer?;
    constructor(serviceName: string);
    /**
     * Register a new metric
     *
     * @param config - Metric configuration
     */
    registerMetric(config: MetricConfig): void;
    /**
     * Register multiple metrics
     *
     * @param configs - Array of metric configurations
     */
    registerMetrics(configs: MetricConfig[]): void;
    /**
     * Record a metric value
     *
     * @param name - Metric name
     * @param value - Metric value
     * @param labels - Optional labels
     */
    record(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Increment a counter metric
     *
     * @param name - Counter name
     * @param increment - Increment value (default: 1)
     * @param labels - Optional labels
     */
    increment(name: string, increment?: number, labels?: Record<string, string>): void;
    /**
     * Record a gauge value (current state)
     *
     * @param name - Gauge name
     * @param value - Current value
     * @param labels - Optional labels
     */
    gauge(name: string, value: number, labels?: Record<string, string>): void;
    /**
     * Record timing information
     *
     * @param name - Timer name
     * @param duration - Duration in milliseconds
     * @param labels - Optional labels
     */
    timing(name: string, duration: number, labels?: Record<string, string>): void;
    /**
     * Record tool execution metrics
     *
     * @param toolName - Name of the executed tool
     * @param duration - Execution duration in milliseconds
     * @param success - Whether execution was successful
     */
    recordToolExecution(toolName: string, duration: number, success: boolean): void;
    /**
     * Get tool execution counts
     *
     * @returns Map of tool names to execution counts
     */
    getToolExecutionCounts(): Record<string, number>;
    /**
     * Get average response time across all requests
     *
     * @returns Average response time in milliseconds
     */
    getAverageResponseTime(): number;
    /**
     * Get response time percentiles
     *
     * @returns Percentile statistics
     */
    getResponseTimePercentiles(): {
        p50: number;
        p95: number;
        p99: number;
    };
    /**
     * Get latest value for a metric
     *
     * @param name - Metric name
     * @returns Latest value or undefined
     */
    getLatestValue(name: string): number | undefined;
    /**
     * Get all values for a metric within time range
     *
     * @param name - Metric name
     * @param since - Start time (milliseconds since epoch)
     * @param until - End time (milliseconds since epoch, default: now)
     * @returns Array of metric values
     */
    getValues(name: string, since?: number, until?: number): MetricValue[];
    /**
     * Get metric statistics
     *
     * @param name - Metric name
     * @param since - Start time (optional)
     * @returns Metric statistics
     */
    getMetricStats(name: string, since?: number): MetricStats | undefined;
    /**
     * Get time series data for a metric
     *
     * @param name - Metric name
     * @param aggregation - Aggregation method
     * @param bucketSize - Bucket size in milliseconds (default: 60000 = 1 minute)
     * @param since - Start time (optional)
     * @returns Time series metric
     */
    getTimeSeries(name: string, aggregation?: AggregationType, bucketSize?: number, since?: number): TimeSeriesMetric | undefined;
    /**
     * Get all metric names
     *
     * @returns Array of metric names
     */
    getMetricNames(): string[];
    /**
     * Get metric configuration
     *
     * @param name - Metric name
     * @returns Metric configuration or undefined
     */
    getMetricConfig(name: string): MetricConfig | undefined;
    /**
     * Record system performance snapshot
     */
    recordPerformanceSnapshot(): void;
    /**
     * Get recent performance snapshots
     *
     * @param count - Number of snapshots to return (default: 10)
     * @returns Array of performance snapshots
     */
    getPerformanceSnapshots(count?: number): PerformanceSnapshot[];
    /**
     * Get current resource usage
     *
     * @returns Current resource usage
     */
    getCurrentResourceUsage(): ResourceUsage;
    /**
     * Get aggregated metrics summary
     *
     * @returns Summary of all metrics
     */
    getSummary(): Record<string, MetricStats>;
    /**
     * Get service health score based on metrics
     *
     * @returns Health score from 0-100
     */
    getHealthScore(): number;
    /**
     * Export metrics in Prometheus format
     *
     * @returns Prometheus-formatted metrics string
     */
    exportPrometheus(): string;
    /**
     * Export metrics as JSON
     *
     * @param includeHistory - Whether to include historical data
     * @returns JSON metrics object
     */
    exportJson(includeHistory?: boolean): Record<string, any>;
    /**
     * Clean up old metric data to prevent memory leaks
     */
    cleanup(): void;
    /**
     * Reset all metrics data
     */
    reset(): void;
    /**
     * Destroy the metrics collector and cleanup resources
     */
    destroy(): void;
    /**
     * Initialize default metrics for all servers
     */
    private _initializeDefaultMetrics;
    /**
     * Start cleanup timer for automatic maintenance
     */
    private _startCleanupTimer;
    /**
     * Start performance monitoring
     */
    private _startPerformanceMonitoring;
    /**
     * Aggregate array of values using specified method
     *
     * @param values - Values to aggregate
     * @param aggregation - Aggregation method
     * @returns Aggregated value
     */
    private _aggregateValues;
    /**
     * Convert metric type to Prometheus type
     *
     * @param type - Internal metric type
     * @returns Prometheus metric type
     */
    private _getPrometheusType;
    /**
     * Format labels for Prometheus export
     *
     * @param labels - Label object
     * @returns Formatted labels string
     */
    private _formatPrometheusLabels;
    /**
     * Measure event loop delay (simplified implementation)
     *
     * @returns Event loop delay in milliseconds
     */
    private _measureEventLoopDelay;
    /**
     * Calculate event loop utilization (approximation)
     *
     * @returns Event loop utilization percentage
     */
    private _calculateEventLoopUtilization;
}
/**
 * Create a new metrics collector instance
 *
 * @param serviceName - Service name for labeling
 * @returns Configured metrics collector
 */
export declare function createMetricsCollector(serviceName: string): MetricsCollector;
/**
 * Create metrics collector with custom configuration
 *
 * @param serviceName - Service name
 * @param options - Configuration options
 * @returns Configured metrics collector
 */
export declare function createCustomMetricsCollector(serviceName: string, options?: {
    maxDataPoints?: number;
    retentionPeriod?: number;
    cleanupInterval?: number;
}): MetricsCollector;
/**
 * Time a function execution and return both result and duration
 *
 * @param fn - Function to time
 * @returns Object with result and duration
 */
export declare function timeExecution<T>(fn: () => Promise<T> | T): Promise<{
    result: T;
    duration: number;
}>;
/**
 * Create a timing wrapper for functions
 *
 * @param fn - Function to wrap
 * @param onTiming - Callback for timing results
 * @returns Wrapped function
 */
export declare function withTiming<T extends (...args: any[]) => any>(fn: T, onTiming: (duration: number, result: any, error?: Error) => void): T;
/**
 * Calculate percentile from array of numbers
 *
 * @param values - Array of numbers
 * @param percentile - Percentile to calculate (0-1)
 * @returns Percentile value
 */
export declare function calculatePercentile(values: number[], percentile: number): number;
/**
 * Format metric value for display
 *
 * @param value - Numeric value
 * @param unit - Value unit
 * @returns Formatted string
 */
export declare function formatMetricValue(value: number, unit?: string): string;
/**
 * Create HTTP request metrics helper
 *
 * @param collector - Metrics collector
 * @returns HTTP metrics helper
 */
export declare function createHttpMetrics(collector: MetricsCollector): {
    /**
     * Record HTTP request
     *
     * @param method - HTTP method
     * @param path - Request path
     * @param statusCode - Response status code
     * @param duration - Request duration
     */
    recordRequest(method: string, path: string, statusCode: number, duration: number): void;
    /**
     * Record HTTP response size
     *
     * @param size - Response size in bytes
     * @param path - Request path
     */
    recordResponseSize(size: number, path: string): void;
};
/**
 * Create database metrics helper
 *
 * @param collector - Metrics collector
 * @returns Database metrics helper
 */
export declare function createDatabaseMetrics(collector: MetricsCollector): {
    /**
     * Record database query
     *
     * @param operation - Query operation (select, insert, update, delete)
     * @param table - Table name
     * @param duration - Query duration
     * @param success - Whether query succeeded
     */
    recordQuery(operation: string, table: string, duration: number, success: boolean): void;
    /**
     * Record database connection pool metrics
     *
     * @param active - Active connections
     * @param idle - Idle connections
     * @param total - Total connections
     */
    recordConnectionPool(active: number, idle: number, total: number): void;
};
//# sourceMappingURL=metrics.d.ts.map