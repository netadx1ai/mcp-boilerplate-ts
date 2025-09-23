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

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResponse,
} from '@modelcontextprotocol/sdk/types.js';

import { BaseMcpServer } from '../core/server.js';
import { HttpTransport } from './http.js';
import {
  McpServerConfig,
  HttpTransportConfig,
  McpTool,
  ServerState,
  ToolResult,
  ServerConfigError,
  ToolExecutionError,
  HttpAuthConfig,
} from '../types/index.js';

/**
 * Configuration for HTTP MCP Server
 */
export interface HttpMcpServerConfig extends McpServerConfig {
  readonly http: HttpTransportConfig;
  readonly enableStdio: boolean;
  readonly primaryTransport: 'stdio' | 'http';
}

/**
 * Default HTTP MCP Server configuration
 */
const DEFAULT_HTTP_SERVER_CONFIG: Partial<HttpMcpServerConfig> = {
  enableStdio: true,
  primaryTransport: 'http',
  http: {
    port: 8000,
    host: '0.0.0.0',
    basePath: '/mcp',
    cors: {
      enabled: true,
      origins: ['*'],
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      credentials: false,
    },
    auth: {
      enabled: false,
      type: 'apikey' as const,
      headerName: 'X-API-Key',
    },
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000,
      maxRequests: 100,
      message: 'Too many requests from this IP',
    },
    security: {
      helmet: true,
      trustProxy: false,
      requestSizeLimit: '10mb',
      timeout: 30000,
    },
    swagger: {
      enabled: true,
      path: '/docs',
      title: 'MCP Server API',
      description: 'Model Context Protocol REST API',
      version: '1.0.0',
    },
  },
};

/**
 * HTTP-enabled MCP Server extending BaseMcpServer
 *
 * This class provides HTTP transport capabilities while maintaining
 * compatibility with the existing MCP ecosystem and stdio transport.
 */
export class HttpMcpServer extends BaseMcpServer {
  private readonly _httpConfig: HttpMcpServerConfig;
  private _httpTransport?: HttpTransport;
  private _stdioTransport?: StdioServerTransport;
  private _mcpServer?: Server;

  /**
   * Create new HTTP MCP server instance
   *
   * @param config - Server configuration including HTTP settings
   * @throws {ServerConfigError} When configuration is invalid
   */
  constructor(config: Partial<HttpMcpServerConfig>) {
    // Merge with defaults and pass base config to parent
    const mergedConfig = {
      ...DEFAULT_HTTP_SERVER_CONFIG,
      ...config,
      http: {
        ...DEFAULT_HTTP_SERVER_CONFIG.http!,
        ...config.http,
      },
    } as HttpMcpServerConfig;

    super(mergedConfig);
    this._httpConfig = mergedConfig;

    this.logger.info('HTTP MCP Server initialized', {
      name: this._httpConfig.name,
      version: this._httpConfig.version,
      httpPort: this._httpConfig.http.port,
      enableStdio: this._httpConfig.enableStdio,
      primaryTransport: this._httpConfig.primaryTransport,
    });
  }

  /**
   * Get HTTP transport configuration
   */
  get httpConfig(): HttpTransportConfig {
    return { ...this._httpConfig.http };
  }

  /**
   * Get HTTP transport instance (if started)
   */
  get httpTransport(): HttpTransport | undefined {
    return this._httpTransport;
  }

  /**
   * Start the server with configured transports
   */
  async start(): Promise<void> {
    try {
      this.setState('starting');
      this.logger.info('Starting HTTP MCP server');

      // Initialize MCP SDK server
      this._mcpServer = new Server(
        {
          name: this._httpConfig.name,
          version: this._httpConfig.version,
          description: this._httpConfig.description,
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      // Setup MCP handlers
      this._setupMcpHandlers();

      // Start HTTP transport
      await this._startHttpTransport();

      // Start stdio transport if enabled
      if (this._httpConfig.enableStdio) {
        await this._startStdioTransport();
      }

      this.startTime = new Date();
      this.setState('running');

      this.logger.info('HTTP MCP server started successfully', {
        httpPort: this._httpConfig.http.port,
        stdioEnabled: this._httpConfig.enableStdio,
        toolCount: this.stats.tools.registered,
      });

      this.emit('server:started', {
        timestamp: this.startTime.toISOString(),
        transports: this._getActiveTransports(),
      });
    } catch (error) {
      this.setState('error');
      this.lastError = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to start HTTP MCP server', { error: this.lastError });
      throw error;
    }
  }

  /**
   * Stop the server and close all transports
   */
  async stop(): Promise<void> {
    try {
      this.setState('stopping');
      this.logger.info('Stopping HTTP MCP server');

      // Stop HTTP transport
      if (this._httpTransport) {
        await this._httpTransport.close();
        this._httpTransport = undefined;
      }

      // Stop stdio transport
      if (this._stdioTransport) {
        // The MCP SDK handles stdio transport cleanup
        this._stdioTransport = undefined;
      }

      this.setState('stopped');
      this.startTime = undefined;

      this.logger.info('HTTP MCP server stopped');
      this.emit('server:stopped', {
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      this.setState('error');
      this.lastError = error instanceof Error ? error.message : String(error);
      this.logger.error('Error stopping HTTP MCP server', { error: this.lastError });
      throw error;
    }
  }

  /**
   * Restart the server
   */
  async restart(): Promise<void> {
    this.logger.info('Restarting HTTP MCP server');
    await this.stop();
    await this.start();
  }

  /**
   * Get server status including transport information
   */
  getStatus() {
    const baseStatus = this.stats;
    return {
      state: baseStatus.state,
      uptime: baseStatus.uptime,
      requestCount: baseStatus.requestCount,
      errorCount: baseStatus.errorCount,
      lastError: baseStatus.lastError,
      toolCount: baseStatus.tools.registered,
      transports: {
        http: {
          enabled: !!this._httpTransport,
          port: this._httpConfig.http.port,
          host: this._httpConfig.http.host,
          basePath: this._httpConfig.http.basePath,
          sessionId: this._httpTransport?.sessionId,
        },
        stdio: {
          enabled: this._httpConfig.enableStdio && !!this._stdioTransport,
        },
      },
      endpoints: this._httpTransport
        ? {
            health: `http://${this._httpConfig.http.host}:${this._httpConfig.http.port}${this._httpConfig.http.basePath}/health`,
            info: `http://${this._httpConfig.http.host}:${this._httpConfig.http.port}${this._httpConfig.http.basePath}/info`,
            rpc: `http://${this._httpConfig.http.host}:${this._httpConfig.http.port}${this._httpConfig.http.basePath}/rpc`,
            tools: `http://${this._httpConfig.http.host}:${this._httpConfig.http.port}${this._httpConfig.http.basePath}/tools`,
            docs: this._httpConfig.http.swagger?.enabled
              ? `http://${this._httpConfig.http.host}:${this._httpConfig.http.port}${this._httpConfig.http.swagger.path}`
              : undefined,
          }
        : undefined,
    };
  }

  /**
   * Start HTTP transport
   */
  private async _startHttpTransport(): Promise<void> {
    this._httpTransport = new HttpTransport(this._httpConfig.http, new Map(this.tools));

    // Setup HTTP transport message handling
    this._httpTransport.onmessage = async (message, extra) => {
      try {
        await this._handleHttpMessage(message, extra);
      } catch (error) {
        this.logger.error('HTTP message handling error', {
          error: error instanceof Error ? error.message : String(error),
          messageId: (message as any).id,
        });
      }
    };

    this._httpTransport.onerror = error => {
      this.logger.error('HTTP transport error', { error: error.message });
      this.emit('transport:error', {
        transport: 'http',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    };

    this._httpTransport.onclose = () => {
      this.logger.info('HTTP transport closed');
      this.emit('transport:closed', {
        transport: 'http',
        timestamp: new Date().toISOString(),
      });
    };

    await this._httpTransport.start();
    this.logger.info('HTTP transport started', {
      port: this._httpConfig.http.port,
      host: this._httpConfig.http.host,
    });
  }

  /**
   * Start stdio transport if enabled
   */
  private async _startStdioTransport(): Promise<void> {
    if (!this._mcpServer) {
      throw new Error('MCP server not initialized');
    }

    this._stdioTransport = new StdioServerTransport();
    await this._mcpServer.connect(this._stdioTransport);

    this.logger.info('Stdio transport started');
  }

  /**
   * Setup MCP SDK handlers
   */
  private _setupMcpHandlers(): void {
    if (!this._mcpServer) {
      return;
    }

    // List tools handler
    this._mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters,
      }));

      return { tools };
    });

    // Call tool handler
    this._mcpServer.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;
      return await this._executeTool(name, args);
    });
  }

  /**
   * Handle HTTP transport messages
   */
  private async _handleHttpMessage(message: JSONRPCMessage, extra?: any): Promise<void> {
    if (!this._mcpServer || message.jsonrpc !== '2.0') {
      return;
    }

    // Handle different message types
    if ('method' in message) {
      // Request message
      const request = message as JSONRPCRequest;

      try {
        let response: JSONRPCResponse;

        switch (request.method) {
          case 'tools/list':
            const tools = Array.from(this.tools.values()).map(tool => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.parameters,
            }));
            response = {
              jsonrpc: '2.0',
              result: { tools },
              id: request.id,
            };
            break;

          case 'tools/call':
            const { name, arguments: args } = request.params as any;
            const result = await this._executeTool(name, args);
            response = {
              jsonrpc: '2.0',
              result,
              id: request.id,
            };
            break;

          default:
            response = {
              jsonrpc: '2.0',
              error: {
                code: -32601,
                message: 'Method not found',
              },
              id: request.id,
            } as any;
        }

        // Send response (this would be handled by the HTTP transport response mechanism)
        this.logger.debug('JSON-RPC response prepared', {
          method: request.method,
          id: request.id,
        });
      } catch (error) {
        this.logger.error('JSON-RPC request handling error', {
          method: request.method,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Execute tool with enhanced error handling
   */
  private async _executeTool(name: string, args: unknown): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new ToolExecutionError(`Tool '${name}' not found`);
    }

    try {
      this.requestCount++;
      this.logger.debug('Executing tool via HTTP', { name, args });

      const startTime = Date.now();
      const result = await tool.execute(args);
      const executionTime = Date.now() - startTime;

      this.logger.info('Tool executed successfully via HTTP', {
        name,
        success: result.success,
        executionTime,
      });

      this.emit('tool:executed', {
        name,
        success: result.success,
        executionTime,
        transport: 'http',
        timestamp: new Date().toISOString(),
      });

      return {
        content: result.success ? result.data : result.error,
        isError: !result.success,
      };
    } catch (error) {
      this.errorCount++;
      this.lastError = error instanceof Error ? error.message : String(error);

      this.logger.error('Tool execution failed via HTTP', {
        name,
        error: this.lastError,
      });

      this.emit('tool:error', {
        name,
        error: this.lastError,
        transport: 'http',
        timestamp: new Date().toISOString(),
      });

      throw new ToolExecutionError(`Tool execution failed: ${this.lastError}`);
    }
  }

  /**
   * Get list of active transports
   */
  private _getActiveTransports(): string[] {
    const transports: string[] = [];
    if (this._httpTransport) transports.push('http');
    if (this._stdioTransport) transports.push('stdio');
    return transports;
  }

  /**
   * Access protected members for HTTP server functionality
   */

  private get logger() {
    return (this as any)._logger;
  }

  private get requestCount(): number {
    return (this as any)._requestCount;
  }

  private set requestCount(value: number) {
    (this as any)._requestCount = value;
  }

  private get errorCount(): number {
    return (this as any)._errorCount;
  }

  private set errorCount(value: number) {
    (this as any)._errorCount = value;
  }

  private get lastError(): string | undefined {
    return (this as any)._lastError;
  }

  private set lastError(value: string | undefined) {
    (this as any)._lastError = value;
  }

  private get startTime(): Date | undefined {
    return (this as any)._startTime;
  }

  private set startTime(value: Date | undefined) {
    (this as any)._startTime = value;
  }

  private setState(state: ServerState): void {
    (this as any)._state = state;
  }
}

/**
 * Create HTTP MCP server with default configuration
 */
export function createHttpMcpServer(config: Partial<HttpMcpServerConfig> = {}): HttpMcpServer {
  return new HttpMcpServer(config);
}

/**
 * HTTP MCP Server factory for common configurations
 */
export class HttpMcpServerFactory {
  /**
   * Create basic HTTP MCP server
   */
  static create(config: Partial<HttpMcpServerConfig> = {}): HttpMcpServer {
    return new HttpMcpServer(config);
  }

  /**
   * Create HTTP MCP server with authentication
   */
  static createWithAuth(
    config: Partial<HttpMcpServerConfig> = {},
    apiKeys: string[] = []
  ): HttpMcpServer {
    return new HttpMcpServer({
      name: 'mcp-server',
      version: '1.0.0',
      description: 'MCP Server with Authentication',
      ...config,
      http: {
        port: 8000,
        host: '0.0.0.0',
        basePath: '/mcp',
        cors: {
          enabled: true,
          origins: ['*'],
          methods: ['GET', 'POST', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
          credentials: false,
        },
        rateLimit: {
          enabled: true,
          windowMs: 900000,
          maxRequests: 100,
          message: 'Too many requests',
        },
        security: {
          helmet: true,
          trustProxy: false,
          requestSizeLimit: '10mb',
          timeout: 30000,
        },
        swagger: {
          enabled: true,
          path: '/docs',
          title: 'MCP Server API',
          description: 'Model Context Protocol REST API',
          version: '1.0.0',
        },
        ...config.http,
        auth: {
          enabled: true,
          type: 'apikey' as const,
          apiKeys,
          headerName: 'X-API-Key',
        },
      },
    });
  }

  /**
   * Create production-ready HTTP MCP server
   */
  static createProduction(config: Partial<HttpMcpServerConfig> = {}): HttpMcpServer {
    return new HttpMcpServer({
      name: 'mcp-production-server',
      version: '1.0.0',
      description: 'MCP Production Server',
      ...config,
      environment: 'production',
      http: {
        port: 8080,
        host: '0.0.0.0',
        basePath: '/mcp',
        cors: {
          enabled: true,
          origins: [],
          methods: ['POST'],
          allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
          credentials: false,
        },
        rateLimit: {
          enabled: true,
          windowMs: 15 * 60 * 1000,
          maxRequests: 100,
          message: 'Too many requests',
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
        ...config.http,
        auth: {
          enabled: true,
          type: 'apikey' as const,
          apiKeys: process.env.MCP_API_KEYS?.split(',') || [],
          headerName: 'X-API-Key',
        },
      },
    });
  }

  /**
   * Create development HTTP MCP server
   */
  static createDevelopment(config: Partial<HttpMcpServerConfig> = {}): HttpMcpServer {
    return new HttpMcpServer({
      name: 'mcp-development-server',
      version: '1.0.0',
      description: 'MCP Development Server',
      ...config,
      environment: 'development',
      http: {
        port: 8000,
        host: 'localhost',
        basePath: '/mcp',
        cors: {
          enabled: true,
          origins: ['*'],
          methods: ['GET', 'POST', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          credentials: false,
        },
        rateLimit: {
          enabled: false,
          windowMs: 900000,
          maxRequests: 1000,
          message: 'Too many requests',
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
          title: 'MCP Development Server',
          description: 'Model Context Protocol Development API',
          version: '1.0.0',
        },
        ...config.http,
        auth: {
          enabled: false,
          type: 'apikey' as const,
          headerName: 'X-API-Key',
        },
      },
    });
  }
}
