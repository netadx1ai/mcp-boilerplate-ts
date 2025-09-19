/**
 * @fileoverview Logging Utilities with Winston Integration
 *
 * This module provides a comprehensive logging system built on Winston,
 * designed for the MCP boilerplate ecosystem with support for structured
 * logging, multiple transports, and production-ready features.
 *
 * Features:
 * - Structured JSON logging for production
 * - Pretty console logging for development
 * - File rotation and archival
 * - Correlation ID tracking
 * - Performance logging
 * - Error tracking and alerting
 * - Configurable log levels and formats
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */
import { Logger } from 'winston';
import { LoggingConfig } from '../types/index.js';
/**
 * Create a Winston logger instance with MCP boilerplate defaults
 *
 * @param config - Logging configuration
 * @param serverName - Optional server name for context
 * @returns Configured Winston logger
 */
export declare function createDefaultLogger(config: LoggingConfig, serverName?: string): Logger;
/**
 * Create child logger with additional context
 *
 * @param logger - Parent logger
 * @param context - Additional context to include in all logs
 * @returns Child logger with context
 */
export declare function createChildLogger(logger: Logger, context: Record<string, unknown>): Logger;
/**
 * Create request logger with correlation ID
 *
 * @param logger - Base logger
 * @param requestId - Request correlation ID
 * @param additionalContext - Additional request context
 * @returns Request-scoped logger
 */
export declare function createRequestLogger(logger: Logger, requestId: string, additionalContext?: Record<string, unknown>): Logger;
/**
 * Create tool execution logger
 *
 * @param logger - Base logger
 * @param toolName - Name of the tool being executed
 * @param requestId - Request correlation ID
 * @returns Tool execution logger
 */
export declare function createToolLogger(logger: Logger, toolName: string, requestId?: string): Logger;
/**
 * Log execution timing with automatic duration calculation
 *
 * @param logger - Logger instance
 * @param operation - Operation name
 * @param fn - Function to execute and time
 * @returns Result of the function execution
 */
export declare function logTiming<T>(logger: Logger, operation: string, fn: () => Promise<T> | T): Promise<T>;
/**
 * Create a timing decorator for methods
 *
 * @param logger - Logger instance
 * @param operation - Operation name (defaults to method name)
 * @returns Method decorator
 */
export declare function logTimingDecorator(logger: Logger, operation?: string): (target: any, propertyName: string, descriptor: PropertyDescriptor) => void;
/**
 * Log error with full context and stack trace
 *
 * @param logger - Logger instance
 * @param error - Error to log
 * @param context - Additional context
 * @param operation - Operation that failed
 */
export declare function logError(logger: Logger, error: unknown, context?: Record<string, unknown>, operation?: string): void;
/**
 * Log and re-throw error with additional context
 *
 * @param logger - Logger instance
 * @param error - Error to log and re-throw
 * @param context - Additional context
 * @param operation - Operation that failed
 * @throws Re-throws the original error after logging
 */
export declare function logAndThrow(logger: Logger, error: unknown, context?: Record<string, unknown>, operation?: string): never;
/**
 * Log metric data point
 *
 * @param logger - Logger instance
 * @param metric - Metric name
 * @param value - Metric value
 * @param unit - Metric unit
 * @param tags - Additional tags
 */
export declare function logMetric(logger: Logger, metric: string, value: number, unit?: string, tags?: Record<string, string>): void;
/**
 * Log system metrics (memory, CPU, etc.)
 *
 * @param logger - Logger instance
 */
export declare function logSystemMetrics(logger: Logger): void;
/**
 * Log security event (authentication, authorization, etc.)
 *
 * @param logger - Logger instance
 * @param event - Security event type
 * @param result - Event result (success/failure)
 * @param context - Additional context
 */
export declare function logSecurityEvent(logger: Logger, event: string, result: 'success' | 'failure', context?: Record<string, unknown>): void;
/**
 * Log audit trail event
 *
 * @param logger - Logger instance
 * @param action - Action performed
 * @param resource - Resource affected
 * @param user - User who performed the action
 * @param result - Action result
 * @param context - Additional context
 */
export declare function logAuditEvent(logger: Logger, action: string, resource: string, user?: string, result?: 'success' | 'failure', context?: Record<string, unknown>): void;
/**
 * Create HTTP request logging middleware
 *
 * @param logger - Logger instance
 * @returns Express-style middleware function
 */
export declare function createHttpLogger(logger: Logger): (req: any, res: any, next: any) => void;
/**
 * Create application logger with standard configuration
 *
 * @param appName - Application name
 * @param level - Log level
 * @returns Application logger
 */
export declare function createAppLogger(appName: string, level?: string): Logger;
/**
 * Create performance logger for benchmarking
 *
 * @param component - Component name
 * @returns Performance logger
 */
export declare function createPerformanceLogger(component: string): Logger;
/**
 * Create security logger for audit trails
 *
 * @param serviceName - Service name
 * @returns Security logger
 */
export declare function createSecurityLogger(serviceName: string): Logger;
/**
 * Create correlation context for distributed tracing
 *
 * @param traceId - Trace ID
 * @param spanId - Span ID
 * @param parentSpanId - Parent span ID
 * @returns Correlation context
 */
export declare function createCorrelationContext(traceId: string, spanId: string, parentSpanId?: string): Record<string, string>;
/**
 * Log function entry with parameters
 *
 * @param logger - Logger instance
 * @param functionName - Function name
 * @param params - Function parameters
 */
export declare function logFunctionEntry(logger: Logger, functionName: string, params?: Record<string, unknown>): void;
/**
 * Log function exit with result
 *
 * @param logger - Logger instance
 * @param functionName - Function name
 * @param result - Function result
 * @param duration - Execution duration in milliseconds
 */
export declare function logFunctionExit(logger: Logger, functionName: string, result?: unknown, duration?: number): void;
/**
 * Create log aggregation helper
 *
 * @param logger - Logger instance
 * @returns Log aggregation utilities
 */
export declare function createLogAggregator(logger: Logger): {
    /**
     * Increment counter for event
     *
     * @param event - Event name
     * @param increment - Increment value (default: 1)
     */
    count(event: string, increment?: number): void;
    /**
     * Record timing for operation
     *
     * @param operation - Operation name
     * @param duration - Duration in milliseconds
     */
    timing(operation: string, duration: number): void;
    /**
     * Log aggregated statistics
     */
    logStats(): void;
    /**
     * Reset all counters and timings
     */
    reset(): void;
};
/**
 * Create debug logger that only logs in development
 *
 * @param component - Component name
 * @returns Debug logger
 */
export declare function createDebugLogger(component: string): Logger;
/**
 * Create trace logger for detailed debugging
 *
 * @param component - Component name
 * @returns Trace logger
 */
export declare function createTraceLogger(component: string): Logger;
/**
 * Log health check results
 *
 * @param logger - Logger instance
 * @param checkName - Health check name
 * @param status - Check status
 * @param duration - Check duration
 * @param details - Additional details
 */
export declare function logHealthCheck(logger: Logger, checkName: string, status: 'pass' | 'fail' | 'warn', duration: number, details?: Record<string, unknown>): void;
/**
 * Create mock logger for testing
 *
 * @returns Mock logger that captures log calls
 */
export declare function createMockLogger(): Logger & {
    getLogs(): Array<{
        level: string;
        message: string;
        meta: any;
    }>;
    clearLogs(): void;
};
/**
 * Create silent logger for tests
 *
 * @returns Logger that doesn't output anything
 */
export declare function createSilentLogger(): Logger;
/**
 * Validate logging configuration
 *
 * @param config - Logging configuration to validate
 * @throws {Error} When configuration is invalid
 */
export declare function validateLoggingConfig(config: LoggingConfig): void;
export { createDefaultLogger as createLogger };
export { createAppLogger as app, createPerformanceLogger as performance, createSecurityLogger as security, createDebugLogger as debug, createTraceLogger as trace, };
export { logTiming as timing, logError as error, logMetric as metric, logSystemMetrics as systemMetrics, logSecurityEvent as securityEvent, logAuditEvent as auditEvent, };
export type { Logger };
//# sourceMappingURL=logger.d.ts.map