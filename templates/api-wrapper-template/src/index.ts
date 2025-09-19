#!/usr/bin/env node

/**
 * @fileoverview API Wrapper MCP Server Template
 *
 * A comprehensive MCP server template for wrapping external APIs with
 * authentication, rate limiting, and error handling. This template demonstrates
 * how to create production-ready API integrations using the MCP protocol.
 *
 * Features:
 * - Multiple authentication methods (API key, OAuth, JWT, Basic Auth, Bearer)
 * - Rate limiting and request throttling
 * - Response caching and optimization
 * - Error handling and retry logic
 * - Request/response transformation
 * - API health monitoring
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

const SERVER_NAME = 'api-wrapper-template';
const SERVER_VERSION = '1.0.0';
const SERVER_DESCRIPTION = 'API wrapper MCP server with authentication and integration tools';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  rateLimit: {
    requests: number;
    windowMs: number;
  };
}

interface AuthConfig {
  type: 'api-key' | 'oauth' | 'jwt' | 'basic' | 'bearer';
  credentials: Record<string, string>;
}

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// =============================================================================
// Mock State Management
// =============================================================================

const mockApiConfig: ApiConfig = {
  baseUrl: 'https://api.example.com/v1',
  timeout: 30000,
  retries: 3,
  rateLimit: {
    requests: 100,
    windowMs: 60000,
  },
};

const mockAuthConfigs: Record<string, AuthConfig> = {
  'example-api': {
    type: 'api-key',
    credentials: { key: 'demo-api-key-12345' },
  },
  'oauth-service': {
    type: 'oauth',
    credentials: { 
      clientId: 'demo-client-id',
      clientSecret: 'demo-client-secret',
      redirectUri: 'http://localhost:3000/callback'
    },
  },
};

const requestCache = new Map<string, CacheEntry>();
const rateLimitTracker = new Map<string, { count: number; resetTime: number }>();

// =============================================================================
// Authentication Tools
// =============================================================================

/**
 * Configure API Authentication - Setup authentication for external APIs
 */
function registerConfigureAuthTool(server: McpServer) {
  server.registerTool(
    'configure_auth',
    {
      title: 'Configure API Authentication',
      description: 'Setup authentication configuration for external API access',
      inputSchema: {
        apiName: z.string().describe('Name/identifier for the API'),
        authType: z.enum(['api-key', 'oauth', 'jwt', 'basic', 'bearer']).describe('Authentication method'),
        credentials: z.record(z.string()).describe('Authentication credentials (key-value pairs)'),
        testEndpoint: z.string().optional().describe('Optional endpoint to test authentication'),
      },
    },
    async ({ apiName, authType, credentials, testEndpoint }) => {
      try {
        // Store auth configuration
        mockAuthConfigs[apiName] = {
          type: authType,
          credentials,
        };

        // Test authentication if endpoint provided
        let testResult = null;
        if (testEndpoint) {
          testResult = {
            endpoint: testEndpoint,
            status: 'success',
            message: 'Authentication test successful (mock)',
            responseTime: `${Math.floor(Math.random() * 500) + 100}ms`,
          };
        }

        const response = {
          success: true,
          apiName,
          authType,
          credentialsCount: Object.keys(credentials).length,
          testResult,
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Authentication configuration failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Make API Request - Execute authenticated API requests with error handling
 */
function registerMakeRequestTool(server: McpServer) {
  server.registerTool(
    'make_request',
    {
      title: 'Make API Request',
      description: 'Execute authenticated API requests with rate limiting and error handling',
      inputSchema: {
        apiName: z.string().describe('API name (must be configured first)'),
        endpoint: z.string().describe('API endpoint path'),
        method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET').describe('HTTP method'),
        headers: z.record(z.string()).optional().describe('Additional headers'),
        body: z.any().optional().describe('Request body for POST/PUT/PATCH'),
        useCache: z.boolean().default(true).describe('Use response caching'),
        cacheTtl: z.number().default(300).describe('Cache TTL in seconds'),
      },
    },
    async ({ apiName, endpoint, method, headers = {}, body, useCache, cacheTtl }) => {
      try {
        // Check if API is configured
        const authConfig = mockAuthConfigs[apiName];
        if (!authConfig) {
          return {
            content: [
              {
                type: 'text',
                text: `API '${apiName}' is not configured. Use configure_auth tool first.`,
              },
            ],
            isError: true,
          };
        }

        // Check rate limiting
        const rateLimitKey = `${apiName}:${method}:${endpoint}`;
        const now = Date.now();
        const rateLimit = rateLimitTracker.get(rateLimitKey);
        
        if (rateLimit && rateLimit.count >= mockApiConfig.rateLimit.requests && now < rateLimit.resetTime) {
          return {
            content: [
              {
                type: 'text',
                text: `Rate limit exceeded for ${apiName}. Try again in ${Math.ceil((rateLimit.resetTime - now) / 1000)} seconds.`,
              },
            ],
            isError: true,
          };
        }

        // Check cache
        const cacheKey = `${apiName}:${method}:${endpoint}:${JSON.stringify(body)}`;
        if (useCache && method === 'GET') {
          const cached = requestCache.get(cacheKey);
          if (cached && now - cached.timestamp < cached.ttl * 1000) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    cached: true,
                    data: cached.data,
                    cacheAge: `${Math.floor((now - cached.timestamp) / 1000)}s`,
                  }, null, 2),
                },
              ],
            };
          }
        }

        // Update rate limiting
        const windowStart = Math.floor(now / mockApiConfig.rateLimit.windowMs) * mockApiConfig.rateLimit.windowMs;
        rateLimitTracker.set(rateLimitKey, {
          count: (rateLimit?.count || 0) + 1,
          resetTime: windowStart + mockApiConfig.rateLimit.windowMs,
        });

        // Simulate API request
        const mockResponse = {
          success: true,
          method,
          endpoint,
          auth: authConfig.type,
          headers: Object.keys(headers).length,
          hasBody: !!body,
          responseTime: `${Math.floor(Math.random() * 1000) + 100}ms`,
          data: {
            message: `Mock API response for ${method} ${endpoint}`,
            timestamp: new Date().toISOString(),
            requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
          },
        };

        // Cache response for GET requests
        if (useCache && method === 'GET') {
          requestCache.set(cacheKey, {
            data: mockResponse,
            timestamp: now,
            ttl: cacheTtl,
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(mockResponse, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `API request failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Manage Rate Limits - Configure and monitor API rate limiting
 */
function registerRateLimitTool(server: McpServer) {
  server.registerTool(
    'manage_rate_limits',
    {
      title: 'Manage Rate Limits',
      description: 'Configure and monitor API rate limiting settings',
      inputSchema: {
        action: z.enum(['view', 'configure', 'reset']).describe('Rate limit action'),
        apiName: z.string().optional().describe('API name for specific operations'),
        requests: z.number().optional().describe('Requests per window (for configure)'),
        windowMs: z.number().optional().describe('Window size in milliseconds (for configure)'),
      },
    },
    async ({ action, apiName, requests, windowMs }) => {
      try {
        switch (action) {
          case 'view': {
            const allLimits = Array.from(rateLimitTracker.entries()).map(([key, data]) => ({
              key,
              count: data.count,
              resetIn: Math.max(0, Math.ceil((data.resetTime - Date.now()) / 1000)),
              limit: mockApiConfig.rateLimit.requests,
            }));

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    currentLimits: allLimits,
                    globalConfig: mockApiConfig.rateLimit,
                    timestamp: new Date().toISOString(),
                  }, null, 2),
                },
              ],
            };
          }

          case 'configure': {
            if (requests !== undefined) {
              mockApiConfig.rateLimit.requests = requests;
            }
            if (windowMs !== undefined) {
              mockApiConfig.rateLimit.windowMs = windowMs;
            }

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    message: 'Rate limit configuration updated',
                    newConfig: mockApiConfig.rateLimit,
                  }, null, 2),
                },
              ],
            };
          }

          case 'reset': {
            if (apiName) {
              // Reset specific API rate limits
              const keysToDelete = Array.from(rateLimitTracker.keys())
                .filter(key => key.startsWith(`${apiName}:`));
              
              keysToDelete.forEach(key => rateLimitTracker.delete(key));

              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      success: true,
                      message: `Rate limits reset for API: ${apiName}`,
                      resetCount: keysToDelete.length,
                    }, null, 2),
                  },
                ],
              };
            } else {
              // Reset all rate limits
              const count = rateLimitTracker.size;
              rateLimitTracker.clear();

              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      success: true,
                      message: 'All rate limits reset',
                      resetCount: count,
                    }, null, 2),
                  },
                ],
              };
            }
          }

          default:
            return {
              content: [
                {
                  type: 'text',
                  text: `Unknown rate limit action: ${action}`,
                },
              ],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Rate limit management failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Transform Request - Transform request data before sending to API
 */
function registerTransformRequestTool(server: McpServer) {
  server.registerTool(
    'transform_request',
    {
      title: 'Transform Request',
      description: 'Transform and validate request data before sending to external API',
      inputSchema: {
        data: z.any().describe('Request data to transform'),
        transformType: z.enum(['camelToSnake', 'snakeToCamel', 'upperCase', 'lowerCase', 'custom']).describe('Transformation type'),
        customRules: z.record(z.string()).optional().describe('Custom transformation rules (key: originalField, value: newField)'),
        validate: z.boolean().default(true).describe('Validate transformed data'),
        schema: z.any().optional().describe('Validation schema for transformed data'),
      },
    },
    async ({ data, transformType, customRules, validate, schema }) => {
      try {
        let transformedData = JSON.parse(JSON.stringify(data)); // Deep clone

        switch (transformType) {
          case 'camelToSnake': {
            transformedData = transformKeys(transformedData, camelToSnake);
            break;
          }

          case 'snakeToCamel': {
            transformedData = transformKeys(transformedData, snakeToCamel);
            break;
          }

          case 'upperCase': {
            transformedData = transformKeys(transformedData, (key: string) => key.toUpperCase());
            break;
          }

          case 'lowerCase': {
            transformedData = transformKeys(transformedData, (key: string) => key.toLowerCase());
            break;
          }

          case 'custom': {
            if (customRules) {
              transformedData = applyCustomRules(transformedData, customRules);
            }
            break;
          }
        }

        // Validation
        let validationResult = null;
        if (validate && schema) {
          validationResult = {
            valid: true,
            message: 'Validation passed (mock)',
          };
        }

        const response = {
          success: true,
          original: data,
          transformed: transformedData,
          transformationType: transformType,
          validation: validationResult,
          timestamp: new Date().toISOString(),
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Request transformation failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Transform Response - Transform API response data for consumption
 */
function registerTransformResponseTool(server: McpServer) {
  server.registerTool(
    'transform_response',
    {
      title: 'Transform Response',
      description: 'Transform API response data for easier consumption',
      inputSchema: {
        response: z.any().describe('API response data to transform'),
        extractFields: z.array(z.string()).optional().describe('Specific fields to extract'),
        flatten: z.boolean().default(false).describe('Flatten nested objects'),
        format: z.enum(['json', 'csv', 'table', 'summary']).default('json').describe('Output format'),
      },
    },
    async ({ response, extractFields, flatten, format }) => {
      try {
        let processedData = JSON.parse(JSON.stringify(response)); // Deep clone

        // Extract specific fields
        if (extractFields && extractFields.length > 0) {
          processedData = extractFieldsFromObject(processedData, extractFields);
        }

        // Flatten if requested
        if (flatten) {
          processedData = flattenObject(processedData);
        }

        // Format output
        let formattedOutput: string;
        switch (format) {
          case 'json':
            formattedOutput = JSON.stringify(processedData, null, 2);
            break;
          case 'csv':
            formattedOutput = objectToCsv(processedData);
            break;
          case 'table':
            formattedOutput = objectToTable(processedData);
            break;
          case 'summary':
            formattedOutput = generateSummary(processedData);
            break;
          default:
            formattedOutput = JSON.stringify(processedData, null, 2);
        }

        return {
          content: [
            {
              type: 'text',
              text: formattedOutput,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Response transformation failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Manage Cache - Control response caching behavior
 */
function registerManageCacheTool(server: McpServer) {
  server.registerTool(
    'manage_cache',
    {
      title: 'Manage Cache',
      description: 'Manage API response caching for improved performance',
      inputSchema: {
        action: z.enum(['view', 'clear', 'configure', 'stats']).describe('Cache management action'),
        key: z.string().optional().describe('Specific cache key for targeted operations'),
        ttl: z.number().optional().describe('New TTL in seconds (for configure)'),
      },
    },
    async ({ action, key, ttl }) => {
      try {
        switch (action) {
          case 'view': {
            if (key) {
              const entry = requestCache.get(key);
              if (!entry) {
                return {
                  content: [
                    {
                      type: 'text',
                      text: `Cache entry not found for key: ${key}`,
                    },
                  ],
                  isError: true,
                };
              }

              const response = {
                key,
                data: entry.data,
                age: Math.floor((Date.now() - entry.timestamp) / 1000),
                ttl: entry.ttl,
                expiresIn: Math.max(0, entry.ttl - Math.floor((Date.now() - entry.timestamp) / 1000)),
              };

              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(response, null, 2),
                  },
                ],
              };
            } else {
              const allEntries = Array.from(requestCache.entries()).map(([cacheKey, entry]) => ({
                key: cacheKey,
                age: Math.floor((Date.now() - entry.timestamp) / 1000),
                ttl: entry.ttl,
                size: JSON.stringify(entry.data).length,
              }));

              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(allEntries, null, 2),
                  },
                ],
              };
            }
          }

          case 'clear': {
            if (key) {
              const deleted = requestCache.delete(key);
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      success: true,
                      message: deleted ? `Cache entry cleared: ${key}` : `Cache entry not found: ${key}`,
                    }, null, 2),
                  },
                ],
              };
            } else {
              const count = requestCache.size;
              requestCache.clear();
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify({
                      success: true,
                      message: `All cache entries cleared`,
                      clearedCount: count,
                    }, null, 2),
                  },
                ],
              };
            }
          }

          case 'stats': {
            const now = Date.now();
            const entries = Array.from(requestCache.entries());
            const stats = {
              totalEntries: entries.length,
              totalSize: entries.reduce((sum, [, entry]) => sum + JSON.stringify(entry.data).length, 0),
              expired: entries.filter(([, entry]) => now - entry.timestamp > entry.ttl * 1000).length,
              hitRate: '75%', // Mock hit rate
              oldestEntry: entries.length > 0 ? Math.min(...entries.map(([, entry]) => entry.timestamp)) : null,
            };

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(stats, null, 2),
                },
              ],
            };
          }

          default:
            return {
              content: [
                {
                  type: 'text',
                  text: `Unknown cache action: ${action}`,
                },
              ],
              isError: true,
            };
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Cache management failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Monitor API Health - Check API endpoint health and performance
 */
function registerMonitorApiTool(server: McpServer) {
  server.registerTool(
    'monitor_api_health',
    {
      title: 'Monitor API Health',
      description: 'Check health and performance of configured APIs',
      inputSchema: {
        apiName: z.string().optional().describe('Specific API to monitor (all if not provided)'),
        includeMetrics: z.boolean().default(true).describe('Include performance metrics'),
        testEndpoints: z.array(z.string()).optional().describe('Specific endpoints to test'),
      },
    },
    async ({ apiName, includeMetrics, testEndpoints }) => {
      try {
        const apisToMonitor = apiName ? [apiName] : Object.keys(mockAuthConfigs);
        const healthResults = [];

        for (const api of apisToMonitor) {
          const authConfig = mockAuthConfigs[api];
          if (!authConfig) continue;

          // Mock health check
          const healthData = {
            apiName: api,
            status: Math.random() > 0.1 ? 'healthy' : 'degraded', // 90% healthy
            authType: authConfig.type,
            responseTime: Math.floor(Math.random() * 500) + 50,
            lastChecked: new Date().toISOString(),
          };

          if (includeMetrics) {
            const apiRateLimits = Array.from(rateLimitTracker.entries())
              .filter(([key]) => key.startsWith(`${api}:`));

            (healthData as any).metrics = {
              requestCount: apiRateLimits.reduce((sum, [, data]) => sum + data.count, 0),
              rateLimitUsage: `${Math.floor(Math.random() * 80)}%`, // Mock usage
              cacheHitRate: `${Math.floor(Math.random() * 50) + 50}%`, // Mock 50-100%
              averageResponseTime: `${Math.floor(Math.random() * 300) + 100}ms`,
            };
          }

          // Test specific endpoints if provided
          if (testEndpoints) {
            (healthData as any).endpointTests = testEndpoints.map(endpoint => ({
              endpoint,
              status: Math.random() > 0.05 ? 'ok' : 'error', // 95% success
              responseTime: Math.floor(Math.random() * 200) + 50,
            }));
          }

          healthResults.push(healthData);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                totalApis: apisToMonitor.length,
                healthResults,
                timestamp: new Date().toISOString(),
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `API health monitoring failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Server Status - Get comprehensive server status and configuration
 */
function registerStatusTool(server: McpServer) {
  server.registerTool(
    'get_server_status',
    {
      title: 'Get Server Status',
      description: 'Get comprehensive server status, configuration, and statistics',
      inputSchema: {
        includeAuth: z.boolean().default(false).describe('Include authentication details'),
        includeCache: z.boolean().default(true).describe('Include cache statistics'),
        includeRateLimit: z.boolean().default(true).describe('Include rate limit information'),
      },
    },
    async ({ includeAuth, includeCache, includeRateLimit }) => {
      try {
        const status = {
          server: {
            name: SERVER_NAME,
            version: SERVER_VERSION,
            description: SERVER_DESCRIPTION,
            uptime: process.uptime(),
            status: 'running',
            tools: 5,
          },
          configuration: {
            apiConfig: {
              ...mockApiConfig,
              // Hide sensitive data
              baseUrl: mockApiConfig.baseUrl,
            },
          },
          timestamp: new Date().toISOString(),
        };

        if (includeAuth) {
          (status as any).authentication = {
            configuredApis: Object.keys(mockAuthConfigs).length,
            authMethods: Object.values(mockAuthConfigs).map(config => ({
              type: config.type,
              credentialsConfigured: Object.keys(config.credentials).length > 0,
            })),
          };
        }

        if (includeCache) {
          (status as any).cache = {
            entries: requestCache.size,
            totalSize: Array.from(requestCache.values())
              .reduce((sum, entry) => sum + JSON.stringify(entry.data).length, 0),
            hitRate: '75%', // Mock hit rate
          };
        }

        if (includeRateLimit) {
          (status as any).rateLimit = {
            globalConfig: mockApiConfig.rateLimit,
            activeTrackers: rateLimitTracker.size,
            totalRequests: Array.from(rateLimitTracker.values())
              .reduce((sum, data) => sum + data.count, 0),
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(status, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Failed to get server status: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function transformKeys(obj: any, transformer: (key: string) => string): any {
  if (Array.isArray(obj)) {
    return obj.map(item => transformKeys(item, transformer));
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      newObj[transformer(key)] = transformKeys(value, transformer);
    }
    return newObj;
  }
  return obj;
}

function applyCustomRules(obj: any, rules: Record<string, string>): any {
  if (Array.isArray(obj)) {
    return obj.map(item => applyCustomRules(item, rules));
  } else if (obj !== null && typeof obj === 'object') {
    const newObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = rules[key] || key;
      newObj[newKey] = applyCustomRules(value, rules);
    }
    return newObj;
  }
  return obj;
}

function extractFieldsFromObject(obj: any, fields: string[]): any {
  if (Array.isArray(obj)) {
    return obj.map(item => extractFieldsFromObject(item, fields));
  } else if (obj !== null && typeof obj === 'object') {
    const extracted: any = {};
    for (const field of fields) {
      if (field in obj) {
        extracted[field] = obj[field];
      }
    }
    return extracted;
  }
  return obj;
}

function flattenObject(obj: any, prefix = ''): any {
  const flattened: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(flattened, flattenObject(value, newKey));
    } else {
      flattened[newKey] = value;
    }
  }
  
  return flattened;
}

function objectToCsv(obj: any): string {
  if (Array.isArray(obj)) {
    const headers = Object.keys(obj[0] || {});
    const csvRows = [
      headers.join(','),
      ...obj.map((row: any) => headers.map(header => String(row[header] || '')).join(','))
    ];
    return csvRows.join('\n');
  } else {
    const entries = Object.entries(obj);
    return `key,value\n${entries.map(([k, v]) => `${k},${v}`).join('\n')}`;
  }
}

function objectToTable(obj: any): string {
  if (Array.isArray(obj)) {
    const headers = Object.keys(obj[0] || {});
    const maxWidths = headers.map(header => 
      Math.max(header.length, ...obj.map((row: any) => String(row[header] || '').length))
    );
    
    const headerRow = headers.map((header, i) => header.padEnd(maxWidths[i])).join(' | ');
    const separator = maxWidths.map(width => '-'.repeat(width)).join(' | ');
    const dataRows = obj.map((row: any) => 
      headers.map((header, i) => String(row[header] || '').padEnd(maxWidths[i])).join(' | ')
    );
    
    return [headerRow, separator, ...dataRows].join('\n');
  } else {
    const entries = Object.entries(obj);
    const maxKeyWidth = Math.max(...entries.map(([k]) => k.length));
    return entries.map(([k, v]) => `${k.padEnd(maxKeyWidth)} | ${v}`).join('\n');
  }
}

function generateSummary(obj: any): string {
  let summary = 'Data Summary:\n';
  
  if (Array.isArray(obj)) {
    summary += `• Type: Array with ${obj.length} items\n`;
    if (obj.length > 0) {
      const firstItem = obj[0];
      if (typeof firstItem === 'object') {
        summary += `• Item structure: ${Object.keys(firstItem).join(', ')}\n`;
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    const keys = Object.keys(obj);
    summary += `• Type: Object with ${keys.length} properties\n`;
    summary += `• Properties: ${keys.join(', ')}\n`;
  } else {
    summary += `• Type: ${typeof obj}\n`;
    summary += `• Value: ${String(obj)}\n`;
  }
  
  return summary;
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
  registerConfigureAuthTool(server);
  registerMakeRequestTool(server);
  registerRateLimitTool(server);
  registerTransformRequestTool(server);
  registerTransformResponseTool(server);
  registerManageCacheTool(server);
  registerMonitorApiTool(server);
  registerStatusTool(server);

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
    console.error('🛠️ Tools: configure_auth, make_request, manage_rate_limits, transform_request, transform_response, manage_cache, monitor_api_health, get_server_status');
    console.error('📡 Ready to receive MCP requests...\n');

    // Create server
    const server = createServer();

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    console.error('✅ API wrapper server connected successfully');
    console.error('💡 Available tools:');
    console.error('   • configure_auth - Setup API authentication');
    console.error('   • make_request - Execute authenticated API calls');
    console.error('   • manage_rate_limits - Control request rate limiting');
    console.error('   • transform_request - Transform request data');
    console.error('   • transform_response - Transform response data');
    console.error('   • manage_cache - Manage response caching');
    console.error('   • monitor_api_health - Monitor API health');
    console.error('   • get_server_status - Get server status');
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