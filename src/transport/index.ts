/**
 * @fileoverview Transport Layer Module Index
 *
 * This module provides the main exports for the MCP transport layer,
 * including HTTP transport, HTTP MCP server, and transport utilities.
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */

// HTTP Transport exports
export { HttpTransport, createHttpTransport, HttpTransportFactory } from './http.js';

// Re-export transport types from main types
export type {
  // Core types
  HttpTransportConfig,
  HttpRequestContext,
  HttpResponse,
  HttpAuthConfig,
  CorsConfig,
  RateLimitConfig,
  HttpSecurityConfig,
  SwaggerConfig,
  HttpMcpServerConfig,
} from '../types/index.js';

// Transport utilities and constants
export const TRANSPORT_TYPES = {
  STDIO: 'stdio',
  HTTP: 'http',
  SSE: 'sse',
} as const;

export type TransportType = (typeof TRANSPORT_TYPES)[keyof typeof TRANSPORT_TYPES];

/**
 * Default ports for different server types
 */
export const DEFAULT_HTTP_PORTS = {
  DEVELOPMENT: 8000,
  PRODUCTION: 8080,
  TEST: 8001,
} as const;

/**
 * Common HTTP status codes for MCP operations
 */
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

/**
 * HTTP method constants
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD',
} as const;

/**
 * Common CORS origins for development
 */
export const CORS_ORIGINS = {
  LOCALHOST: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  DEVELOPMENT: ['http://localhost:*', 'http://127.0.0.1:*'],
  ALL: ['*'],
} as const;

/**
 * Default authentication headers
 */
export const AUTH_HEADERS = {
  API_KEY: 'X-API-Key',
  AUTHORIZATION: 'Authorization',
  BEARER: 'Bearer',
  BASIC: 'Basic',
} as const;

/**
 * Common rate limiting windows
 */
export const RATE_LIMIT_WINDOWS = {
  MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

/**
 * Transport configuration presets
 */
export const TRANSPORT_PRESETS = {
  DEVELOPMENT: {
    http: {
      port: DEFAULT_HTTP_PORTS.DEVELOPMENT,
      host: 'localhost',
      basePath: '/mcp',
      cors: {
        enabled: true,
        origins: CORS_ORIGINS.ALL,
        methods: [HTTP_METHODS.GET, HTTP_METHODS.POST, HTTP_METHODS.OPTIONS],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false,
      },
      auth: {
        enabled: false,
      },
      rateLimit: {
        enabled: false,
      },
      security: {
        helmet: false,
        trustProxy: false,
        requestSizeLimit: '10mb',
        timeout: 30000,
      },
      swagger: {
        enabled: true,
        path: '/docs',
        title: 'MCP Development API',
        description: 'Model Context Protocol Development Server',
        version: '1.0.0',
      },
    },
  },
  PRODUCTION: {
    http: {
      port: DEFAULT_HTTP_PORTS.PRODUCTION,
      host: '0.0.0.0',
      basePath: '/mcp',
      cors: {
        enabled: true,
        origins: [],
        methods: [HTTP_METHODS.POST],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
        credentials: false,
      },
      auth: {
        enabled: true,
        type: 'apikey' as const,
        headerName: AUTH_HEADERS.API_KEY,
      },
      rateLimit: {
        enabled: true,
        windowMs: RATE_LIMIT_WINDOWS.FIFTEEN_MINUTES,
        maxRequests: 100,
      },
      security: {
        helmet: true,
        trustProxy: true,
        requestSizeLimit: '1mb',
        timeout: 10000,
      },
      swagger: {
        enabled: false,
        path: '/docs',
        title: 'MCP Production API',
        description: 'Model Context Protocol Production Server',
        version: '1.0.0',
      },
    },
  },
} as const;

// HTTP MCP Server exports
export { HttpMcpServer, createHttpMcpServer, HttpMcpServerFactory } from './http-server.js';
