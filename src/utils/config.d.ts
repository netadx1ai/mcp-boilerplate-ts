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
import { z } from 'zod';
import { McpServerConfig } from '../types/index.js';
/**
 * Logging configuration schema
 */
export declare const LoggingConfigSchema: z.ZodObject<{
    level: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug", "trace"]>>;
    format: z.ZodDefault<z.ZodEnum<["json", "pretty"]>>;
    output: z.ZodDefault<z.ZodEnum<["console", "file", "both"]>>;
    file: z.ZodOptional<z.ZodString>;
    maxSize: z.ZodDefault<z.ZodString>;
    maxFiles: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    level: "error" | "warn" | "info" | "debug" | "trace";
    format: "json" | "pretty";
    output: "console" | "file" | "both";
    maxSize: string;
    maxFiles: number;
    file?: string | undefined;
}, {
    level?: "error" | "warn" | "info" | "debug" | "trace" | undefined;
    format?: "json" | "pretty" | undefined;
    output?: "console" | "file" | "both" | undefined;
    file?: string | undefined;
    maxSize?: string | undefined;
    maxFiles?: number | undefined;
}>;
/**
 * Create default server configuration
 *
 * @param serverName - Optional server name for port assignment
 * @returns Default configuration object
 */
export declare function createDefaultConfig(serverName?: string): McpServerConfig;
/**
 * Get environment variable with optional fallback
 *
 * @param key - Environment variable key
 * @param fallback - Fallback value if not found
 * @returns Environment variable value or fallback
 */
declare function getEnvVar(key: string, fallback?: string): string | undefined;
/**
 * Get environment variable as number
 *
 * @param key - Environment variable key
 * @param fallback - Fallback value if not found or invalid
 * @returns Parsed number or fallback
 */
declare function getEnvNumber(key: string, fallback: number): number;
/**
 * Get environment variable as boolean
 *
 * @param key - Environment variable key
 * @param fallback - Fallback value if not found
 * @returns Boolean value or fallback
 */
declare function getEnvBoolean(key: string, fallback: boolean): boolean;
/**
 * Load configuration from environment variables
 *
 * @param serverName - Server name for defaults
 * @returns Configuration loaded from environment
 */
export declare function loadConfigFromEnv(serverName?: string): Partial<McpServerConfig>;
/**
 * Load configuration from JSON file
 *
 * @param filePath - Path to configuration file
 * @returns Configuration object
 * @throws {ServerConfigError} When file cannot be loaded or parsed
 */
export declare function loadConfigFromFile(filePath: string): Promise<Partial<McpServerConfig>>;
/**
 * Validate and normalize configuration
 *
 * @param config - Configuration to validate
 * @returns Validated configuration
 * @throws {ServerConfigError} When configuration is invalid
 */
export declare function validateConfig(config: Partial<McpServerConfig>): McpServerConfig;
/**
 * Merge multiple configuration objects with proper precedence
 *
 * @param configs - Configuration objects in order of precedence (later overrides earlier)
 * @returns Merged configuration
 */
export declare function mergeConfigs(...configs: Partial<McpServerConfig>[]): Partial<McpServerConfig>;
/**
 * Load complete configuration with all sources
 *
 * @param serverName - Server name for defaults
 * @param configFile - Optional configuration file path
 * @returns Complete validated configuration
 * @throws {ServerConfigError} When configuration cannot be loaded or is invalid
 */
export declare function loadCompleteConfig(serverName?: string, configFile?: string): Promise<McpServerConfig>;
/**
 * Check if running in development environment
 *
 * @returns True if development environment
 */
export declare function isDevelopment(): boolean;
/**
 * Check if running in production environment
 *
 * @returns True if production environment
 */
export declare function isProduction(): boolean;
/**
 * Check if running in test environment
 *
 * @returns True if test environment
 */
declare function isTest(): boolean;
/**
 * Get configuration value with environment override
 *
 * @param key - Configuration key
 * @param defaultValue - Default value
 * @param envKey - Optional environment variable key (defaults to uppercased key)
 * @returns Configuration value
 */
export declare function getConfigValue<T>(key: string, defaultValue: T, envKey?: string): T;
/**
 * Validate port number
 *
 * @param port - Port to validate
 * @throws {ServerConfigError} When port is invalid
 */
export declare function validatePort(port: number): void;
/**
 * Validate server name
 *
 * @param name - Name to validate
 * @throws {ServerConfigError} When name is invalid
 */
export declare function validateServerName(name: string): void;
/**
 * Validate semver version string
 *
 * @param version - Version to validate
 * @throws {ServerConfigError} When version is invalid
 */
export declare function validateVersion(version: string): void;
/**
 * Create development configuration template
 *
 * @param serverName - Server name
 * @returns Development configuration
 */
export declare function createDevConfig(serverName: string): McpServerConfig;
/**
 * Create production configuration template
 *
 * @param serverName - Server name
 * @returns Production configuration
 */
export declare function createProdConfig(serverName: string): McpServerConfig;
/**
 * Create test configuration template
 *
 * @param serverName - Server name
 * @returns Test configuration
 */
export declare function createTestConfig(serverName: string): McpServerConfig;
/**
 * Export configuration to JSON string
 *
 * @param config - Configuration to export
 * @param pretty - Whether to format JSON prettily
 * @returns JSON string representation
 */
export declare function exportConfig(config: McpServerConfig, pretty?: boolean): string;
/**
 * Export configuration to file
 *
 * @param config - Configuration to export
 * @param filePath - Target file path
 * @param pretty - Whether to format JSON prettily
 */
export declare function exportConfigToFile(config: McpServerConfig, filePath: string, pretty?: boolean): Promise<void>;
/**
 * Complete server configuration schema for external validation
 */
export declare const CompleteServerConfigSchema: z.ZodObject<{
    name: z.ZodString;
    version: z.ZodString;
    description: z.ZodString;
    port: z.ZodNumber;
    host: z.ZodDefault<z.ZodString>;
    environment: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    logging: z.ZodObject<{
        level: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug", "trace"]>>;
        format: z.ZodDefault<z.ZodEnum<["json", "pretty"]>>;
        output: z.ZodDefault<z.ZodEnum<["console", "file", "both"]>>;
        file: z.ZodOptional<z.ZodString>;
        maxSize: z.ZodDefault<z.ZodString>;
        maxFiles: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        level: "error" | "warn" | "info" | "debug" | "trace";
        format: "json" | "pretty";
        output: "console" | "file" | "both";
        maxSize: string;
        maxFiles: number;
        file?: string | undefined;
    }, {
        level?: "error" | "warn" | "info" | "debug" | "trace" | undefined;
        format?: "json" | "pretty" | undefined;
        output?: "console" | "file" | "both" | undefined;
        file?: string | undefined;
        maxSize?: string | undefined;
        maxFiles?: number | undefined;
    }>;
    security: z.ZodObject<{
        enableAuth: z.ZodDefault<z.ZodBoolean>;
        apiKeys: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        rateLimiting: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            windowMs: z.ZodDefault<z.ZodNumber>;
            maxRequests: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            windowMs: number;
            maxRequests: number;
        }, {
            enabled?: boolean | undefined;
            windowMs?: number | undefined;
            maxRequests?: number | undefined;
        }>;
        cors: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            origins: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            methods: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            origins: string[];
            methods: string[];
        }, {
            enabled?: boolean | undefined;
            origins?: string[] | undefined;
            methods?: string[] | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        enableAuth: boolean;
        rateLimiting: {
            enabled: boolean;
            windowMs: number;
            maxRequests: number;
        };
        cors: {
            enabled: boolean;
            origins: string[];
            methods: string[];
        };
        apiKeys?: string[] | undefined;
    }, {
        rateLimiting: {
            enabled?: boolean | undefined;
            windowMs?: number | undefined;
            maxRequests?: number | undefined;
        };
        cors: {
            enabled?: boolean | undefined;
            origins?: string[] | undefined;
            methods?: string[] | undefined;
        };
        enableAuth?: boolean | undefined;
        apiKeys?: string[] | undefined;
    }>;
    performance: z.ZodObject<{
        timeout: z.ZodDefault<z.ZodNumber>;
        maxConcurrentRequests: z.ZodDefault<z.ZodNumber>;
        requestSizeLimit: z.ZodDefault<z.ZodString>;
        caching: z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            ttl: z.ZodDefault<z.ZodNumber>;
            maxSize: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            maxSize: number;
            ttl: number;
        }, {
            enabled?: boolean | undefined;
            maxSize?: number | undefined;
            ttl?: number | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        timeout: number;
        maxConcurrentRequests: number;
        requestSizeLimit: string;
        caching: {
            enabled: boolean;
            maxSize: number;
            ttl: number;
        };
    }, {
        caching: {
            enabled?: boolean | undefined;
            maxSize?: number | undefined;
            ttl?: number | undefined;
        };
        timeout?: number | undefined;
        maxConcurrentRequests?: number | undefined;
        requestSizeLimit?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: string;
    description: string;
    port: number;
    host: string;
    environment: "development" | "production" | "test";
    logging: {
        level: "error" | "warn" | "info" | "debug" | "trace";
        format: "json" | "pretty";
        output: "console" | "file" | "both";
        maxSize: string;
        maxFiles: number;
        file?: string | undefined;
    };
    security: {
        enableAuth: boolean;
        rateLimiting: {
            enabled: boolean;
            windowMs: number;
            maxRequests: number;
        };
        cors: {
            enabled: boolean;
            origins: string[];
            methods: string[];
        };
        apiKeys?: string[] | undefined;
    };
    performance: {
        timeout: number;
        maxConcurrentRequests: number;
        requestSizeLimit: string;
        caching: {
            enabled: boolean;
            maxSize: number;
            ttl: number;
        };
    };
}, {
    name: string;
    version: string;
    description: string;
    port: number;
    logging: {
        level?: "error" | "warn" | "info" | "debug" | "trace" | undefined;
        format?: "json" | "pretty" | undefined;
        output?: "console" | "file" | "both" | undefined;
        file?: string | undefined;
        maxSize?: string | undefined;
        maxFiles?: number | undefined;
    };
    security: {
        rateLimiting: {
            enabled?: boolean | undefined;
            windowMs?: number | undefined;
            maxRequests?: number | undefined;
        };
        cors: {
            enabled?: boolean | undefined;
            origins?: string[] | undefined;
            methods?: string[] | undefined;
        };
        enableAuth?: boolean | undefined;
        apiKeys?: string[] | undefined;
    };
    performance: {
        caching: {
            enabled?: boolean | undefined;
            maxSize?: number | undefined;
            ttl?: number | undefined;
        };
        timeout?: number | undefined;
        maxConcurrentRequests?: number | undefined;
        requestSizeLimit?: string | undefined;
    };
    host?: string | undefined;
    environment?: "development" | "production" | "test" | undefined;
}>;
/**
 * Validate configuration against schema and return detailed errors
 *
 * @param config - Configuration to validate
 * @returns Validation result with detailed error information
 */
export declare function validateConfigDetailed(config: unknown): {
    success: boolean;
    data?: McpServerConfig;
    errors?: string[];
};
export { getEnvVar as env, getEnvNumber as envNumber, getEnvBoolean as envBoolean, isDevelopment as isDev, isProduction as isProd, isTest, };
/**
 * Quick configuration loader for common scenarios
 *
 * @param serverName - Server name
 * @param options - Loading options
 * @returns Validated configuration
 */
export declare function quickConfig(serverName: string, options?: {
    configFile?: string;
    environment?: 'development' | 'production' | 'test';
}): Promise<McpServerConfig>;
//# sourceMappingURL=config.d.ts.map