/**
 * @fileoverview HTTP Transport Tests
 *
 * Comprehensive test suite for the HTTP transport implementation,
 * covering transport lifecycle, message handling, error scenarios,
 * and integration with the MCP protocol.
 *
 * @author MCP Boilerplate Team
 * @version 0.3.0
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import { HttpTransport, HttpTransportFactory } from '../../src/transport/http.js';
import { HttpMcpServer, HttpMcpServerFactory } from '../../src/transport/http-server.js';
import { McpTool, ToolResult, HttpTransportConfig } from '../../src/types/index.js';
import { z } from 'zod';

// Mock tool for testing
class TestTool implements McpTool {
  readonly name = 'test-tool';
  readonly description = 'Test tool for HTTP transport testing';
  readonly category = 'data' as const;
  readonly version = '1.0.0';
  readonly parameters = z.object({
    message: z.string(),
  });
  readonly examples = [];

  async execute(params: unknown): Promise<ToolResult> {
    const { message } = this.parameters.parse(params);
    return {
      success: true,
      data: { echo: message, timestamp: new Date().toISOString() },
    };
  }
}

class ErrorTool implements McpTool {
  readonly name = 'error-tool';
  readonly description = 'Tool that always throws errors';
  readonly category = 'data' as const;
  readonly version = '1.0.0';
  readonly parameters = z.object({});
  readonly examples = [];

  async execute(): Promise<ToolResult> {
    throw new Error('Test error');
  }
}

describe('HttpTransport', () => {
  let transport: HttpTransport;
  let testPort: number;

  beforeEach(() => {
    testPort = 8900 + Math.floor(Math.random() * 100); // Random port to avoid conflicts
  });

  afterEach(async () => {
    if (transport) {
      await transport.close();
    }
  });

  describe('Transport Lifecycle', () => {
    it('should create transport with default configuration', () => {
      transport = new HttpTransport();
      expect(transport).toBeDefined();
      expect(transport.sessionId).toBeDefined();
    });

    it('should create transport with custom configuration', () => {
      const config: Partial<HttpTransportConfig> = {
        port: testPort,
        host: 'localhost',
        basePath: '/test-mcp',
      };
      transport = new HttpTransport(config);
      expect(transport).toBeDefined();
    });

    it('should start and stop transport successfully', async () => {
      transport = new HttpTransport({ port: testPort, host: 'localhost' });

      await expect(transport.start()).resolves.toBeUndefined();
      await expect(transport.close()).resolves.toBeUndefined();
    });

    it('should throw error when starting already started transport', async () => {
      transport = new HttpTransport({ port: testPort, host: 'localhost' });

      await transport.start();
      await expect(transport.start()).rejects.toThrow('HTTP transport already started');
    });

    it('should handle port conflicts gracefully', async () => {
      const transport1 = new HttpTransport({ port: testPort, host: 'localhost' });
      const transport2 = new HttpTransport({ port: testPort, host: 'localhost' });

      await transport1.start();

      await expect(transport2.start()).rejects.toThrow();

      await transport1.close();
    });
  });

  describe('HTTP Endpoints', () => {
    let app: any;

    beforeEach(async () => {
      const tools = new Map<string, McpTool>();
      tools.set('test-tool', new TestTool());
      tools.set('error-tool', new ErrorTool());

      transport = new HttpTransport(
        {
          port: testPort,
          host: 'localhost',
          basePath: '/mcp',
          auth: { enabled: false },
        },
        tools
      );

      await transport.start();
      app = (transport as any)._app; // Access private app for testing
    });

    describe('Health Endpoint', () => {
      it('should return health status', async () => {
        const response = await request(app).get('/mcp/health').expect(200);

        expect(response.body).toMatchObject({
          status: 'healthy',
          sessionId: expect.any(String),
          uptime: expect.any(Number),
        });
      });
    });

    describe('Info Endpoint', () => {
      it('should return server information', async () => {
        const response = await request(app).get('/mcp/info').expect(200);

        expect(response.body).toMatchObject({
          name: 'MCP HTTP Transport',
          version: '0.3.0',
          protocol: 'mcp',
          transport: 'http',
          sessionId: expect.any(String),
          capabilities: expect.arrayContaining(['tools', 'rpc']),
        });
      });
    });

    describe('Tools Endpoint', () => {
      it('should list available tools', async () => {
        const response = await request(app).get('/mcp/tools').expect(200);

        expect(response.body).toMatchObject({
          tools: expect.arrayContaining([
            expect.objectContaining({
              name: 'test-tool',
              description: expect.any(String),
              category: 'data',
            }),
          ]),
          count: expect.any(Number),
        });
      });

      it('should execute tool successfully', async () => {
        const response = await request(app)
          .post('/mcp/tools/test-tool')
          .send({ message: 'Hello Test' })
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            echo: 'Hello Test',
            timestamp: expect.any(String),
          },
        });
      });

      it('should handle tool execution errors', async () => {
        const response = await request(app).post('/mcp/tools/error-tool').send({}).expect(500);

        expect(response.body).toMatchObject({
          error: 'Tool Execution Failed',
          message: expect.stringContaining('Test error'),
        });
      });

      it('should return 404 for non-existent tool', async () => {
        const response = await request(app).post('/mcp/tools/non-existent').send({}).expect(404);

        expect(response.body).toMatchObject({
          error: 'Tool Not Found',
          availableTools: expect.any(Array),
        });
      });
    });

    describe('JSON-RPC Endpoint', () => {
      it('should accept valid JSON-RPC request', async () => {
        const rpcRequest = {
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 1,
        };

        const response = await request(app).post('/mcp/rpc').send(rpcRequest).expect(202);

        expect(response.body).toMatchObject({
          jsonrpc: '2.0',
          result: { accepted: true },
          id: 1,
        });
      });

      it('should reject invalid JSON-RPC request', async () => {
        const invalidRequest = {
          method: 'test',
          // Missing jsonrpc field
        };

        const response = await request(app).post('/mcp/rpc').send(invalidRequest).expect(400);

        expect(response.body).toMatchObject({
          jsonrpc: '2.0',
          error: {
            code: -32600,
            message: 'Invalid Request',
          },
        });
      });
    });
  });

  describe('Authentication', () => {
    beforeEach(async () => {
      transport = new HttpTransport({
        port: testPort,
        host: 'localhost',
        basePath: '/mcp',
        auth: {
          enabled: true,
          type: 'apikey',
          apiKeys: ['test-key-123'],
          headerName: 'X-API-Key',
        },
      });

      await transport.start();
    });

    it('should allow access with valid API key', async () => {
      const app = (transport as any)._app;

      const response = await request(app)
        .get('/mcp/tools')
        .set('X-API-Key', 'test-key-123')
        .expect(200);

      expect(response.body.tools).toBeDefined();
    });

    it('should reject requests without API key', async () => {
      const app = (transport as any)._app;

      await request(app).get('/mcp/tools').expect(401);
    });

    it('should reject requests with invalid API key', async () => {
      const app = (transport as any)._app;

      await request(app).get('/mcp/tools').set('X-API-Key', 'invalid-key').expect(401);
    });

    it('should allow health check without authentication', async () => {
      const app = (transport as any)._app;

      await request(app).get('/mcp/health').expect(200);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(async () => {
      transport = new HttpTransport({
        port: testPort,
        host: 'localhost',
        basePath: '/mcp',
        auth: { enabled: false },
        rateLimit: {
          enabled: true,
          windowMs: 1000, // 1 second window
          maxRequests: 2, // Max 2 requests per second
        },
      });

      await transport.start();
    });

    it('should allow requests within rate limit', async () => {
      const app = (transport as any)._app;

      await request(app).get('/mcp/health').expect(200);

      await request(app).get('/mcp/health').expect(200);
    });

    it('should block requests exceeding rate limit', async () => {
      const app = (transport as any)._app;

      // Make maximum allowed requests
      await request(app).get('/mcp/health').expect(200);
      await request(app).get('/mcp/health').expect(200);

      // This should be rate limited
      await request(app).get('/mcp/health').expect(429);
    });
  });

  describe('CORS', () => {
    beforeEach(async () => {
      transport = new HttpTransport({
        port: testPort,
        host: 'localhost',
        basePath: '/mcp',
        cors: {
          enabled: true,
          origins: ['http://localhost:3000'],
          methods: ['GET', 'POST'],
          allowedHeaders: ['Content-Type'],
          credentials: false,
        },
      });

      await transport.start();
    });

    it('should include CORS headers for allowed origins', async () => {
      const app = (transport as any)._app;

      const response = await request(app)
        .get('/mcp/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should handle preflight OPTIONS requests', async () => {
      const app = (transport as any)._app;

      const response = await request(app)
        .options('/mcp/tools')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      transport = new HttpTransport({
        port: testPort,
        host: 'localhost',
        basePath: '/mcp',
        auth: { enabled: false },
      });

      await transport.start();
    });

    it('should return 404 for non-existent endpoints', async () => {
      const app = (transport as any)._app;

      const response = await request(app).get('/mcp/non-existent').expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        message: expect.stringContaining('not found'),
      });
    });

    it('should handle malformed JSON in request body', async () => {
      const app = (transport as any)._app;

      await request(app)
        .post('/mcp/rpc')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should include request ID in error responses', async () => {
      const app = (transport as any)._app;

      const response = await request(app).get('/mcp/non-existent').expect(404);

      expect(response.body.timestamp).toBeDefined();
      expect(response.headers['x-request-id']).toBeDefined();
    });
  });
});

describe('HttpTransportFactory', () => {
  it('should create basic transport', () => {
    const transport = HttpTransportFactory.create();
    expect(transport).toBeInstanceOf(HttpTransport);
  });

  it('should create transport with authentication', () => {
    const transport = HttpTransportFactory.createWithAuth(
      {},
      {
        enabled: true,
        type: 'apikey',
        apiKeys: ['test-key'],
      }
    );
    expect(transport).toBeInstanceOf(HttpTransport);
  });

  it('should create secure transport', () => {
    const transport = HttpTransportFactory.createSecure();
    expect(transport).toBeInstanceOf(HttpTransport);
  });
});

describe('HttpMcpServer Integration', () => {
  let server: HttpMcpServer;
  let testPort: number;

  beforeEach(() => {
    testPort = 8900 + Math.floor(Math.random() * 100);
  });

  afterEach(async () => {
    if (server && server.state === 'running') {
      await server.stop();
    }
  });

  it('should create and start HTTP MCP server', async () => {
    server = HttpMcpServerFactory.createDevelopment({
      name: 'test-server',
      version: '1.0.0',
      description: 'Test server',
      http: {
        port: testPort,
        host: 'localhost',
      },
    });

    server.registerTool(new TestTool());

    await expect(server.start()).resolves.toBeUndefined();
    expect(server.state).toBe('running');

    const status = server.getStatus();
    expect(status.transports.http.enabled).toBe(true);
    expect(status.transports.http.port).toBe(testPort);
  });

  it('should handle tool execution through HTTP MCP server', async () => {
    server = HttpMcpServerFactory.createDevelopment({
      name: 'test-server',
      version: '1.0.0',
      description: 'Test server',
      http: {
        port: testPort,
        host: 'localhost',
        auth: { enabled: false },
      },
    });

    server.registerTool(new TestTool());
    await server.start();

    const httpTransport = server.httpTransport;
    expect(httpTransport).toBeDefined();

    // Test tool execution via HTTP
    const app = (httpTransport as any)?._app;
    if (app) {
      const response = await request(app)
        .post('/mcp/tools/test-tool')
        .send({ message: 'Integration test' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          echo: 'Integration test',
        },
      });
    }
  });

  it('should support dual transport mode', async () => {
    server = HttpMcpServerFactory.createDevelopment({
      name: 'dual-transport-server',
      version: '1.0.0',
      description: 'Dual transport test server',
      enableStdio: true,
      http: {
        port: testPort,
        host: 'localhost',
      },
    });

    await server.start();

    const status = server.getStatus();
    expect(status.transports.http.enabled).toBe(true);
    expect(status.transports.stdio.enabled).toBe(true);
  });
});

describe('Transport Performance', () => {
  let transport: HttpTransport;
  let testPort: number;

  beforeEach(async () => {
    testPort = 8900 + Math.floor(Math.random() * 100);

    const tools = new Map<string, McpTool>();
    tools.set('test-tool', new TestTool());

    transport = new HttpTransport(
      {
        port: testPort,
        host: 'localhost',
        basePath: '/mcp',
        auth: { enabled: false },
        rateLimit: { enabled: false },
      },
      tools
    );

    await transport.start();
  });

  afterEach(async () => {
    if (transport) {
      await transport.close();
    }
  });

  it('should handle concurrent requests efficiently', async () => {
    const app = (transport as any)._app;
    const concurrentRequests = 10;

    const startTime = Date.now();

    const promises = Array.from({ length: concurrentRequests }, () =>
      request(app).post('/mcp/tools/test-tool').send({ message: 'Concurrent test' }).expect(200)
    );

    const responses = await Promise.all(promises);
    const endTime = Date.now();

    expect(responses).toHaveLength(concurrentRequests);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds

    responses.forEach(response => {
      expect(response.body.success).toBe(true);
    });
  });

  it('should respond to health checks quickly', async () => {
    const app = (transport as any)._app;

    const startTime = Date.now();

    await request(app).get('/mcp/health').expect(200);

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(100); // Should respond within 100ms
  });
});
