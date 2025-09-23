/**
 * @fileoverview Transport Layer Module Index
 *
 * This module provides the main exports for the MCP transport layer,
 * including HTTP transport, HTTP MCP server, and transport utilities.
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */
export { HttpTransport, createHttpTransport, HttpTransportFactory } from './http.js';
export type { HttpTransportConfig, HttpRequestContext, HttpResponse, HttpAuthConfig, CorsConfig, RateLimitConfig, HttpSecurityConfig, SwaggerConfig, HttpMcpServerConfig, } from '../types/index.js';
export declare const TRANSPORT_TYPES: {
    readonly STDIO: "stdio";
    readonly HTTP: "http";
    readonly SSE: "sse";
};
export type TransportType = (typeof TRANSPORT_TYPES)[keyof typeof TRANSPORT_TYPES];
/**
 * Default ports for different server types
 */
export declare const DEFAULT_HTTP_PORTS: {
    readonly DEVELOPMENT: 8000;
    readonly PRODUCTION: 8080;
    readonly TEST: 8001;
};
/**
 * Common HTTP status codes for MCP operations
 */
export declare const HTTP_STATUS_CODES: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly ACCEPTED: 202;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly METHOD_NOT_ALLOWED: 405;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly TOO_MANY_REQUESTS: 429;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly NOT_IMPLEMENTED: 501;
    readonly BAD_GATEWAY: 502;
    readonly SERVICE_UNAVAILABLE: 503;
    readonly GATEWAY_TIMEOUT: 504;
};
/**
 * HTTP method constants
 */
export declare const HTTP_METHODS: {
    readonly GET: "GET";
    readonly POST: "POST";
    readonly PUT: "PUT";
    readonly PATCH: "PATCH";
    readonly DELETE: "DELETE";
    readonly OPTIONS: "OPTIONS";
    readonly HEAD: "HEAD";
};
/**
 * Common CORS origins for development
 */
export declare const CORS_ORIGINS: {
    readonly LOCALHOST: readonly ["http://localhost:3000", "http://127.0.0.1:3000"];
    readonly DEVELOPMENT: readonly ["http://localhost:*", "http://127.0.0.1:*"];
    readonly ALL: readonly ["*"];
};
/**
 * Default authentication headers
 */
export declare const AUTH_HEADERS: {
    readonly API_KEY: "X-API-Key";
    readonly AUTHORIZATION: "Authorization";
    readonly BEARER: "Bearer";
    readonly BASIC: "Basic";
};
/**
 * Common rate limiting windows
 */
export declare const RATE_LIMIT_WINDOWS: {
    readonly MINUTE: number;
    readonly FIVE_MINUTES: number;
    readonly FIFTEEN_MINUTES: number;
    readonly HOUR: number;
    readonly DAY: number;
};
/**
 * Transport configuration presets
 */
export declare const TRANSPORT_PRESETS: {
    readonly DEVELOPMENT: {
        readonly http: {
            readonly port: 8000;
            readonly host: "localhost";
            readonly basePath: "/mcp";
            readonly cors: {
                readonly enabled: true;
                readonly origins: readonly ["*"];
                readonly methods: readonly ["GET", "POST", "OPTIONS"];
                readonly allowedHeaders: readonly ["Content-Type", "Authorization"];
                readonly credentials: false;
            };
            readonly auth: {
                readonly enabled: false;
            };
            readonly rateLimit: {
                readonly enabled: false;
            };
            readonly security: {
                readonly helmet: false;
                readonly trustProxy: false;
                readonly requestSizeLimit: "10mb";
                readonly timeout: 30000;
            };
            readonly swagger: {
                readonly enabled: true;
                readonly path: "/docs";
                readonly title: "MCP Development API";
                readonly description: "Model Context Protocol Development Server";
                readonly version: "1.0.0";
            };
        };
    };
    readonly PRODUCTION: {
        readonly http: {
            readonly port: 8080;
            readonly host: "0.0.0.0";
            readonly basePath: "/mcp";
            readonly cors: {
                readonly enabled: true;
                readonly origins: readonly [];
                readonly methods: readonly ["POST"];
                readonly allowedHeaders: readonly ["Content-Type", "Authorization", "X-API-Key"];
                readonly credentials: false;
            };
            readonly auth: {
                readonly enabled: true;
                readonly type: "apikey";
                readonly headerName: "X-API-Key";
            };
            readonly rateLimit: {
                readonly enabled: true;
                readonly windowMs: number;
                readonly maxRequests: 100;
            };
            readonly security: {
                readonly helmet: true;
                readonly trustProxy: true;
                readonly requestSizeLimit: "1mb";
                readonly timeout: 10000;
            };
            readonly swagger: {
                readonly enabled: false;
                readonly path: "/docs";
                readonly title: "MCP Production API";
                readonly description: "Model Context Protocol Production Server";
                readonly version: "1.0.0";
            };
        };
    };
};
export { HttpMcpServer, createHttpMcpServer, HttpMcpServerFactory } from './http-server.js';
//# sourceMappingURL=index.d.ts.map