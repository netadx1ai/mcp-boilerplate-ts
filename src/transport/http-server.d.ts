/**
 * @fileoverview HTTP MCP Server Implementation
 *
 * This module provides an HTTP-enabled MCP server that extends the base server
 * with REST API capabilities, maintaining compatibility with the existing
 * stdio transport while adding HTTP transport support.
 *
 * Key Features:
 * - Extends BaseMcpServer with HTTP transport
 * - Dual transport support (stdio + HTTP)
 * - REST API endpoints for tool execution
 * - Health monitoring and metrics
 * - Authentication and security
 * - OpenAPI documentation
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */
import { BaseMcpServer } from '../core/server.js';
import { HttpTransport } from './http.js';
import { McpServerConfig, HttpTransportConfig, ServerState } from '../types/index.js';
/**
 * Configuration for HTTP MCP Server
 */
export interface HttpMcpServerConfig extends McpServerConfig {
    readonly http: HttpTransportConfig;
    readonly enableStdio: boolean;
    readonly primaryTransport: 'stdio' | 'http';
}
/**
 * HTTP-enabled MCP Server extending BaseMcpServer
 *
 * This class provides HTTP transport capabilities while maintaining
 * compatibility with the existing MCP ecosystem and stdio transport.
 */
export declare class HttpMcpServer extends BaseMcpServer {
    private readonly _httpConfig;
    private _httpTransport?;
    private _stdioTransport?;
    private _mcpServer?;
    /**
     * Create new HTTP MCP server instance
     *
     * @param config - Server configuration including HTTP settings
     * @throws {ServerConfigError} When configuration is invalid
     */
    constructor(config: Partial<HttpMcpServerConfig>);
    /**
     * Get HTTP transport configuration
     */
    get httpConfig(): HttpTransportConfig;
    /**
     * Get HTTP transport instance (if started)
     */
    get httpTransport(): HttpTransport | undefined;
    /**
     * Start the server with configured transports
     */
    start(): Promise<void>;
    /**
     * Stop the server and close all transports
     */
    stop(): Promise<void>;
    /**
     * Restart the server
     */
    restart(): Promise<void>;
    /**
     * Get server status including transport information
     */
    getStatus(): {
        state: ServerState;
        uptime: number;
        requestCount: number;
        errorCount: number;
        lastError: string | undefined;
        toolCount: number;
        transports: {
            http: {
                enabled: boolean;
                port: number;
                host: string;
                basePath: string;
                sessionId: string | undefined;
            };
            stdio: {
                enabled: boolean;
            };
        };
        endpoints: {
            health: string;
            info: string;
            rpc: string;
            tools: string;
            docs: string | undefined;
        } | undefined;
    };
    /**
     * Start HTTP transport
     */
    private _startHttpTransport;
    /**
     * Start stdio transport if enabled
     */
    private _startStdioTransport;
    /**
     * Setup MCP SDK handlers
     */
    private _setupMcpHandlers;
    /**
     * Handle HTTP transport messages
     */
    private _handleHttpMessage;
    /**
     * Execute tool with enhanced error handling
     */
    private _executeTool;
    /**
     * Get list of active transports
     */
    private _getActiveTransports;
    /**
     * Access protected members for HTTP server functionality
     */
    private get logger();
    private get requestCount();
    private set requestCount(value);
    private get errorCount();
    private set errorCount(value);
    private get lastError();
    private set lastError(value);
    private get startTime();
    private set startTime(value);
    private setState;
}
/**
 * Create HTTP MCP server with default configuration
 */
export declare function createHttpMcpServer(config?: Partial<HttpMcpServerConfig>): HttpMcpServer;
/**
 * HTTP MCP Server factory for common configurations
 */
export declare class HttpMcpServerFactory {
    /**
     * Create basic HTTP MCP server
     */
    static create(config?: Partial<HttpMcpServerConfig>): HttpMcpServer;
    /**
     * Create HTTP MCP server with authentication
     */
    static createWithAuth(config?: Partial<HttpMcpServerConfig>, apiKeys?: string[]): HttpMcpServer;
    /**
     * Create production-ready HTTP MCP server
     */
    static createProduction(config?: Partial<HttpMcpServerConfig>): HttpMcpServer;
    /**
     * Create development HTTP MCP server
     */
    static createDevelopment(config?: Partial<HttpMcpServerConfig>): HttpMcpServer;
}
//# sourceMappingURL=http-server.d.ts.map