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

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { EventEmitter } from 'events';
import { createLogger, Logger } from 'winston';

import {
  McpServer,
  McpServerConfig,
  McpTool,
  ServerState,
  ServerStats,
  HealthCheckResult,
  HealthCheck,
  EventPayload,
  EventListener,
  ToolResult,
  ServerConfigError,
  ToolExecutionError,
  ValidationError,
  DEFAULT_TIMEOUTS,
  isMcpTool,
  isToolResult,
} from '../types/index.js';
import { createDefaultConfig, validateConfig } from '../utils/config.js';
import { createDefaultLogger } from '../utils/logger.js';
import { createMetricsCollector } from '../utils/metrics.js';

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
export class BaseMcpServer extends EventEmitter implements McpServer {
  private readonly _config: McpServerConfig;
  private readonly _logger: Logger;
  private readonly _tools: Map<string, McpTool>;
  private readonly _server: Server;
  private readonly _metricsCollector: ReturnType<typeof createMetricsCollector>;

  private _state: ServerState = 'stopped';
  private _startTime?: Date;
  private _requestCount = 0;
  private _errorCount = 0;
  private _lastError?: string;

  /**
   * Create new MCP server instance
   *
   * @param config - Server configuration
   * @throws {ServerConfigError} When configuration is invalid
   */
  constructor(config: Partial<McpServerConfig>) {
    super();

    try {
      this._config = validateConfig({ ...createDefaultConfig(), ...config });
    } catch (error) {
      throw new ServerConfigError(
        `Invalid server configuration: ${error instanceof Error ? error.message : String(error)}`
      );
    }

    this._logger = createDefaultLogger(this._config.logging);
    this._tools = new Map();
    this._metricsCollector = createMetricsCollector(this._config.name);

    // Initialize official MCP SDK server
    this._server = new Server(
      {
        name: this._config.name,
        version: this._config.version,
        description: this._config.description,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this._initializeHandlers();
    this._logger.info('MCP Server initialized', {
      name: this._config.name,
      version: this._config.version,
    });
  }

  // =============================================================================
  // Public Interface Implementation
  // =============================================================================

  /**
   * Get server configuration
   */
  get config(): McpServerConfig {
    return { ...this._config };
  }

  /**
   * Get registered tools (readonly)
   */
  get tools(): ReadonlyMap<string, McpTool> {
    return new Map(this._tools);
  }

  /**
   * Get current server statistics
   */
  get stats(): ServerStats {
    const now = Date.now();
    const uptime = this._startTime ? now - this._startTime.getTime() : 0;

    return {
      state: this._state,
      uptime: Math.floor(uptime / 1000), // seconds
      requestCount: this._requestCount,
      errorCount: this._errorCount,
      lastError: this._lastError,
      performance: {
        avgResponseTime: this._metricsCollector.getAverageResponseTime(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: process.cpuUsage().user / 1000, // microseconds to milliseconds
      },
      tools: {
        registered: this._tools.size,
        executions: this._metricsCollector.getToolExecutionCounts(),
      },
    };
  }

  /**
   * Start the MCP server
   *
   * @throws {ServerConfigError} When server cannot be started
   */
  async start(): Promise<void> {
    if (this._state === 'running') {
      this._logger.warn('Server already running');
      return;
    }

    try {
      this._setState('starting');
      this._logger.info('Starting MCP server', { port: this._config.port });

      // Connect to stdio transport (official MCP pattern)
      const transport = new StdioServerTransport();
      await this._server.connect(transport);

      this._startTime = new Date();
      this._setState('running');

      this._emit('server:started', {
        port: this._config.port,
        toolCount: this._tools.size,
      });

      this._logger.info('MCP server started successfully', {
        port: this._config.port,
        toolsRegistered: this._tools.size,
        uptime: 0,
      });
    } catch (error) {
      this._setState('error');
      const errorMessage = error instanceof Error ? error.message : String(error);
      this._lastError = errorMessage;
      this._errorCount++;

      this._emit('server:error', { error: errorMessage });
      this._logger.error('Failed to start server', { error: errorMessage });

      throw new ServerConfigError(`Failed to start server: ${errorMessage}`);
    }
  }

  /**
   * Stop the MCP server gracefully
   */
  async stop(): Promise<void> {
    if (this._state === 'stopped') {
      this._logger.warn('Server already stopped');
      return;
    }

    try {
      this._setState('stopping');
      this._logger.info('Stopping MCP server');

      // Graceful shutdown with timeout
      await Promise.race([
        this._server.close(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Shutdown timeout')), DEFAULT_TIMEOUTS.SERVER_SHUTDOWN)
        ),
      ]);

      this._setState('stopped');
      this._startTime = undefined;

      this._emit('server:stopped', {
        finalStats: this.stats,
      });

      this._logger.info('MCP server stopped successfully');
    } catch (error) {
      this._setState('error');
      const errorMessage = error instanceof Error ? error.message : String(error);
      this._lastError = errorMessage;
      this._errorCount++;

      this._emit('server:error', { error: errorMessage });
      this._logger.error('Error during server shutdown', { error: errorMessage });

      throw new ServerConfigError(`Failed to stop server: ${errorMessage}`);
    }
  }

  /**
   * Restart the server
   */
  async restart(): Promise<void> {
    this._logger.info('Restarting MCP server');
    await this.stop();
    await this.start();
  }

  /**
   * Get comprehensive health check
   */
  async getHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks: Record<string, HealthCheck> = {};

    // Server state check
    checks.server = {
      status: this._state === 'running' ? 'pass' : 'fail',
      message: `Server state: ${this._state}`,
      duration: 0,
    };

    // Memory check
    const memoryUsage = process.memoryUsage();
    const memoryMb = memoryUsage.heapUsed / 1024 / 1024;
    checks.memory = {
      status: memoryMb < 500 ? 'pass' : memoryMb < 1000 ? 'warn' : 'fail',
      message: `Memory usage: ${memoryMb.toFixed(2)} MB`,
      duration: 0,
      metadata: { memoryMb, heapTotal: memoryUsage.heapTotal / 1024 / 1024 },
    };

    // Tools check
    checks.tools = {
      status: this._tools.size > 0 ? 'pass' : 'warn',
      message: `${this._tools.size} tools registered`,
      duration: 0,
      metadata: { toolCount: this._tools.size, toolNames: Array.from(this._tools.keys()) },
    };

    // Response time check
    const avgResponseTime = this._metricsCollector.getAverageResponseTime();
    checks.performance = {
      status: avgResponseTime < 100 ? 'pass' : avgResponseTime < 500 ? 'warn' : 'fail',
      message: `Average response time: ${avgResponseTime.toFixed(2)}ms`,
      duration: 0,
      metadata: { avgResponseTime, requestCount: this._requestCount },
    };

    const overallStatus = Object.values(checks).every(check => check.status === 'pass')
      ? 'healthy'
      : Object.values(checks).some(check => check.status === 'fail')
        ? 'unhealthy'
        : 'degraded';

    return {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
      uptime: this.stats.uptime,
    };
  }

  /**
   * Register a new tool with the server
   *
   * @param tool - Tool to register
   * @throws {ValidationError} When tool is invalid
   */
  registerTool(tool: McpTool): void {
    if (!isMcpTool(tool)) {
      throw new ValidationError('Invalid tool: must implement McpTool interface');
    }

    if (this._tools.has(tool.name)) {
      this._logger.warn('Tool already registered, replacing', { toolName: tool.name });
    }

    this._tools.set(tool.name, tool);
    this._logger.info('Tool registered', {
      toolName: tool.name,
      category: tool.category,
      version: tool.version,
    });
  }

  /**
   * Register multiple tools
   *
   * @param tools - Array of tools to register
   */
  registerTools(tools: McpTool[]): void {
    for (const tool of tools) {
      this.registerTool(tool);
    }
  }

  /**
   * Get a specific tool by name
   *
   * @param name - Tool name
   * @returns Tool instance or undefined
   */
  getTool(name: string): McpTool | undefined {
    return this._tools.get(name);
  }

  /**
   * List all registered tools
   *
   * @returns Array of all tools
   */
  listTools(): McpTool[] {
    return Array.from(this._tools.values());
  }

  /**
   * Execute a workflow (placeholder for workflow server)
   */
  async executeWorkflow(): Promise<never> {
    throw new Error('Workflow execution not implemented in base server');
  }

  // =============================================================================
  // Event System
  // =============================================================================

  /**
   * Add event listener
   *
   * @param event - Event type to listen for
   * @param listener - Event handler function
   */
  addEventListener(event: string, listener: EventListener): void {
    this.on(event, listener);
  }

  /**
   * Remove event listener
   *
   * @param event - Event type
   * @param listener - Event handler to remove
   */
  removeEventListener(event: string, listener: EventListener): void {
    this.off(event, listener);
  }

  // =============================================================================
  // Private Implementation
  // =============================================================================

  /**
   * Initialize MCP SDK request handlers
   */
  private _initializeHandlers(): void {
    // List tools handler
    this._server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this._tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters,
      }));

      this._logger.debug('Listed tools', { toolCount: tools.length });
      return { tools };
    });

    // Call tool handler
    this._server.setRequestHandler(CallToolRequestSchema, async request => {
      const startTime = Date.now();
      this._requestCount++;

      try {
        const { name, arguments: args } = request.params;
        const tool = this._tools.get(name);

        if (!tool) {
          throw new ToolExecutionError(`Tool not found: ${name}`);
        }

        this._logger.debug('Executing tool', { toolName: name, args });

        // Execute tool with timeout
        const result = await Promise.race([
          tool.execute(args ?? {}),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error('Tool execution timeout')),
              DEFAULT_TIMEOUTS.TOOL_EXECUTION
            )
          ),
        ]);

        if (!isToolResult(result)) {
          throw new ToolExecutionError('Tool returned invalid result format');
        }

        const executionTime = Date.now() - startTime;
        this._metricsCollector.recordToolExecution(name, executionTime, result.success);

        this._emit('tool:executed', {
          toolName: name,
          executionTime,
          success: result.success,
        });

        this._logger.info('Tool executed successfully', {
          toolName: name,
          executionTime,
          success: result.success,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const executionTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        this._errorCount++;
        this._lastError = errorMessage;
        this._metricsCollector.recordToolExecution(request.params.name, executionTime, false);

        this._emit('tool:error', {
          toolName: request.params.name,
          error: errorMessage,
          executionTime,
        });

        this._logger.error('Tool execution failed', {
          toolName: request.params.name,
          error: errorMessage,
          executionTime,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: false,
                  error: errorMessage,
                  metadata: {
                    executionTime,
                    timestamp: new Date().toISOString(),
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }
    });

    // Error handler
    this._server.onerror = (error: Error) => {
      this._errorCount++;
      this._lastError = error.message;

      this._emit('server:error', { error: error.message });
      this._logger.error('Server error', { error: error.message, stack: error.stack });
    };
  }

  /**
   * Set server state and emit events
   *
   * @param newState - New server state
   */
  private _setState(newState: ServerState): void {
    const oldState = this._state;
    this._state = newState;

    this._logger.debug('State transition', { from: oldState, to: newState });
    this.emit('stateChange', { from: oldState, to: newState });
  }

  /**
   * Emit server event with proper payload structure
   *
   * @param type - Event type
   * @param data - Event data
   */
  private _emit(type: string, data?: Record<string, unknown>): void {
    const payload: EventPayload = {
      type: type as any,
      timestamp: new Date().toISOString(),
      serverId: this._config.name,
      data,
    };

    this.emit(type, payload);
  }

  /**
   * Validate tool registration
   *
   * @param tool - Tool to validate
   * @throws {ValidationError} When tool is invalid
   */
  private _validateTool(tool: McpTool): void {
    if (!tool.name || typeof tool.name !== 'string') {
      throw new ValidationError('Tool must have a valid name');
    }

    if (!tool.description || typeof tool.description !== 'string') {
      throw new ValidationError('Tool must have a valid description');
    }

    if (typeof tool.execute !== 'function') {
      throw new ValidationError('Tool must have an execute method');
    }

    if (!tool.parameters) {
      throw new ValidationError('Tool must have parameters schema');
    }
  }

  /**
   * Create health check for specific component
   *
   * @param name - Component name
   * @param checkFn - Health check function
   * @returns Health check result
   */
  private async _createHealthCheck(
    name: string,
    checkFn: () => Promise<boolean> | boolean
  ): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const result = await checkFn();
      const duration = Date.now() - startTime;

      return {
        status: result ? 'pass' : 'fail',
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);

      return {
        status: 'fail',
        message,
        duration,
      };
    }
  }
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
export class ServerBuilder {
  private _config: Partial<McpServerConfig> = {};
  private _tools: McpTool[] = [];

  /**
   * Set server configuration
   *
   * @param config - Partial server configuration
   * @returns Builder instance for chaining
   */
  withConfig(config: Partial<McpServerConfig>): ServerBuilder {
    this._config = { ...this._config, ...config };
    return this;
  }

  /**
   * Add a single tool
   *
   * @param tool - Tool to add
   * @returns Builder instance for chaining
   */
  withTool(tool: McpTool): ServerBuilder {
    this._tools.push(tool);
    return this;
  }

  /**
   * Add multiple tools
   *
   * @param tools - Array of tools to add
   * @returns Builder instance for chaining
   */
  withTools(tools: McpTool[]): ServerBuilder {
    this._tools.push(...tools);
    return this;
  }

  /**
   * Configure authentication (placeholder for future implementation)
   *
   * @param _auth - Authentication configuration
   * @returns Builder instance for chaining
   */
  withAuth(_auth: unknown): ServerBuilder {
    // TODO: Implement authentication configuration
    return this;
  }

  /**
   * Configure database (placeholder for future implementation)
   *
   * @param _db - Database configuration
   * @returns Builder instance for chaining
   */
  withDatabase(_db: unknown): ServerBuilder {
    // TODO: Implement database configuration
    return this;
  }

  /**
   * Configure external API (placeholder for future implementation)
   *
   * @param _api - API configuration
   * @returns Builder instance for chaining
   */
  withExternalApi(_api: unknown): ServerBuilder {
    // TODO: Implement external API configuration
    return this;
  }

  /**
   * Build and configure the server instance
   *
   * @returns Configured MCP server
   * @throws {ServerConfigError} When configuration is invalid
   */
  async build(): Promise<McpServer> {
    const server = new BaseMcpServer(this._config);

    // Register all tools
    for (const tool of this._tools) {
      server.registerTool(tool);
    }

    return server;
  }
}

/**
 * Create a new server builder instance
 *
 * @returns New ServerBuilder instance
 */
export function createServerBuilder(): ServerBuilder {
  return new ServerBuilder();
}

/**
 * Create a basic MCP server with minimal configuration
 *
 * @param name - Server name
 * @param tools - Tools to register
 * @returns Configured MCP server
 */
export async function createBasicServer(name: string, tools: McpTool[] = []): Promise<McpServer> {
  return createServerBuilder()
    .withConfig({ name, version: '1.0.0', description: `${name} MCP server` })
    .withTools(tools)
    .build();
}

// =============================================================================
// Re-exports for convenience
// =============================================================================

export { BaseMcpServer as Server };
export { ServerBuilder as Builder };
export type { McpServer, McpServerConfig, ServerState, ServerStats, HealthCheckResult };
