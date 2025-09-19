/**
 * @fileoverview Core Utilities Index
 *
 * Central export point for all utility functions used throughout the
 * MCP boilerplate TypeScript ecosystem. This module re-exports utilities
 * for configuration, logging, metrics, and common helper functions.
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */
export { createDefaultConfig, loadConfigFromEnv, loadConfigFromFile, validateConfig, mergeConfigs, loadCompleteConfig, isDevelopment, isProduction, isTest, validatePort, validateServerName, validateVersion, createDevConfig, createProdConfig, createTestConfig, exportConfig, exportConfigToFile, validateConfigDetailed, CompleteServerConfigSchema, quickConfig, env, envNumber, envBoolean, isDev, isProd, } from './config.js';
export { createDefaultLogger, createChildLogger, createRequestLogger, createToolLogger, logTiming, logTimingDecorator, logError, logAndThrow, logMetric, logSystemMetrics, logSecurityEvent, logAuditEvent, createHttpLogger, createCorrelationContext, logFunctionEntry, logFunctionExit, createLogAggregator, validateLoggingConfig, app as createAppLogger, performance as createPerformanceLogger, security as createSecurityLogger, debug as createDebugLogger, trace as createTraceLogger, createMockLogger, createSilentLogger, createLogger, timing, error as logErrorUtil, metric, systemMetrics, securityEvent, auditEvent, } from './logger.js';
export { MetricsCollector, createMetricsCollector, createCustomMetricsCollector, timeExecution, withTiming, calculatePercentile, formatMetricValue, createHttpMetrics, createDatabaseMetrics, type MetricType, type AggregationType, type MetricConfig, type MetricValue, type MetricStats, type PerformanceSnapshot, } from './metrics.js';
/**
 * Sleep for specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Generate unique ID with optional prefix
 *
 * @param prefix - Optional prefix for the ID
 * @returns Unique identifier string
 */
export declare function generateId(prefix?: string): string;
/**
 * Create a timeout promise that rejects after specified time
 *
 * @param ms - Timeout in milliseconds
 * @param message - Error message for timeout
 * @returns Promise that rejects on timeout
 */
export declare function timeout(ms: number, message?: string): Promise<never>;
/**
 * Retry a function with exponential backoff
 *
 * @param fn - Function to retry
 * @param maxAttempts - Maximum number of attempts
 * @param initialDelay - Initial delay in milliseconds
 * @returns Promise with function result
 */
export declare function retry<T>(fn: () => Promise<T>, maxAttempts?: number, initialDelay?: number): Promise<T>;
/**
 * Deep clone an object using JSON serialization
 *
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Check if a value is a plain object
 *
 * @param value - Value to check
 * @returns True if value is a plain object
 */
export declare function isPlainObject(value: unknown): value is Record<string, unknown>;
/**
 * Merge objects deeply
 *
 * @param target - Target object
 * @param sources - Source objects to merge
 * @returns Merged object
 */
export declare function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T;
/**
 * Sanitize object for logging (remove sensitive fields)
 *
 * @param obj - Object to sanitize
 * @param sensitiveKeys - Keys to redact (default: common sensitive keys)
 * @returns Sanitized object
 */
export declare function sanitizeForLogging(obj: Record<string, unknown>, sensitiveKeys?: string[]): Record<string, unknown>;
/**
 * Format bytes to human readable string
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export declare function formatBytes(bytes: number, decimals?: number): string;
/**
 * Format duration to human readable string
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export declare function formatDuration(ms: number): string;
/**
 * Check if string is valid JSON
 *
 * @param str - String to validate
 * @returns True if valid JSON
 */
export declare function isValidJson(str: string): boolean;
/**
 * Parse JSON safely with fallback
 *
 * @param str - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export declare function parseJsonSafe<T>(str: string, fallback: T): T;
/**
 * Debounce function execution
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export declare function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Throttle function execution
 *
 * @param fn - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export declare function throttle<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
/**
 * Create a circuit breaker for function calls
 *
 * @param fn - Function to protect
 * @param options - Circuit breaker options
 * @returns Circuit breaker wrapped function
 */
export declare function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(fn: T, options?: {
    failureThreshold?: number;
    resetTimeout?: number;
    monitoringPeriod?: number;
}): T;
/**
 * Validate environment variable presence
 *
 * @param name - Environment variable name
 * @param defaultValue - Optional default value
 * @returns Environment variable value
 * @throws Error if required variable is missing
 */
export declare function requireEnv(name: string, defaultValue?: string): string;
/**
 * Get environment variable as array (comma-separated)
 *
 * @param name - Environment variable name
 * @param defaultValue - Default array value
 * @returns Array of strings
 */
export declare function getEnvArray(name: string, defaultValue?: string[]): string[];
/**
 * Create a promise that resolves after all provided promises settle
 *
 * @param promises - Array of promises
 * @returns Promise with all results
 */
export declare function allSettledTyped<T>(promises: Promise<T>[]): Promise<Array<{
    status: 'fulfilled';
    value: T;
} | {
    status: 'rejected';
    reason: any;
}>>;
/**
 * Convert callback-style function to promise
 *
 * @param fn - Callback function
 * @returns Promisified function
 */
export declare function promisify<T>(fn: (callback: (error: Error | null, result?: T) => void) => void): () => Promise<T>;
export type { Logger } from 'winston';
export type { McpServerConfig, LoggingConfig, SecurityConfig, PerformanceConfig, MetricDataPoint, TimeSeriesMetric, } from '../types/index.js';
//# sourceMappingURL=index.d.ts.map