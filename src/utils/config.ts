/**
 * @fileoverview Configuration Management Utilities
 *
 * This module provides utilities for loading, validating, and managing
 * configuration for MCP servers in the boilerplate ecosystem.
 *
 * Features:
 * - Environment variable loading with type safety
 * - Configuration validation with Zod schemas
 * - Default configuration generation
 * - Configuration merging and overrides
 * - Environment-specific configurations
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */

import { config } from 'dotenv';
import { z } from 'zod';

import {
  McpServerConfig,
  LoggingConfig,
  SecurityConfig,
  PerformanceConfig,
  ServerConfigError,
  DEFAULT_PORTS,
  DEFAULT_TIMEOUTS,
  DEFAULT_LIMITS,
  ENV_PREFIX,
} from '../types/index.js';

// Load environment variables
config();

// =============================================================================
// Validation Schemas
// =============================================================================

/**
 * Logging configuration schema
 */
export const LoggingConfigSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug', 'trace']).default('info'),
  format: z.enum(['json', 'pretty']).default('pretty'),
  output: z.enum(['console', 'file', 'both']).default('console'),
  file: z.string().optional(),
  maxSize: z.string().default('10MB'),
  maxFiles: z.number().int().positive().default(5),
});

/**
 * Security configuration schema
 */
const SecurityConfigSchema = z.object({
  enableAuth: z.boolean().default(false),
  apiKeys: z.array(z.string()).optional(),
  rateLimiting: z.object({
    enabled: z.boolean().default(true),
    windowMs: z.number().positive().default(DEFAULT_LIMITS.RATE_LIMIT_WINDOW),
    maxRequests: z.number().positive().default(DEFAULT_LIMITS.RATE_LIMIT_MAX_REQUESTS),
  }),
  cors: z.object({
    enabled: z.boolean().default(true),
    origins: z.array(z.string()).default(['*']),
    methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
  }),
});

/**
 * Performance configuration schema
 */
const PerformanceConfigSchema = z.object({
  timeout: z.number().positive().default(DEFAULT_TIMEOUTS.TOOL_EXECUTION),
  maxConcurrentRequests: z.number().positive().default(DEFAULT_LIMITS.MAX_CONCURRENT_REQUESTS),
  requestSizeLimit: z.string().default(DEFAULT_LIMITS.MAX_REQUEST_SIZE),
  caching: z.object({
    enabled: z.boolean().default(true),
    ttl: z.number().positive().default(300000), // 5 minutes
    maxSize: z.number().positive().default(1000),
  }),
});

/**
 * Complete server configuration schema
 */
const ServerConfigSchema = z.object({
  name: z.string().min(1).max(100),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver format'),
  description: z.string().min(1).max(500),
  port: z.number().int().min(1024).max(65535),
  host: z.string().default('localhost'),
  environment: z.enum(['development', 'production', 'test']).default('development'),
  logging: LoggingConfigSchema,
  security: SecurityConfigSchema,
  performance: PerformanceConfigSchema,
});

// =============================================================================
// Default Configuration Factory
// =============================================================================

/**
 * Create default server configuration
 *
 * @param serverName - Optional server name for port assignment
 * @returns Default configuration object
 */
export function createDefaultConfig(serverName?: string): McpServerConfig {
  const port = getDefaultPort(serverName);
  const environment = getEnvironment();

  return {
    name: serverName || 'mcp-server',
    version: '1.0.0',
    description: 'MCP Server built with TypeScript boilerplate',
    port,
    host: 'localhost',
    environment,
    logging: createDefaultLoggingConfig(environment),
    security: createDefaultSecurityConfig(environment),
    performance: createDefaultPerformanceConfig(environment),
  };
}

/**
 * Create default logging configuration based on environment
 *
 * @param environment - Target environment
 * @returns Logging configuration
 */
function createDefaultLoggingConfig(environment: string): LoggingConfig {
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';

  return {
    level: isDevelopment ? 'debug' : isProduction ? 'info' : 'warn',
    format: isDevelopment ? 'pretty' : 'json',
    output: isProduction ? 'both' : 'console',
    file: isProduction ? `logs/${ENV_PREFIX.toLowerCase()}.log` : undefined,
    maxSize: '10MB',
    maxFiles: 5,
  };
}

/**
 * Create default security configuration based on environment
 *
 * @param environment - Target environment
 * @returns Security configuration
 */
function createDefaultSecurityConfig(environment: string): SecurityConfig {
  const isProduction = environment === 'production';

  return {
    enableAuth: isProduction,
    rateLimiting: {
      enabled: true,
      windowMs: DEFAULT_LIMITS.RATE_LIMIT_WINDOW,
      maxRequests: isProduction ? 100 : DEFAULT_LIMITS.RATE_LIMIT_MAX_REQUESTS,
    },
    cors: {
      enabled: true,
      origins: isProduction ? [] : ['*'], // Must be configured in production
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  };
}

/**
 * Create default performance configuration based on environment
 *
 * @param environment - Target environment
 * @returns Performance configuration
 */
function createDefaultPerformanceConfig(environment: string): PerformanceConfig {
  const isProduction = environment === 'production';

  return {
    timeout: DEFAULT_TIMEOUTS.TOOL_EXECUTION,
    maxConcurrentRequests: isProduction ? 200 : DEFAULT_LIMITS.MAX_CONCURRENT_REQUESTS,
    requestSizeLimit: DEFAULT_LIMITS.MAX_REQUEST_SIZE,
    caching: {
      enabled: true,
      ttl: isProduction ? 600000 : 300000, // 10min prod, 5min dev
      maxSize: isProduction ? 5000 : 1000,
    },
  };
}

// =============================================================================
// Environment Utilities
// =============================================================================

/**
 * Get current environment from NODE_ENV or default
 *
 * @returns Environment string
 */
function getEnvironment(): 'development' | 'production' | 'test' {
  const env = process.env.NODE_ENV?.toLowerCase();

  switch (env) {
    case 'production':
    case 'prod':
      return 'production';
    case 'test':
    case 'testing':
      return 'test';
    default:
      return 'development';
  }
}

/**
 * Get default port for server based on name
 *
 * @param serverName - Server name
 * @returns Default port number
 */
function getDefaultPort(serverName?: string): number {
  if (!serverName) return 8000;

  const normalizedName = serverName.toLowerCase().replace(/[-_]/g, '');

  // Map server names to default ports
  if (normalizedName.includes('news') || normalizedName.includes('data')) {
    return DEFAULT_PORTS.NEWS_DATA;
  }
  if (normalizedName.includes('template')) {
    return DEFAULT_PORTS.TEMPLATE;
  }
  if (normalizedName.includes('analytics')) {
    return DEFAULT_PORTS.ANALYTICS;
  }
  if (normalizedName.includes('database') || normalizedName.includes('db')) {
    return DEFAULT_PORTS.DATABASE;
  }
  if (normalizedName.includes('api') || normalizedName.includes('gateway')) {
    return DEFAULT_PORTS.API_GATEWAY;
  }
  if (normalizedName.includes('workflow')) {
    return DEFAULT_PORTS.WORKFLOW;
  }

  return 8000; // Default fallback
}

/**
 * Get environment variable with optional fallback
 *
 * @param key - Environment variable key
 * @param fallback - Fallback value if not found
 * @returns Environment variable value or fallback
 */
function getEnvVar(key: string, fallback?: string): string | undefined {
  const fullKey = `${ENV_PREFIX}_${key.toUpperCase()}`;
  return process.env[fullKey] || process.env[key] || fallback;
}

/**
 * Get environment variable as number
 *
 * @param key - Environment variable key
 * @param fallback - Fallback value if not found or invalid
 * @returns Parsed number or fallback
 */
function getEnvNumber(key: string, fallback: number): number {
  const value = getEnvVar(key);
  if (!value) return fallback;

  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Get environment variable as boolean
 *
 * @param key - Environment variable key
 * @param fallback - Fallback value if not found
 * @returns Boolean value or fallback
 */
function getEnvBoolean(key: string, fallback: boolean): boolean {
  const value = getEnvVar(key);
  if (!value) return fallback;

  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

// =============================================================================
// Configuration Loading
// =============================================================================

/**
 * Load configuration from environment variables
 *
 * @param serverName - Server name for defaults
 * @returns Configuration loaded from environment
 */
export function loadConfigFromEnv(serverName?: string): Partial<McpServerConfig> {
  const config: Partial<McpServerConfig> = {};

  // Basic configuration
  const envName = getEnvVar('SERVER_NAME') || getEnvVar('NAME');
  if (envName) config.name = envName;

  const envVersion = getEnvVar('VERSION');
  if (envVersion) config.version = envVersion;

  const envDescription = getEnvVar('DESCRIPTION');
  if (envDescription) config.description = envDescription;

  const envPort = getEnvNumber('PORT', getDefaultPort(serverName));
  config.port = envPort;

  const envHost = getEnvVar('HOST') || getEnvVar('BIND_HOST');
  if (envHost) config.host = envHost;

  // Environment
  config.environment = getEnvironment();

  // Logging configuration
  config.logging = {
    level: (getEnvVar('LOG_LEVEL') as LoggingConfig['level']) || 'info',
    format: (getEnvVar('LOG_FORMAT') as LoggingConfig['format']) || 'pretty',
    output: (getEnvVar('LOG_OUTPUT') as LoggingConfig['output']) || 'console',
    file: getEnvVar('LOG_FILE'),
    maxSize: getEnvVar('LOG_MAX_SIZE') || '10MB',
    maxFiles: getEnvNumber('LOG_MAX_FILES', 5),
  };

  // Security configuration
  config.security = {
    enableAuth: getEnvBoolean('ENABLE_AUTH', false),
    apiKeys: getEnvVar('API_KEYS')
      ?.split(',')
      .map(key => key.trim()),
    rateLimiting: {
      enabled: getEnvBoolean('RATE_LIMIT_ENABLED', true),
      windowMs: getEnvNumber('RATE_LIMIT_WINDOW', DEFAULT_LIMITS.RATE_LIMIT_WINDOW),
      maxRequests: getEnvNumber('RATE_LIMIT_MAX', DEFAULT_LIMITS.RATE_LIMIT_MAX_REQUESTS),
    },
    cors: {
      enabled: getEnvBoolean('CORS_ENABLED', true),
      origins: getEnvVar('CORS_ORIGINS')
        ?.split(',')
        .map(origin => origin.trim()) || ['*'],
      methods: getEnvVar('CORS_METHODS')
        ?.split(',')
        .map(method => method.trim()) || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  };

  // Performance configuration
  config.performance = {
    timeout: getEnvNumber('TIMEOUT', DEFAULT_TIMEOUTS.TOOL_EXECUTION),
    maxConcurrentRequests: getEnvNumber('MAX_CONCURRENT', DEFAULT_LIMITS.MAX_CONCURRENT_REQUESTS),
    requestSizeLimit: getEnvVar('REQUEST_SIZE_LIMIT') || DEFAULT_LIMITS.MAX_REQUEST_SIZE,
    caching: {
      enabled: getEnvBoolean('CACHE_ENABLED', true),
      ttl: getEnvNumber('CACHE_TTL', 300000),
      maxSize: getEnvNumber('CACHE_MAX_SIZE', 1000),
    },
  };

  return config;
}

/**
 * Load configuration from JSON file
 *
 * @param filePath - Path to configuration file
 * @returns Configuration object
 * @throws {ServerConfigError} When file cannot be loaded or parsed
 */
export async function loadConfigFromFile(filePath: string): Promise<Partial<McpServerConfig>> {
  try {
    const fs = await import('fs/promises');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(fileContent) as unknown;

    // Basic validation that it's an object
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Configuration file must contain a JSON object');
    }

    return parsed as Partial<McpServerConfig>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ServerConfigError(`Failed to load configuration from ${filePath}: ${message}`);
  }
}

/**
 * Validate and normalize configuration
 *
 * @param config - Configuration to validate
 * @returns Validated configuration
 * @throws {ServerConfigError} When configuration is invalid
 */
export function validateConfig(config: Partial<McpServerConfig>): McpServerConfig {
  try {
    const result = ServerConfigSchema.parse(config);
    return result as McpServerConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      throw new ServerConfigError(`Configuration validation failed: ${issues}`);
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new ServerConfigError(`Configuration validation error: ${message}`);
  }
}

/**
 * Merge multiple configuration objects with proper precedence
 *
 * @param configs - Configuration objects in order of precedence (later overrides earlier)
 * @returns Merged configuration
 */
export function mergeConfigs(...configs: Partial<McpServerConfig>[]): Partial<McpServerConfig> {
  const merged: Partial<McpServerConfig> = {};

  for (const config of configs) {
    Object.assign(merged, config);

    // Deep merge nested objects
    if (config.logging && merged.logging) {
      merged.logging = { ...merged.logging, ...config.logging };
    }
    if (config.security && merged.security) {
      merged.security = {
        ...merged.security,
        ...config.security,
        rateLimiting: {
          ...merged.security.rateLimiting,
          ...config.security.rateLimiting,
        },
        cors: {
          ...merged.security.cors,
          ...config.security.cors,
        },
      };
    }
    if (config.performance && merged.performance) {
      merged.performance = {
        ...merged.performance,
        ...config.performance,
        caching: {
          ...merged.performance.caching,
          ...config.performance.caching,
        },
      };
    }
  }

  return merged;
}

/**
 * Load complete configuration with all sources
 *
 * @param serverName - Server name for defaults
 * @param configFile - Optional configuration file path
 * @returns Complete validated configuration
 * @throws {ServerConfigError} When configuration cannot be loaded or is invalid
 */
export async function loadCompleteConfig(
  serverName?: string,
  configFile?: string
): Promise<McpServerConfig> {
  try {
    // Start with defaults
    const defaultConfig = createDefaultConfig(serverName);

    // Load from file if provided
    let fileConfig: Partial<McpServerConfig> = {};
    if (configFile) {
      fileConfig = await loadConfigFromFile(configFile);
    }

    // Load from environment
    const envConfig = loadConfigFromEnv(serverName);

    // Merge in order: defaults < file < environment
    const mergedConfig = mergeConfigs(defaultConfig, fileConfig, envConfig);

    // Validate final configuration
    return validateConfig(mergedConfig);
  } catch (error) {
    if (error instanceof ServerConfigError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    throw new ServerConfigError(`Failed to load configuration: ${message}`);
  }
}

// =============================================================================
// Environment-Specific Utilities
// =============================================================================

/**
 * Check if running in development environment
 *
 * @returns True if development environment
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}

/**
 * Check if running in production environment
 *
 * @returns True if production environment
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production';
}

/**
 * Check if running in test environment
 *
 * @returns True if test environment
 */
function isTest(): boolean {
  return getEnvironment() === 'test';
}

/**
 * Get configuration value with environment override
 *
 * @param key - Configuration key
 * @param defaultValue - Default value
 * @param envKey - Optional environment variable key (defaults to uppercased key)
 * @returns Configuration value
 */
export function getConfigValue<T>(key: string, defaultValue: T, envKey?: string): T {
  const envValue = getEnvVar(envKey || key);

  if (!envValue) return defaultValue;

  // Type conversion based on default value type
  if (typeof defaultValue === 'number') {
    const parsed = parseInt(envValue, 10);
    return (isNaN(parsed) ? defaultValue : parsed) as T;
  }

  if (typeof defaultValue === 'boolean') {
    return getEnvBoolean(envKey || key, defaultValue as boolean) as T;
  }

  return envValue as T;
}

// =============================================================================
// Configuration Validation Helpers
// =============================================================================

/**
 * Validate port number
 *
 * @param port - Port to validate
 * @throws {ServerConfigError} When port is invalid
 */
export function validatePort(port: number): void {
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new ServerConfigError(`Invalid port ${port}: must be integer between 1024 and 65535`);
  }
}

/**
 * Validate server name
 *
 * @param name - Name to validate
 * @throws {ServerConfigError} When name is invalid
 */
export function validateServerName(name: string): void {
  if (!name || typeof name !== 'string') {
    throw new ServerConfigError('Server name is required and must be a string');
  }

  if (name.length < 1 || name.length > 100) {
    throw new ServerConfigError('Server name must be between 1 and 100 characters');
  }

  if (!/^[a-zA-Z0-9\-_]+$/.test(name)) {
    throw new ServerConfigError(
      'Server name can only contain letters, numbers, hyphens, and underscores'
    );
  }
}

/**
 * Validate semver version string
 *
 * @param version - Version to validate
 * @throws {ServerConfigError} When version is invalid
 */
export function validateVersion(version: string): void {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new ServerConfigError(
      `Invalid version ${version}: must follow semver format (e.g., 1.0.0)`
    );
  }
}

// =============================================================================
// Configuration Templates
// =============================================================================

/**
 * Create development configuration template
 *
 * @param serverName - Server name
 * @returns Development configuration
 */
export function createDevConfig(serverName: string): McpServerConfig {
  const base = createDefaultConfig(serverName);

  return {
    ...base,
    environment: 'development',
    logging: {
      ...base.logging,
      level: 'debug',
      format: 'pretty',
      output: 'console',
    },
    security: {
      ...base.security,
      enableAuth: false,
      rateLimiting: {
        ...base.security.rateLimiting,
        maxRequests: 10000, // Very permissive for development
      },
    },
    performance: {
      ...base.performance,
      timeout: 60000, // Longer timeout for debugging
      caching: {
        ...base.performance.caching,
        enabled: false, // Disable caching for development
      },
    },
  };
}

/**
 * Create production configuration template
 *
 * @param serverName - Server name
 * @returns Production configuration
 */
export function createProdConfig(serverName: string): McpServerConfig {
  const base = createDefaultConfig(serverName);

  return {
    ...base,
    environment: 'production',
    logging: {
      ...base.logging,
      level: 'info',
      format: 'json',
      output: 'both',
      file: `logs/${serverName}.log`,
    },
    security: {
      ...base.security,
      enableAuth: true,
      rateLimiting: {
        ...base.security.rateLimiting,
        enabled: true,
        maxRequests: 100, // Strict rate limiting
      },
      cors: {
        ...base.security.cors,
        origins: [], // Must be explicitly configured
      },
    },
    performance: {
      ...base.performance,
      timeout: DEFAULT_TIMEOUTS.TOOL_EXECUTION,
      maxConcurrentRequests: 200,
      caching: {
        ...base.performance.caching,
        enabled: true,
        ttl: 600000, // 10 minutes
        maxSize: 5000,
      },
    },
  };
}

/**
 * Create test configuration template
 *
 * @param serverName - Server name
 * @returns Test configuration
 */
export function createTestConfig(serverName: string): McpServerConfig {
  const base = createDefaultConfig(serverName);

  return {
    ...base,
    environment: 'test',
    port: 0, // Let system assign port for tests
    logging: {
      ...base.logging,
      level: 'warn',
      format: 'json',
      output: 'console',
    },
    security: {
      ...base.security,
      enableAuth: false,
      rateLimiting: {
        ...base.security.rateLimiting,
        enabled: false, // Disable for testing
      },
    },
    performance: {
      ...base.performance,
      timeout: 5000, // Shorter timeout for tests
      caching: {
        ...base.performance.caching,
        enabled: false, // Disable caching for predictable tests
      },
    },
  };
}

// =============================================================================
// Configuration Export/Import
// =============================================================================

/**
 * Export configuration to JSON string
 *
 * @param config - Configuration to export
 * @param pretty - Whether to format JSON prettily
 * @returns JSON string representation
 */
export function exportConfig(config: McpServerConfig, pretty = true): string {
  return JSON.stringify(config, null, pretty ? 2 : 0);
}

/**
 * Export configuration to file
 *
 * @param config - Configuration to export
 * @param filePath - Target file path
 * @param pretty - Whether to format JSON prettily
 */
export async function exportConfigToFile(
  config: McpServerConfig,
  filePath: string,
  pretty = true
): Promise<void> {
  try {
    const fs = await import('fs/promises');
    const content = exportConfig(config, pretty);
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ServerConfigError(`Failed to export configuration to ${filePath}: ${message}`);
  }
}

// =============================================================================
// Configuration Schema Validation
// =============================================================================

/**
 * Complete server configuration schema for external validation
 */
export const CompleteServerConfigSchema = ServerConfigSchema;

/**
 * Validate configuration against schema and return detailed errors
 *
 * @param config - Configuration to validate
 * @returns Validation result with detailed error information
 */
export function validateConfigDetailed(config: unknown): {
  success: boolean;
  data?: McpServerConfig;
  errors?: string[];
} {
  try {
    const result = ServerConfigSchema.parse(config);
    return {
      success: true,
      data: result as McpServerConfig,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
      return {
        success: false,
        errors,
      };
    }

    return {
      success: false,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

// =============================================================================
// Re-exports and Convenience Functions
// =============================================================================

export {
  getEnvVar as env,
  getEnvNumber as envNumber,
  getEnvBoolean as envBoolean,
  isDevelopment as isDev,
  isProduction as isProd,
  isTest,
};

/**
 * Quick configuration loader for common scenarios
 *
 * @param serverName - Server name
 * @param options - Loading options
 * @returns Validated configuration
 */
export async function quickConfig(
  serverName: string,
  options: {
    configFile?: string;
    environment?: 'development' | 'production' | 'test';
  } = {}
): Promise<McpServerConfig> {
  // Override environment if specified
  if (options.environment) {
    process.env.NODE_ENV = options.environment;
  }

  return loadCompleteConfig(serverName, options.configFile);
}
