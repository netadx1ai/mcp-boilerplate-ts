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
export { BaseMcpServer, ServerBuilder, createServerBuilder, createBasicServer, BaseMcpServer as Server, ServerBuilder as Builder, } from './server.js';
export type { McpServer, McpServerConfig, ServerState, ServerStats, HealthCheckResult, } from '../types/index.js';
export { createDefaultConfig, loadCompleteConfig, validateConfig, isDevelopment, isProduction, isTest, } from '../utils/config.js';
export { createDefaultLogger, createRequestLogger, createToolLogger, } from '../utils/logger.js';
export { createMetricsCollector, } from '../utils/metrics.js';
/**
 * Create a development server with sensible defaults
 *
 * @param name - Server name
 * @param tools - Tools to register
 * @returns Development-configured MCP server
 */
export declare function createDevServer(name: string, tools?: any[]): Promise<any>;
/**
 * Create a production server with security defaults
 *
 * @param name - Server name
 * @param tools - Tools to register
 * @returns Production-configured MCP server
 */
export declare function createProdServer(name: string, tools?: any[]): Promise<any>;
/**
 * Create a test server with minimal configuration
 *
 * @param name - Server name
 * @param tools - Tools to register
 * @returns Test-configured MCP server
 */
export declare function createTestServer(name: string, tools?: any[]): Promise<any>;
//# sourceMappingURL=index.d.ts.map