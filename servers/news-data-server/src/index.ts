#!/usr/bin/env node

/**
 * @fileoverview News Data Server - Production MCP Server for News Data
 * 
 * A production-ready MCP server that provides comprehensive news data functionality
 * using the official TypeScript SDK. This server demonstrates real-world MCP server
 * implementation with 5 specialized news tools.
 * 
 * Features:
 * - Official @modelcontextprotocol/sdk integration
 * - 5 news tools: search, category, trending, status, categories
 * - Mock news data with realistic structure
 * - Production error handling and logging
 * - Statistics tracking and performance monitoring
 * 
 * @author MCP Boilerplate Team
 * @version 1.0.0
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// =============================================================================
// Constants and Types
// =============================================================================

const SERVER_NAME = 'news-data-server';
const SERVER_VERSION = '1.0.0';
const SERVER_DESCRIPTION = 'Production MCP server for real-time news data';

interface NewsArticle {
  title: string;
  description?: string;
  url: string;
  source: string;
  publishedAt?: string;
  category?: string;
  country?: string;
  language?: string;
}

interface ServerStats {
  totalRequests: number;
  toolUsage: Record<string, number>;
  startTime: string;
  uptime: number;
}

// Global server statistics
const serverStats: ServerStats = {
  totalRequests: 0,
  toolUsage: {},
  startTime: new Date().toISOString(),
  uptime: 0
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Update server statistics
 */
function updateStats(toolName: string): void {
  serverStats.totalRequests++;
  serverStats.toolUsage[toolName] = (serverStats.toolUsage[toolName] || 0) + 1;
  serverStats.uptime = process.uptime();
}

/**
 * Generate mock news articles for demonstration
 */
function generateMockArticles(query: string, category?: string, limit: number = 10): NewsArticle[] {
  const mockArticles: NewsArticle[] = [
    {
      title: `Breaking: ${query} Developments Unfold`,
      description: `Latest updates on ${query} with comprehensive analysis and expert opinions.`,
      url: `https://news.example.com/breaking/${query.toLowerCase().replace(/\s+/g, '-')}`,
      source: 'Global News Network',
      publishedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      category: category || 'general',
      language: 'en'
    },
    {
      title: `${query}: Market Impact and Analysis`,
      description: `Economic implications of recent ${query} events affecting global markets.`,
      url: `https://finance.example.com/analysis/${query.toLowerCase().replace(/\s+/g, '-')}`,
      source: 'Financial Times',
      publishedAt: new Date(Date.now() - Math.random() * 172800000).toISOString(),
      category: 'business',
      language: 'en'
    },
    {
      title: `Expert Opinion: ${query} Trends`,
      description: `Industry experts weigh in on the latest ${query} developments and future outlook.`,
      url: `https://expert.example.com/opinion/${query.toLowerCase().replace(/\s+/g, '-')}`,
      source: 'Expert Analysis',
      publishedAt: new Date(Date.now() - Math.random() * 259200000).toISOString(),
      category: category || 'analysis',
      language: 'en'
    }
  ];

  // Generate additional articles up to the limit
  while (mockArticles.length < limit && mockArticles.length < 50) {
    const variations = [
      'Update', 'Report', 'Investigation', 'Study', 'Research', 'Interview',
      'Analysis', 'Commentary', 'Review', 'Survey', 'Poll', 'Data'
    ];
    const sources = [
      'Reuters', 'Associated Press', 'BBC News', 'CNN', 'Fox News',
      'The Guardian', 'Wall Street Journal', 'New York Times', 'Washington Post'
    ];
    
    const variation = variations[Math.floor(Math.random() * variations.length)];
    const source = sources[Math.floor(Math.random() * sources.length)];
    
    mockArticles.push({
      title: `${variation}: ${query} Continues to Impact Industry`,
      description: `Detailed ${variation.toLowerCase()} on how ${query} is shaping current events.`,
      url: `https://news.example.com/${variation.toLowerCase()}/${Date.now()}`,
      source: source,
      publishedAt: new Date(Date.now() - Math.random() * 604800000).toISOString(),
      category: category || ['general', 'business', 'technology', 'health', 'sports'][Math.floor(Math.random() * 5)],
      language: 'en'
    });
  }

  return mockArticles.slice(0, limit);
}

/**
 * Format articles for display
 */
function formatArticles(articles: NewsArticle[]): string {
  if (articles.length === 0) {
    return '📰 No articles found matching your criteria.';
  }

  return articles.map((article, index) => {
    const publishedTime = article.publishedAt ? 
      new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : 'Unknown';

    return `**${index + 1}. ${article.title}**
📅 ${publishedTime} | 🏢 ${article.source}${article.category ? ` | 🏷️ ${article.category}` : ''}
📝 ${article.description || 'No description available'}
🔗 ${article.url}`;
  }).join('\n\n');
}

// =============================================================================
// Tool Implementations
// =============================================================================

/**
 * Search News Tool - Search for news articles by query
 */
function registerSearchNewsTool(server: McpServer) {
  server.registerTool(
    'search_news',
    {
      title: 'Search News',
      description: 'Search for news articles by query with language and limit options',
      inputSchema: {
        query: z.string().describe('Search query for news articles'),
        limit: z.number().int().min(1).max(50).optional().default(10).describe('Maximum number of articles to return (1-50, default: 10)'),
        language: z.string().optional().default('en').describe('Language code for articles (default: en)')
      }
    },
    async ({ query, limit = 10, language = 'en' }) => {
      updateStats('search_news');
      
      console.error(`🔍 News search: query='${query}', limit=${limit}, language=${language}`);
      
      const articles = generateMockArticles(query, undefined, limit);
      const formattedResults = formatArticles(articles);

      const summary = `🔍 **News Search Results**

**Query:** ${query}
**Articles Found:** ${articles.length}
**Language:** ${language}

${formattedResults}`;

      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };
    }
  );
}

/**
 * Category News Tool - Get news by category
 */
function registerCategoryNewsTool(server: McpServer) {
  server.registerTool(
    'get_category_news',
    {
      title: 'Get Category News',
      description: 'Get news articles from a specific category',
      inputSchema: {
        category: z.enum(['general', 'business', 'technology', 'health', 'sports', 'entertainment', 'science']).describe('News category to fetch'),
        limit: z.number().int().min(1).max(50).optional().default(10).describe('Maximum number of articles to return (1-50, default: 10)')
      }
    },
    async ({ category, limit = 10 }) => {
      updateStats('get_category_news');
      
      console.error(`📂 Category news: category='${category}', limit=${limit}`);
      
      const articles = generateMockArticles(`${category} news`, category, limit);
      const formattedResults = formatArticles(articles);

      const summary = `📂 **Category News: ${category.toUpperCase()}**

**Articles Found:** ${articles.length}

${formattedResults}`;

      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };
    }
  );
}

/**
 * Trending News Tool - Get trending news by country
 */
function registerTrendingNewsTool(server: McpServer) {
  server.registerTool(
    'get_trending_news',
    {
      title: 'Get Trending News',
      description: 'Get trending news articles by country',
      inputSchema: {
        country: z.string().optional().default('us').describe('Country code for trending news (default: us)'),
        limit: z.number().int().min(1).max(50).optional().default(10).describe('Maximum number of articles to return (1-50, default: 10)')
      }
    },
    async ({ country = 'us', limit = 10 }) => {
      updateStats('get_trending_news');
      
      console.error(`🔥 Trending news: country='${country}', limit=${limit}`);
      
      // Generate trending articles with country-specific content
      const trendingTopics = [
        'Election Updates', 'Technology Breakthrough', 'Economic Policy',
        'Climate Change', 'Healthcare Innovation', 'Sports Championship',
        'Entertainment News', 'Scientific Discovery'
      ];
      
      const randomTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
      const articles = generateMockArticles(`${randomTopic} in ${country.toUpperCase()}`, 'trending', limit);
      
      // Add country-specific metadata
      articles.forEach(article => {
        article.country = country;
        article.category = 'trending';
      });
      
      const formattedResults = formatArticles(articles);

      const summary = `🔥 **Trending News: ${country.toUpperCase()}**

**Articles Found:** ${articles.length}
**Region:** ${country.toUpperCase()}

${formattedResults}`;

      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };
    }
  );
}

/**
 * Server Status Tool - Get server health and statistics
 */
function registerServerStatusTool(server: McpServer) {
  server.registerTool(
    'get_server_status',
    {
      title: 'Server Status',
      description: 'Get news server health status and usage statistics',
      inputSchema: {
        includeStats: z.boolean().optional().default(true).describe('Include detailed usage statistics (default: true)')
      }
    },
    async ({ includeStats = true }) => {
      updateStats('get_server_status');
      
      console.error('📊 Server status requested');
      
      const status = {
        server: SERVER_NAME,
        version: SERVER_VERSION,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        }
      };

      let responseText = `📊 **News Data Server Status**

🟢 **Status:** ${status.status}
⚡ **Version:** ${status.version}
⏱️ **Uptime:** ${Math.round(status.uptime)}s
💾 **Memory:** ${status.memory.used}MB / ${status.memory.total}MB
📅 **Timestamp:** ${status.timestamp}`;

      if (includeStats && serverStats.totalRequests > 0) {
        responseText += `

📈 **Usage Statistics:**
📋 Total Requests: ${serverStats.totalRequests}
🕐 Started: ${serverStats.startTime}

🛠️ **Tool Usage:**`;

        for (const [tool, count] of Object.entries(serverStats.toolUsage)) {
          responseText += `\n   • ${tool}: ${count} calls`;
        }
      }

      return {
        content: [{
          type: 'text',
          text: responseText
        }]
      };
    }
  );
}

/**
 * Categories Tool - List available news categories
 */
function registerCategoriesTool(server: McpServer) {
  server.registerTool(
    'get_categories',
    {
      title: 'Get Categories',
      description: 'List all available news categories with descriptions',
      inputSchema: {
        includeStats: z.boolean().optional().default(false).describe('Include usage statistics per category (default: false)')
      }
    },
    async ({ includeStats = false }) => {
      updateStats('get_categories');
      
      console.error('📂 Categories list requested');
      
      const categories = [
        { name: 'general', description: 'General news and current events', icon: '📰' },
        { name: 'business', description: 'Business, finance, and economic news', icon: '💼' },
        { name: 'technology', description: 'Technology, innovation, and digital trends', icon: '💻' },
        { name: 'health', description: 'Health, medicine, and wellness news', icon: '🏥' },
        { name: 'sports', description: 'Sports news, scores, and athlete updates', icon: '⚽' },
        { name: 'entertainment', description: 'Entertainment, celebrities, and pop culture', icon: '🎬' },
        { name: 'science', description: 'Scientific discoveries and research', icon: '🔬' }
      ];

      let responseText = '📂 **Available News Categories**\n\n';
      
      categories.forEach((cat, index) => {
        responseText += `**${index + 1}. ${cat.icon} ${cat.name.toUpperCase()}**\n`;
        responseText += `   📝 ${cat.description}\n`;
        
        if (includeStats) {
          const usage = serverStats.toolUsage['get_category_news'] || 0;
          responseText += `   📊 Usage: ${usage} requests\n`;
        }
        
        responseText += '\n';
      });

      responseText += `📋 **Total Categories:** ${categories.length}
🛠️ **Usage:** Use \`get_category_news\` tool with any category name
📖 **Example:** get_category_news(category="technology", limit=5)`;

      return {
        content: [{
          type: 'text',
          text: responseText
        }]
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
    version: SERVER_VERSION
  });
  
  // Register all news tools
  registerSearchNewsTool(server);
  registerCategoryNewsTool(server);
  registerTrendingNewsTool(server);
  registerServerStatusTool(server);
  registerCategoriesTool(server);
  
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
      console.error('News data server stopped successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGHUP', () => shutdown('SIGHUP'));
  
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception in news server:', error);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection in news server:', reason);
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
    console.error('📰 Tools: search, category, trending, status, categories');
    console.error('📡 Ready to receive MCP requests...\n');
    
    // Create server
    const server = createServer();
    
    // Setup graceful shutdown
    setupGracefulShutdown(server);
    
    // Create stdio transport
    const transport = new StdioServerTransport();
    
    // Connect server to transport
    await server.connect(transport);
    
    console.error('✅ News data server connected successfully');
    console.error('💡 Available tools:');
    console.error('   • search_news - Search articles by query');
    console.error('   • get_category_news - Get articles by category');
    console.error('   • get_trending_news - Get trending articles by country'); 
    console.error('   • get_server_status - Get server health and stats');
    console.error('   • get_categories - List available categories');
    console.error('💡 Use Ctrl+C to stop the server\n');
    
  } catch (error) {
    console.error('💥 Failed to start news data server:');
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
  main().catch((error) => {
    console.error('💥 Bootstrap error:', error);
    process.exit(1);
  });
}

// Export for testing
export { main, createServer, updateStats, generateMockArticles, formatArticles };
export type { NewsArticle, ServerStats };