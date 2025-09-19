#!/usr/bin/env node

/**
 * @fileoverview Basic MCP Server Template - Simple Working Implementation
 *
 * A minimal, working MCP server based on official TypeScript SDK patterns.
 * This server demonstrates core MCP functionality with 4 example tools.
 *
 * Features:
 * - Official @modelcontextprotocol/sdk integration
 * - 4 example tools: echo, calculator, time, health
 * - Command-line interface with proper error handling
 * - Graceful shutdown and signal handling
 *
 * @author MCP Boilerplate Team
 * @version 1.0.0
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// =============================================================================
// Constants
// =============================================================================

const SERVER_NAME = 'basic-server-template';
const SERVER_VERSION = '1.0.0';
const SERVER_DESCRIPTION = 'Basic MCP server template with example tools';

// =============================================================================
// Tool Implementations
// =============================================================================

/**
 * Echo Tool - Returns the input message with optional prefix
 */
function registerEchoTool(server: McpServer) {
  server.registerTool(
    'echo',
    {
      title: 'Echo Tool',
      description: 'Echoes back the provided message with optional prefix',
      inputSchema: {
        message: z.string().describe('Message to echo back'),
        prefix: z.string().optional().describe('Optional prefix to add'),
      },
    },
    async ({ message, prefix }) => {
      const output = prefix ? `${prefix}: ${message}` : message;
      return {
        content: [
          {
            type: 'text',
            text: output,
          },
        ],
      };
    }
  );
}

/**
 * Calculator Tool - Performs basic arithmetic operations
 */
function registerCalculatorTool(server: McpServer) {
  server.registerTool(
    'calculator',
    {
      title: 'Calculator',
      description: 'Performs basic arithmetic operations (add, subtract, multiply, divide)',
      inputSchema: {
        operation: z
          .enum(['add', 'subtract', 'multiply', 'divide'])
          .describe('Arithmetic operation to perform'),
        a: z.number().describe('First number'),
        b: z.number().describe('Second number'),
      },
    },
    async ({ operation, a, b }) => {
      let result: number;

      switch (operation) {
        case 'add':
          result = a + b;
          break;
        case 'subtract':
          result = a - b;
          break;
        case 'multiply':
          result = a * b;
          break;
        case 'divide':
          if (b === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: 'Error: Division by zero is not allowed',
                },
              ],
              isError: true,
            };
          }
          result = a / b;
          break;
      }

      return {
        content: [
          {
            type: 'text',
            text: `${a} ${operation} ${b} = ${result}`,
          },
        ],
      };
    }
  );
}

/**
 * Time Tool - Returns current time information
 */
function registerTimeTool(server: McpServer) {
  server.registerTool(
    'time',
    {
      title: 'Time Tool',
      description: 'Returns current time information in various formats',
      inputSchema: {
        format: z
          .enum(['iso', 'unix', 'human', 'utc'])
          .optional()
          .describe('Time format (default: iso)'),
        timezone: z.string().optional().describe('Timezone (default: local)'),
      },
    },
    async ({ format = 'iso', timezone }) => {
      const now = new Date();
      let timeString: string;

      switch (format) {
        case 'iso':
          timeString = timezone
            ? new Intl.DateTimeFormat('en-CA', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                timeZoneName: 'short',
              }).format(now)
            : now.toISOString();
          break;
        case 'unix':
          timeString = Math.floor(now.getTime() / 1000).toString();
          break;
        case 'human':
          timeString = timezone
            ? now.toLocaleString('en-US', { timeZone: timezone })
            : now.toLocaleString();
          break;
        case 'utc':
          timeString = now.toUTCString();
          break;
      }

      return {
        content: [
          {
            type: 'text',
            text: `Current time (${format}${timezone ? `, ${timezone}` : ''}): ${timeString}`,
          },
        ],
      };
    }
  );
}

/**
 * Health Tool - Returns server health information
 */
function registerHealthTool(server: McpServer) {
  server.registerTool(
    'health',
    {
      title: 'Health Check',
      description: 'Returns server health and system information',
      inputSchema: {
        includeSystem: z
          .boolean()
          .optional()
          .describe('Include system information (default: false)'),
      },
    },
    async ({ includeSystem = false }) => {
      const startTime = process.hrtime();

      // Basic health check
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: SERVER_VERSION,
        tools: 4,
      };

      // System information (optional)
      const systemInfo = includeSystem
        ? {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            memory: {
              used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
              total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            },
          }
        : null;

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const executionTime = Math.round(seconds * 1000 + nanoseconds / 1000000);

      const response = {
        health,
        ...(systemInfo && { system: systemInfo }),
        executionTime: `${executionTime}ms`,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    }
  );
}

// =============================================================================
// Server Setup
// =============================================================================

/**
 * Create and configure the MCP server
 */
function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Register all tools
  registerEchoTool(server);
  registerCalculatorTool(server);
  registerTimeTool(server);
  registerHealthTool(server);

  return server;
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown(server: McpServer): void {
  const shutdown = async (signal: string) => {
    console.error(`\nReceived ${signal}, shutting down gracefully...`);

    try {
      await server.close();
      console.error('Server stopped successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGHUP', () => shutdown('SIGHUP'));

  process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    process.exit(1);
  });

  process.on('unhandledRejection', reason => {
    console.error('Unhandled promise rejection:', reason);
    process.exit(1);
  });
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Main application entry point
 */
async function main(): Promise<void> {
  try {
    console.error(`🚀 Starting ${SERVER_NAME} v${SERVER_VERSION}`);
    console.error(`📝 ${SERVER_DESCRIPTION}`);
    console.error('🔌 Transport: stdio');
    console.error('📡 Ready to receive MCP requests...\n');

    // Create server
    const server = createServer();

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    console.error('✅ Server connected successfully');
    console.error('💡 Use Ctrl+C to stop the server');
  } catch (error) {
    console.error('💥 Failed to start server:');
    console.error(error instanceof Error ? error.message : String(error));

    if (error instanceof Error && error.stack) {
      console.error('\n🔍 Stack trace:');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// =============================================================================
// Application Bootstrap
// =============================================================================

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Bootstrap error:', error);
    process.exit(1);
  });
}

// Export for testing
export { main, createServer };
