#!/usr/bin/env node

/**
 * @fileoverview Database Integration MCP Server Template
 *
 * A comprehensive MCP server template for database operations with support for
 * multiple database engines (PostgreSQL, MySQL, SQLite). This template demonstrates
 * secure database access, connection pooling, migration management, and query optimization.
 *
 * Features:
 * - Multi-database support (PostgreSQL, MySQL, SQLite)
 * - Connection pooling and management
 * - Schema introspection and management
 * - Migration execution and rollback
 * - Query builder and execution
 * - Transaction management
 * - Performance monitoring
 * - Security best practices
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

const SERVER_NAME = 'database-integration-template';
const SERVER_VERSION = '1.0.0';
const SERVER_DESCRIPTION = 'Database integration MCP server with multi-database support';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface DatabaseConfig {
  type: 'postgresql' | 'mysql' | 'sqlite';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  filename?: string; // For SQLite
  pool?: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
  };
}

interface QueryResult {
  rows: any[];
  rowCount: number;
  executionTime: number;
  query: string;
}

interface SchemaInfo {
  tables: TableInfo[];
  views: ViewInfo[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
}

interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  rowCount: number;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  defaultValue?: string;
}

interface ViewInfo {
  name: string;
  schema: string;
  definition: string;
}

interface IndexInfo {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
}

interface ForeignKeyInfo {
  name: string;
  table: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

interface MigrationInfo {
  id: string;
  name: string;
  executedAt?: string;
  status: 'pending' | 'executed' | 'failed';
}

// =============================================================================
// Mock State Management
// =============================================================================

const connections = new Map<string, DatabaseConfig>();
const queryHistory: Array<{
  query: string;
  timestamp: string;
  executionTime: number;
  rowCount: number;
}> = [];
const mockSchemas = new Map<string, SchemaInfo>();

// Initialize mock data
connections.set('demo-postgres', {
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'demo_db',
  username: 'demo_user',
  password: '***',
  pool: { min: 2, max: 10, idleTimeoutMillis: 30000 },
});

connections.set('demo-mysql', {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'demo_db',
  username: 'demo_user',
  password: '***',
  pool: { min: 2, max: 10, idleTimeoutMillis: 30000 },
});

connections.set('demo-sqlite', {
  type: 'sqlite',
  database: 'demo.db',
  filename: './data/demo.db',
});

// =============================================================================
// Database Tools
// =============================================================================

/**
 * Configure Database Connection - Setup database connections
 */
function registerConfigureConnectionTool(server: McpServer) {
  server.registerTool(
    'configure_connection',
    {
      title: 'Configure Database Connection',
      description: 'Setup and test database connection configuration',
      inputSchema: {
        connectionName: z.string().describe('Unique name for this connection'),
        type: z.enum(['postgresql', 'mysql', 'sqlite']).describe('Database type'),
        host: z.string().optional().describe('Database host (not needed for SQLite)'),
        port: z.number().optional().describe('Database port'),
        database: z.string().describe('Database name or SQLite file path'),
        username: z.string().optional().describe('Database username'),
        password: z.string().optional().describe('Database password'),
        poolMin: z.number().default(2).describe('Minimum pool connections'),
        poolMax: z.number().default(10).describe('Maximum pool connections'),
        testConnection: z.boolean().default(true).describe('Test connection after configuration'),
      },
    },
    async ({
      connectionName,
      type,
      host,
      port,
      database,
      username,
      password,
      poolMin,
      poolMax,
      testConnection,
    }) => {
      try {
        const config: DatabaseConfig = {
          type,
          database,
          ...(host && { host }),
          ...(port && { port }),
          ...(username && { username }),
          ...(password && { password }),
          ...(type === 'sqlite' && { filename: database }),
          pool: {
            min: poolMin,
            max: poolMax,
            idleTimeoutMillis: 30000,
          },
        };

        connections.set(connectionName, config);

        let testResult = null;
        if (testConnection) {
          // Mock connection test
          testResult = {
            status: 'success',
            responseTime: Math.floor(Math.random() * 200) + 50,
            serverVersion: type === 'postgresql' ? '14.5' : type === 'mysql' ? '8.0.28' : '3.36.0',
            timestamp: new Date().toISOString(),
          };
        }

        const response = {
          success: true,
          connectionName,
          configuration: {
            ...config,
            password: config.password ? '***' : undefined, // Hide password
          },
          testResult,
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
              text: `Database configuration failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Execute Query - Run SQL queries with safety checks
 */
function registerExecuteQueryTool(server: McpServer) {
  server.registerTool(
    'execute_query',
    {
      title: 'Execute SQL Query',
      description: 'Execute SQL queries with safety checks and performance monitoring',
      inputSchema: {
        connectionName: z.string().describe('Database connection name'),
        query: z.string().describe('SQL query to execute'),
        params: z.array(z.any()).optional().describe('Query parameters for prepared statements'),
        dryRun: z.boolean().default(false).describe('Validate query without execution'),
        explain: z.boolean().default(false).describe('Include query execution plan'),
        maxRows: z.number().default(1000).describe('Maximum rows to return'),
      },
    },
    async ({ connectionName, query, params = [], dryRun, explain, maxRows }) => {
      try {
        const connection = connections.get(connectionName);
        if (!connection) {
          return {
            content: [
              {
                type: 'text',
                text: `Connection '${connectionName}' not found. Configure it first using configure_connection.`,
              },
            ],
            isError: true,
          };
        }

        // Safety checks
        const lowerQuery = query.toLowerCase().trim();
        const isModifying =
          lowerQuery.startsWith('insert') ||
          lowerQuery.startsWith('update') ||
          lowerQuery.startsWith('delete') ||
          lowerQuery.startsWith('drop') ||
          lowerQuery.startsWith('alter');

        if (dryRun) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    dryRun: true,
                    query: query.trim(),
                    parameters: params,
                    isModifying,
                    estimatedCost: Math.floor(Math.random() * 1000),
                    validation: 'Query syntax appears valid (mock validation)',
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Mock query execution
        const startTime = Date.now();
        const executionTime = Math.floor(Math.random() * 500) + 10;

        // Generate mock results based on query type
        let mockResults: any[];
        let rowCount: number;

        if (lowerQuery.startsWith('select')) {
          // Mock SELECT results
          rowCount = Math.floor(Math.random() * Math.min(maxRows, 100)) + 1;
          mockResults = Array.from({ length: Math.min(rowCount, 10) }, (_, i) => ({
            id: i + 1,
            name: `Record ${i + 1}`,
            created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            status: Math.random() > 0.5 ? 'active' : 'inactive',
          }));
        } else if (isModifying) {
          // Mock modification results
          rowCount = Math.floor(Math.random() * 10) + 1;
          mockResults = [];
        } else {
          // Other queries (CREATE, etc.)
          rowCount = 0;
          mockResults = [];
        }

        // Add to history
        queryHistory.push({
          query: query.trim(),
          timestamp: new Date().toISOString(),
          executionTime,
          rowCount,
        });

        const result: QueryResult = {
          rows: mockResults,
          rowCount,
          executionTime,
          query: query.trim(),
        };

        const response = {
          success: true,
          connection: connectionName,
          result,
          ...(explain && {
            executionPlan: {
              cost: Math.floor(Math.random() * 1000),
              operation: 'Sequential Scan (mock)',
              estimatedRows: rowCount,
            },
          }),
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
              text: `Query execution failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Get Schema Information - Introspect database schema
 */
function registerGetSchemaTool(server: McpServer) {
  server.registerTool(
    'get_schema',
    {
      title: 'Get Database Schema',
      description: 'Retrieve comprehensive database schema information',
      inputSchema: {
        connectionName: z.string().describe('Database connection name'),
        includeData: z.boolean().default(false).describe('Include sample data'),
        tables: z.array(z.string()).optional().describe('Specific tables to inspect'),
        detailed: z.boolean().default(true).describe('Include detailed column information'),
      },
    },
    async ({ connectionName, includeData, tables, detailed }) => {
      try {
        const connection = connections.get(connectionName);
        if (!connection) {
          return {
            content: [
              {
                type: 'text',
                text: `Connection '${connectionName}' not found.`,
              },
            ],
            isError: true,
          };
        }

        // Generate mock schema
        const mockTables = tables || ['users', 'posts', 'comments', 'categories'];
        const schemaInfo: SchemaInfo = {
          tables: mockTables.map(tableName => ({
            name: tableName,
            schema: 'public',
            columns: generateMockColumns(tableName),
            rowCount: Math.floor(Math.random() * 10000),
          })),
          views: [
            {
              name: 'user_stats',
              schema: 'public',
              definition: 'SELECT user_id, COUNT(*) as post_count FROM posts GROUP BY user_id',
            },
          ],
          indexes: [
            {
              name: 'idx_users_email',
              table: 'users',
              columns: ['email'],
              unique: true,
            },
            {
              name: 'idx_posts_user_id',
              table: 'posts',
              columns: ['user_id'],
              unique: false,
            },
          ],
          foreignKeys: [
            {
              name: 'fk_posts_user_id',
              table: 'posts',
              column: 'user_id',
              referencedTable: 'users',
              referencedColumn: 'id',
            },
          ],
        };

        mockSchemas.set(connectionName, schemaInfo);

        let sampleData = null;
        if (includeData) {
          sampleData = mockTables.reduce(
            (acc, table) => {
              acc[table] = Array.from({ length: 3 }, (_, i) => ({
                id: i + 1,
                name: `Sample ${table} ${i + 1}`,
                created_at: new Date().toISOString(),
              }));
              return acc;
            },
            {} as Record<string, any[]>
          );
        }

        const response = {
          success: true,
          connection: connectionName,
          databaseType: connection.type,
          schema: detailed
            ? schemaInfo
            : {
                tableCount: schemaInfo.tables.length,
                viewCount: schemaInfo.views.length,
                indexCount: schemaInfo.indexes.length,
              },
          ...(sampleData && { sampleData }),
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
              text: `Schema inspection failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Run Migration - Execute database migrations
 */
function registerRunMigrationTool(server: McpServer) {
  server.registerTool(
    'run_migration',
    {
      title: 'Run Database Migration',
      description: 'Execute database migrations with rollback support',
      inputSchema: {
        connectionName: z.string().describe('Database connection name'),
        migrationId: z.string().describe('Migration identifier'),
        direction: z.enum(['up', 'down']).default('up').describe('Migration direction'),
        force: z.boolean().default(false).describe('Force migration even if risky'),
        dryRun: z.boolean().default(false).describe('Preview migration without execution'),
      },
    },
    async ({ connectionName, migrationId, direction, force, dryRun }) => {
      try {
        const connection = connections.get(connectionName);
        if (!connection) {
          return {
            content: [
              {
                type: 'text',
                text: `Connection '${connectionName}' not found.`,
              },
            ],
            isError: true,
          };
        }

        // Mock migration data
        const mockMigrations: Record<string, MigrationInfo> = {
          '001_create_users': {
            id: '001_create_users',
            name: 'Create users table',
            status: 'executed',
            executedAt: '2024-01-01T10:00:00Z',
          },
          '002_add_user_profiles': {
            id: '002_add_user_profiles',
            name: 'Add user profiles table',
            status: 'executed',
            executedAt: '2024-01-02T10:00:00Z',
          },
          '003_add_posts': {
            id: '003_add_posts',
            name: 'Add posts table',
            status: 'pending',
          },
        };

        const migration = mockMigrations[migrationId];
        if (!migration) {
          return {
            content: [
              {
                type: 'text',
                text: `Migration '${migrationId}' not found.`,
              },
            ],
            isError: true,
          };
        }

        if (dryRun) {
          const mockSql =
            direction === 'up'
              ? `CREATE TABLE ${migrationId.split('_').slice(1).join('_')} (id SERIAL PRIMARY KEY);`
              : `DROP TABLE ${migrationId.split('_').slice(1).join('_')};`;

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    dryRun: true,
                    migration: migration,
                    direction,
                    sql: mockSql,
                    estimatedTime: '2.5s',
                    warnings: direction === 'down' ? ['This will delete data'] : [],
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        // Mock execution
        const executionTime = Math.floor(Math.random() * 3000) + 500;

        if (direction === 'up' && migration.status === 'executed' && !force) {
          return {
            content: [
              {
                type: 'text',
                text: `Migration '${migrationId}' already executed. Use force=true to re-run.`,
              },
            ],
            isError: true,
          };
        }

        // Update migration status
        migration.status = 'executed';
        migration.executedAt = new Date().toISOString();

        const response = {
          success: true,
          migration: migration,
          direction,
          executionTime: `${executionTime}ms`,
          affectedTables: [migrationId.split('_').slice(1).join('_')],
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
              text: `Migration execution failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Manage Transactions - Handle database transactions
 */
function registerTransactionTool(server: McpServer) {
  server.registerTool(
    'manage_transaction',
    {
      title: 'Manage Database Transaction',
      description: 'Start, commit, or rollback database transactions',
      inputSchema: {
        connectionName: z.string().describe('Database connection name'),
        action: z.enum(['begin', 'commit', 'rollback', 'status']).describe('Transaction action'),
        transactionId: z.string().optional().describe('Transaction ID for commit/rollback'),
        isolationLevel: z
          .enum(['READ_uncommitted', 'read_committed', 'repeatable_read', 'serializable'])
          .optional()
          .describe('Transaction isolation level'),
      },
    },
    async ({ connectionName, action, transactionId, isolationLevel }) => {
      try {
        const connection = connections.get(connectionName);
        if (!connection) {
          return {
            content: [
              {
                type: 'text',
                text: `Connection '${connectionName}' not found.`,
              },
            ],
            isError: true,
          };
        }

        switch (action) {
          case 'begin': {
            const newTransactionId = `txn_${Math.random().toString(36).substr(2, 9)}`;

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'begin',
                      transactionId: newTransactionId,
                      isolationLevel: isolationLevel || 'read_committed',
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'commit': {
            if (!transactionId) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Transaction ID required for commit action.',
                  },
                ],
                isError: true,
              };
            }

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'commit',
                      transactionId,
                      commitTime: `${Math.floor(Math.random() * 100) + 10}ms`,
                      changesCommitted: Math.floor(Math.random() * 50) + 1,
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'rollback': {
            if (!transactionId) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Transaction ID required for rollback action.',
                  },
                ],
                isError: true,
              };
            }

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: true,
                      action: 'rollback',
                      transactionId,
                      rollbackTime: `${Math.floor(Math.random() * 50) + 5}ms`,
                      changesRolledBack: Math.floor(Math.random() * 20) + 1,
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          case 'status': {
            // Mock active transactions
            const activeTransactions = [
              {
                id: 'txn_abc123',
                startTime: new Date(Date.now() - 30000).toISOString(),
                isolationLevel: 'read_committed',
                queriesExecuted: 3,
              },
            ];

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      connection: connectionName,
                      activeTransactions,
                      totalTransactions: queryHistory.length,
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                  ),
                },
              ],
            };
          }

          default:
            return {
              content: [
                {
                  type: 'text',
                  text: `Unknown transaction action: ${action}`,
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
              text: `Transaction management failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Monitor Performance - Database performance monitoring
 */
function registerMonitorPerformanceTool(server: McpServer) {
  server.registerTool(
    'monitor_performance',
    {
      title: 'Monitor Database Performance',
      description: 'Monitor database performance metrics and connection health',
      inputSchema: {
        connectionName: z.string().optional().describe('Specific connection to monitor'),
        includeSlowQueries: z.boolean().default(true).describe('Include slow query analysis'),
        timePeriod: z.number().default(3600).describe('Time period in seconds for metrics'),
      },
    },
    async ({ connectionName, includeSlowQueries, timePeriod }) => {
      try {
        const connectionsToMonitor = connectionName
          ? [connectionName]
          : Array.from(connections.keys());

        const performanceData = [];

        for (const connName of connectionsToMonitor) {
          const connection = connections.get(connName);
          if (!connection) continue;

          const connectionMetrics = {
            connectionName: connName,
            databaseType: connection.type,
            health: {
              status: Math.random() > 0.1 ? 'healthy' : 'warning',
              activeConnections: Math.floor(Math.random() * (connection.pool?.max || 10)) + 1,
              maxConnections: connection.pool?.max || 10,
              connectionUtilization: `${Math.floor(Math.random() * 80) + 10}%`,
            },
            performance: {
              averageQueryTime: `${Math.floor(Math.random() * 200) + 50}ms`,
              queriesPerSecond: Math.floor(Math.random() * 100) + 10,
              slowestQuery: Math.floor(Math.random() * 5000) + 1000,
              cacheHitRatio: `${Math.floor(Math.random() * 30) + 70}%`,
            },
          };

          if (includeSlowQueries) {
            const slowQueries = queryHistory
              .filter(q => q.executionTime > 1000)
              .slice(-5)
              .map(q => ({
                query: q.query.length > 100 ? q.query.substring(0, 100) + '...' : q.query,
                executionTime: q.executionTime,
                timestamp: q.timestamp,
              }));

            (connectionMetrics as any).slowQueries = slowQueries;
          }

          performanceData.push(connectionMetrics);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  timePeriod: `${timePeriod}s`,
                  monitoredConnections: performanceData.length,
                  performanceData,
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Performance monitoring failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Create Backup - Create database backups
 */
function registerCreateBackupTool(server: McpServer) {
  server.registerTool(
    'create_backup',
    {
      title: 'Create Database Backup',
      description: 'Create database backups with compression and encryption options',
      inputSchema: {
        connectionName: z.string().describe('Database connection name'),
        backupName: z.string().optional().describe('Custom backup name'),
        compress: z.boolean().default(true).describe('Compress backup file'),
        includeData: z.boolean().default(true).describe('Include table data in backup'),
        tables: z.array(z.string()).optional().describe('Specific tables to backup'),
      },
    },
    async ({ connectionName, backupName, compress, includeData, tables }) => {
      try {
        const connection = connections.get(connectionName);
        if (!connection) {
          return {
            content: [
              {
                type: 'text',
                text: `Connection '${connectionName}' not found.`,
              },
            ],
            isError: true,
          };
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const finalBackupName = backupName || `${connectionName}_backup_${timestamp}`;

        // Mock backup process
        const backupSize = Math.floor(Math.random() * 1000000) + 100000; // 100KB - 1MB
        const compressedSize = compress ? Math.floor(backupSize * 0.3) : backupSize;

        const response = {
          success: true,
          backupName: finalBackupName,
          connection: connectionName,
          databaseType: connection.type,
          options: {
            compressed: compress,
            includeData,
            tableFilter: tables || 'all',
          },
          result: {
            filename: `${finalBackupName}.${connection.type === 'postgresql' ? 'sql' : connection.type === 'mysql' ? 'sql' : 'db'}${compress ? '.gz' : ''}`,
            originalSize: `${Math.floor(backupSize / 1024)}KB`,
            compressedSize: compress ? `${Math.floor(compressedSize / 1024)}KB` : undefined,
            compressionRatio: compress
              ? `${Math.floor((1 - compressedSize / backupSize) * 100)}%`
              : undefined,
            executionTime: `${Math.floor(Math.random() * 10000) + 1000}ms`,
            tablesBackedUp: tables?.length || Math.floor(Math.random() * 10) + 5,
          },
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
              text: `Backup creation failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Restore Backup - Restore database from backup
 */
function registerRestoreBackupTool(server: McpServer) {
  server.registerTool(
    'restore_backup',
    {
      title: 'Restore Database Backup',
      description: 'Restore database from backup file with safety checks',
      inputSchema: {
        connectionName: z.string().describe('Database connection name'),
        backupFile: z.string().describe('Backup file path or name'),
        force: z.boolean().default(false).describe('Force restore even if target database exists'),
        verify: z.boolean().default(true).describe('Verify backup integrity before restore'),
        createDatabase: z
          .boolean()
          .default(false)
          .describe('Create target database if it does not exist'),
      },
    },
    async ({ connectionName, backupFile, force, verify, createDatabase }) => {
      try {
        const connection = connections.get(connectionName);
        if (!connection) {
          return {
            content: [
              {
                type: 'text',
                text: `Connection '${connectionName}' not found.`,
              },
            ],
            isError: true,
          };
        }

        // Mock verification
        if (verify) {
          const verificationResult = {
            valid: Math.random() > 0.05, // 95% success rate
            fileSize: `${Math.floor(Math.random() * 1000) + 100}KB`,
            backupDate: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            databaseVersion: connection.type === 'postgresql' ? '14.5' : '8.0.28',
          };

          if (!verificationResult.valid) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      success: false,
                      error: 'Backup file verification failed',
                      verification: verificationResult,
                    },
                    null,
                    2
                  ),
                },
              ],
              isError: true,
            };
          }
        }

        // Mock restore process
        const restoreTime = Math.floor(Math.random() * 20000) + 5000; // 5-25 seconds

        const response = {
          success: true,
          connection: connectionName,
          backupFile,
          options: {
            force,
            verify,
            createDatabase,
          },
          result: {
            tablesRestored: Math.floor(Math.random() * 15) + 5,
            rowsRestored: Math.floor(Math.random() * 100000) + 10000,
            executionTime: `${restoreTime}ms`,
            databaseSize: `${Math.floor(Math.random() * 500) + 50}MB`,
          },
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
              text: `Backup restore failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Query Builder - Build complex SQL queries with validation
 */
function registerQueryBuilderTool(server: McpServer) {
  server.registerTool(
    'build_query',
    {
      title: 'SQL Query Builder',
      description: 'Build complex SQL queries with validation and optimization',
      inputSchema: {
        type: z.enum(['select', 'insert', 'update', 'delete']).describe('Query type'),
        table: z.string().describe('Target table name'),
        columns: z.array(z.string()).optional().describe('Columns for SELECT or INSERT'),
        where: z.record(z.any()).optional().describe('WHERE conditions'),
        joins: z
          .array(
            z.object({
              type: z.enum(['inner', 'left', 'right', 'full']),
              table: z.string(),
              on: z.string(),
            })
          )
          .optional()
          .describe('JOIN clauses'),
        orderBy: z
          .array(
            z.object({
              column: z.string(),
              direction: z.enum(['asc', 'desc']).default('asc'),
            })
          )
          .optional()
          .describe('ORDER BY clauses'),
        limit: z.number().optional().describe('LIMIT clause'),
        data: z.record(z.any()).optional().describe('Data for INSERT/UPDATE'),
      },
    },
    async ({ type, table, columns, where, joins, orderBy, limit, data }) => {
      try {
        let query = '';
        const params: any[] = [];

        switch (type) {
          case 'select': {
            const selectColumns = columns?.join(', ') || '*';
            query = `SELECT ${selectColumns} FROM ${table}`;

            if (joins) {
              for (const join of joins) {
                query += ` ${join.type.toUpperCase()} JOIN ${join.table} ON ${join.on}`;
              }
            }

            if (where) {
              const conditions = Object.entries(where).map(([key, value], index) => {
                params.push(value);
                return `${key} = $${index + 1}`;
              });
              query += ` WHERE ${conditions.join(' AND ')}`;
            }

            if (orderBy) {
              const orderClauses = orderBy.map(o => `${o.column} ${o.direction.toUpperCase()}`);
              query += ` ORDER BY ${orderClauses.join(', ')}`;
            }

            if (limit) {
              query += ` LIMIT ${limit}`;
            }
            break;
          }

          case 'insert': {
            if (!data) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Data is required for INSERT queries.',
                  },
                ],
                isError: true,
              };
            }

            const insertColumns = Object.keys(data);
            const insertValues = Object.values(data);
            const placeholders = insertValues.map((_, index) => `$${index + 1}`);

            query = `INSERT INTO ${table} (${insertColumns.join(', ')}) VALUES (${placeholders.join(', ')})`;
            params.push(...insertValues);
            break;
          }

          case 'update': {
            if (!data) {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'Data is required for UPDATE queries.',
                  },
                ],
                isError: true,
              };
            }

            const setClauses = Object.entries(data).map(([key, value], index) => {
              params.push(value);
              return `${key} = $${index + 1}`;
            });

            query = `UPDATE ${table} SET ${setClauses.join(', ')}`;

            if (where) {
              const conditions = Object.entries(where).map(([key, value], index) => {
                params.push(value);
                return `${key} = $${params.length}`;
              });
              query += ` WHERE ${conditions.join(' AND ')}`;
            }
            break;
          }

          case 'delete': {
            query = `DELETE FROM ${table}`;

            if (where) {
              const conditions = Object.entries(where).map(([key, value], index) => {
                params.push(value);
                return `${key} = $${index + 1}`;
              });
              query += ` WHERE ${conditions.join(' AND ')}`;
            } else {
              return {
                content: [
                  {
                    type: 'text',
                    text: 'WHERE clause is required for DELETE queries for safety.',
                  },
                ],
                isError: true,
              };
            }
            break;
          }
        }

        const response = {
          success: true,
          queryType: type,
          generatedQuery: query,
          parameters: params,
          validation: {
            syntaxValid: true,
            safetyChecks: type === 'delete' ? (where ? 'passed' : 'failed') : 'passed',
            estimatedCost: Math.floor(Math.random() * 1000),
          },
          suggestions: [
            'Consider adding indexes on WHERE clause columns',
            'Use LIMIT for large result sets',
            'Test with EXPLAIN for performance analysis',
          ],
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
              text: `Query building failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}

/**
 * Server Status - Get comprehensive server status
 */
function registerStatusTool(server: McpServer) {
  server.registerTool(
    'get_server_status',
    {
      title: 'Get Server Status',
      description: 'Get comprehensive database server status and statistics',
      inputSchema: {
        includeConnections: z.boolean().default(true).describe('Include connection details'),
        includeQueryHistory: z.boolean().default(false).describe('Include recent query history'),
        includePerformance: z.boolean().default(true).describe('Include performance metrics'),
      },
    },
    async ({ includeConnections, includeQueryHistory, includePerformance }) => {
      try {
        const status = {
          server: {
            name: SERVER_NAME,
            version: SERVER_VERSION,
            description: SERVER_DESCRIPTION,
            uptime: process.uptime(),
            status: 'running',
            tools: 7,
          },
          timestamp: new Date().toISOString(),
        };

        if (includeConnections) {
          (status as any).connections = {
            total: connections.size,
            configured: Array.from(connections.entries()).map(([name, config]) => ({
              name,
              type: config.type,
              database: config.database,
              host: config.host || 'N/A',
              poolConfig: config.pool,
            })),
          };
        }

        if (includeQueryHistory) {
          (status as any).queryHistory = {
            totalQueries: queryHistory.length,
            recentQueries: queryHistory.slice(-10).map(q => ({
              query: q.query.length > 50 ? q.query.substring(0, 50) + '...' : q.query,
              executionTime: q.executionTime,
              timestamp: q.timestamp,
            })),
          };
        }

        if (includePerformance) {
          const avgExecutionTime =
            queryHistory.length > 0
              ? queryHistory.reduce((sum, q) => sum + q.executionTime, 0) / queryHistory.length
              : 0;

          (status as any).performance = {
            totalQueries: queryHistory.length,
            averageExecutionTime: `${Math.floor(avgExecutionTime)}ms`,
            slowQueries: queryHistory.filter(q => q.executionTime > 1000).length,
            memoryUsage: {
              used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
              total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            },
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

function generateMockColumns(tableName: string): ColumnInfo[] {
  const baseColumns: ColumnInfo[] = [
    {
      name: 'id',
      type: 'integer',
      nullable: false,
      primaryKey: true,
    },
    {
      name: 'created_at',
      type: 'timestamp',
      nullable: false,
      primaryKey: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
    {
      name: 'updated_at',
      type: 'timestamp',
      nullable: false,
      primaryKey: false,
      defaultValue: 'CURRENT_TIMESTAMP',
    },
  ];

  // Add table-specific columns
  switch (tableName) {
    case 'users':
      return [
        ...baseColumns,
        { name: 'email', type: 'varchar(255)', nullable: false, primaryKey: false },
        { name: 'name', type: 'varchar(255)', nullable: false, primaryKey: false },
        {
          name: 'is_active',
          type: 'boolean',
          nullable: false,
          primaryKey: false,
          defaultValue: 'true',
        },
      ];
    case 'posts':
      return [
        ...baseColumns,
        { name: 'title', type: 'varchar(255)', nullable: false, primaryKey: false },
        { name: 'content', type: 'text', nullable: true, primaryKey: false },
        { name: 'user_id', type: 'integer', nullable: false, primaryKey: false },
        {
          name: 'published',
          type: 'boolean',
          nullable: false,
          primaryKey: false,
          defaultValue: 'false',
        },
      ];
    case 'comments':
      return [
        ...baseColumns,
        { name: 'content', type: 'text', nullable: false, primaryKey: false },
        { name: 'post_id', type: 'integer', nullable: false, primaryKey: false },
        { name: 'user_id', type: 'integer', nullable: false, primaryKey: false },
      ];
    default:
      return [
        ...baseColumns,
        { name: 'name', type: 'varchar(255)', nullable: false, primaryKey: false },
        { name: 'description', type: 'text', nullable: true, primaryKey: false },
      ];
  }
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
  registerConfigureConnectionTool(server);
  registerExecuteQueryTool(server);
  registerGetSchemaTool(server);
  registerRunMigrationTool(server);
  registerTransactionTool(server);
  registerMonitorPerformanceTool(server);
  registerCreateBackupTool(server);
  registerRestoreBackupTool(server);
  registerQueryBuilderTool(server);
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
    console.error(
      '🛠️ Tools: configure_connection, execute_query, get_schema, run_migration, manage_transaction, monitor_performance, create_backup, restore_backup, build_query, get_server_status'
    );
    console.error('📡 Ready to receive MCP requests...\n');

    // Create server
    const server = createServer();

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    console.error('✅ Database integration server connected successfully');
    console.error('💡 Available tools:');
    console.error('   • configure_connection - Setup database connections');
    console.error('   • execute_query - Execute SQL queries safely');
    console.error('   • get_schema - Inspect database schema');
    console.error('   • run_migration - Execute database migrations');
    console.error('   • manage_transaction - Handle database transactions');
    console.error('   • monitor_performance - Monitor database performance');
    console.error('   • create_backup - Create database backups');
    console.error('   • restore_backup - Restore from backups');
    console.error('   • build_query - Build complex SQL queries');
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
