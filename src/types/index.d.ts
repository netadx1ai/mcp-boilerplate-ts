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
/**
 * Base configuration interface for all MCP servers
 */
export interface McpServerConfig {
    name: string;
    version: string;
    description: string;
    port: number;
    host: string;
    environment: 'development' | 'production' | 'test';
    logging: LoggingConfig;
    security: SecurityConfig;
    performance: PerformanceConfig;
}
/**
 * Logging configuration for servers
 */
export interface LoggingConfig {
    readonly level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
    readonly format: 'json' | 'pretty';
    readonly output: 'console' | 'file' | 'both';
    readonly file?: string;
    readonly maxSize?: string;
    readonly maxFiles?: number;
}
/**
 * Security configuration for servers
 */
export interface SecurityConfig {
    readonly enableAuth: boolean;
    readonly apiKeys?: string[];
    readonly rateLimiting: {
        readonly enabled: boolean;
        readonly windowMs: number;
        readonly maxRequests: number;
    };
    readonly cors: {
        readonly enabled: boolean;
        readonly origins: string[];
        readonly methods: string[];
    };
}
/**
 * Performance configuration for servers
 */
export interface PerformanceConfig {
    readonly timeout: number;
    readonly maxConcurrentRequests: number;
    readonly requestSizeLimit: string;
    readonly caching: {
        readonly enabled: boolean;
        readonly ttl: number;
        readonly maxSize: number;
    };
}
/**
 * Base interface for all MCP tools in the ecosystem
 */
export interface McpTool {
    readonly name: string;
    readonly description: string;
    readonly parameters: z.ZodSchema;
    readonly category: ToolCategory;
    readonly version: string;
    readonly examples: ToolExample[];
    execute(params: unknown): Promise<ToolResult>;
}
/**
 * Tool categories for organization and discovery
 */
export type ToolCategory = 'data' | 'content' | 'analytics' | 'database' | 'api' | 'workflow' | 'utility' | 'auth' | 'template' | 'search';
/**
 * Tool execution example for documentation
 */
export interface ToolExample {
    readonly title: string;
    readonly description: string;
    readonly input: Record<string, unknown>;
    readonly expectedOutput: ToolResult;
}
/**
 * Standard tool execution result
 */
export interface ToolResult {
    readonly success: boolean;
    readonly data?: unknown;
    readonly error?: string;
    readonly metadata?: ToolResultMetadata;
}
/**
 * Additional metadata for tool results
 */
export interface ToolResultMetadata {
    readonly executionTime: number;
    readonly resourcesUsed?: ResourceUsage;
    readonly cacheHit?: boolean;
    readonly requestId?: string;
    readonly timestamp: string;
}
/**
 * Resource usage tracking
 */
export interface ResourceUsage {
    readonly memoryMb: number;
    readonly cpuPercent: number;
    readonly networkBytesIn?: number;
    readonly networkBytesOut?: number;
}
/**
 * Server lifecycle state
 */
export type ServerState = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
/**
 * Server statistics and health information
 */
export interface ServerStats {
    readonly state: ServerState;
    readonly uptime: number;
    readonly requestCount: number;
    readonly errorCount: number;
    readonly lastError?: string;
    readonly performance: {
        readonly avgResponseTime: number;
        readonly memoryUsage: number;
        readonly cpuUsage: number;
    };
    readonly tools: {
        readonly registered: number;
        readonly executions: Record<string, number>;
    };
}
/**
 * Health check result
 */
export interface HealthCheckResult {
    readonly status: 'healthy' | 'unhealthy' | 'degraded';
    readonly checks: Record<string, HealthCheck>;
    readonly timestamp: string;
    readonly uptime: number;
}
/**
 * Individual health check
 */
export interface HealthCheck {
    readonly status: 'pass' | 'fail' | 'warn';
    readonly message?: string;
    readonly duration: number;
    readonly metadata?: Record<string, unknown>;
}
/**
 * Authentication methods supported
 */
export type AuthMethod = 'api-key' | 'bearer' | 'oauth2' | 'basic' | 'custom';
/**
 * Authentication configuration
 */
export interface AuthConfig {
    readonly method: AuthMethod;
    readonly options: Record<string, unknown>;
    readonly required: boolean;
}
/**
 * User context for authenticated requests
 */
export interface UserContext {
    readonly id: string;
    readonly name?: string;
    readonly roles: string[];
    readonly permissions: string[];
    readonly metadata?: Record<string, unknown>;
}
/**
 * Database connection configuration
 */
export interface DatabaseConfig {
    readonly type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis';
    readonly host?: string;
    readonly port?: number;
    readonly database: string;
    readonly username?: string;
    readonly password?: string;
    readonly ssl?: boolean;
    readonly pool?: {
        readonly min: number;
        readonly max: number;
        readonly acquireTimeout: number;
        readonly idleTimeout: number;
    };
}
/**
 * Query result interface
 */
export interface QueryResult<T = unknown> {
    readonly data: T[];
    readonly total: number;
    readonly page?: number;
    readonly pageSize?: number;
    readonly hasMore?: boolean;
    readonly executionTime: number;
}
/**
 * External API configuration
 */
export interface ApiConfig {
    readonly baseUrl: string;
    readonly timeout: number;
    readonly retries: number;
    readonly auth?: AuthConfig;
    readonly rateLimit?: {
        readonly requestsPerSecond: number;
        readonly burstSize: number;
    };
    readonly circuitBreaker?: {
        readonly enabled: boolean;
        readonly failureThreshold: number;
        readonly resetTimeout: number;
    };
}
/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
    readonly success: boolean;
    readonly data?: T;
    readonly error?: ApiError;
    readonly metadata: {
        readonly statusCode: number;
        readonly headers: Record<string, string>;
        readonly requestId?: string;
        readonly executionTime: number;
    };
}
/**
 * API error details
 */
export interface ApiError {
    readonly code: string;
    readonly message: string;
    readonly details?: Record<string, unknown>;
    readonly statusCode?: number;
    readonly retryable: boolean;
}
/**
 * Template definition
 */
export interface Template {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly category: string;
    readonly version: string;
    readonly schema: z.ZodSchema;
    readonly content: string;
    readonly examples: TemplateExample[];
    readonly metadata: TemplateMetadata;
}
/**
 * Template usage example
 */
export interface TemplateExample {
    readonly title: string;
    readonly description: string;
    readonly input: Record<string, unknown>;
    readonly expectedOutput: string;
}
/**
 * Template metadata
 */
export interface TemplateMetadata {
    readonly created: string;
    readonly updated: string;
    readonly author: string;
    readonly tags: string[];
    readonly usageCount?: number;
}
/**
 * Analytics data point
 */
export interface MetricDataPoint {
    readonly timestamp: string;
    readonly value: number;
    readonly metadata?: Record<string, unknown>;
}
/**
 * Time series metric
 */
export interface TimeSeriesMetric {
    readonly name: string;
    readonly description: string;
    readonly unit: string;
    readonly dataPoints: MetricDataPoint[];
    readonly aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'p95' | 'p99';
}
/**
 * Analytics report
 */
export interface AnalyticsReport {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly timeRange: {
        readonly start: string;
        readonly end: string;
    };
    readonly metrics: TimeSeriesMetric[];
    readonly insights: string[];
    readonly generatedAt: string;
}
/**
 * Workflow definition
 */
export interface Workflow {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly version: string;
    readonly steps: WorkflowStep[];
    readonly triggers: WorkflowTrigger[];
    readonly metadata: WorkflowMetadata;
}
/**
 * Individual workflow step
 */
export interface WorkflowStep {
    readonly id: string;
    readonly name: string;
    readonly type: 'tool' | 'condition' | 'loop' | 'parallel';
    readonly config: Record<string, unknown>;
    readonly dependencies: string[];
    readonly timeout?: number;
    readonly retries?: number;
}
/**
 * Workflow trigger configuration
 */
export interface WorkflowTrigger {
    readonly type: 'manual' | 'schedule' | 'event' | 'webhook';
    readonly config: Record<string, unknown>;
    readonly enabled: boolean;
}
/**
 * Workflow metadata
 */
export interface WorkflowMetadata {
    readonly created: string;
    readonly updated: string;
    readonly author: string;
    readonly tags: string[];
    readonly executionCount: number;
    readonly lastExecution?: string;
}
/**
 * Workflow execution result
 */
export interface WorkflowExecution {
    readonly id: string;
    readonly workflowId: string;
    readonly status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    readonly startTime: string;
    readonly endTime?: string;
    readonly results: Record<string, ToolResult>;
    readonly error?: string;
}
/**
 * Server configuration validation schema
 */
export declare const ServerConfigSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodString;
    port: z.ZodNumber;
    host: z.ZodUnion<[z.ZodString, z.ZodLiteral<"localhost">]>;
    environment: z.ZodEnum<["development", "production", "test"]>;
    logging: z.ZodObject<{
        level: z.ZodEnum<["error", "warn", "info", "debug", "trace"]>;
        format: z.ZodEnum<["json", "pretty"]>;
        output: z.ZodEnum<["console", "file", "both"]>;
    }, "strip", z.ZodTypeAny, {
        level: "error" | "warn" | "info" | "debug" | "trace";
        format: "json" | "pretty";
        output: "console" | "file" | "both";
    }, {
        level: "error" | "warn" | "info" | "debug" | "trace";
        format: "json" | "pretty";
        output: "console" | "file" | "both";
    }>;
    security: z.ZodObject<{
        enableAuth: z.ZodBoolean;
        rateLimiting: z.ZodObject<{
            enabled: z.ZodBoolean;
            windowMs: z.ZodNumber;
            maxRequests: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            windowMs: number;
            maxRequests: number;
        }, {
            enabled: boolean;
            windowMs: number;
            maxRequests: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        enableAuth: boolean;
        rateLimiting: {
            enabled: boolean;
            windowMs: number;
            maxRequests: number;
        };
    }, {
        enableAuth: boolean;
        rateLimiting: {
            enabled: boolean;
            windowMs: number;
            maxRequests: number;
        };
    }>;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    description: string;
    port: number;
    host: string;
    environment: "development" | "production" | "test";
    logging: {
        level: "error" | "warn" | "info" | "debug" | "trace";
        format: "json" | "pretty";
        output: "console" | "file" | "both";
    };
    security: {
        enableAuth: boolean;
        rateLimiting: {
            enabled: boolean;
            windowMs: number;
            maxRequests: number;
        };
    };
}, {
    name: string;
    version: string;
    description: string;
    port: number;
    host: string;
    environment: "development" | "production" | "test";
    logging: {
        level: "error" | "warn" | "info" | "debug" | "trace";
        format: "json" | "pretty";
        output: "console" | "file" | "both";
    };
    security: {
        enableAuth: boolean;
        rateLimiting: {
            enabled: boolean;
            windowMs: number;
            maxRequests: number;
        };
    };
}>;
/**
 * Tool parameters validation schema
 */
export declare const ToolParametersSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
/**
 * Tool result validation schema
 */
export declare const ToolResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodUnknown>;
    error: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodObject<{
        executionTime: z.ZodNumber;
        timestamp: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        executionTime: number;
        timestamp: string;
    }, {
        executionTime: number;
        timestamp: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    error?: string | undefined;
    data?: unknown;
    metadata?: {
        executionTime: number;
        timestamp: string;
    } | undefined;
}, {
    success: boolean;
    error?: string | undefined;
    data?: unknown;
    metadata?: {
        executionTime: number;
        timestamp: string;
    } | undefined;
}>;
/**
 * Base error class for MCP boilerplate ecosystem
 */
export declare abstract class McpBoilerplateError extends Error {
    abstract readonly code: string;
    abstract readonly statusCode: number;
    readonly timestamp: string;
    readonly context?: Record<string, unknown>;
    constructor(message: string, context?: Record<string, unknown>);
}
/**
 * Server configuration error
 */
export declare class ServerConfigError extends McpBoilerplateError {
    readonly code = "SERVER_CONFIG_ERROR";
    readonly statusCode = 500;
}
/**
 * Tool execution error
 */
export declare class ToolExecutionError extends McpBoilerplateError {
    readonly code = "TOOL_EXECUTION_ERROR";
    readonly statusCode = 400;
}
/**
 * Authentication error
 */
export declare class AuthenticationError extends McpBoilerplateError {
    readonly code = "AUTHENTICATION_ERROR";
    readonly statusCode = 401;
}
/**
 * Authorization error
 */
export declare class AuthorizationError extends McpBoilerplateError {
    readonly code = "AUTHORIZATION_ERROR";
    readonly statusCode = 403;
}
/**
 * Database error
 */
export declare class DatabaseError extends McpBoilerplateError {
    readonly code = "DATABASE_ERROR";
    readonly statusCode = 500;
}
/**
 * External API error
 */
export declare class ExternalApiError extends McpBoilerplateError {
    readonly code = "EXTERNAL_API_ERROR";
    readonly statusCode = 502;
}
/**
 * Validation error
 */
export declare class ValidationError extends McpBoilerplateError {
    readonly code = "VALIDATION_ERROR";
    readonly statusCode = 400;
}
/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
/**
 * Make specified properties required
 */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
/**
 * Omit null and undefined from union type
 */
export type NonNullable<T> = T extends null | undefined ? never : T;
/**
 * Extract promise type
 */
export type PromiseType<T> = T extends Promise<infer U> ? U : T;
/**
 * Function with async result
 */
export type AsyncFunction<T extends unknown[], R> = (...args: T) => Promise<R>;
/**
 * Configuration with environment overrides
 */
export type ConfigWithEnv<T> = T & {
    readonly [K in keyof T as `${string & K}_ENV`]?: string;
};
/**
 * Server builder interface for fluent API
 */
export interface ServerBuilder {
    withConfig(config: Partial<McpServerConfig>): ServerBuilder;
    withTool(tool: McpTool): ServerBuilder;
    withTools(tools: McpTool[]): ServerBuilder;
    withAuth(auth: AuthConfig): ServerBuilder;
    withDatabase(db: DatabaseConfig): ServerBuilder;
    withExternalApi(api: ApiConfig): ServerBuilder;
    build(): Promise<McpServer>;
}
/**
 * Main server interface
 */
export interface McpServer {
    readonly config: McpServerConfig;
    readonly tools: ReadonlyMap<string, McpTool>;
    readonly stats: ServerStats;
    start(): Promise<void>;
    stop(): Promise<void>;
    restart(): Promise<void>;
    getHealth(): Promise<HealthCheckResult>;
    getTool(name: string): McpTool | undefined;
    listTools(): McpTool[];
    executeWorkflow(workflow: Workflow): Promise<WorkflowExecution>;
}
/**
 * Server events
 */
export type ServerEvent = 'server:started' | 'server:stopped' | 'server:error' | 'tool:executed' | 'tool:error' | 'workflow:started' | 'workflow:completed' | 'workflow:failed';
/**
 * Event payload interface
 */
export interface EventPayload {
    readonly type: ServerEvent;
    readonly timestamp: string;
    readonly serverId: string;
    readonly data?: Record<string, unknown>;
    readonly error?: string;
}
/**
 * Event listener function
 */
export type EventListener = (payload: EventPayload) => void | Promise<void>;
/**
 * HTTP transport configuration
 */
export interface HttpTransportConfig {
    readonly port: number;
    readonly host: string;
    readonly basePath: string;
    readonly cors: CorsConfig;
    readonly auth?: HttpAuthConfig;
    readonly rateLimit?: RateLimitConfig;
    readonly security: HttpSecurityConfig;
    readonly swagger?: SwaggerConfig;
}
/**
 * Configuration for HTTP MCP Server
 */
export interface HttpMcpServerConfig extends McpServerConfig {
    readonly http: HttpTransportConfig;
    readonly enableStdio: boolean;
    readonly primaryTransport: 'stdio' | 'http';
}
/**
 * CORS configuration
 */
export interface CorsConfig {
    readonly enabled: boolean;
    readonly origins: string[];
    readonly methods: string[];
    readonly allowedHeaders: string[];
    readonly credentials: boolean;
}
/**
 * HTTP Authentication configuration
 */
export interface HttpAuthConfig {
    readonly enabled: boolean;
    readonly type: 'apikey' | 'jwt' | 'bearer' | 'basic';
    readonly apiKeys?: string[];
    readonly jwtSecret?: string;
    readonly jwtExpiration?: string;
    readonly headerName?: string;
}
/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
    readonly enabled: boolean;
    readonly windowMs: number;
    readonly maxRequests: number;
    readonly message?: string;
    readonly skipSuccessfulRequests?: boolean;
}
/**
 * HTTP security configuration
 */
export interface HttpSecurityConfig {
    readonly helmet: boolean;
    readonly trustProxy: boolean;
    readonly requestSizeLimit: string;
    readonly timeout: number;
}
/**
 * Swagger/OpenAPI configuration
 */
export interface SwaggerConfig {
    readonly enabled: boolean;
    readonly path: string;
    readonly title: string;
    readonly description: string;
    readonly version: string;
    readonly contact?: {
        name: string;
        email: string;
        url: string;
    };
}
/**
 * HTTP request context
 */
export interface HttpRequestContext {
    readonly method: string;
    readonly url: string;
    readonly headers: Record<string, string>;
    readonly query: Record<string, string>;
    readonly body?: unknown;
    readonly user?: UserContext;
    readonly requestId: string;
    readonly timestamp: string;
}
/**
 * HTTP response interface
 */
export interface HttpResponse<T = unknown> {
    readonly statusCode: number;
    readonly headers: Record<string, string>;
    readonly body: T;
    readonly metadata?: {
        readonly requestId: string;
        readonly executionTime: number;
        readonly cacheHit?: boolean;
    };
}
/**
 * Telemetry configuration
 */
export interface TelemetryConfig {
    readonly enabled: boolean;
    readonly endpoint?: string;
    readonly serviceName: string;
    readonly serviceVersion: string;
    readonly traces: {
        readonly enabled: boolean;
        readonly sampleRate: number;
    };
    readonly metrics: {
        readonly enabled: boolean;
        readonly interval: number;
    };
    readonly logs: {
        readonly enabled: boolean;
        readonly correlation: boolean;
    };
}
/**
 * Span context for distributed tracing
 */
export interface SpanContext {
    readonly traceId: string;
    readonly spanId: string;
    readonly parentSpanId?: string;
    readonly baggage?: Record<string, string>;
}
/**
 * Type guard to check if value is McpTool
 */
export declare function isMcpTool(value: unknown): value is McpTool;
/**
 * Type guard to check if value is ToolResult
 */
export declare function isToolResult(value: unknown): value is ToolResult;
/**
 * Type guard to check if error is McpBoilerplateError
 */
export declare function isMcpBoilerplateError(error: unknown): error is McpBoilerplateError;
/**
 * Transport type definitions
 */
export type TransportType = 'stdio' | 'http' | 'sse';
/**
 * Transport health status interface
 */
export interface TransportHealthStatus {
    healthy: boolean;
    transport: TransportType;
    port?: number;
    host?: string;
    uptime?: number;
    requestCount?: number;
    errorCount?: number;
    lastError?: string;
}
/**
 * Default server ports
 */
export declare const DEFAULT_PORTS: {
    readonly NEWS_DATA: 8001;
    readonly TEMPLATE: 8002;
    readonly ANALYTICS: 8003;
    readonly DATABASE: 8004;
    readonly API_GATEWAY: 8005;
    readonly WORKFLOW: 8006;
};
/**
 * Default timeouts (in milliseconds)
 */
export declare const DEFAULT_TIMEOUTS: {
    readonly TOOL_EXECUTION: 30000;
    readonly DATABASE_QUERY: 10000;
    readonly EXTERNAL_API: 15000;
    readonly SERVER_STARTUP: 5000;
    readonly SERVER_SHUTDOWN: 3000;
};
/**
 * Default limits
 */
export declare const DEFAULT_LIMITS: {
    readonly MAX_CONCURRENT_REQUESTS: 100;
    readonly MAX_REQUEST_SIZE: "10mb";
    readonly MAX_RESPONSE_SIZE: "50mb";
    readonly RATE_LIMIT_WINDOW: 60000;
    readonly RATE_LIMIT_MAX_REQUESTS: 1000;
};
/**
 * Environment variables prefix
 */
export declare const ENV_PREFIX: "MCP_BOILERPLATE";
export type { McpServerConfig as Config, McpTool as Tool, McpServer as Server, ToolResult as Result, QueryResult as DbResult, ApiResponse as ApiResult, ServerState as State, ToolCategory as Category, AuthMethod as Auth, };
export { ServerConfigSchema as ConfigSchema, ToolParametersSchema as ParamsSchema, ToolResultSchema as ResultSchema, };
//# sourceMappingURL=index.d.ts.map