/**
 * @fileoverview Core Module Index
 *
 * Central export point for all core functionality in the MCP boilerplate
 * TypeScript ecosystem. This module provides easy access to server classes,
 * builders, and core interfaces.
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */

// Core server implementation
export {
  BaseMcpServer,
  ServerBuilder,
  createServerBuilder,
  createBasicServer,
  // Convenience re-exports
  BaseMcpServer as Server,
  ServerBuilder as Builder,
} from './server.js';

// Import for internal use
import { createServerBuilder } from './server.js';

// Core types
export type {
  McpServer,
  McpServerConfig,
  ServerState,
  ServerStats,
  HealthCheckResult,
} from '../types/index.js';

// Utility re-exports for convenience
export {
  createDefaultConfig,
  loadCompleteConfig,
  validateConfig,
  isDevelopment,
  isProduction,
  isTest,
} from '../utils/config.js';

export { createDefaultLogger, createRequestLogger, createToolLogger } from '../utils/logger.js';

export { createMetricsCollector } from '../utils/metrics.js';

// =============================================================================
// Quick Start Factory Functions
// =============================================================================

/**
 * Create a development server with sensible defaults
 *
 * @param name - Server name
 * @param tools - Tools to register
 * @returns Development-configured MCP server
 */
export async function createDevServer(name: string, tools: any[] = []): Promise<any> {
  return createServerBuilder()
    .withConfig({
      name,
      version: '1.0.0',
      description: `${name} development server`,
      environment: 'development',
      logging: {
        level: 'debug',
        format: 'pretty',
        output: 'console',
      },
      security: {
        enableAuth: false,
        rateLimiting: {
          enabled: false,
          windowMs: 60000,
          maxRequests: 10000,
        },
        cors: {
          enabled: true,
          origins: ['*'],
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        },
      },
    })
    .withTools(tools)
    .build();
}

/**
 * Create a production server with security defaults
 *
 * @param name - Server name
 * @param tools - Tools to register
 * @returns Production-configured MCP server
 */
export async function createProdServer(name: string, tools: any[] = []): Promise<any> {
  return createServerBuilder()
    .withConfig({
      name,
      version: '1.0.0',
      description: `${name} production server`,
      environment: 'production',
      logging: {
        level: 'info',
        format: 'json',
        output: 'both',
        file: `logs/${name}.log`,
      },
      security: {
        enableAuth: true,
        rateLimiting: {
          enabled: true,
          windowMs: 60000,
          maxRequests: 100,
        },
        cors: {
          enabled: true,
          origins: [], // Must be configured
          methods: ['GET', 'POST'],
        },
      },
    })
    .withTools(tools)
    .build();
}

/**
 * Create a test server with minimal configuration
 *
 * @param name - Server name
 * @param tools - Tools to register
 * @returns Test-configured MCP server
 */
export async function createTestServer(name: string, tools: any[] = []): Promise<any> {
  return createServerBuilder()
    .withConfig({
      name,
      version: '1.0.0',
      description: `${name} test server`,
      environment: 'test',
      port: 0, // Let system assign port
      logging: {
        level: 'warn',
        format: 'json',
        output: 'console',
      },
      security: {
        enableAuth: false,
        rateLimiting: {
          enabled: false,
          windowMs: 60000,
          maxRequests: 10000,
        },
        cors: {
          enabled: true,
          origins: ['*'],
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        },
      },
      performance: {
        timeout: 5000, // Shorter timeout for tests
        maxConcurrentRequests: 50,
        requestSizeLimit: '1mb',
        caching: {
          enabled: false, // Disable caching for predictable tests
          ttl: 0,
          maxSize: 0,
        },
      },
    })
    .withTools(tools)
    .build();
}
