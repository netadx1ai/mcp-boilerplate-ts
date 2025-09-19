# MCP Server Ecosystem - Official TypeScript SDK

[![TypeScript](https://img.shields.io/badge/typescript-5.2+-blue.svg)](https://www.typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![MCP SDK](https://img.shields.io/badge/MCP%20SDK-v1.0.0-green.svg)](https://github.com/modelcontextprotocol/typescript-sdk)
[![Node.js](https://img.shields.io/badge/node-18+-brightgreen.svg)](https://nodejs.org)
[![Transport Compliance](https://img.shields.io/badge/Transport-stdio%20%7C%20HTTP-brightgreen.svg)](docs/HTTP_TRANSPORT.md)
[![NetADX](https://img.shields.io/badge/Powered%20by-NetADX.ai-purple.svg)](https://netadx.ai)

A production-ready MCP (Model Context Protocol) server ecosystem built on the official TypeScript SDK, delivering specialized servers, reusable templates, HTTP transport support, and complete deployment infrastructure.

> 🚀 **Professional AI Solutions**: Need custom AI integrations? [NetADX.ai](https://netadx.ai) offers enterprise AI customizer services, from proof-of-concept to production deployment. Transform your business with tailored AI solutions!

> 🦀 **Looking for Rust?** Check out our [Rust version](https://github.com/netadx1ai/mcp-boilerplate-rust) for native performance and minimal resource usage with the same features and API compatibility!

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/netadx1ai/mcp-boilerplate-ts.git
cd mcp-boilerplate-ts
npm install

# Build all servers
npm run build

# Run a server
npm run dev --workspace=servers/news-data-server

# Test HTTP transport
curl http://localhost:8001/mcp/health
curl http://localhost:8001/mcp/tools
```

## 🌐 Transport Support

This ecosystem supports multiple MCP transport layers:

### Standard Transport
- **Stdio Transport**: Standard MCP communication via stdin/stdout
- **Compatible with all MCP clients** including Claude Desktop, MCP Inspector

### HTTP Transport ✨ NEW
- **REST API Endpoints**: Direct HTTP access to tools and server status
- **JSON-RPC over HTTP**: Standard MCP protocol over HTTP POST
- **Authentication**: API key, JWT, Bearer token support
- **OpenAPI Documentation**: Auto-generated Swagger docs at `/docs`
- **Production Ready**: Rate limiting, CORS, security headers

```bash
# HTTP transport examples
curl http://localhost:8000/mcp/health              # Server health
curl http://localhost:8000/mcp/tools               # List tools
curl -X POST http://localhost:8000/mcp/tools/echo  # Execute tool
curl http://localhost:8000/docs                    # API documentation

# Start HTTP-enabled server example
npm run example:http:dev
```

**📚 HTTP Transport Documentation**: [Complete HTTP Transport Guide](docs/HTTP_TRANSPORT.md)

## 📋 Production Servers

| Server | Purpose | Tools | Port | HTTP Support |
|--------|---------|-------|------|--------------|
| **news-data-server** | Real-time news & trends | 5 tools | 8001 | ✅ Stdio + HTTP |
| **template-server** | Content templates & rendering | 7 tools | 8002 | ✅ Stdio + HTTP |
| **analytics-server** | Metrics & performance data | 7 tools | 8003 | ✅ Stdio + HTTP |
| **database-server** | Query & data access | 7 tools | 8004 | ✅ Stdio + HTTP |
| **api-gateway-server** | External API integration | 5 tools | 8005 | ✅ Stdio + HTTP |
| **workflow-server** | Task automation | 7 tools | 8006 | ✅ Stdio + HTTP |

### News Data Server
Real-time news and trends data provider with multi-language support.

```bash
cd servers/news-data-server
npm run dev

# Test API
curl -X POST http://localhost:8001/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "search_news", "arguments": {"query": "AI", "limit": 5}}'
```

**Available Tools**: `search_news`, `get_category_news`, `get_trending_news`, `get_categories`, `get_server_status`

### Template Server
Content templates and structure provider with Handlebars rendering.

```bash
cd servers/template-server
npm run dev

# Test API
curl -X POST http://localhost:8002/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "render_template", "arguments": {"template_id": "blog_post", "params": {"title": "My Blog"}}}'
```

**Available Tools**: `list_templates`, `get_template`, `render_template`, `validate_template_params`, `create_template`, `get_categories`

### Analytics Server
Metrics and performance data provider with business intelligence.

```bash
cd servers/analytics-server
npm run dev

# Test API
curl -X POST http://localhost:8003/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"name": "get_content_metrics", "arguments": {"content_id": "blog_123", "period": "week"}}'
```

**Available Tools**: `get_content_metrics`, `get_audience_insights`, `get_engagement_trends`, `generate_analytics_report`, `get_available_metrics`

## 🛠️ Server Templates

Copy-paste ready templates for rapid MCP server development:

### Basic Server Template
```bash
cd templates/basic-server-template
npm run dev
```
- Minimal MCP server implementation
- 4 example tools with async patterns
- Complete development setup

### API Wrapper Template
```bash
cd templates/api-wrapper-template
npm run dev
```
- External API integration patterns
- 5 authentication methods (API Key, OAuth, Bearer, Basic, Custom)
- Rate limiting and circuit breaker

### Database Integration Template
```bash
cd templates/database-integration-template
npm run dev
```
- Multi-database support (PostgreSQL, MySQL, SQLite)
- SQL injection protection
- Connection pooling patterns

### Authenticated Server Template
```bash
cd templates/authenticated-server-template
npm run dev
```
- OAuth integration examples
- Session management
- Authorization middleware

## 🚀 Deployment

### Docker
```bash
cd deployment/docker
./build.sh --build-all
./build.sh --dev-up
```

### Kubernetes
```bash
cd deployment/kubernetes
./deploy.sh --apply-all
```

### Monitoring
```bash
cd deployment/monitoring
./deploy.sh --monitoring
```

## 📖 Documentation

- **[Server Development Guide](docs/SERVER_DEVELOPMENT_GUIDE.md)** - Build custom servers
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Docker + Kubernetes
- **[Performance Guide](docs/PERFORMANCE_GUIDE.md)** - Optimization tips
- **[Security Guide](docs/SECURITY_GUIDE.md)** - Security best practices
- **[API Reference](docs/API_REFERENCE.md)** - Complete API documentation

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm 8+ (or pnpm/yarn)
- Docker (for deployment)
- Kubernetes (optional, for production)

### Build
```bash
# Install dependencies
npm install

# Build all servers
npm run build

# Run tests
npm test

# Quality check
npm run quality-check

# Development server with hot reload
npm run dev --workspace=servers/news-data-server
```

### Create Your Own Server
1. Copy a template:
```bash
cp -r templates/basic-server-template servers/my-server
cd servers/my-server
```

2. Implement your tools:
```typescript
import { McpTool, ToolResult } from '@/types';
import { z } from 'zod';

export class MyTool implements McpTool {
  readonly name = 'my_tool';
  readonly description = 'My custom tool';
  readonly category = 'utility';
  readonly version = '1.0.0';
  readonly examples = [];
  
  readonly parameters = z.object({
    input: z.string().describe('Input parameter'),
  });

  async execute(params: unknown): Promise<ToolResult> {
    const { input } = this.parameters.parse(params);
    
    // Your tool logic here
    return {
      success: true,
      data: { result: `Processed: ${input}` },
      metadata: {
        executionTime: Date.now(),
        timestamp: new Date().toISOString(),
      },
    };
  }
}
```

3. Register with server:
```typescript
import { createServerBuilder } from '@/core';
import { MyTool } from './tools/MyTool';

async function main() {
  const server = await createServerBuilder()
    .withConfig({ 
      name: 'my-server',
      port: 8007,
      description: 'My custom MCP server' 
    })
    .withTool(new MyTool())
    .build();
    
  await server.start();
}
```

## 🏗️ Architecture

Built on the official TypeScript SDK with clean separation of concerns:

```
mcp-boilerplate-ts/
├── src/
│   ├── core/           # Core server implementation
│   ├── types/          # Shared TypeScript definitions
│   ├── utils/          # Common utilities
│   └── shared/         # Shared components
├── servers/            # Production MCP servers
├── templates/          # Reusable server templates
├── deployment/         # Docker + K8s + monitoring
├── examples/           # Integration examples
├── docs/              # Comprehensive documentation
└── tests/             # Integration test suite
```

### Key Design Principles
- **Official SDK**: Built on @modelcontextprotocol/sdk
- **TypeScript First**: Full type safety and IntelliSense
- **Production Ready**: Enterprise-grade quality and security
- **Template Driven**: Rapid development through templates
- **Deployment Focused**: Complete automation and monitoring
- **Community First**: Open source and contribution-friendly

## 📊 Performance

- **Response Times**: < 50ms (production verified)
- **Build Times**: 3-8 seconds per server
- **Memory Usage**: < 100MB per server
- **Startup Time**: < 2 seconds
- **Test Suite**: 100% pass rate, < 5 seconds execution

## 🔒 Security

- ✅ Input validation with Zod schemas
- ✅ Rate limiting and circuit breakers
- ✅ Secure authentication patterns
- ✅ CORS configuration
- ✅ Container security (non-root, read-only)
- ✅ Kubernetes Pod Security Standards
- ✅ Dependency vulnerability scanning

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific server tests
npm test --workspace=servers/news-data-server
```

### Test Structure
- **Unit Tests**: Individual tool and component testing
- **Integration Tests**: Full server testing with real MCP protocol
- **E2E Tests**: Complete workflow testing
- **Performance Tests**: Load testing and benchmarking

## 📦 Package Management

This project uses npm workspaces for efficient dependency management:

```bash
# Install dependencies for all packages
npm install

# Install for specific workspace
npm install --workspace=servers/news-data-server

# Run command in specific workspace
npm run build --workspace=templates/basic-server-template

# Run command in all workspaces
npm run test --workspaces
```

## 🔍 Debugging

### Development Tools
```bash
# Start with debugging
npm run dev:debug --workspace=servers/news-data-server

# Type checking
npm run type-check

# Linting
npm run lint

# Code formatting
npm run format
```

### Logging
All servers include structured logging with correlation IDs:

```typescript
// Automatic request correlation
logger.info('Processing request', { 
  requestId: 'req_123',
  tool: 'search_news',
  params: { query: 'AI' }
});

// Performance logging
await logTiming(logger, 'database_query', async () => {
  return await db.query('SELECT * FROM articles');
});
```

### Metrics & Monitoring
Built-in metrics collection with Prometheus export:

```bash
# Get metrics endpoint
curl http://localhost:8001/metrics

# Health check
curl http://localhost:8001/health
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and test: `npm run quality-check`
4. Submit a pull request

### Development Standards
- All code must pass ESLint with zero warnings
- All tests must pass: `npm test`
- Format code: `npm run format`
- Type check: `npm run type-check`
- Document public APIs with TSDoc examples

## 🚀 Enterprise AI Solutions by NetADX.ai

Looking to accelerate your AI journey? [**NetADX.ai**](https://netadx.ai) offers comprehensive AI customizer services to transform your business:

### 🎯 Our Services
- **Custom AI Model Development** - Tailored models for your specific use cases
- **AI Integration Consulting** - Seamless integration with existing systems
- **Proof-of-Concept Development** - Rapid prototyping and validation
- **Production Deployment** - Enterprise-grade AI solutions at scale
- **Training & Support** - Comprehensive team training and ongoing support

### 🌟 Why Choose NetADX.ai?
- **Proven Expertise** - Deep experience in AI/ML and enterprise software
- **Open Source First** - Building on solid, community-driven foundations
- **End-to-End Solutions** - From concept to production deployment
- **Industry Agnostic** - Serving healthcare, finance, retail, manufacturing, and more
- **Scalable Architecture** - Solutions that grow with your business

### 📞 Get Started Today
Ready to unlock the power of AI for your organization? 

**🌐 Visit**: [https://netadx.ai](https://netadx.ai)  
**📧 Contact**: [hello@netadx.ai](mailto:hello@netadx.ai)  
**📅 Book Consultation**: Free 30-minute discovery call available

*"Empowering businesses through intelligent automation and custom AI solutions"*

---

## 🔄 Rust Version Available

This TypeScript implementation has a companion [Rust version](https://github.com/netadx1ai/mcp-boilerplate-rust) that provides:

- **Same API**: Identical tool interfaces and responses
- **Same Architecture**: Equivalent server templates and deployment options
- **Superior Performance**: Native binary performance with minimal resource usage
- **Systems Programming**: Direct access to system resources and lower-level control
- **Zero Runtime Dependencies**: Self-contained executables

### Migration Between Versions
Both versions are designed for seamless migration:

- **Identical APIs**: Same tool names, parameters, and response formats
- **Compatible Configs**: Docker and Kubernetes deployments work for both
- **Shared Protocols**: Full MCP specification compliance
- **Equivalent Features**: All servers and templates available in both languages

### Key Differences
- **Language**: TypeScript vs Rust
- **Runtime**: Node.js vs native binary
- **Package Manager**: npm workspaces vs Cargo workspace
- **Testing**: Jest vs Rust's built-in test framework
- **Performance**: ~50ms vs ~20ms response times
- **Memory**: ~100MB vs ~30MB per server

## 📄 License

Licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [Official TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) for the excellent implementation
- [Model Context Protocol](https://modelcontextprotocol.io/) for the specification
- [TypeScript Community](https://www.typescriptlang.org/community) for the amazing ecosystem
- [Rust Version](https://github.com/netadx1ai/mcp-boilerplate-rust) for the architectural foundation
- [NetADX.ai](https://netadx.ai) for sponsoring open source development and enterprise AI innovation

---

**Ready for Production** | **Enterprise Quality** | **TypeScript Native** | **Powered by [NetADX.ai](https://netadx.ai)**

Start building your MCP integration today! 🚀

### 🌟 Open Source Commitment
This project is part of NetADX.ai's commitment to open source innovation. We believe in:
- **Transparent Development** - All code is open and community-driven
- **Knowledge Sharing** - Contributing to the global AI ecosystem
- **Collaborative Growth** - Building better solutions together
- **Accessible Technology** - Making enterprise-grade AI tools available to everyone

Join our mission to democratize AI technology while offering professional services for those who need customized solutions.

## 🆚 Rust vs TypeScript Comparison

| Feature | Rust Version | TypeScript Version |
|---------|-------------|-------------------|
| **Performance** | ~20ms response | ~50ms response |
| **Memory Usage** | ~30MB per server | ~100MB per server |
| **Build Time** | 4-9 seconds | 3-8 seconds |
| **Type Safety** | Compile-time | Compile-time |
| **Runtime** | Native binary | Node.js |
| **Ecosystem** | Cargo crates | npm packages |
| **Debugging** | GDB/LLDB | Chrome DevTools |
| **Hot Reload** | Manual restart | Automatic |
| **IDE Support** | Good | Excellent |
| **Learning Curve** | Steep | Moderate |

Choose based on your team's expertise and performance requirements!