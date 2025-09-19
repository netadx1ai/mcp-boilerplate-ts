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
// Core MCP Types (extending official SDK types)
// =============================================================================

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

// =============================================================================
// Tool System Types
// =============================================================================

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
export type ToolCategory = 
  | 'data'
  | 'content'
  | 'analytics'
  | 'database'
  | 'api'
  | 'workflow'
  | 'utility'
  | 'auth'
  | 'template'
  | 'search';

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

// =============================================================================
// Server Lifecycle Types
// =============================================================================

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

// =============================================================================
// Authentication & Authorization Types
// =============================================================================

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

// =============================================================================
// Database & Storage Types
// =============================================================================

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

// =============================================================================
// API Integration Types
// =============================================================================

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

// =============================================================================
// Content & Template Types
// =============================================================================

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

// =============================================================================
// Analytics & Metrics Types
// =============================================================================

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

// =============================================================================
// Workflow & Automation Types
// =============================================================================

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
export abstract class McpBoilerplateError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly timestamp: string;
  readonly context?: Record<string, unknown>;

  constructor(message: string, context?: Record<string, unknown>) {
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
  readonly code = 'SERVER_CONFIG_ERROR';
  readonly statusCode = 500;
}

/**
 * Tool execution error
 */
export class ToolExecutionError extends McpBoilerplateError {
  readonly code = 'TOOL_EXECUTION_ERROR';
  readonly statusCode = 400;
}

/**
 * Authentication error
 */
export class AuthenticationError extends McpBoilerplateError {
  readonly code = 'AUTHENTICATION_ERROR';
  readonly statusCode = 401;
}

/**
 * Authorization error
 */
export class AuthorizationError extends McpBoilerplateError {
  readonly code = 'AUTHORIZATION_ERROR';
  readonly statusCode = 403;
}

/**
 * Database error
 */
export class DatabaseError extends McpBoilerplateError {
  readonly code = 'DATABASE_ERROR';
  readonly statusCode = 500;
}

/**
 * External API error
 */
export class ExternalApiError extends McpBoilerplateError {
  readonly code = 'EXTERNAL_API_ERROR';
  readonly statusCode = 502;
}

/**
 * Validation error
 */
export class ValidationError extends McpBoilerplateError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
}

// =============================================================================
// Utility Types
// =============================================================================

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

// =============================================================================
// Server Implementation Types
// =============================================================================

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

// =============================================================================
// Event System Types
// =============================================================================

/**
 * Server events
 */
export type ServerEvent = 
  | 'server:started'
  | 'server:stopped'
  | 'server:error'
  | 'tool:executed'
  | 'tool:error'
  | 'workflow:started'
  | 'workflow:completed'
  | 'workflow:failed';

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

// =============================================================================
// HTTP Transport Types
// =============================================================================

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

// =============================================================================
// Monitoring & Observability Types
// =============================================================================

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

// =============================================================================
// Type Guards & Validators
// =============================================================================

/**
 * Type guard to check if value is McpTool
 */
export function isMcpTool(value: unknown): value is McpTool {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    'description' in value &&
    'execute' in value &&
    typeof (value as McpTool).execute === 'function'
  );
}

/**
 * Type guard to check if value is ToolResult
 */
export function isToolResult(value: unknown): value is ToolResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as ToolResult).success === 'boolean'
  );
}

/**
 * Type guard to check if error is McpBoilerplateError
 */
export function isMcpBoilerplateError(error: unknown): error is McpBoilerplateError {
  return error instanceof McpBoilerplateError;
}

// =============================================================================
// Constants
// =============================================================================

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
export const DEFAULT_PORTS = {
  NEWS_DATA: 8001,
  TEMPLATE: 8002,
  ANALYTICS: 8003,
  DATABASE: 8004,
  API_GATEWAY: 8005,
  WORKFLOW: 8006,
} as const;

/**
 * Default timeouts (in milliseconds)
 */
export const DEFAULT_TIMEOUTS = {
  TOOL_EXECUTION: 30000,
  DATABASE_QUERY: 10000,
  EXTERNAL_API: 15000,
  SERVER_STARTUP: 5000,
  SERVER_SHUTDOWN: 3000,
} as const;

/**
 * Default limits
 */
export const DEFAULT_LIMITS = {
  MAX_CONCURRENT_REQUESTS: 100,
  MAX_REQUEST_SIZE: '10mb',
  MAX_RESPONSE_SIZE: '50mb',
  RATE_LIMIT_WINDOW: 60000, // 1 minute
  RATE_LIMIT_MAX_REQUESTS: 1000,
} as const;

/**
 * Environment variables prefix
 */
export const ENV_PREFIX = 'MCP_BOILERPLATE' as const;

// =============================================================================
// Re-exports for convenience
// =============================================================================

export type {
  // Core
  McpServerConfig as Config,
  McpTool as Tool,
  McpServer as Server,
  
  // Results
  ToolResult as Result,
  QueryResult as DbResult,
  ApiResponse as ApiResult,
  
  // Common
  ServerState as State,
  ToolCategory as Category,
  AuthMethod as Auth,
};

// Export validation schemas
export {
  ServerConfigSchema as ConfigSchema,
  ToolParametersSchema as ParamsSchema,
  ToolResultSchema as ResultSchema,
};