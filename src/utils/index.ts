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

// Configuration utilities
export {
  createDefaultConfig,
  loadConfigFromEnv,
  loadConfigFromFile,
  validateConfig,
  mergeConfigs,
  loadCompleteConfig,
  isDevelopment,
  isProduction,
  isTest,
  validatePort,
  validateServerName,
  validateVersion,
  createDevConfig,
  createProdConfig,
  createTestConfig,
  exportConfig,
  exportConfigToFile,
  validateConfigDetailed,
  CompleteServerConfigSchema,
  quickConfig,
  // Convenience exports
  env,
  envNumber,
  envBoolean,
  isDev,
  isProd,
} from './config.js';

// Logging utilities
export {
  createDefaultLogger,
  createChildLogger,
  createRequestLogger,
  createToolLogger,
  logTiming,
  logTimingDecorator,
  logError,
  logAndThrow,
  logMetric,
  logSystemMetrics,
  logSecurityEvent,
  logAuditEvent,
  createHttpLogger,
  createCorrelationContext,
  logFunctionEntry,
  logFunctionExit,
  createLogAggregator,
  validateLoggingConfig,
  // Specialized loggers
  app as createAppLogger,
  performance as createPerformanceLogger,
  security as createSecurityLogger,
  debug as createDebugLogger,
  trace as createTraceLogger,
  // Testing utilities
  createMockLogger,
  createSilentLogger,
  // Convenience exports
  createLogger,
  timing,
  error as logErrorUtil,
  metric,
  systemMetrics,
  securityEvent,
  auditEvent,
} from './logger.js';

// Metrics utilities
export {
  MetricsCollector,
  createMetricsCollector,
  createCustomMetricsCollector,
  timeExecution,
  withTiming,
  calculatePercentile,
  formatMetricValue,
  createHttpMetrics,
  createDatabaseMetrics,
  // Types
  type MetricType,
  type AggregationType,
  type MetricConfig,
  type MetricValue,
  type MetricStats,
  type PerformanceSnapshot,
} from './metrics.js';

// =============================================================================
// Common Utility Functions
// =============================================================================

/**
 * Sleep for specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate unique ID with optional prefix
 *
 * @param prefix - Optional prefix for the ID
 * @returns Unique identifier string
 */
export function generateId(prefix?: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  const id = `${timestamp}${random}`;

  return prefix ? `${prefix}_${id}` : id;
}

/**
 * Create a timeout promise that rejects after specified time
 *
 * @param ms - Timeout in milliseconds
 * @param message - Error message for timeout
 * @returns Promise that rejects on timeout
 */
export function timeout(ms: number, message = 'Operation timeout'): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Retry a function with exponential backoff
 *
 * @param fn - Function to retry
 * @param maxAttempts - Maximum number of attempts
 * @param initialDelay - Initial delay in milliseconds
 * @returns Promise with function result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Exponential backoff
      const delay = initialDelay * Math.pow(2, attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Deep clone an object using JSON serialization
 *
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if a value is a plain object
 *
 * @param value - Value to check
 * @returns True if value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    value.constructor === Object &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Merge objects deeply
 *
 * @param target - Target object
 * @param sources - Source objects to merge
 * @returns Merged object
 */
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  const result = { ...target } as T;

  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (isPlainObject(value) && isPlainObject((result as any)[key])) {
        (result as any)[key] = deepMerge((result as any)[key], value);
      } else {
        (result as any)[key] = value;
      }
    }
  }

  return result;
}

/**
 * Sanitize object for logging (remove sensitive fields)
 *
 * @param obj - Object to sanitize
 * @param sensitiveKeys - Keys to redact (default: common sensitive keys)
 * @returns Sanitized object
 */
export function sanitizeForLogging(
  obj: Record<string, unknown>,
  sensitiveKeys: string[] = ['password', 'secret', 'token', 'key', 'auth']
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (isPlainObject(value)) {
      sanitized[key] = sanitizeForLogging(value as Record<string, unknown>, sensitiveKeys);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Format bytes to human readable string
 *
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places
 * @returns Formatted string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format duration to human readable string
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

/**
 * Check if string is valid JSON
 *
 * @param str - String to validate
 * @returns True if valid JSON
 */
export function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse JSON safely with fallback
 *
 * @param str - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function parseJsonSafe<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

/**
 * Debounce function execution
 *
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function execution
 *
 * @param fn - Function to throttle
 * @param delay - Delay in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn(...args);
    }
  };
}

/**
 * Create a circuit breaker for function calls
 *
 * @param fn - Function to protect
 * @param options - Circuit breaker options
 * @returns Circuit breaker wrapped function
 */
export function createCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    failureThreshold?: number;
    resetTimeout?: number;
    monitoringPeriod?: number;
  } = {}
): T {
  const { failureThreshold = 5, resetTimeout = 60000, monitoringPeriod = 10000 } = options;

  let state: 'closed' | 'open' | 'half-open' = 'closed';
  let failureCount = 0;
  let lastFailureTime = 0;
  let successCount = 0;

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const now = Date.now();

    // Reset failure count after monitoring period
    if (now - lastFailureTime > monitoringPeriod) {
      failureCount = 0;
    }

    // Check if circuit should be closed again
    if (state === 'open' && now - lastFailureTime > resetTimeout) {
      state = 'half-open';
      successCount = 0;
    }

    // Reject if circuit is open
    if (state === 'open') {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await fn(...args);

      // Success in half-open state
      if (state === 'half-open') {
        successCount++;
        if (successCount >= 3) {
          state = 'closed';
          failureCount = 0;
        }
      }

      return result;
    } catch (error) {
      failureCount++;
      lastFailureTime = now;

      // Open circuit if failure threshold reached
      if (failureCount >= failureThreshold) {
        state = 'open';
      }

      throw error;
    }
  }) as T;
}

/**
 * Validate environment variable presence
 *
 * @param name - Environment variable name
 * @param defaultValue - Optional default value
 * @returns Environment variable value
 * @throws Error if required variable is missing
 */
export function requireEnv(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;

  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }

  return value;
}

/**
 * Get environment variable as array (comma-separated)
 *
 * @param name - Environment variable name
 * @param defaultValue - Default array value
 * @returns Array of strings
 */
export function getEnvArray(name: string, defaultValue: string[] = []): string[] {
  const value = process.env[name];

  if (!value) return defaultValue;

  return value
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);
}

/**
 * Create a promise that resolves after all provided promises settle
 *
 * @param promises - Array of promises
 * @returns Promise with all results
 */
export async function allSettledTyped<T>(
  promises: Promise<T>[]
): Promise<Array<{ status: 'fulfilled'; value: T } | { status: 'rejected'; reason: any }>> {
  return Promise.allSettled(promises);
}

/**
 * Convert callback-style function to promise
 *
 * @param fn - Callback function
 * @returns Promisified function
 */
export function promisify<T>(
  fn: (callback: (error: Error | null, result?: T) => void) => void
): () => Promise<T> {
  return () =>
    new Promise<T>((resolve, reject) => {
      fn((error, result) => {
        if (error) reject(error);
        else resolve(result!);
      });
    });
}

// Re-export common types for convenience
export type { Logger } from 'winston';
export type {
  McpServerConfig,
  LoggingConfig,
  SecurityConfig,
  PerformanceConfig,
  MetricDataPoint,
  TimeSeriesMetric,
} from '../types/index.js';
