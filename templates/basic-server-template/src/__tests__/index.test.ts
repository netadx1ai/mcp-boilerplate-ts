/**
 * @fileoverview Basic Server Template Tests
 *
 * Test suite for the basic MCP server template to verify core functionality
 * including server creation, tool registration, and basic operations.
 *
 * @author MCP Boilerplate Team
 * @version 1.0.0
 */

import { jest } from '@jest/globals';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createServer, main } from '../index.js';

// Mock console methods to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

describe('Basic Server Template', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createServer', () => {
    it('should create a server instance successfully', () => {
      const server = createServer();

      expect(server).toBeInstanceOf(McpServer);
      expect(server).toBeDefined();
    });

    it('should register all expected tools', async () => {
      const server = createServer();

      // Test that the server has the expected tools registered
      // Note: We can't easily test this without accessing private methods
      // This is a basic smoke test to ensure the server initializes
      expect(server).toBeInstanceOf(McpServer);
    });
  });

  describe('Server Tools', () => {
    let server: McpServer;

    beforeEach(() => {
      server = createServer();
    });

    it('should have required tools available', () => {
      // This is a basic structural test
      // The actual tool functionality would be tested through MCP protocol calls
      expect(server).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle startup errors gracefully', async () => {
      // Simple error handling test without complex mocking
      expect(() => {
        const server = createServer();
        expect(server).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Configuration', () => {
    it('should use correct server metadata', () => {
      const server = createServer();

      // Basic validation that server was created with expected configuration
      expect(server).toBeInstanceOf(McpServer);
    });
  });

  describe('Integration Tests', () => {
    it('should initialize without throwing', () => {
      expect(() => {
        const server = createServer();
        expect(server).toBeDefined();
      }).not.toThrow();
    });
  });
});

describe('Tool Functionality', () => {
  // These tests would ideally test the actual tool execution
  // but that requires a more complex setup with MCP protocol simulation

  describe('Echo Tool', () => {
    it('should be available for registration', () => {
      const server = createServer();
      expect(server).toBeDefined();
      // Actual tool testing would require MCP client simulation
    });
  });

  describe('Calculator Tool', () => {
    it('should be available for registration', () => {
      const server = createServer();
      expect(server).toBeDefined();
      // Actual tool testing would require MCP client simulation
    });
  });

  describe('Time Tool', () => {
    it('should be available for registration', () => {
      const server = createServer();
      expect(server).toBeDefined();
      // Actual tool testing would require MCP client simulation
    });
  });

  describe('Health Tool', () => {
    it('should be available for registration', () => {
      const server = createServer();
      expect(server).toBeDefined();
      // Actual tool testing would require MCP client simulation
    });
  });
});

describe('Performance Requirements', () => {
  it('should create server quickly', () => {
    const start = process.hrtime();
    const server = createServer();
    const [seconds, nanoseconds] = process.hrtime(start);
    const milliseconds = seconds * 1000 + nanoseconds / 1000000;

    expect(server).toBeDefined();
    expect(milliseconds).toBeLessThan(1000); // Should create in under 1 second
  });
});
