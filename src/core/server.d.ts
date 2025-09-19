/**
 * @fileoverview Core MCP Server Base Implementation
 *
 * This module provides the base server class that integrates with the official
 * @modelcontextprotocol/sdk and provides the foundation for all MCP servers
 * in the boilerplate ecosystem.
 *
 * Key Features:
 * - Official MCP SDK integration
 * - Lifecycle management (start/stop/restart)
 * - Tool registration and execution
 * - Health monitoring and metrics
 * - Event system for observability
 * - Configuration management
 * - Error handling and recovery
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from 'events';
import { McpServer, McpServerConfig, McpTool, ServerState, ServerStats, HealthCheckResult, EventListener } from '../types/index.js';
/**
 * Base MCP Server implementation with official SDK integration
 *
 * This class provides a production-ready foundation for building MCP servers
 * with proper lifecycle management, error handling, and observability.
 *
 * @example
 * ```typescript
 * const server = new BaseMcpServer({
 *   name: 'my-server',
 *   version: '1.0.0',
 *   description: 'My custom MCP server',
 *   port: 8001,
 * });
 *
 * server.registerTool(new MyCustomTool());
 * await server.start();
 * ```
 */
export declare class BaseMcpServer extends EventEmitter implements McpServer {
    private readonly _config;
    private readonly _logger;
    private readonly _tools;
    private readonly _server;
    private readonly _metricsCollector;
    private _state;
    private _startTime?;
    private _requestCount;
    private _errorCount;
    private _lastError?;
    /**
     * Create new MCP server instance
     *
     * @param config - Server configuration
     * @throws {ServerConfigError} When configuration is invalid
     */
    constructor(config: Partial<McpServerConfig>);
    /**
     * Get server configuration
     */
    get config(): McpServerConfig;
    /**
     * Get registered tools (readonly)
     */
    get tools(): ReadonlyMap<string, McpTool>;
    /**
     * Get current server statistics
     */
    get stats(): ServerStats;
    /**
     * Start the MCP server
     *
     * @throws {ServerConfigError} When server cannot be started
     */
    start(): Promise<void>;
    /**
     * Stop the MCP server gracefully
     */
    stop(): Promise<void>;
    /**
     * Restart the server
     */
    restart(): Promise<void>;
    /**
     * Get comprehensive health check
     */
    getHealth(): Promise<HealthCheckResult>;
    /**
     * Register a new tool with the server
     *
     * @param tool - Tool to register
     * @throws {ValidationError} When tool is invalid
     */
    registerTool(tool: McpTool): void;
    /**
     * Register multiple tools
     *
     * @param tools - Array of tools to register
     */
    registerTools(tools: McpTool[]): void;
    /**
     * Get a specific tool by name
     *
     * @param name - Tool name
     * @returns Tool instance or undefined
     */
    getTool(name: string): McpTool | undefined;
    /**
     * List all registered tools
     *
     * @returns Array of all tools
     */
    listTools(): McpTool[];
    /**
     * Execute a workflow (placeholder for workflow server)
     */
    executeWorkflow(): Promise<never>;
    /**
     * Add event listener
     *
     * @param event - Event type to listen for
     * @param listener - Event handler function
     */
    addEventListener(event: string, listener: EventListener): void;
    /**
     * Remove event listener
     *
     * @param event - Event type
     * @param listener - Event handler to remove
     */
    removeEventListener(event: string, listener: EventListener): void;
    /**
     * Initialize MCP SDK request handlers
     */
    private _initializeHandlers;
    /**
     * Set server state and emit events
     *
     * @param newState - New server state
     */
    private _setState;
    /**
     * Emit server event with proper payload structure
     *
     * @param type - Event type
     * @param data - Event data
     */
    private _emit;
    /**
     * Validate tool registration
     *
     * @param tool - Tool to validate
     * @throws {ValidationError} When tool is invalid
     */
    private _validateTool;
    /**
     * Create health check for specific component
     *
     * @param name - Component name
     * @param checkFn - Health check function
     * @returns Health check result
     */
    private _createHealthCheck;
}
/**
 * Server builder for fluent API construction
 *
 * @example
 * ```typescript
 * const server = await new ServerBuilder()
 *   .withConfig({ name: 'my-server', port: 8001 })
 *   .withTool(new MyTool())
 *   .withAuth({ method: 'api-key', required: true })
 *   .build();
 * ```
 */
export declare class ServerBuilder {
    private _config;
    private _tools;
    /**
     * Set server configuration
     *
     * @param config - Partial server configuration
     * @returns Builder instance for chaining
     */
    withConfig(config: Partial<McpServerConfig>): ServerBuilder;
    /**
     * Add a single tool
     *
     * @param tool - Tool to add
     * @returns Builder instance for chaining
     */
    withTool(tool: McpTool): ServerBuilder;
    /**
     * Add multiple tools
     *
     * @param tools - Array of tools to add
     * @returns Builder instance for chaining
     */
    withTools(tools: McpTool[]): ServerBuilder;
    /**
     * Configure authentication (placeholder for future implementation)
     *
     * @param _auth - Authentication configuration
     * @returns Builder instance for chaining
     */
    withAuth(_auth: unknown): ServerBuilder;
    /**
     * Configure database (placeholder for future implementation)
     *
     * @param _db - Database configuration
     * @returns Builder instance for chaining
     */
    withDatabase(_db: unknown): ServerBuilder;
    /**
     * Configure external API (placeholder for future implementation)
     *
     * @param _api - API configuration
     * @returns Builder instance for chaining
     */
    withExternalApi(_api: unknown): ServerBuilder;
    /**
     * Build and configure the server instance
     *
     * @returns Configured MCP server
     * @throws {ServerConfigError} When configuration is invalid
     */
    build(): Promise<McpServer>;
}
/**
 * Create a new server builder instance
 *
 * @returns New ServerBuilder instance
 */
export declare function createServerBuilder(): ServerBuilder;
/**
 * Create a basic MCP server with minimal configuration
 *
 * @param name - Server name
 * @param tools - Tools to register
 * @returns Configured MCP server
 */
export declare function createBasicServer(name: string, tools?: McpTool[]): Promise<McpServer>;
export { BaseMcpServer as Server };
export { ServerBuilder as Builder };
export type { McpServer, McpServerConfig, ServerState, ServerStats, HealthCheckResult };
//# sourceMappingURL=server.d.ts.map