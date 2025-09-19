/**
 * @fileoverview Shared types for MCP Boilerplate TypeScript Ecosystem
 *
 * This module provides comprehensive type definitions for the MCP boilerplate ecosystem,
 * including server interfaces, tool definitions, configuration types, and common utilities.
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */
import { z } from 'zod';
// =============================================================================
// Validation Schemas (Zod)
// =============================================================================
/**
 * Server configuration validation schema
 */
export const ServerConfigSchema = z.object({
    name: z.string().min(1).max(100),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    description: z.string().min(1).max(500),
    port: z.number().int().min(1024).max(65535),
    host: z.string().ip().or(z.literal('localhost')),
    environment: z.enum(['development', 'production', 'test']),
    logging: z.object({
        level: z.enum(['error', 'warn', 'info', 'debug', 'trace']),
        format: z.enum(['json', 'pretty']),
        output: z.enum(['console', 'file', 'both']),
    }),
    security: z.object({
        enableAuth: z.boolean(),
        rateLimiting: z.object({
            enabled: z.boolean(),
            windowMs: z.number().positive(),
            maxRequests: z.number().positive(),
        }),
    }),
});
/**
 * Tool parameters validation schema
 */
export const ToolParametersSchema = z.record(z.unknown());
/**
 * Tool result validation schema
 */
export const ToolResultSchema = z.object({
    success: z.boolean(),
    data: z.unknown().optional(),
    error: z.string().optional(),
    metadata: z.object({
        executionTime: z.number().nonnegative(),
        timestamp: z.string().datetime(),
    }).optional(),
});
// =============================================================================
// Error Types
// =============================================================================
/**
 * Base error class for MCP boilerplate ecosystem
 */
export class McpBoilerplateError extends Error {
    timestamp;
    context;
    constructor(message, context) {
        super(message);
        this.name = this.constructor.name;
        this.timestamp = new Date().toISOString();
        this.context = context;
        Error.captureStackTrace(this, this.constructor);
    }
}
/**
 * Server configuration error
 */
export class ServerConfigError extends McpBoilerplateError {
    code = 'SERVER_CONFIG_ERROR';
    statusCode = 500;
}
/**
 * Tool execution error
 */
export class ToolExecutionError extends McpBoilerplateError {
    code = 'TOOL_EXECUTION_ERROR';
    statusCode = 400;
}
/**
 * Authentication error
 */
export class AuthenticationError extends McpBoilerplateError {
    code = 'AUTHENTICATION_ERROR';
    statusCode = 401;
}
/**
 * Authorization error
 */
export class AuthorizationError extends McpBoilerplateError {
    code = 'AUTHORIZATION_ERROR';
    statusCode = 403;
}
/**
 * Database error
 */
export class DatabaseError extends McpBoilerplateError {
    code = 'DATABASE_ERROR';
    statusCode = 500;
}
/**
 * External API error
 */
export class ExternalApiError extends McpBoilerplateError {
    code = 'EXTERNAL_API_ERROR';
    statusCode = 502;
}
/**
 * Validation error
 */
export class ValidationError extends McpBoilerplateError {
    code = 'VALIDATION_ERROR';
    statusCode = 400;
}
// =============================================================================
// Type Guards & Validators
// =============================================================================
/**
 * Type guard to check if value is McpTool
 */
export function isMcpTool(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'name' in value &&
        'description' in value &&
        'execute' in value &&
        typeof value.execute === 'function');
}
/**
 * Type guard to check if value is ToolResult
 */
export function isToolResult(value) {
    return (typeof value === 'object' &&
        value !== null &&
        'success' in value &&
        typeof value.success === 'boolean');
}
/**
 * Type guard to check if error is McpBoilerplateError
 */
export function isMcpBoilerplateError(error) {
    return error instanceof McpBoilerplateError;
}
/**
 * Default server ports
 */
export const DEFAULT_PORTS = {
    NEWS_DATA: 8001,
    TEMPLATE: 8002,
    ANALYTICS: 8003,
    DATABASE: 8004,
    API_GATEWAY: 8005,
    WORKFLOW: 8006,
};
/**
 * Default timeouts (in milliseconds)
 */
export const DEFAULT_TIMEOUTS = {
    TOOL_EXECUTION: 30000,
    DATABASE_QUERY: 10000,
    EXTERNAL_API: 15000,
    SERVER_STARTUP: 5000,
    SERVER_SHUTDOWN: 3000,
};
/**
 * Default limits
 */
export const DEFAULT_LIMITS = {
    MAX_CONCURRENT_REQUESTS: 100,
    MAX_REQUEST_SIZE: '10mb',
    MAX_RESPONSE_SIZE: '50mb',
    RATE_LIMIT_WINDOW: 60000, // 1 minute
    RATE_LIMIT_MAX_REQUESTS: 1000,
};
/**
 * Environment variables prefix
 */
export const ENV_PREFIX = 'MCP_BOILERPLATE';
// Export validation schemas
export { ServerConfigSchema as ConfigSchema, ToolParametersSchema as ParamsSchema, ToolResultSchema as ResultSchema, };
//# sourceMappingURL=index.js.map