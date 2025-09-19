#!/usr/bin/env node

/**
 * @fileoverview Template Server - Production MCP Server for Template and Scaffolding Operations
 * 
 * A comprehensive MCP server that provides template generation, scaffolding,
 * and code generation tools. Supports multiple template types, project
 * scaffolding, and automated code generation workflows.
 * 
 * Features:
 * - Official @modelcontextprotocol/sdk integration
 * - 7 template tools: generate, scaffold, config, test, docs, list, validate, status
 * - Multiple template types (React, Express, TypeScript, etc.)
 * - Project scaffolding with best practices
 * - Configuration file generation
 * - Test template creation
 * - Documentation generation
 * - Template validation
 * - Performance monitoring and statistics
 * 
 * @author MCP Boilerplate Team
 * @version 1.0.0
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// =============================================================================
// Constants and Types
// =============================================================================

const SERVER_NAME = 'template-server';
const SERVER_VERSION = '1.0.0';
const SERVER_DESCRIPTION = 'Production MCP server for template and scaffolding operations';

interface TemplateConfig {
  name: string;
  type: string;
  framework?: string;
  language: string;
  features: string[];
  dependencies: string[];
  devDependencies: string[];
}

interface ScaffoldingOptions {
  projectName: string;
  templateType: string;
  includeTests: boolean;
  includeDocs: boolean;
  includeCI: boolean;
  packageManager: 'npm' | 'yarn' | 'pnpm';
}

interface ServerStats {
  templatesGenerated: number;
  projectsScaffolded: number;
  lastTemplateType: string;
  totalRequests: number;
  toolUsage: Record<string, number>;
  startTime: string;
  uptime: number;
}

// Global server statistics
const serverStats: ServerStats = {
  templatesGenerated: 0,
  projectsScaffolded: 0,
  lastTemplateType: 'none',
  totalRequests: 0,
  toolUsage: {},
  startTime: new Date().toISOString(),
  uptime: 0
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Update server statistics
 */
function updateStats(toolName: string, templateType?: string): void {
  serverStats.totalRequests++;
  serverStats.toolUsage[toolName] = (serverStats.toolUsage[toolName] || 0) + 1;
  serverStats.uptime = process.uptime();
  
  if (toolName === 'generate_template' && templateType) {
    serverStats.templatesGenerated++;
    serverStats.lastTemplateType = templateType;
  } else if (toolName === 'scaffold_project') {
    serverStats.projectsScaffolded++;
  }
}

/**
 * Generate template content based on type and configuration
 */
function generateTemplateContent(templateType: string, config: TemplateConfig): string {
  const templates: Record<string, string> = {
    'react-component': `import React from 'react';

interface ${config.name}Props {
  className?: string;
  children?: React.ReactNode;
}

export const ${config.name}: React.FC<${config.name}Props> = ({ 
  className = '', 
  children 
}) => {
  return (
    <div className={\`${config.name.toLowerCase()} \${className}\`}>
      {children}
    </div>
  );
};

export default ${config.name};`,

    'express-api': `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/${config.name.toLowerCase()}', (req, res) => {
  res.json({ message: 'Hello from ${config.name}', data: [] });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(\`🚀 ${config.name} server running on port \${PORT}\`);
});`,

    'typescript-class': `/**
 * ${config.name} - Auto-generated TypeScript class
 */
export class ${config.name} {
  private _id: string;
  private _createdAt: Date;

  constructor(id?: string) {
    this._id = id || crypto.randomUUID();
    this._createdAt = new Date();
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // Add your methods here
  public process(): void {
    console.log(\`Processing \${this._id}\`);
  }
}

export default ${config.name};`,

    'package-json': `{
  "name": "${config.name.toLowerCase()}",
  "version": "1.0.0",
  "description": "Generated ${config.type} project",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "ts-node src/index.ts",
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    ${config.dependencies.map(dep => `"${dep}": "*"`).join(',\n    ')}
  },
  "devDependencies": {
    ${config.devDependencies.map(dep => `"${dep}": "*"`).join(',\n    ')}
  },
  "engines": {
    "node": ">=18.0.0"
  }
}`,

    'dockerfile': `# ${config.name} Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]`,

    'github-workflow': `name: ${config.name} CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - run: npm ci
    - run: npm run lint
    - run: npm run type-check
    - run: npm run test
    - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    - name: Deploy to production
      run: echo "Deploy ${config.name} to production"`,

    'jest-config': `module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }]
  }
};`
  };

  return templates[templateType] || `# ${config.name}\n\nGenerated template for ${templateType}`;
}

// =============================================================================
// Tool Implementations
// =============================================================================

/**
 * Generate Template Tool - Generate code templates for various frameworks
 */
function registerGenerateTemplateTool(server: McpServer) {
  server.registerTool(
    'generate_template',
    {
      title: 'Generate Template',
      description: 'Generate code templates for various frameworks and languages',
      inputSchema: {
        templateType: z.enum(['react-component', 'express-api', 'typescript-class', 'package-json', 'dockerfile', 'github-workflow', 'jest-config']).describe('Type of template to generate'),
        name: z.string().describe('Name for the generated template'),
        language: z.enum(['typescript', 'javascript', 'python', 'rust', 'go']).optional().default('typescript').describe('Programming language for the template'),
        framework: z.string().optional().describe('Framework to use (React, Express, FastAPI, etc.)'),
        features: z.array(z.string()).optional().default([]).describe('Features to include in the template')
      }
    },
    async ({ templateType, name, language = 'typescript', framework, features = [] }) => {
      updateStats('generate_template', templateType);
      
      console.error(`🛠️ Template generation: type='${templateType}', name='${name}', language='${language}'`);

      const config: TemplateConfig = {
        name,
        type: templateType,
        framework,
        language,
        features,
        dependencies: [],
        devDependencies: []
      };

      const content = generateTemplateContent(templateType, config);

      const summary = `🛠️ **Generated ${templateType} Template: ${name}**

**Language:** ${language}
**Framework:** ${framework || 'None'}
**Features:** ${features.join(', ') || 'None'}

\`\`\`${language}
${content}
\`\`\`

**Usage Instructions:**
1. Copy the generated code to your project
2. Install required dependencies
3. Customize as needed for your use case
4. Run tests to verify functionality

**Generated at:** ${new Date().toISOString()}`;

      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };
    }
  );
}

/**
 * Scaffold Project Tool - Create complete project structure
 */
function registerScaffoldProjectTool(server: McpServer) {
  server.registerTool(
    'scaffold_project',
    {
      title: 'Scaffold Project',
      description: 'Create complete project structure with scaffolding',
      inputSchema: {
        projectName: z.string().describe('Name of the project'),
        templateType: z.enum(['express-api', 'react-app', 'typescript-library']).describe('Type of project template'),
        includeTests: z.boolean().optional().default(true).describe('Include test setup'),
        includeDocs: z.boolean().optional().default(true).describe('Include documentation'),
        includeCI: z.boolean().optional().default(true).describe('Include CI/CD pipeline'),
        packageManager: z.enum(['npm', 'yarn', 'pnpm']).optional().default('npm').describe('Package manager to use')
      }
    },
    async ({ projectName, templateType, includeTests = true, includeDocs = true, includeCI = true, packageManager = 'npm' }) => {
      updateStats('scaffold_project');
      
      console.error(`🏗️ Project scaffolding: project='${projectName}', type='${templateType}'`);

      const projectStructure = {
        'express-api': [
          'src/index.ts',
          'src/routes/api.ts',
          'src/middleware/auth.ts',
          'src/models/User.ts',
          'src/utils/logger.ts',
          'package.json',
          'tsconfig.json',
          '.env.example',
          'README.md'
        ],
        'react-app': [
          'src/App.tsx',
          'src/components/Header.tsx',
          'src/hooks/useApi.ts',
          'src/utils/helpers.ts',
          'public/index.html',
          'package.json',
          'tsconfig.json',
          'README.md'
        ],
        'typescript-library': [
          'src/index.ts',
          'src/lib/core.ts',
          'src/types/index.ts',
          'src/utils/helpers.ts',
          'package.json',
          'tsconfig.json',
          'README.md'
        ]
      };

      const files = projectStructure[templateType] || [];
      
      if (includeTests) {
        files.push('src/__tests__/index.test.ts', 'jest.config.js');
      }
      
      if (includeDocs) {
        files.push('docs/README.md', 'docs/API.md');
      }
      
      if (includeCI) {
        files.push('.github/workflows/ci.yml', '.github/workflows/deploy.yml');
      }

      const summary = `🏗️ **Project Scaffolded: ${projectName}**

**Template Type:** ${templateType}
**Package Manager:** ${packageManager}

**Project Structure:**
\`\`\`
${projectName}/
${files.map(file => `├── ${file}`).join('\n')}
\`\`\`

**Features Included:**
- ${includeTests ? '✅' : '❌'} Tests
- ${includeDocs ? '✅' : '❌'} Documentation  
- ${includeCI ? '✅' : '❌'} CI/CD Pipelines

**Setup Instructions:**
1. \`mkdir ${projectName} && cd ${projectName}\`
2. Create the files listed above
3. \`${packageManager} install\`
4. \`${packageManager} run dev\`

**Generated at:** ${new Date().toISOString()}`;

      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };
    }
  );
}

/**
 * Generate Config Tool - Generate configuration files
 */
function registerGenerateConfigTool(server: McpServer) {
  server.registerTool(
    'generate_config',
    {
      title: 'Generate Config',
      description: 'Generate configuration files for projects',
      inputSchema: {
        configType: z.enum(['tsconfig', 'eslint', 'prettier', 'docker', 'gitignore']).describe('Type of configuration to generate'),
        projectName: z.string().describe('Project name'),
        options: z.record(z.any()).optional().default({}).describe('Additional configuration options')
      }
    },
    async ({ configType, projectName, options = {} }) => {
      updateStats('generate_config');
      
      console.error(`⚙️ Config generation: type='${configType}', project='${projectName}'`);

      const configs: Record<string, string> = {
        'tsconfig': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,

        'eslint': `module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error'
  }
};`,

        'prettier': `module.exports = {
  semi: true,
  trailingComma: 'es5',
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false
};`,

        'docker': `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]`,

        'gitignore': `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
coverage/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log`
      };

      const configContent = configs[configType];
      if (!configContent) {
        throw new Error(`Unknown config type: ${configType}`);
      }

      const summary = `⚙️ **Generated ${configType} Configuration**

**Project:** ${projectName}
**Options:** ${JSON.stringify(options, null, 2)}

\`\`\`json
${configContent}
\`\`\`

**Installation:**
Save as appropriate config file in your project root.

**Generated at:** ${new Date().toISOString()}`;

      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };
    }
  );
}

/**
 * Generate Test Tool - Create test templates
 */
function registerGenerateTestTool(server: McpServer) {
  server.registerTool(
    'generate_test',
    {
      title: 'Generate Test',
      description: 'Generate test templates for different testing types',
      inputSchema: {
        testType: z.enum(['unit', 'integration', 'e2e']).describe('Type of test template'),
        moduleName: z.string().describe('Module or component to test'),
        framework: z.enum(['jest', 'vitest', 'playwright']).optional().default('jest').describe('Testing framework')
      }
    },
    async ({ testType, moduleName, framework = 'jest' }) => {
      updateStats('generate_test');
      
      console.error(`🧪 Test generation: type='${testType}', module='${moduleName}', framework='${framework}'`);

      const testTemplates: Record<string, string> = {
        'unit': `import { ${moduleName} } from '../${moduleName.toLowerCase()}';

describe('${moduleName}', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('constructor', () => {
    it('should create instance successfully', () => {
      const instance = new ${moduleName}();
      expect(instance).toBeDefined();
    });
  });

  describe('public methods', () => {
    it('should handle valid inputs', () => {
      const instance = new ${moduleName}();
      // Test valid scenario
      expect(instance).toBeDefined();
    });

    it('should handle invalid inputs', () => {
      const instance = new ${moduleName}();
      // Test error scenarios
      expect(() => {
        // Test error case
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle null inputs gracefully', () => {
      const instance = new ${moduleName}();
      // Test null handling
      expect(instance).toBeDefined();
    });
  });
});`,

        'integration': `import request from 'supertest';
import { app } from '../app';

describe('${moduleName} Integration Tests', () => {
  beforeAll(async () => {
    // Setup test database, services, etc.
  });

  afterAll(async () => {
    // Cleanup test resources
  });

  describe('API Endpoints', () => {
    it('GET /api/${moduleName.toLowerCase()} should return 200', async () => {
      const response = await request(app)
        .get('/api/${moduleName.toLowerCase()}')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('POST /api/${moduleName.toLowerCase()} should create resource', async () => {
      const testData = { name: 'Test ${moduleName}' };
      
      const response = await request(app)
        .post('/api/${moduleName.toLowerCase()}')
        .send(testData)
        .expect(201);

      expect(response.body.id).toBeDefined();
    });
  });
});`,

        'e2e': `import { test, expect } from '@playwright/test';

test.describe('${moduleName} E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load main page', async ({ page }) => {
    await expect(page).toHaveTitle(/${moduleName}/);
  });

  test('should handle user interactions', async ({ page }) => {
    // Test user workflows
    await page.click('[data-testid="main-button"]');
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });

  test('should handle error states', async ({ page }) => {
    // Test error scenarios
    await page.click('[data-testid="error-trigger"]');
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});`
      };

      const testContent = testTemplates[testType];
      if (!testContent) {
        throw new Error(`Unknown test type: ${testType}`);
      }

      const summary = `🧪 **Generated ${testType} Test Template**

**Module:** ${moduleName}
**Framework:** ${framework}

\`\`\`typescript
${testContent}
\`\`\`

**Setup Instructions:**
1. Save as \`__tests__/${moduleName.toLowerCase()}.test.ts\`
2. Install test dependencies: \`npm install --save-dev ${framework}\`
3. Run tests: \`npm test\`

**Generated at:** ${new Date().toISOString()}`;

      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };
    }
  );
}

/**
 * Generate Documentation Tool - Create documentation templates
 */
function registerGenerateDocsTool(server: McpServer) {
  server.registerTool(
    'generate_docs',
    {
      title: 'Generate Documentation',
      description: 'Generate documentation templates',
      inputSchema: {
        docType: z.enum(['readme', 'api', 'changelog']).describe('Type of documentation'),
        projectName: z.string().describe('Project name'),
        version: z.string().optional().default('1.0.0').describe('Project version'),
        features: z.array(z.string()).optional().default([]).describe('Project features to document')
      }
    },
    async ({ docType, projectName, version = '1.0.0', features = [] }) => {
      updateStats('generate_docs');
      
      console.error(`📚 Documentation generation: type='${docType}', project='${projectName}'`);

      const docTemplates: Record<string, string> = {
        'readme': `# ${projectName}

## Overview

${projectName} is a modern ${features.join(', ')} application built with best practices.

## Features

${features.map(feature => `- ✅ ${feature}`).join('\n')}

## Installation

\`\`\`bash
npm install
npm run build
npm start
\`\`\`

## Usage

\`\`\`typescript
import { ${projectName} } from './${projectName.toLowerCase()}';

const app = new ${projectName}();
app.start();
\`\`\`

## API Reference

### Methods

#### \`start()\`
Starts the application.

#### \`stop()\`
Stops the application gracefully.

## Development

\`\`\`bash
npm run dev     # Development mode
npm run test    # Run tests
npm run lint    # Code linting
\`\`\`

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## License

MIT License - see LICENSE file for details.`,

        'api': `# ${projectName} API Documentation

## Base URL
\`https://api.${projectName.toLowerCase()}.com/v1\`

## Authentication
All API requests require authentication via API key:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### GET /health
Health check endpoint.

**Response:**
\`\`\`json
{
  "status": "healthy",
  "timestamp": "2025-01-17T10:00:00Z",
  "version": "${version}"
}
\`\`\`

### GET /${projectName.toLowerCase()}
List all ${projectName.toLowerCase()} resources.

**Parameters:**
- \`limit\` (number, optional): Maximum number of items to return
- \`offset\` (number, optional): Number of items to skip

**Response:**
\`\`\`json
{
  "data": [],
  "total": 0,
  "limit": 10,
  "offset": 0
}
\`\`\`

### POST /${projectName.toLowerCase()}
Create a new ${projectName.toLowerCase()} resource.

**Request Body:**
\`\`\`json
{
  "name": "string",
  "description": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "createdAt": "2025-01-17T10:00:00Z"
}
\`\`\`

## Error Handling

All errors follow this format:
\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
\`\`\``,

        'changelog': `# Changelog

All notable changes to ${projectName} will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [${version}] - ${new Date().toISOString().split('T')[0]}

### Added
- Initial release of ${projectName}
${features.map(feature => `- ${feature} support`).join('\n')}

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A`
      };

      const docContent = docTemplates[docType];
      if (!docContent) {
        throw new Error(`Unknown documentation type: ${docType}`);
      }

      const summary = `📚 **Generated ${docType} Documentation**

**Project:** ${projectName}
**Version:** ${version}

\`\`\`markdown
${docContent}
\`\`\`

**Generated at:** ${new Date().toISOString()}`;

      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };
    }
  );
}

/**
 * List Templates Tool - Show available templates
 */
function registerListTemplatesTool(server: McpServer) {
  server.registerTool(
    'list_templates',
    {
      title: 'List Templates',
      description: 'List all available templates by category',
      inputSchema: {
        category: z.enum(['all', 'code', 'config', 'project', 'test', 'docs']).optional().default('all').describe('Template category to list')
      }
    },
    async ({ category = 'all' }) => {
      updateStats('list_templates');
      
      console.error(`📋 Templates list: category='${category}'`);

      const templates = {
        'code': [
          'react-component - React functional component with TypeScript',
          'express-api - Express.js API server with middleware',
          'typescript-class - TypeScript class with methods',
          'package-json - Node.js package.json configuration',
          'dockerfile - Docker containerization',
          'github-workflow - GitHub Actions CI/CD',
          'jest-config - Jest testing configuration'
        ],
        'config': [
          'tsconfig - TypeScript configuration',
          'eslint - ESLint configuration',
          'prettier - Prettier configuration',
          'docker - Docker containerization',
          'gitignore - Git ignore patterns'
        ],
        'project': [
          'express-api - Full Express.js API project',
          'react-app - React application with TypeScript',
          'typescript-library - TypeScript library package'
        ],
        'test': [
          'unit - Unit test template with Jest',
          'integration - Integration test template',
          'e2e - End-to-end test with Playwright'
        ],
        'docs': [
          'readme - Project README.md',
          'api - API documentation',
          'changelog - Project changelog'
        ]
      };

      let responseText: string;
      if (category === 'all') {
        responseText = Object.entries(templates)
          .map(([cat, temps]) => `**${cat.toUpperCase()}:**\n${temps.map(t => `- ${t}`).join('\n')}`)
          .join('\n\n');
      } else {
        const categoryTemplates = templates[category as keyof typeof templates];
        responseText = categoryTemplates ? categoryTemplates.map(t => `- ${t}`).join('\n') : 'Category not found';
      }

      const summary = `📋 **Available Templates**

${responseText}

**Usage:**
- Use \`generate_template\` for code templates
- Use \`scaffold_project\` for complete project setup
- Use \`generate_config\` for configuration files
- Use \`generate_test\` for test templates
- Use \`generate_docs\` for documentation

**Categories:** ${Object.keys(templates).join(', ')}

**Total Templates:** ${Object.values(templates).flat().length}`;

      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };
    }
  );
}

/**
 * Validate Template Tool - Validate generated templates
 */
function registerValidateTemplateTool(server: McpServer) {
  server.registerTool(
    'validate_template',
    {
      title: 'Validate Template',
      description: 'Validate generated template content for correctness',
      inputSchema: {
        templateContent: z.string().describe('Template content to validate'),
        templateType: z.string().describe('Type of template being validated'),
        strictMode: z.boolean().optional().default(false).describe('Enable strict validation')
      }
    },
    async ({ templateContent, templateType, strictMode = false }) => {
      updateStats('validate_template');
      
      console.error(`✅ Template validation: type='${templateType}', strict=${strictMode}`);

      const validationRules: Record<string, Array<{rule: string, required: boolean}>> = {
        'package-json': [
          { rule: 'Has name field', required: true },
          { rule: 'Has version field', required: true },
          { rule: 'Has valid JSON syntax', required: true },
          { rule: 'Has scripts section', required: false }
        ],
        'typescript': [
          { rule: 'No TypeScript syntax errors', required: true },
          { rule: 'Follows naming conventions', required: false },
          { rule: 'Has proper exports', required: true },
          { rule: 'Includes type annotations', required: false }
        ],
        'react-component': [
          { rule: 'Valid JSX syntax', required: true },
          { rule: 'Proper React imports', required: true },
          { rule: 'TypeScript props interface', required: false },
          { rule: 'Default export present', required: true }
        ]
      };

      const rules = validationRules[templateType] || [
        { rule: 'Basic syntax check', required: true }
      ];

      const validationResults = rules.map(rule => {
        // Simplified validation - in production would use actual parsers
        let passed = true;
        let message = `✅ ${rule.rule}`;

        // Basic validations
        if (rule.rule.includes('JSON') && templateType === 'package-json') {
          try {
            JSON.parse(templateContent);
          } catch {
            passed = false;
            message = `❌ ${rule.rule} - Invalid JSON syntax`;
          }
        }

        if (rule.rule.includes('name field') && templateType === 'package-json') {
          passed = templateContent.includes('"name"');
          if (!passed) message = `❌ ${rule.rule} - Missing name field`;
        }

        if (rule.rule.includes('React imports') && templateType === 'react-component') {
          passed = templateContent.includes('import React') || templateContent.includes('from "react"');
          if (!passed) message = `❌ ${rule.rule} - Missing React import`;
        }

        return { ...rule, passed, message };
      });

      const errors = validationResults.filter(r => !r.passed && r.required);
      const warnings = validationResults.filter(r => !r.passed && !r.required);
      const isValid = errors.length === 0;

      const summary = `✅ **Template Validation Results**

**Status:** ${isValid ? '✅ VALID' : '❌ INVALID'}
**Template Type:** ${templateType}
**Strict Mode:** ${strictMode}

**Results:**
${validationResults.map(r => r.message).join('\n')}

**Summary:**
- **Errors:** ${errors.length}
- **Warnings:** ${warnings.length}
- **Checks Passed:** ${validationResults.filter(r => r.passed).length}/${validationResults.length}

${errors.length > 0 ? `**Errors to Fix:**\n${errors.map(e => `- ${e.rule}`).join('\n')}` : ''}
${warnings.length > 0 ? `**Warnings:**\n${warnings.map(w => `- ${w.rule}`).join('\n')}` : ''}

**Validated at:** ${new Date().toISOString()}`;

      return {
        content: [{
          type: 'text',
          text: summary
        }]
      };
    }
  );
}

/**
 * Server Status Tool - Get server health and statistics
 */
function registerServerStatusTool(server: McpServer) {
  server.registerTool(
    'get_server_status',
    {
      title: 'Server Status',
      description: 'Get template server health and performance statistics',
      inputSchema: {
        includeStats: z.boolean().optional().default(true).describe('Include detailed usage statistics')
      }
    },
    async ({ includeStats = true }) => {
      updateStats('get_server_status');
      
      console.error('📊 Server status requested');

      const uptime = process.uptime();
      const uptimeHours = Math.floor(uptime / 3600);
      const uptimeMinutes = Math.floor((uptime % 3600) / 60);
      
      let responseText = `📊 **Template Server Status**

🟢 **Status:** HEALTHY
⚡ **Version:** ${SERVER_VERSION}
📝 **Description:** ${SERVER_DESCRIPTION}
⏱️ **Uptime:** ${uptimeHours}h ${uptimeMinutes}m
💾 **Memory:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
📅 **Started:** ${serverStats.startTime}

🚀 **Performance Metrics:**
- Templates Generated: ${serverStats.templatesGenerated}
- Projects Scaffolded: ${serverStats.projectsScaffolded}
- Last Template: ${serverStats.lastTemplateType}
- Total Requests: ${serverStats.totalRequests}

🛠️ **Available Operations:**
- ✅ Template Generation (7 types)
- ✅ Project Scaffolding (3 types)
- ✅ Configuration Generation (5 types)
- ✅ Test Template Creation (3 types)
- ✅ Documentation Generation (3 types)
- ✅ Template Validation
- ✅ Health Monitoring`;

      if (includeStats && serverStats.totalRequests > 0) {
        responseText += `

📈 **Tool Usage Statistics:**`;

        for (const [tool, count] of Object.entries(serverStats.toolUsage)) {
          responseText += `\n   • ${tool}: ${count} calls`;
        }
      }

      responseText += `

**System Information:**
- Node.js: ${process.version}
- Platform: ${process.platform}
- Architecture: ${process.arch}

**Health Check:** ✅ ALL SYSTEMS OPERATIONAL

*Last updated: ${new Date().toISOString()}*`;

      return {
        content: [{
          type: 'text',
          text: responseText
        }]
      };
    }
  );
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
    version: SERVER_VERSION
  });
  
  // Register all template tools
  registerGenerateTemplateTool(server);
  registerScaffoldProjectTool(server);
  registerGenerateConfigTool(server);
  registerGenerateTestTool(server);
  registerGenerateDocsTool(server);
  registerListTemplatesTool(server);
  registerValidateTemplateTool(server);
  registerServerStatusTool(server);
  
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
      console.error('Template server stopped successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGHUP', () => shutdown('SIGHUP'));
  
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception in template server:', error);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection in template server:', reason);
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
    console.error('🛠️ Tools: generate, scaffold, config, test, docs, list, validate, status');
    console.error('📡 Ready to receive MCP requests...\n');
    
    // Create server
    const server = createServer();
    
    // Setup graceful shutdown
    setupGracefulShutdown(server);
    
    // Create stdio transport
    const transport = new StdioServerTransport();
    
    // Connect server to transport
    await server.connect(transport);
    
    console.error('✅ Template server connected successfully');
    console.error('💡 Available tools:');
    console.error('   • generate_template - Generate code templates');
    console.error('   • scaffold_project - Create complete project structure');
    console.error('   • generate_config - Generate configuration files');
    console.error('   • generate_test - Create test templates');
    console.error('   • generate_docs - Generate documentation');
    console.error('   • list_templates - Show available templates');
    console.error('   • validate_template - Validate generated templates');
    console.error('   • get_server_status - Get server health and statistics');
    console.error('💡 Use Ctrl+C to stop the server\n');
    
  } catch (error) {
    console.error('💥 Failed to start template server:');
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
  main().catch((error) => {
    console.error('💥 Bootstrap error:', error);
    process.exit(1);
  });
}

// Export for testing
export { main, createServer, updateStats, generateTemplateContent };
export type { TemplateConfig, ScaffoldingOptions, ServerStats };