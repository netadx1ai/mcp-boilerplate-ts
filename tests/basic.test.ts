/**
 * @fileoverview Basic Test Suite
 *
 * Basic tests to verify Jest ES modules configuration and core functionality
 * of the MCP TypeScript boilerplate ecosystem.
 *
 * @author MCP Boilerplate Team
 * @version 1.0.0
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

// =============================================================================
// Basic Functionality Tests
// =============================================================================

describe('Basic TypeScript and Jest Configuration', () => {
  test('should support ES modules', () => {
    // Test that ES module imports work
    expect(typeof describe).toBe('function');
    expect(typeof test).toBe('function');
    expect(typeof expect).toBe('function');
  });

  test('should support async/await', async () => {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const start = Date.now();
    await delay(10);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(8); // Allow for timing variance
  });

  test('should support TypeScript types', () => {
    interface TestInterface {
      id: number;
      name: string;
      active: boolean;
    }

    const testObject: TestInterface = {
      id: 1,
      name: 'test',
      active: true,
    };

    expect(testObject.id).toBe(1);
    expect(testObject.name).toBe('test');
    expect(testObject.active).toBe(true);
  });

  test('should handle JSON operations', () => {
    const testData = {
      server: 'mcp-boilerplate-ts',
      version: '1.0.0',
      tools: ['echo', 'calculator', 'health'],
    };

    const jsonString = JSON.stringify(testData);
    const parsed = JSON.parse(jsonString);

    expect(parsed).toEqual(testData);
    expect(parsed.tools).toHaveLength(3);
  });
});

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('Utility Functions', () => {
  test('should generate unique IDs', () => {
    const generateId = () => `id_${Math.random().toString(36).substr(2, 9)}`;

    const id1 = generateId();
    const id2 = generateId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^id_[a-z0-9]{9}$/);
    expect(id2).toMatch(/^id_[a-z0-9]{9}$/);
  });

  test('should handle error objects', () => {
    const createError = (message: string) => new Error(message);

    const error = createError('Test error');

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Test error');
    expect(error.stack).toBeDefined();
  });

  test('should validate timestamps', () => {
    const now = new Date().toISOString();

    expect(now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(now)).toBeInstanceOf(Date);
  });
});

// =============================================================================
// Mock MCP Server Tests
// =============================================================================

describe('Mock MCP Server Structure', () => {
  interface MockTool {
    name: string;
    description: string;
    schema: Record<string, any>;
    handler: (args: any) => Promise<any>;
  }

  const mockTools: MockTool[] = [
    {
      name: 'echo',
      description: 'Echo back a message',
      schema: { message: 'string' },
      handler: async ({ message }) => ({ result: message }),
    },
    {
      name: 'add',
      description: 'Add two numbers',
      schema: { a: 'number', b: 'number' },
      handler: async ({ a, b }) => ({ result: a + b }),
    },
  ];

  test('should register and execute tools', async () => {
    const echoTool = mockTools.find(t => t.name === 'echo');
    const addTool = mockTools.find(t => t.name === 'add');

    expect(echoTool).toBeDefined();
    expect(addTool).toBeDefined();

    if (echoTool) {
      const echoResult = await echoTool.handler({ message: 'Hello' });
      expect(echoResult.result).toBe('Hello');
    }

    if (addTool) {
      const addResult = await addTool.handler({ a: 5, b: 3 });
      expect(addResult.result).toBe(8);
    }
  });

  test('should handle tool errors gracefully', async () => {
    const errorTool: MockTool = {
      name: 'error_test',
      description: 'Tool that throws an error',
      schema: {},
      handler: async () => {
        throw new Error('Intentional test error');
      },
    };

    let caughtError: Error | null = null;

    try {
      await errorTool.handler({});
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).toBeInstanceOf(Error);
    expect(caughtError?.message).toBe('Intentional test error');
  });
});

// =============================================================================
// Performance Tests
// =============================================================================

describe('Performance Tests', () => {
  test('should execute quickly', async () => {
    const start = Date.now();

    // Simulate some work
    const data = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: Math.random() }));
    const filtered = data.filter(item => item.value > 0.5);
    const mapped = filtered.map(item => ({ ...item, doubled: item.value * 2 }));

    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(100); // Should be very fast
    expect(mapped.length).toBeGreaterThan(0);
    expect(mapped.length).toBeLessThanOrEqual(1000);
  });

  test('should handle concurrent operations', async () => {
    const concurrentTasks = Array.from({ length: 10 }, async (_, i) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
      return `task-${i}`;
    });

    const start = Date.now();
    const results = await Promise.all(concurrentTasks);
    const elapsed = Date.now() - start;

    expect(results).toHaveLength(10);
    expect(elapsed).toBeLessThan(100); // Should complete quickly
    expect(results).toEqual(expect.arrayContaining([expect.stringMatching(/^task-\d+$/)]));
  });
});

// =============================================================================
// Integration Readiness Tests
// =============================================================================

describe('Integration Readiness', () => {
  test('should have required Node.js version', () => {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    expect(majorVersion).toBeGreaterThanOrEqual(18);
  });

  test('should support modern JavaScript features', () => {
    // Test optional chaining
    const obj = { a: { b: { c: 'value' } } };
    expect(obj.a?.b?.c).toBe('value');
    expect(obj.a?.b?.d).toBeUndefined();

    // Test nullish coalescing
    const nullValue = null;
    const undefinedValue = undefined;
    const zeroValue = 0;
    const emptyString = '';

    expect(nullValue ?? 'default').toBe('default');
    expect(undefinedValue ?? 'default').toBe('default');
    expect(zeroValue ?? 'default').toBe(0);
    expect(emptyString ?? 'default').toBe('');
  });

  test('should support destructuring and spread', () => {
    const source = { a: 1, b: 2, c: 3 };
    const { a, ...rest } = source;

    expect(a).toBe(1);
    expect(rest).toEqual({ b: 2, c: 3 });

    const extended = { ...source, d: 4 };
    expect(extended).toEqual({ a: 1, b: 2, c: 3, d: 4 });
  });
});

// =============================================================================
// Mock Server Response Tests
// =============================================================================

describe('Mock Server Responses', () => {
  test('should format MCP responses correctly', () => {
    const mockResponse = {
      content: [
        {
          type: 'text',
          text: 'Hello from MCP server',
        },
      ],
    };

    expect(mockResponse.content).toHaveLength(1);
    expect(mockResponse.content[0].type).toBe('text');
    expect(mockResponse.content[0].text).toBe('Hello from MCP server');
  });

  test('should handle error responses', () => {
    const mockErrorResponse = {
      content: [
        {
          type: 'text',
          text: 'An error occurred',
        },
      ],
      isError: true,
    };

    expect(mockErrorResponse.isError).toBe(true);
    expect(mockErrorResponse.content[0].text).toBe('An error occurred');
  });

  test('should handle complex data responses', () => {
    const complexData = {
      users: [
        { id: 1, name: 'Alice', roles: ['admin'] },
        { id: 2, name: 'Bob', roles: ['user'] },
      ],
      pagination: {
        page: 1,
        total: 2,
        hasMore: false,
      },
    };

    const mockResponse = {
      content: [
        {
          type: 'text',
          text: JSON.stringify(complexData, null, 2),
        },
      ],
    };

    const parsedContent = JSON.parse(mockResponse.content[0].text);

    expect(parsedContent.users).toHaveLength(2);
    expect(parsedContent.users[0].name).toBe('Alice');
    expect(parsedContent.pagination.total).toBe(2);
  });
});

// =============================================================================
// Environment and Configuration Tests
// =============================================================================

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should handle environment variables', () => {
    process.env.TEST_VAR = 'test_value';

    expect(process.env.TEST_VAR).toBe('test_value');
    expect(process.env.NONEXISTENT_VAR).toBeUndefined();
  });

  test('should detect environment type', () => {
    // Test NODE_ENV detection
    process.env.NODE_ENV = 'test';
    expect(process.env.NODE_ENV).toBe('test');

    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';

    expect(isDevelopment).toBe(false);
    expect(isProduction).toBe(false);
    expect(isTest).toBe(true);
  });
});

// =============================================================================
// Resource Management Tests
// =============================================================================

describe('Resource Management', () => {
  test('should manage memory efficiently', () => {
    const initialMemory = process.memoryUsage();

    // Create some data
    const largeArray = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      data: `item-${i}`,
      timestamp: new Date().toISOString(),
    }));

    expect(largeArray).toHaveLength(10000);

    // Memory should not be excessive
    const currentMemory = process.memoryUsage();
    const heapDiff = currentMemory.heapUsed - initialMemory.heapUsed;

    // Should use less than 50MB for this test data
    expect(heapDiff).toBeLessThan(50 * 1024 * 1024);
  });

  test('should handle cleanup properly', () => {
    let cleanupCalled = false;

    const mockCleanup = () => {
      cleanupCalled = true;
    };

    // Simulate resource allocation and cleanup
    const resource = { cleanup: mockCleanup };
    resource.cleanup();

    expect(cleanupCalled).toBe(true);
  });
});

// =============================================================================
// System Information Tests
// =============================================================================

describe('System Information', () => {
  test('should provide system details', () => {
    expect(process.platform).toBeDefined();
    expect(process.arch).toBeDefined();
    expect(process.version).toMatch(/^v\d+\.\d+\.\d+/);
    expect(process.uptime()).toBeGreaterThan(0);
  });

  test('should track timing accurately', () => {
    const start = process.hrtime.bigint();

    // Small delay to ensure measurable time difference
    for (let i = 0; i < 1000; i++) {
      Math.random();
    }

    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100); // Should be very fast
  });
});
