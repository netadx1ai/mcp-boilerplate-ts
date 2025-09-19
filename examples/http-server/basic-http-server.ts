/**
 * @fileoverview Basic HTTP MCP Server Example
 * 
 * This example demonstrates how to create a simple HTTP-enabled MCP server
 * using the HttpMcpServer class with a few sample tools.
 * 
 * Features demonstrated:
 * - HTTP transport setup
 * - Tool registration
 * - Basic authentication
 * - Health monitoring
 * - OpenAPI documentation
 * 
 * Usage:
 *   npm run build
 *   node dist/examples/http-server/basic-http-server.js
 * 
 * Then visit:
 *   http://localhost:8000/mcp/health - Health check
 *   http://localhost:8000/mcp/tools - List tools
 *   http://localhost:8000/docs - API documentation
 * 
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */

import { HttpMcpServer, HttpMcpServerFactory } from '../../src/transport/index.js';
import { McpTool, ToolResult } from '../../src/types/index.js';
import { z } from 'zod';

/**
 * Example Echo Tool - Returns the input message
 */
class EchoTool implements McpTool {
  readonly name = 'echo';
  readonly description = 'Echo back the provided message';
  readonly category = 'content' as const;
  readonly version = '1.0.0';
  readonly parameters = z.object({
    message: z.string().describe('The message to echo back')
  });
  readonly examples = [
    {
      name: 'Simple echo',
      description: 'Echo a simple message',
      parameters: { message: 'Hello, World!' },
      expectedResult: 'Hello, World!'
    }
  ];

  async execute(params: unknown): Promise<ToolResult> {
    try {
      const { message } = this.parameters.parse(params);
      
      return {
        success: true,
        data: {
          echo: message,
          timestamp: new Date().toISOString(),
          length: message.length
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Echo tool error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

/**
 * Example Math Tool - Performs basic arithmetic operations
 */
class MathTool implements McpTool {
  readonly name = 'math';
  readonly description = 'Perform basic mathematical operations';
  readonly category = 'analytics' as const;
  readonly version = '1.0.0';
  readonly parameters = z.object({
    operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('The mathematical operation to perform'),
    a: z.number().describe('First number'),
    b: z.number().describe('Second number')
  });
  readonly examples = [
    {
      name: 'Addition',
      description: 'Add two numbers',
      parameters: { operation: 'add', a: 5, b: 3 },
      expectedResult: 8
    },
    {
      name: 'Division',
      description: 'Divide two numbers',
      parameters: { operation: 'divide', a: 10, b: 2 },
      expectedResult: 5
    }
  ];

  async execute(params: unknown): Promise<ToolResult> {
    try {
      const { operation, a, b } = this.parameters.parse(params);
      
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
            throw new Error('Division by zero is not allowed');
          }
          result = a / b;
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      return {
        success: true,
        data: {
          operation,
          operands: { a, b },
          result,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Math tool error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

/**
 * Example Time Tool - Returns current time information
 */
class TimeTool implements McpTool {
  readonly name = 'time';
  readonly description = 'Get current time information';
  readonly category = 'data' as const;
  readonly version = '1.0.0';
  readonly parameters = z.object({
    timezone: z.string().optional().describe('Timezone (default: UTC)')
  });
  readonly examples = [
    {
      name: 'Current UTC time',
      description: 'Get current time in UTC',
      parameters: {},
      expectedResult: 'Current time information'
    },
    {
      name: 'Time in specific timezone',
      description: 'Get time in a specific timezone',
      parameters: { timezone: 'America/New_York' },
      expectedResult: 'Time in New York timezone'
    }
  ];

  async execute(params: unknown): Promise<ToolResult> {
    try {
      const { timezone } = this.parameters.parse(params);
      
      const now = new Date();
      const utcTime = now.toISOString();
      const localTime = timezone ? 
        now.toLocaleString('en-US', { timeZone: timezone }) :
        now.toUTCString();

      return {
        success: true,
        data: {
          utc: utcTime,
          local: localTime,
          timezone: timezone || 'UTC',
          timestamp: now.getTime(),
          formatted: {
            date: now.toDateString(),
            time: now.toTimeString()
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        error: `Time tool error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

/**
 * Main function to start the HTTP MCP server
 */
async function main() {
  console.log('🚀 Starting Basic HTTP MCP Server...');

  try {
    // Create HTTP MCP server with development configuration
    const server = HttpMcpServerFactory.createDevelopment({
      name: 'basic-http-mcp-server',
      version: '1.0.0',
      description: 'Basic HTTP MCP Server Example',
      http: {
        port: 8000,
        host: 'localhost',
        basePath: '/mcp',
        swagger: {
          enabled: true,
          path: '/docs',
          title: 'Basic MCP Server API',
          description: 'Example HTTP MCP Server with sample tools',
          version: '1.0.0',
          contact: {
            name: 'MCP Team',
            email: 'team@mcp.example.com',
            url: 'https://github.com/netadx1ai/mcp-boilerplate-ts'
          }
        }
      }
    });

    // Register sample tools
    server.registerTool(new EchoTool());
    server.registerTool(new MathTool());
    server.registerTool(new TimeTool());

    // Setup event listeners
    server.on('server:started', (payload) => {
      console.log('✅ Server started successfully:', payload);
      console.log('\n📋 Available endpoints:');
      console.log(`   Health Check: http://localhost:8000/mcp/health`);
      console.log(`   Server Info:  http://localhost:8000/mcp/info`);
      console.log(`   List Tools:   http://localhost:8000/mcp/tools`);
      console.log(`   JSON-RPC:     http://localhost:8000/mcp/rpc`);
      console.log(`   API Docs:     http://localhost:8000/docs`);
      console.log('\n🔧 Example tool usage:');
      console.log(`   curl -X POST http://localhost:8000/mcp/tools/echo -H "Content-Type: application/json" -d '{"message":"Hello HTTP MCP!"}'`);
      console.log(`   curl -X POST http://localhost:8000/mcp/tools/math -H "Content-Type: application/json" -d '{"operation":"add","a":5,"b":3}'`);
      console.log(`   curl http://localhost:8000/mcp/tools/time`);
    });

    server.on('server:stopped', () => {
      console.log('🛑 Server stopped');
    });

    server.on('tool:executed', (payload) => {
      console.log(`🔧 Tool executed: ${payload.name} (${payload.success ? 'success' : 'failed'}) in ${payload.executionTime}ms`);
    });

    server.on('transport:error', (payload) => {
      console.error(`❌ Transport error: ${payload.error}`);
    });

    // Start the server
    await server.start();

    // Graceful shutdown handling
    const shutdown = async () => {
      console.log('\n🛑 Shutting down server...');
      try {
        await server.stop();
        console.log('✅ Server shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Keep the process alive
    console.log('🎯 Server is running. Press Ctrl+C to stop.');

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}

export { main };