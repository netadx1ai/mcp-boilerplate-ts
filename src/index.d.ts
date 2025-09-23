/**
 * @fileoverview Main MCP Boilerplate TypeScript Library Index
 *
 * This module provides the main exports for the MCP boilerplate TypeScript ecosystem,
 * including core server classes, transport implementations, types, and utilities.
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */
export { BaseMcpServer } from './core/server.js';
export { HttpTransport, createHttpTransport, HttpTransportFactory, HttpMcpServer, createHttpMcpServer, HttpMcpServerFactory, TRANSPORT_TYPES, DEFAULT_HTTP_PORTS, HTTP_STATUS_CODES, HTTP_METHODS, CORS_ORIGINS, AUTH_HEADERS, RATE_LIMIT_WINDOWS, TRANSPORT_PRESETS, } from './transport/index.js';
export type { McpServer, McpServerConfig, McpTool, ToolResult, ToolExample, ToolCategory, ServerState, ServerStats, HealthCheckResult, HealthCheck, EventPayload, EventListener, LoggingConfig, SecurityConfig, PerformanceConfig, HttpTransportConfig, HttpMcpServerConfig, HttpRequestContext, HttpResponse, HttpAuthConfig, CorsConfig, RateLimitConfig, HttpSecurityConfig, SwaggerConfig, McpBoilerplateError, ServerConfigError, ToolExecutionError, ValidationError, UserContext, TelemetryConfig, SpanContext, } from './types/index.js';
export { createDefaultConfig, validateConfig } from './utils/config.js';
export { createDefaultLogger } from './utils/logger.js';
export { isMcpTool, isToolResult, isMcpBoilerplateError } from './types/index.js';
export { DEFAULT_PORTS, DEFAULT_TIMEOUTS, DEFAULT_LIMITS } from './types/index.js';
export declare const VERSION = "0.3.0";
export declare const LIBRARY_NAME = "mcp-boilerplate-ts";
export declare const PROTOCOL_VERSION = "2024-11-05";
/**
 * Library metadata
 */
export declare const METADATA: {
    readonly name: "mcp-boilerplate-ts";
    readonly version: "0.3.0";
    readonly protocolVersion: "2024-11-05";
    readonly description: "Production-ready MCP server ecosystem built on official TypeScript SDK";
    readonly homepage: "https://github.com/netadx1ai/mcp-boilerplate-ts";
    readonly repository: "git+https://github.com/netadx1ai/mcp-boilerplate-ts.git";
    readonly author: "MCP Boilerplate Team";
    readonly license: "MIT";
    readonly engines: {
        readonly node: ">=18.0.0";
        readonly npm: ">=8.0.0";
    };
    readonly keywords: readonly ["mcp", "model-context-protocol", "ai", "llm", "agents", "typescript", "server", "boilerplate", "http", "transport"];
};
/**
 * Quick start factory for common use cases
 */
export declare class McpBoilerplateFactory {
    /**
     * Create a development MCP server with HTTP transport
     */
    static createDevelopmentServer(config: {
        name: string;
        description: string;
        port?: number;
    }): any;
    /**
     * Create a production MCP server with security enabled
     */
    static createProductionServer(config: {
        name: string;
        description: string;
        port?: number;
        apiKeys: string[];
    }): any;
    /**
     * Create a simple HTTP transport for custom use cases
     */
    static createHttpTransport(config: {
        port?: number;
        host?: string;
        enableAuth?: boolean;
        apiKeys?: string[];
    }): any;
}
/**
 * Feature flags for conditional functionality
 */
export declare const FEATURES: {
    readonly HTTP_TRANSPORT: true;
    readonly STDIO_TRANSPORT: true;
    readonly AUTHENTICATION: true;
    readonly RATE_LIMITING: true;
    readonly CORS: true;
    readonly SWAGGER_DOCS: true;
    readonly METRICS: true;
    readonly TELEMETRY: true;
    readonly HEALTH_CHECKS: true;
};
/**
 * Environment detection utilities
 */
export declare const ENVIRONMENT: {
    readonly isDevelopment: () => boolean;
    readonly isProduction: () => boolean;
    readonly isTest: () => boolean;
    readonly getNodeEnv: () => string;
};
//# sourceMappingURL=index.d.ts.map