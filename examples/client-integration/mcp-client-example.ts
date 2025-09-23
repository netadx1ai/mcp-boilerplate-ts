#!/usr/bin/env node

/**
 * @fileoverview MCP Client Integration Example
 *
 * This example demonstrates how to create a custom MCP client that connects
 * to and interacts with the MCP servers in this boilerplate ecosystem.
 *
 * Features:
 * - Multiple server connections
 * - Tool discovery and execution
 * - Error handling and retries
 * - Performance monitoring
 * - Graceful shutdown
 *
 * @author MCP Boilerplate Team
 * @version 1.0.0
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface ServerConfig {
  name: string;
  command: string;
  args: string[];
  cwd: string;
  description: string;
}

interface ConnectedServer {
  name: string;
  client: Client;
  transport: StdioClientTransport;
  tools: string[];
  connected: boolean;
}

interface ToolResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

// =============================================================================
// Configuration
// =============================================================================

const SERVER_CONFIGS: ServerConfig[] = [
  {
    name: 'news-server',
    command: 'npm',
    args: ['run', 'start', '-w', 'servers/news-data-server'],
    cwd: process.cwd(),
    description: 'News data aggregation and analysis',
  },
  {
    name: 'template-server',
    command: 'npm',
    args: ['run', 'start', '-w', 'servers/template-server'],
    cwd: process.cwd(),
    description: 'Code generation and project scaffolding',
  },
  {
    name: 'analytics-server',
    command: 'npm',
    args: ['run', 'start', '-w', 'servers/analytics-server'],
    cwd: process.cwd(),
    description: 'Data analytics and reporting',
  },
  {
    name: 'basic-template',
    command: 'npm',
    args: ['run', 'start', '-w', 'templates/basic-server-template'],
    cwd: process.cwd(),
    description: 'Basic server template with example tools',
  },
];

// =============================================================================
// MCP Multi-Server Client
// =============================================================================

class McpMultiClient extends EventEmitter {
  private servers = new Map<string, ConnectedServer>();
  private connectionTimeout = 10000; // 10 seconds

  constructor() {
    super();
    this.setupGracefulShutdown();
  }

  /**
   * Connect to all configured servers
   */
  async connectAll(): Promise<void> {
    console.log('🔌 Connecting to MCP servers...\n');

    const connectionPromises = SERVER_CONFIGS.map(config => this.connectToServer(config));

    const results = await Promise.allSettled(connectionPromises);

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`\n📊 Connection Summary: ${successful} successful, ${failed} failed\n`);

    if (successful === 0) {
      throw new Error('Failed to connect to any MCP servers');
    }
  }

  /**
   * Connect to a specific server
   */
  async connectToServer(config: ServerConfig): Promise<void> {
    try {
      console.log(`🔄 Connecting to ${config.name}...`);

      // Create client
      const client = new Client({
        name: 'mcp-multi-client',
        version: '1.0.0',
      });

      // Create transport
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        cwd: config.cwd,
      });

      // Connect with timeout
      const connectionPromise = client.connect(transport);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), this.connectionTimeout)
      );

      await Promise.race([connectionPromise, timeoutPromise]);

      // Get available tools
      const toolsResult = await client.request(
        { method: 'tools/list', params: {} },
        { timeout: 5000 }
      );

      const tools = toolsResult.tools.map((tool: any) => tool.name);

      // Store connection
      this.servers.set(config.name, {
        name: config.name,
        client,
        transport,
        tools,
        connected: true,
      });

      console.log(`✅ Connected to ${config.name} (${tools.length} tools available)`);
      this.emit('serverConnected', { name: config.name, tools });
    } catch (error) {
      console.error(
        `❌ Failed to connect to ${config.name}: ${error instanceof Error ? error.message : String(error)}`
      );
      this.emit('serverError', { name: config.name, error });
    }
  }

  /**
   * List all available tools across all servers
   */
  async listAllTools(): Promise<Record<string, string[]>> {
    const allTools: Record<string, string[]> = {};

    for (const [serverName, server] of this.servers) {
      if (server.connected) {
        allTools[serverName] = server.tools;
      }
    }

    return allTools;
  }

  /**
   * Execute a tool on a specific server
   */
  async executeTool(serverName: string, toolName: string, args: any = {}): Promise<ToolResult> {
    const startTime = Date.now();

    try {
      const server = this.servers.get(serverName);
      if (!server || !server.connected) {
        return {
          success: false,
          error: `Server '${serverName}' not connected`,
          executionTime: Date.now() - startTime,
        };
      }

      if (!server.tools.includes(toolName)) {
        return {
          success: false,
          error: `Tool '${toolName}' not available on server '${serverName}'`,
          executionTime: Date.now() - startTime,
        };
      }

      const result = await server.client.request(
        {
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args,
          },
        },
        { timeout: 30000 }
      );

      return {
        success: true,
        result: result.content,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Get server status
   */
  getServerStatus(): Array<{ name: string; connected: boolean; tools: number }> {
    return Array.from(this.servers.values()).map(server => ({
      name: server.name,
      connected: server.connected,
      tools: server.tools.length,
    }));
  }

  /**
   * Disconnect from all servers
   */
  async disconnectAll(): Promise<void> {
    console.log('\n🔌 Disconnecting from all servers...');

    const disconnectPromises = Array.from(this.servers.values()).map(async server => {
      try {
        await server.client.close();
        console.log(`✅ Disconnected from ${server.name}`);
      } catch (error) {
        console.error(`❌ Error disconnecting from ${server.name}: ${error}`);
      }
    });

    await Promise.allSettled(disconnectPromises);
    this.servers.clear();
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`\n📡 Received ${signal}, shutting down gracefully...`);
      await this.disconnectAll();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGHUP', () => shutdown('SIGHUP'));
  }
}

// =============================================================================
// Example Usage Functions
// =============================================================================

/**
 * Example: News aggregation workflow
 */
async function exampleNewsWorkflow(client: McpMultiClient): Promise<void> {
  console.log('📰 === News Aggregation Workflow ===\n');

  try {
    // 1. Search for news
    console.log('🔍 Searching for tech news...');
    const searchResult = await client.executeTool('news-server', 'search_news', {
      query: 'artificial intelligence',
      limit: 5,
    });

    if (searchResult.success) {
      console.log('✅ News search completed');
      console.log(`⏱️ Execution time: ${searchResult.executionTime}ms`);
    } else {
      console.log(`❌ News search failed: ${searchResult.error}`);
    }

    // 2. Get trending topics
    console.log('\n📈 Getting trending topics...');
    const trendingResult = await client.executeTool('news-server', 'get_trending_news', {
      category: 'technology',
      timeframe: '24h',
    });

    if (trendingResult.success) {
      console.log('✅ Trending topics retrieved');
      console.log(`⏱️ Execution time: ${trendingResult.executionTime}ms`);
    } else {
      console.log(`❌ Trending topics failed: ${trendingResult.error}`);
    }
  } catch (error) {
    console.error('💥 News workflow error:', error);
  }
}

/**
 * Example: Template generation workflow
 */
async function exampleTemplateWorkflow(client: McpMultiClient): Promise<void> {
  console.log('🏗️ === Template Generation Workflow ===\n');

  try {
    // 1. List available templates
    console.log('📋 Listing available templates...');
    const listResult = await client.executeTool('template-server', 'list_templates', {
      category: 'web',
    });

    if (listResult.success) {
      console.log('✅ Templates listed');
      console.log(`⏱️ Execution time: ${listResult.executionTime}ms`);
    } else {
      console.log(`❌ Template listing failed: ${listResult.error}`);
    }

    // 2. Generate a new project
    console.log('\n🎨 Generating React component template...');
    const generateResult = await client.executeTool('template-server', 'generate_template', {
      templateType: 'react-component',
      name: 'UserProfile',
      props: ['userId', 'showAvatar', 'onUpdate'],
      includeTests: true,
    });

    if (generateResult.success) {
      console.log('✅ Template generated');
      console.log(`⏱️ Execution time: ${generateResult.executionTime}ms`);
    } else {
      console.log(`❌ Template generation failed: ${generateResult.error}`);
    }
  } catch (error) {
    console.error('💥 Template workflow error:', error);
  }
}

/**
 * Example: Analytics workflow
 */
async function exampleAnalyticsWorkflow(client: McpMultiClient): Promise<void> {
  console.log('📊 === Analytics Workflow ===\n');

  try {
    // 1. Track events
    console.log('📝 Tracking user events...');
    const trackResult = await client.executeTool('analytics-server', 'track_event', {
      eventType: 'user_action',
      properties: {
        action: 'button_click',
        component: 'header_cta',
        userId: 'user_123',
      },
      timestamp: new Date().toISOString(),
    });

    if (trackResult.success) {
      console.log('✅ Event tracked');
      console.log(`⏱️ Execution time: ${trackResult.executionTime}ms`);
    } else {
      console.log(`❌ Event tracking failed: ${trackResult.error}`);
    }

    // 2. Query analytics data
    console.log('\n📈 Querying analytics data...');
    const queryResult = await client.executeTool('analytics-server', 'query_analytics', {
      metric: 'user_engagement',
      timeRange: '7d',
      groupBy: 'day',
      filters: {
        eventType: 'user_action',
      },
    });

    if (queryResult.success) {
      console.log('✅ Analytics query completed');
      console.log(`⏱️ Execution time: ${queryResult.executionTime}ms`);
    } else {
      console.log(`❌ Analytics query failed: ${queryResult.error}`);
    }
  } catch (error) {
    console.error('💥 Analytics workflow error:', error);
  }
}

/**
 * Example: Basic tools workflow
 */
async function exampleBasicWorkflow(client: McpMultiClient): Promise<void> {
  console.log('🔧 === Basic Tools Workflow ===\n');

  try {
    // 1. Echo tool
    console.log('💬 Testing echo tool...');
    const echoResult = await client.executeTool('basic-template', 'echo', {
      message: 'Hello MCP!',
      prefix: 'Client says',
    });

    if (echoResult.success) {
      console.log('✅ Echo tool worked');
      console.log(`⏱️ Execution time: ${echoResult.executionTime}ms`);
    } else {
      console.log(`❌ Echo tool failed: ${echoResult.error}`);
    }

    // 2. Calculator tool
    console.log('\n🧮 Testing calculator...');
    const calcResult = await client.executeTool('basic-template', 'calculator', {
      operation: 'multiply',
      a: 42,
      b: 7,
    });

    if (calcResult.success) {
      console.log('✅ Calculator worked');
      console.log(`⏱️ Execution time: ${calcResult.executionTime}ms`);
    } else {
      console.log(`❌ Calculator failed: ${calcResult.error}`);
    }

    // 3. Health check
    console.log('\n🏥 Checking server health...');
    const healthResult = await client.executeTool('basic-template', 'health', {
      includeSystem: true,
    });

    if (healthResult.success) {
      console.log('✅ Health check completed');
      console.log(`⏱️ Execution time: ${healthResult.executionTime}ms`);
    } else {
      console.log(`❌ Health check failed: ${healthResult.error}`);
    }
  } catch (error) {
    console.error('💥 Basic workflow error:', error);
  }
}

/**
 * Interactive server explorer
 */
async function exploreServers(client: McpMultiClient): Promise<void> {
  console.log('🔍 === Server Explorer ===\n');

  const servers = client.getServerStatus();

  for (const server of servers) {
    if (server.connected) {
      console.log(`\n📡 Server: ${server.name}`);
      console.log(`🛠️ Tools available: ${server.tools}`);

      try {
        // Get server status if available
        const statusResult = await client.executeTool(server.name, 'get_server_status', {
          includeSystem: false,
        });

        if (statusResult.success) {
          console.log('✅ Server status retrieved');
        }
      } catch (error) {
        console.log('ℹ️ Server status tool not available');
      }
    } else {
      console.log(`\n❌ Server: ${server.name} - Not connected`);
    }
  }
}

/**
 * Performance testing across multiple servers
 */
async function performanceTest(client: McpMultiClient): Promise<void> {
  console.log('⚡ === Performance Testing ===\n');

  const testCases = [
    { server: 'basic-template', tool: 'echo', args: { message: 'performance test' } },
    { server: 'basic-template', tool: 'calculator', args: { operation: 'add', a: 100, b: 200 } },
    { server: 'basic-template', tool: 'time', args: { format: 'iso' } },
    { server: 'news-server', tool: 'get_news_status', args: {} },
    { server: 'template-server', tool: 'get_server_status', args: {} },
    { server: 'analytics-server', tool: 'get_server_status', args: {} },
  ];

  const results: Array<{ test: string; success: boolean; time: number }> = [];

  for (const testCase of testCases) {
    const testName = `${testCase.server}:${testCase.tool}`;
    console.log(`🧪 Testing ${testName}...`);

    const result = await client.executeTool(testCase.server, testCase.tool, testCase.args);
    results.push({
      test: testName,
      success: result.success,
      time: result.executionTime,
    });

    if (result.success) {
      console.log(`  ✅ ${testName}: ${result.executionTime}ms`);
    } else {
      console.log(`  ❌ ${testName}: ${result.error}`);
    }
  }

  // Performance summary
  const successful = results.filter(r => r.success);
  const avgTime =
    successful.length > 0
      ? Math.round(successful.reduce((sum, r) => sum + r.time, 0) / successful.length)
      : 0;

  console.log(`\n📊 Performance Summary:`);
  console.log(`   Successful: ${successful.length}/${results.length}`);
  console.log(`   Average response time: ${avgTime}ms`);
  console.log(`   Fastest: ${Math.min(...successful.map(r => r.time))}ms`);
  console.log(`   Slowest: ${Math.max(...successful.map(r => r.time))}ms`);
}

/**
 * Error handling and retry example
 */
async function errorHandlingExample(client: McpMultiClient): Promise<void> {
  console.log('🚨 === Error Handling Example ===\n');

  // Test with invalid server
  console.log('🧪 Testing with invalid server...');
  const invalidResult = await client.executeTool('nonexistent-server', 'some_tool', {});
  console.log(`Expected error: ${invalidResult.error}\n`);

  // Test with invalid tool
  console.log('🧪 Testing with invalid tool...');
  const invalidToolResult = await client.executeTool('basic-template', 'nonexistent_tool', {});
  console.log(`Expected error: ${invalidToolResult.error}\n`);

  // Test with invalid arguments
  console.log('🧪 Testing with invalid arguments...');
  const invalidArgsResult = await client.executeTool('basic-template', 'calculator', {
    operation: 'divide',
    a: 10,
    b: 0, // Division by zero
  });

  if (invalidArgsResult.success) {
    console.log('✅ Tool handled error gracefully');
  } else {
    console.log(`Expected error handling: ${invalidArgsResult.error}`);
  }
}

// =============================================================================
// Main Application
// =============================================================================

/**
 * Main demonstration function
 */
async function runDemo(): Promise<void> {
  const client = new McpMultiClient();

  try {
    console.log('🚀 MCP Multi-Client Demo Starting\n');
    console.log('='.repeat(60));

    // Connect to all servers
    await client.connectAll();

    // Show available tools
    console.log('🛠️ === Available Tools ===\n');
    const allTools = await client.listAllTools();
    for (const [serverName, tools] of Object.entries(allTools)) {
      console.log(`📡 ${serverName}: ${tools.join(', ')}`);
    }
    console.log();

    // Run example workflows
    await exampleBasicWorkflow(client);
    await exampleNewsWorkflow(client);
    await exampleTemplateWorkflow(client);
    await exampleAnalyticsWorkflow(client);

    // Explore servers
    await exploreServers(client);

    // Performance testing
    await performanceTest(client);

    // Error handling examples
    await errorHandlingExample(client);

    console.log('\n🎉 Demo completed successfully!');
    console.log('💡 Press Ctrl+C to exit or wait 30 seconds for auto-shutdown');

    // Auto-shutdown after 30 seconds
    setTimeout(async () => {
      console.log('\n⏰ Auto-shutdown triggered');
      await client.disconnectAll();
      process.exit(0);
    }, 30000);
  } catch (error) {
    console.error('\n💥 Demo failed:', error);
    await client.disconnectAll();
    process.exit(1);
  }
}

/**
 * Interactive mode for manual testing
 */
async function interactiveMode(): Promise<void> {
  const client = new McpMultiClient();

  try {
    console.log('🎮 Interactive MCP Client Mode\n');
    await client.connectAll();

    console.log('\nCommands:');
    console.log('  tools [server]     - List tools for server');
    console.log('  call <server> <tool> <args> - Execute tool');
    console.log('  status             - Show server status');
    console.log('  help               - Show this help');
    console.log('  exit               - Disconnect and exit\n');

    // Note: In a real interactive implementation, you would use readline
    // For this example, we'll just show the structure
    console.log('💡 Interactive mode structure implemented');
    console.log('📝 To make fully interactive, integrate with readline for user input');

    // Simulate some interactive usage
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n🔄 Interactive session ending...');
    await client.disconnectAll();
  } catch (error) {
    console.error('💥 Interactive mode error:', error);
    await client.disconnectAll();
    process.exit(1);
  }
}

// =============================================================================
// CLI Entry Point
// =============================================================================

/**
 * Parse command line arguments and run appropriate mode
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mode = args[0] || 'demo';

  switch (mode) {
    case 'demo':
      await runDemo();
      break;

    case 'interactive':
      await interactiveMode();
      break;

    case 'help':
      console.log('MCP Multi-Client Example\n');
      console.log('Usage: npm run client [mode]\n');
      console.log('Modes:');
      console.log('  demo         - Run comprehensive demo (default)');
      console.log('  interactive  - Interactive mode for manual testing');
      console.log('  help         - Show this help\n');
      console.log('Examples:');
      console.log('  npm run client');
      console.log('  npm run client demo');
      console.log('  npm run client interactive');
      break;

    default:
      console.error(`Unknown mode: ${mode}`);
      console.error('Use "help" for usage information');
      process.exit(1);
  }
}

// =============================================================================
// Bootstrap
// =============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Application error:', error);
    process.exit(1);
  });
}

// Export for use as module
export { McpMultiClient, runDemo, interactiveMode };
