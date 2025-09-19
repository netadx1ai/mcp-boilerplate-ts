/**
 * @fileoverview Main MCP Boilerplate TypeScript Library Index
 *
 * This module provides the main exports for the MCP boilerplate TypeScript ecosystem,
 * including core server classes, transport implementations, types, and utilities.
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */
// Core server exports
export { BaseMcpServer } from './core/server.js';
export { HttpMcpServer } from './transport/http-server.js';
// Transport layer exports
export { HttpTransport, createHttpTransport, HttpTransportFactory, TransportFactory, createTransportConfig, validateTransportConfig, TRANSPORT_TYPES, DEFAULT_HTTP_PORTS, HTTP_STATUS_CODES, HTTP_METHODS, CORS_ORIGINS, AUTH_HEADERS, RATE_LIMIT_WINDOWS, TRANSPORT_PRESETS } from './transport/index.js';
// Utility exports
export { createDefaultConfig, validateConfig } from './utils/config.js';
export { createDefaultLogger } from './utils/logger.js';
export { createMetricsCollector } from './utils/metrics.js';
// Type guards and validators
export { isMcpTool, isToolResult, isMcpBoilerplateError } from './types/index.js';
// Constants
export { DEFAULT_PORTS, DEFAULT_TIMEOUTS, DEFAULT_LIMITS } from './types/index.js';
// Version and metadata
export const VERSION = '0.3.0';
export const LIBRARY_NAME = 'mcp-boilerplate-ts';
export const PROTOCOL_VERSION = '2024-11-05';
/**
 * Library metadata
 */
export const METADATA = {
    name: LIBRARY_NAME,
    version: VERSION,
    protocolVersion: PROTOCOL_VERSION,
    description: 'Production-ready MCP server ecosystem built on official TypeScript SDK',
    homepage: 'https://github.com/netadx1ai/mcp-boilerplate-ts',
    repository: 'git+https://github.com/netadx1ai/mcp-boilerplate-ts.git',
    author: 'MCP Boilerplate Team',
    license: 'MIT',
    engines: {
        node: '>=18.0.0',
        npm: '>=8.0.0'
    },
    keywords: [
        'mcp',
        'model-context-protocol',
        'ai',
        'llm',
        'agents',
        'typescript',
        'server',
        'boilerplate',
        'http',
        'transport'
    ]
};
/**
 * Quick start factory for common use cases
 */
export class McpBoilerplateFactory {
    /**
     * Create a development MCP server with HTTP transport
     */
    static createDevelopmentServer(config) {
        return new HttpMcpServer({
            name: config.name,
            version: '1.0.0',
            description: config.description,
            environment: 'development',
            enableStdio: false,
            primaryTransport: 'http',
            http: {
                port: config.port || 8000,
                host: 'localhost',
                basePath: '/mcp',
                cors: {
                    enabled: true,
                    origins: ['*'],
                    methods: ['GET', 'POST', 'OPTIONS'],
                    allowedHeaders: ['Content-Type', 'Authorization'],
                    credentials: false
                },
                auth: {
                    enabled: false,
                    type: 'apikey',
                    headerName: 'X-API-Key'
                },
                rateLimit: {
                    enabled: false,
                    windowMs: 900000,
                    maxRequests: 100
                },
                security: {
                    helmet: false,
                    trustProxy: false,
                    requestSizeLimit: '10mb',
                    timeout: 30000
                },
                swagger: {
                    enabled: true,
                    path: '/docs',
                    title: `${config.name} API`,
                    description: config.description,
                    version: '1.0.0'
                }
            }
        });
    }
    /**
     * Create a production MCP server with security enabled
     */
    static createProductionServer(config) {
        return new HttpMcpServer({
            name: config.name,
            version: '1.0.0',
            description: config.description,
            environment: 'production',
            enableStdio: false,
            primaryTransport: 'http',
            http: {
                port: config.port || 8080,
                host: '0.0.0.0',
                basePath: '/mcp',
                cors: {
                    enabled: true,
                    origins: [],
                    methods: ['POST'],
                    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
                    credentials: false
                },
                auth: {
                    enabled: true,
                    type: 'apikey',
                    apiKeys: config.apiKeys,
                    headerName: 'X-API-Key'
                },
                rateLimit: {
                    enabled: true,
                    windowMs: 900000,
                    maxRequests: 100,
                    message: 'Too many requests'
                },
                security: {
                    helmet: true,
                    trustProxy: true,
                    requestSizeLimit: '1mb',
                    timeout: 10000
                },
                swagger: {
                    enabled: false,
                    path: '/docs',
                    title: 'MCP Production API',
                    description: 'Model Context Protocol Production Server',
                    version: '1.0.0'
                }
            }
        });
    }
    /**
     * Create a simple HTTP transport for custom use cases
     */
    static createHttpTransport(config) {
        if (config.enableAuth && !config.apiKeys?.length) {
            throw new Error('API keys required when authentication is enabled');
        }
        return new HttpTransport({
            port: config.port || 8000,
            host: config.host || 'localhost',
            basePath: '/mcp',
            auth: config.enableAuth ? {
                enabled: true,
                type: 'apikey',
                apiKeys: config.apiKeys || [],
                headerName: 'X-API-Key'
            } : {
                enabled: false
            }
        });
    }
}
/**
 * Feature flags for conditional functionality
 */
export const FEATURES = {
    HTTP_TRANSPORT: true,
    STDIO_TRANSPORT: true,
    AUTHENTICATION: true,
    RATE_LIMITING: true,
    CORS: true,
    SWAGGER_DOCS: true,
    METRICS: true,
    TELEMETRY: true,
    HEALTH_CHECKS: true
};
/**
 * Environment detection utilities
 */
export const ENVIRONMENT = {
    isDevelopment: () => process.env.NODE_ENV === 'development',
    isProduction: () => process.env.NODE_ENV === 'production',
    isTest: () => process.env.NODE_ENV === 'test',
    getNodeEnv: () => process.env.NODE_ENV || 'development'
};
//# sourceMappingURL=index.js.map