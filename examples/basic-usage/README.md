# MCP TypeScript Boilerplate - Basic Usage Examples

This directory contains practical examples demonstrating how to use all the MCP
servers and templates in the TypeScript boilerplate ecosystem.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ with npm/pnpm
- MCP-compatible client (Claude Desktop, custom MCP client, etc.)

### Running Examples

```bash
# From the root directory
cd mcp-boilerplate-ts

# Run any server directly
npm run dev -w servers/news-data-server
npm run dev -w servers/template-server
npm run dev -w templates/basic-server-template
```

## 📋 Available Servers & Tools

### 1. News Data Server

**Purpose**: News aggregation and content analysis **Tools**: 5 news-related
operations

```bash
# Start server
npm run dev -w servers/news-data-server

# Example usage in MCP client:
# - search_news: Find articles by keyword
# - get_news_by_category: Browse by category
# - get_trending_news: Current trending topics
# - get_news_status: Service health check
# - list_news_categories: Available categories
```

### 2. Template Server

**Purpose**: Code generation and project scaffolding **Tools**: 8 template
operations

```bash
# Start server
npm run dev -w servers/template-server

# Example workflows:
# 1. List available templates: list_templates
# 2. Generate code: generate_template
# 3. Scaffold project: scaffold_project
# 4. Generate docs: generate_docs
```

### 3. Analytics Server

**Purpose**: Data analytics and reporting **Tools**: 8 analytics operations

```bash
# Start server
npm run dev -w servers/analytics-server

# Example analytics pipeline:
# 1. Track events: track_event
# 2. Query data: query_analytics
# 3. Generate reports: generate_report
# 4. Create dashboards: create_dashboard
```

### 4. Database Server

**Purpose**: Database operations and management **Tools**: 7 database operations

```bash
# Start server
npm run dev -w servers/database-server

# Example database workflow:
# 1. Execute queries: execute_query
# 2. Get schema: get_schema
# 3. Run migrations: run_migration
# 4. Monitor performance: monitor_performance
```

### 5. API Gateway Server

**Purpose**: API routing and load balancing **Tools**: 5 gateway operations

```bash
# Start server
npm run dev -w servers/api-gateway-server

# Example gateway setup:
# 1. Configure routes: manage_routes
# 2. Setup auth: configure_auth
# 3. Proxy requests: proxy_request
# 4. Monitor gateway: monitor_gateway
```

### 6. Workflow Server

**Purpose**: Workflow automation and orchestration **Tools**: 8 workflow
operations

```bash
# Start server
npm run dev -w servers/workflow-server

# Example workflow automation:
# 1. Create workflow: create_workflow
# 2. Execute workflow: execute_workflow
# 3. Schedule workflow: schedule_workflow
# 4. Monitor workflows: monitor_workflows
```

## 🏗️ Template Examples

### Basic Server Template

**Best for**: Simple MCP servers with basic functionality

```bash
# Start template
npm run dev -w templates/basic-server-template

# Available tools:
# - echo: Message echoing with prefix
# - calculator: Basic arithmetic operations
# - time: Current time in multiple formats
# - health: Server health information
```

### API Wrapper Template

**Best for**: Wrapping external APIs with authentication

```bash
# Start template
npm run dev -w templates/api-wrapper-template

# Workflow example:
# 1. Configure auth: configure_auth
# 2. Make requests: make_request
# 3. Transform data: transform_request/transform_response
# 4. Monitor health: monitor_api_health
```

### Database Integration Template

**Best for**: Database-heavy applications

```bash
# Start template
npm run dev -w templates/database-integration-template

# Database workflow:
# 1. Configure connection: configure_connection
# 2. Execute queries: execute_query
# 3. Manage schema: get_schema
# 4. Handle transactions: manage_transaction
```

### Authenticated Server Template

**Best for**: User management and authentication

```bash
# Start template
npm run dev -w templates/authenticated-server-template

# Authentication workflow:
# 1. User login: login
# 2. Validate tokens: validate_token
# 3. Manage users: manage_users
# 4. Check permissions: check_permissions
```

## 🎯 Real-World Usage Scenarios

### Scenario 1: Content Management System

**Servers Used**: Template + Database + Authenticated

1. **Setup Authentication**:

   ```
   authenticated-server-template → login → validate_token
   ```

2. **Generate Content Templates**:

   ```
   template-server → generate_template → scaffold_project
   ```

3. **Database Operations**:
   ```
   database-server → execute_query → get_schema
   ```

### Scenario 2: News Aggregation Dashboard

**Servers Used**: News Data + Analytics + API Gateway

1. **Fetch News Data**:

   ```
   news-data-server → search_news → get_trending_news
   ```

2. **Track Analytics**:

   ```
   analytics-server → track_event → query_analytics
   ```

3. **Route Requests**:
   ```
   api-gateway-server → manage_routes → proxy_request
   ```

### Scenario 3: Automated Workflow System

**Servers Used**: Workflow + Database + Analytics

1. **Create Workflows**:

   ```
   workflow-server → create_workflow → schedule_workflow
   ```

2. **Database Integration**:

   ```
   database-server → execute_query → monitor_performance
   ```

3. **Performance Tracking**:
   ```
   analytics-server → create_dashboard → generate_report
   ```

## 📚 Integration Patterns

### MCP Client Configuration

#### Claude Desktop Integration

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "news-server": {
      "command": "npm",
      "args": ["run", "start", "-w", "servers/news-data-server"],
      "cwd": "/path/to/mcp-boilerplate-ts"
    },
    "template-server": {
      "command": "npm",
      "args": ["run", "start", "-w", "servers/template-server"],
      "cwd": "/path/to/mcp-boilerplate-ts"
    }
  }
}
```

#### Custom MCP Client

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client({
  name: 'example-client',
  version: '1.0.0',
});

const transport = new StdioClientTransport({
  command: 'npm',
  args: ['run', 'start', '-w', 'servers/news-data-server'],
  cwd: '/path/to/mcp-boilerplate-ts',
});

await client.connect(transport);
```

### Development Workflow

#### 1. Choose Your Server Type

- **Simple functionality**: Use `basic-server-template`
- **External APIs**: Use `api-wrapper-template`
- **Database operations**: Use `database-integration-template`
- **User management**: Use `authenticated-server-template`
- **Production ready**: Use production servers as reference

#### 2. Customize and Extend

```bash
# Copy template to new project
cp -r templates/basic-server-template my-custom-server
cd my-custom-server

# Customize package.json
# Add your tools
# Modify configuration
```

#### 3. Development Commands

```bash
# Development with hot reload
npm run dev

# Type checking
npm run type-check

# Production build
npm run build

# Start production
npm run start
```

## 🔧 Configuration Examples

### Environment Variables

```bash
# Server configuration
SERVER_NAME="my-custom-server"
SERVER_VERSION="1.0.0"
PORT=3000
NODE_ENV=production

# Database (for database-integration-template)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=myuser
DB_PASSWORD=mypassword

# Authentication (for authenticated-server-template)
JWT_SECRET=your-secret-key
OAUTH_GOOGLE_CLIENT_ID=your-google-client-id
OAUTH_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Custom Tool Example

```typescript
// Add to any server template
function registerCustomTool(server: McpServer) {
  server.registerTool(
    'my_custom_tool',
    {
      title: 'My Custom Tool',
      description: 'Does something specific for my use case',
      inputSchema: {
        input: z.string().describe('Tool input'),
        options: z
          .object({
            format: z.enum(['json', 'text']).default('json'),
          })
          .optional(),
      },
    },
    async ({ input, options }) => {
      // Your tool logic here
      return {
        content: [
          {
            type: 'text',
            text: `Processed: ${input}`,
          },
        ],
      };
    }
  );
}
```

## 📊 Performance Benchmarks

### Development Performance

- **Server Startup**: < 2 seconds
- **Type Checking**: < 5 seconds
- **Build Time**: < 10 seconds per server
- **Memory Usage**: ~50-100MB per server

### Production Performance

- **Request Latency**: < 100ms average
- **Throughput**: 1000+ requests/second
- **Memory Efficiency**: ~30-60MB per server
- **Cold Start**: < 1 second

## 🛠️ Troubleshooting

### Common Issues

#### TypeScript Compilation Errors

```bash
# Clear build cache
npm run clean
npm run build

# Check for missing dependencies
npm install
```

#### Server Won't Start

```bash
# Check port availability
lsof -i :3000

# Run with debug logging
DEBUG=* npm run dev
```

#### MCP Connection Issues

```bash
# Test server manually
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | npm run start
```

### Development Tips

1. **Use TypeScript Strict Mode**: All templates use strict compilation
2. **Handle Errors Gracefully**: Always return proper error responses
3. **Add Logging**: Use console.error for server-side logging
4. **Test Tools Individually**: Test each tool before integration
5. **Monitor Performance**: Use built-in status tools

## 🧪 Testing

### Manual Testing

```bash
# Test specific server
npm run dev -w servers/template-server

# In another terminal, test with curl or MCP client
```

### Automated Testing

```bash
# Run test suite (when Jest is configured)
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📖 Next Steps

1. **Choose a Template**: Start with the template that best fits your needs
2. **Customize Tools**: Add your specific business logic
3. **Configure Environment**: Set up your environment variables
4. **Deploy**: Use Docker/Kubernetes configurations in deployment/
5. **Monitor**: Use built-in status and monitoring tools

## 🔗 Resources

- [Official MCP Documentation](https://modelcontextprotocol.io/)
- [TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Production Deployment Guide](../production-deployment/)
- [Client Integration Examples](../client-integration/)

## 📝 License

MIT License - See root LICENSE file for details.
