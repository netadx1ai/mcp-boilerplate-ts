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



// Transport layer exports
export {
  HttpTransport,
  createHttpTransport,
  HttpTransportFactory,
  HttpMcpServer,
  createHttpMcpServer,
  HttpMcpServerFactory,
  TRANSPORT_TYPES,
  DEFAULT_HTTP_PORTS,
  HTTP_STATUS_CODES,
  HTTP_METHODS,
  CORS_ORIGINS,
  AUTH_HEADERS,
  RATE_LIMIT_WINDOWS,
  TRANSPORT_PRESETS
} from './transport/index.js';

// Type exports
export type {
  // Core types
  McpServer,
  McpServerConfig,
  McpTool,
  ToolResult,
  ToolExample,
  ToolCategory,
  ServerState,
  ServerStats,
  HealthCheckResult,
  HealthCheck,
  EventPayload,
  EventListener,
  
  // Configuration types
  LoggingConfig,
  SecurityConfig,
  PerformanceConfig,
  
  // HTTP transport types
  HttpTransportConfig,
  HttpMcpServerConfig,
  HttpRequestContext,
  HttpResponse,
  HttpAuthConfig,
  CorsConfig,
  RateLimitConfig,
  HttpSecurityConfig,
  SwaggerConfig,

  
  // Error types
  McpBoilerplateError,
  ServerConfigError,
  ToolExecutionError,
  ValidationError,
  
  // Utility types
  UserContext,
  TelemetryConfig,
  SpanContext
} from './types/index.js';

// Utility exports
export { createDefaultConfig, validateConfig } from './utils/config.js';
export { createDefaultLogger } from './utils/logger.js';

// Type guards and validators
export {
  isMcpTool,
  isToolResult,
  isMcpBoilerplateError
} from './types/index.js';

// Constants
export {
  DEFAULT_PORTS,
  DEFAULT_TIMEOUTS,
  DEFAULT_LIMITS
} from './types/index.js';

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
} as const;

/**
 * Quick start factory for common use cases
 */
export class McpBoilerplateFactory {
  /**
   * Create a development MCP server with HTTP transport
   */
  static createDevelopmentServer(config: {
    name: string;
    description: string;
    port?: number;
  }) {
    const { HttpMcpServerFactory } = require('./transport/http-server.js');
    return HttpMcpServerFactory.createDevelopment({
      name: config.name,
      version: '1.0.0',
      description: config.description,
      http: {
        port: config.port || 8000,
        host: 'localhost',
        basePath: '/mcp'
      }
    });
  }

  /**
   * Create a production MCP server with security enabled
   */
  static createProductionServer(config: {
    name: string;
    description: string;
    port?: number;
    apiKeys: string[];
  }) {
    const { HttpMcpServerFactory } = require('./transport/http-server.js');
    return HttpMcpServerFactory.createWithAuth({
      name: config.name,
      version: '1.0.0',
      description: config.description,
      http: {
        port: config.port || 8080,
        host: '0.0.0.0',
        basePath: '/mcp'
      }
    }, config.apiKeys);
  }

  /**
   * Create a simple HTTP transport for custom use cases
   */
  static createHttpTransport(config: {
    port?: number;
    host?: string;
    enableAuth?: boolean;
    apiKeys?: string[];
  }) {
    const { createHttpTransport } = require('./transport/http.js');
    return createHttpTransport({
      port: config.port || 8000,
      host: config.host || 'localhost',
      basePath: '/mcp',
      auth: config.enableAuth ? {
        enabled: true,
        type: 'apikey',
        apiKeys: config.apiKeys || [],
        headerName: 'X-API-Key'
      } : {
        enabled: false,
        type: 'apikey',
        headerName: 'X-API-Key'
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
} as const;

/**
 * Environment detection utilities
 */
export const ENVIRONMENT = {
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
  isTest: () => process.env.NODE_ENV === 'test',
  getNodeEnv: () => process.env.NODE_ENV || 'development'
} as const;