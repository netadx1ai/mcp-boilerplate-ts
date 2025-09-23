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

import { createLogger, format, transports, Logger } from 'winston';
import { LoggingConfig } from '../types/index.js';
import { LoggingConfigSchema } from './config.js';

// =============================================================================
// Constants
// =============================================================================

/**
 * Default log format for different environments
 */
const LOG_FORMATS = {
  development: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.colorize(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level}]: ${message}${metaStr}`;
    })
  ),
  production: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  test: format.combine(format.timestamp(), format.errors({ stack: true }), format.simple()),
};

/**
 * Log level mapping for Winston
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

/**
 * Default file rotation settings
 */
const FILE_ROTATION_DEFAULTS = {
  maxSize: '10MB',
  maxFiles: 5,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
};

// =============================================================================
// Logger Factory
// =============================================================================

/**
 * Create a Winston logger instance with MCP boilerplate defaults
 *
 * @param config - Logging configuration
 * @param serverName - Optional server name for context
 * @returns Configured Winston logger
 */
export function createDefaultLogger(config: LoggingConfig, serverName?: string): Logger {
  const loggerTransports: any[] = [];
  const environment = process.env.NODE_ENV || 'development';

  // Determine format based on config
  const logFormat =
    config.format === 'json'
      ? LOG_FORMATS.production
      : config.format === 'pretty'
        ? LOG_FORMATS.development
        : LOG_FORMATS[environment as keyof typeof LOG_FORMATS] || LOG_FORMATS.development;

  // Console transport
  if (config.output === 'console' || config.output === 'both') {
    loggerTransports.push(
      new transports.Console({
        level: config.level,
        format: logFormat,
        handleExceptions: true,
        handleRejections: true,
      })
    );
  }

  // File transport with rotation
  if (config.output === 'file' || config.output === 'both') {
    if (!config.file) {
      throw new Error('File path required when file output is enabled');
    }

    // Daily rotate file transport
    const DailyRotateFile = require('winston-daily-rotate-file');

    loggerTransports.push(
      new DailyRotateFile({
        filename: config.file.replace('.log', '-%DATE%.log'),
        datePattern: FILE_ROTATION_DEFAULTS.datePattern,
        maxSize: config.maxSize || FILE_ROTATION_DEFAULTS.maxSize,
        maxFiles: config.maxFiles || FILE_ROTATION_DEFAULTS.maxFiles,
        zippedArchive: FILE_ROTATION_DEFAULTS.zippedArchive,
        level: config.level,
        format: LOG_FORMATS.production, // Always use JSON for files
        handleExceptions: true,
        handleRejections: true,
      })
    );

    // Error-only file transport
    loggerTransports.push(
      new DailyRotateFile({
        filename: config.file.replace('.log', '-error-%DATE%.log'),
        datePattern: FILE_ROTATION_DEFAULTS.datePattern,
        maxSize: config.maxSize || FILE_ROTATION_DEFAULTS.maxSize,
        maxFiles: config.maxFiles || FILE_ROTATION_DEFAULTS.maxFiles,
        zippedArchive: FILE_ROTATION_DEFAULTS.zippedArchive,
        level: 'error',
        format: LOG_FORMATS.production,
        handleExceptions: true,
        handleRejections: true,
      })
    );
  }

  // Create logger instance
  const logger = createLogger({
    levels: LOG_LEVELS,
    level: config.level,
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      serverName ? format.label({ label: serverName }) : format.label({ label: 'mcp-server' }),
      format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
    ),
    transports: loggerTransports,
    exitOnError: false,
    silent: process.env.NODE_ENV === 'test' && process.env.LOG_TESTS !== 'true',
  });

  // Add custom log levels
  logger.add(
    new transports.Console({
      level: 'trace',
      format: logFormat,
    })
  );

  return logger;
}

// =============================================================================
// Structured Logging Helpers
// =============================================================================

/**
 * Create child logger with additional context
 *
 * @param logger - Parent logger
 * @param context - Additional context to include in all logs
 * @returns Child logger with context
 */
export function createChildLogger(logger: Logger, context: Record<string, unknown>): Logger {
  return logger.child(context);
}

/**
 * Create request logger with correlation ID
 *
 * @param logger - Base logger
 * @param requestId - Request correlation ID
 * @param additionalContext - Additional request context
 * @returns Request-scoped logger
 */
export function createRequestLogger(
  logger: Logger,
  requestId: string,
  additionalContext: Record<string, unknown> = {}
): Logger {
  return createChildLogger(logger, {
    requestId,
    ...additionalContext,
  });
}

/**
 * Create tool execution logger
 *
 * @param logger - Base logger
 * @param toolName - Name of the tool being executed
 * @param requestId - Request correlation ID
 * @returns Tool execution logger
 */
export function createToolLogger(logger: Logger, toolName: string, requestId?: string): Logger {
  const context: Record<string, unknown> = { tool: toolName };
  if (requestId) context.requestId = requestId;

  return createChildLogger(logger, context);
}

// =============================================================================
// Performance Logging
// =============================================================================

/**
 * Log execution timing with automatic duration calculation
 *
 * @param logger - Logger instance
 * @param operation - Operation name
 * @param fn - Function to execute and time
 * @returns Result of the function execution
 */
export async function logTiming<T>(
  logger: Logger,
  operation: string,
  fn: () => Promise<T> | T
): Promise<T> {
  const startTime = Date.now();

  try {
    logger.debug(`Starting ${operation}`);
    const result = await fn();
    const duration = Date.now() - startTime;

    logger.info(`${operation} completed`, { duration, success: true });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error(`${operation} failed`, {
      duration,
      success: false,
      error: errorMessage,
    });
    throw error;
  }
}

/**
 * Create a timing decorator for methods
 *
 * @param logger - Logger instance
 * @param operation - Operation name (defaults to method name)
 * @returns Method decorator
 */
export function logTimingDecorator(logger: Logger, operation?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      return logTiming(logger, operationName, () => method.apply(this, args));
    };
  };
}

// =============================================================================
// Error Logging Helpers
// =============================================================================

/**
 * Log error with full context and stack trace
 *
 * @param logger - Logger instance
 * @param error - Error to log
 * @param context - Additional context
 * @param operation - Operation that failed
 */
export function logError(
  logger: Logger,
  error: unknown,
  context: Record<string, unknown> = {},
  operation?: string
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  logger.error(operation ? `${operation} failed` : 'Error occurred', {
    error: errorMessage,
    stack,
    ...context,
  });
}

/**
 * Log and re-throw error with additional context
 *
 * @param logger - Logger instance
 * @param error - Error to log and re-throw
 * @param context - Additional context
 * @param operation - Operation that failed
 * @throws Re-throws the original error after logging
 */
export function logAndThrow(
  logger: Logger,
  error: unknown,
  context: Record<string, unknown> = {},
  operation?: string
): never {
  logError(logger, error, context, operation);
  throw error;
}

// =============================================================================
// Metrics Logging
// =============================================================================

/**
 * Log metric data point
 *
 * @param logger - Logger instance
 * @param metric - Metric name
 * @param value - Metric value
 * @param unit - Metric unit
 * @param tags - Additional tags
 */
export function logMetric(
  logger: Logger,
  metric: string,
  value: number,
  unit?: string,
  tags: Record<string, string> = {}
): void {
  logger.info('Metric recorded', {
    metric,
    value,
    unit,
    tags,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log system metrics (memory, CPU, etc.)
 *
 * @param logger - Logger instance
 */
export function logSystemMetrics(logger: Logger): void {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  logger.debug('System metrics', {
    memory: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000), // ms
      system: Math.round(cpuUsage.system / 1000), // ms
    },
    uptime: Math.round(process.uptime()),
  });
}

// =============================================================================
// Security Logging
// =============================================================================

/**
 * Log security event (authentication, authorization, etc.)
 *
 * @param logger - Logger instance
 * @param event - Security event type
 * @param result - Event result (success/failure)
 * @param context - Additional context
 */
export function logSecurityEvent(
  logger: Logger,
  event: string,
  result: 'success' | 'failure',
  context: Record<string, unknown> = {}
): void {
  const level = result === 'success' ? 'info' : 'warn';

  logger.log(level, `Security event: ${event}`, {
    securityEvent: event,
    result,
    timestamp: new Date().toISOString(),
    ...context,
  });
}

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
export function logAuditEvent(
  logger: Logger,
  action: string,
  resource: string,
  user?: string,
  result: 'success' | 'failure' = 'success',
  context: Record<string, unknown> = {}
): void {
  logger.info('Audit event', {
    audit: {
      action,
      resource,
      user: user || 'system',
      result,
      timestamp: new Date().toISOString(),
    },
    ...context,
  });
}

// =============================================================================
// HTTP Logging Middleware
// =============================================================================

/**
 * Create HTTP request logging middleware
 *
 * @param logger - Logger instance
 * @returns Express-style middleware function
 */
export function createHttpLogger(logger: Logger) {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || generateRequestId();

    // Add request ID to request object
    req.requestId = requestId;
    req.logger = createRequestLogger(logger, requestId, {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
    });

    // Log request start
    req.logger.info('HTTP request started', {
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers),
    });

    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (this: any, chunk: any, encoding: any) {
      const duration = Date.now() - startTime;

      req.logger.info('HTTP request completed', {
        statusCode: res.statusCode,
        duration,
        responseSize: res.get('content-length') || 0,
      });

      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

/**
 * Generate unique request ID
 *
 * @returns Unique request identifier
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize HTTP headers for logging (remove sensitive data)
 *
 * @param headers - HTTP headers
 * @returns Sanitized headers
 */
function sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
  const sanitized = { ...headers };

  // Remove sensitive headers
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-access-token',
  ];

  for (const header of sensitiveHeaders) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  }

  return sanitized;
}

// =============================================================================
// Specialized Loggers
// =============================================================================

/**
 * Create application logger with standard configuration
 *
 * @param appName - Application name
 * @param level - Log level
 * @returns Application logger
 */
export function createAppLogger(appName: string, level: string = 'info'): Logger {
  const environment = process.env.NODE_ENV || 'development';

  return createLogger({
    level,
    format: LOG_FORMATS[environment as keyof typeof LOG_FORMATS] || LOG_FORMATS.development,
    defaultMeta: {
      service: appName,
      environment,
      pid: process.pid,
    },
    transports: [
      new transports.Console({
        handleExceptions: true,
        handleRejections: true,
      }),
    ],
    exitOnError: false,
  });
}

/**
 * Create performance logger for benchmarking
 *
 * @param component - Component name
 * @returns Performance logger
 */
export function createPerformanceLogger(component: string): Logger {
  return createLogger({
    level: 'debug',
    format: format.combine(
      format.timestamp(),
      format.label({ label: `perf:${component}` }),
      format.json()
    ),
    transports: [new transports.Console()],
  });
}

/**
 * Create security logger for audit trails
 *
 * @param serviceName - Service name
 * @returns Security logger
 */
export function createSecurityLogger(serviceName: string): Logger {
  return createLogger({
    level: 'info',
    format: format.combine(
      format.timestamp(),
      format.label({ label: `security:${serviceName}` }),
      format.json()
    ),
    transports: [
      new transports.Console(),
      ...(process.env.NODE_ENV === 'production'
        ? [
            new transports.File({
              filename: `logs/security-${serviceName}.log`,
              level: 'info',
            }),
          ]
        : []),
    ],
  });
}

// =============================================================================
// Logging Utilities
// =============================================================================

/**
 * Create correlation context for distributed tracing
 *
 * @param traceId - Trace ID
 * @param spanId - Span ID
 * @param parentSpanId - Parent span ID
 * @returns Correlation context
 */
export function createCorrelationContext(
  traceId: string,
  spanId: string,
  parentSpanId?: string
): Record<string, string> {
  return {
    traceId,
    spanId,
    ...(parentSpanId && { parentSpanId }),
  };
}

/**
 * Log function entry with parameters
 *
 * @param logger - Logger instance
 * @param functionName - Function name
 * @param params - Function parameters
 */
export function logFunctionEntry(
  logger: Logger,
  functionName: string,
  params: Record<string, unknown> = {}
): void {
  logger.debug(`→ ${functionName}`, {
    function: functionName,
    params: sanitizeLogParams(params),
    direction: 'entry',
  });
}

/**
 * Log function exit with result
 *
 * @param logger - Logger instance
 * @param functionName - Function name
 * @param result - Function result
 * @param duration - Execution duration in milliseconds
 */
export function logFunctionExit(
  logger: Logger,
  functionName: string,
  result?: unknown,
  duration?: number
): void {
  logger.debug(`← ${functionName}`, {
    function: functionName,
    result: sanitizeLogParams({ result }),
    duration,
    direction: 'exit',
  });
}

/**
 * Sanitize parameters for logging (remove sensitive data)
 *
 * @param params - Parameters to sanitize
 * @returns Sanitized parameters
 */
function sanitizeLogParams(params: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(params)) {
    const lowerKey = key.toLowerCase();

    if (
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('token') ||
      lowerKey.includes('key')
    ) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// =============================================================================
// Log Analysis Utilities
// =============================================================================

/**
 * Create log aggregation helper
 *
 * @param logger - Logger instance
 * @returns Log aggregation utilities
 */
export function createLogAggregator(logger: Logger) {
  const counters = new Map<string, number>();
  const timings = new Map<string, number[]>();

  return {
    /**
     * Increment counter for event
     *
     * @param event - Event name
     * @param increment - Increment value (default: 1)
     */
    count(event: string, increment = 1): void {
      const current = counters.get(event) || 0;
      counters.set(event, current + increment);
    },

    /**
     * Record timing for operation
     *
     * @param operation - Operation name
     * @param duration - Duration in milliseconds
     */
    timing(operation: string, duration: number): void {
      const current = timings.get(operation) || [];
      current.push(duration);
      timings.set(operation, current);
    },

    /**
     * Log aggregated statistics
     */
    logStats(): void {
      // Log counters
      for (const [event, count] of Array.from(counters.entries())) {
        logger.info('Event counter', { event, count });
      }

      // Log timing statistics
      for (const [operation, durations] of Array.from(timings.entries())) {
        const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
        const min = Math.min(...durations);
        const max = Math.max(...durations);

        logger.info('Timing statistics', {
          operation,
          count: durations.length,
          avg: Math.round(avg),
          min,
          max,
        });
      }
    },

    /**
     * Reset all counters and timings
     */
    reset(): void {
      counters.clear();
      timings.clear();
    },
  };
}

// =============================================================================
// Development Helpers
// =============================================================================

/**
 * Create debug logger that only logs in development
 *
 * @param component - Component name
 * @returns Debug logger
 */
export function createDebugLogger(component: string): Logger {
  const logger = createLogger({
    level: 'debug',
    format: format.combine(
      format.timestamp({ format: 'HH:mm:ss.SSS' }),
      format.colorize(),
      format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} [${component}] ${level}: ${message}${metaStr}`;
      })
    ),
    transports: [new transports.Console()],
    silent: process.env.NODE_ENV === 'production',
  });

  return logger;
}

/**
 * Create trace logger for detailed debugging
 *
 * @param component - Component name
 * @returns Trace logger
 */
export function createTraceLogger(component: string): Logger {
  const logger = createDebugLogger(component);
  logger.level = 'silly'; // Most verbose level
  return logger;
}

// =============================================================================
// Health Check Logging
// =============================================================================

/**
 * Log health check results
 *
 * @param logger - Logger instance
 * @param checkName - Health check name
 * @param status - Check status
 * @param duration - Check duration
 * @param details - Additional details
 */
export function logHealthCheck(
  logger: Logger,
  checkName: string,
  status: 'pass' | 'fail' | 'warn',
  duration: number,
  details?: Record<string, unknown>
): void {
  const level = status === 'pass' ? 'debug' : status === 'warn' ? 'warn' : 'error';

  logger.log(level, `Health check: ${checkName}`, {
    healthCheck: checkName,
    status,
    duration,
    ...details,
  });
}

// =============================================================================
// Testing Utilities
// =============================================================================

/**
 * Create mock logger for testing
 *
 * @returns Mock logger that captures log calls
 */
export function createMockLogger(): Logger & {
  getLogs(): Array<{ level: string; message: string; meta: any }>;
  clearLogs(): void;
} {
  const logs: Array<{ level: string; message: string; meta: any }> = [];

  const mockLogger = createLogger({
    level: 'silly',
    format: format.simple(),
    transports: [
      new transports.Console({
        silent: true, // Don't actually output during tests
      }),
    ],
  });

  // Override logging methods to capture calls
  const originalLog = mockLogger.log;
  (mockLogger as any).log = function (level: any, message?: any, meta?: any) {
    logs.push({ level: level.level || level, message, meta });
    return originalLog.call(mockLogger, level, message) as Logger;
  };

  // Add utility methods
  (mockLogger as any).getLogs = () => [...logs];
  (mockLogger as any).clearLogs = () => (logs.length = 0);

  return mockLogger as any;
}

/**
 * Create silent logger for tests
 *
 * @returns Logger that doesn't output anything
 */
export function createSilentLogger(): Logger {
  return createLogger({
    level: 'error',
    transports: [new transports.Console({ silent: true })],
  });
}

// =============================================================================
// Configuration Validation
// =============================================================================

/**
 * Validate logging configuration
 *
 * @param config - Logging configuration to validate
 * @throws {Error} When configuration is invalid
 */
export function validateLoggingConfig(config: LoggingConfig): void {
  const result = LoggingConfigSchema.safeParse(config);

  if (!result.success) {
    const issues = result.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');
    throw new Error(`Invalid logging configuration: ${issues}`);
  }

  // Additional validation
  if (config.output === 'file' || config.output === 'both') {
    if (!config.file) {
      throw new Error('File path required when file output is enabled');
    }
  }
}

// =============================================================================
// Re-exports and Convenience
// =============================================================================

// Export main factory function
export { createDefaultLogger as createLogger };

// Export specialized loggers
export {
  createAppLogger as app,
  createPerformanceLogger as performance,
  createSecurityLogger as security,
  createDebugLogger as debug,
  createTraceLogger as trace,
};

// Export utilities
export {
  logTiming as timing,
  logError as error,
  logMetric as metric,
  logSystemMetrics as systemMetrics,
  logSecurityEvent as securityEvent,
  logAuditEvent as auditEvent,
};

// Type exports
export type { Logger };
