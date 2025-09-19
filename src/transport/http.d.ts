/**
 * @fileoverview HTTP Transport for MCP TypeScript
 *
 * This module provides HTTP transport implementation for the MCP protocol,
 * enabling REST API communication alongside existing stdio transport.
 *
 * Key Features:
 * - JSON-RPC over HTTP POST endpoints
 * - RESTful tool execution endpoints
 * - Authentication middleware (API keys, JWT)
 * - Rate limiting and CORS support
 * - OpenAPI/Swagger documentation
 * - Health check and status endpoints
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */
import { Transport, TransportSendOptions } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage, MessageExtraInfo } from '@modelcontextprotocol/sdk/types.js';
import { HttpTransportConfig, HttpAuthConfig, McpTool } from '../types/index.js';
/**
 * HTTP Transport implementation for MCP protocol
 *
 * Provides REST API endpoints for JSON-RPC communication and tool execution
 */
export declare class HttpTransport implements Transport {
    private readonly _config;
    private readonly _logger;
    private readonly _app;
    private readonly _tools;
    private _server?;
    private _sessionId;
    private _isStarted;
    onclose?: () => void;
    onerror?: (error: Error) => void;
    onmessage?: (message: JSONRPCMessage, extra?: MessageExtraInfo) => void;
    constructor(config?: Partial<HttpTransportConfig>, tools?: Map<string, McpTool>);
    /**
     * Get the session ID for this transport
     */
    get sessionId(): string;
    /**
     * Start the HTTP server and begin processing requests
     */
    start(): Promise<void>;
    /**
     * Send a JSON-RPC message (not applicable for HTTP transport)
     */
    send(message: JSONRPCMessage, options?: TransportSendOptions): Promise<void>;
    /**
     * Close the HTTP server
     */
    close(): Promise<void>;
    /**
     * Setup Express middleware stack
     */
    private _setupMiddleware;
    /**
     * Setup API routes
     */
    private _setupRoutes;
    /**
     * Setup Swagger documentation
     */
    private _setupSwagger;
    /**
     * Setup error handling middleware
     */
    private _setupErrorHandling;
    /**
     * Create request context middleware
     */
    private _createRequestContext;
    /**
     * Authentication middleware
     */
    private _authMiddleware;
    /**
     * Handle health check requests
     *
     * @swagger
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     responses:
     *       200:
     *         description: Server is healthy
     */
    private _handleHealth;
    /**
     * Handle server info requests
     *
     * @swagger
     * /info:
     *   get:
     *     summary: Get server information
     *     responses:
     *       200:
     *         description: Server information
     */
    private _handleInfo;
    /**
     * Handle JSON-RPC requests
     *
     * @swagger
     * /rpc:
     *   post:
     *     summary: JSON-RPC endpoint
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: JSON-RPC response
     */
    private _handleJsonRpc;
    /**
     * Handle list tools requests
     *
     * @swagger
     * /tools:
     *   get:
     *     summary: List available tools
     *     responses:
     *       200:
     *         description: List of available tools
     */
    private _handleListTools;
    /**
     * Handle tool execution requests
     *
     * @swagger
     * /tools/{name}:
     *   post:
     *     summary: Execute a specific tool
     *     parameters:
     *       - name: name
     *         in: path
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Tool execution result
     */
    private _handleExecuteTool;
}
/**
 * Create HTTP transport with default configuration
 */
export declare function createHttpTransport(config?: Partial<HttpTransportConfig>, tools?: Map<string, McpTool>): HttpTransport;
/**
 * HTTP transport factory for easy integration
 */
export declare class HttpTransportFactory {
    static create(config?: Partial<HttpTransportConfig>): HttpTransport;
    static createWithAuth(config: Partial<HttpTransportConfig> | undefined, authConfig: HttpAuthConfig): HttpTransport;
    static createSecure(config?: Partial<HttpTransportConfig>): HttpTransport;
}
//# sourceMappingURL=http.d.ts.map