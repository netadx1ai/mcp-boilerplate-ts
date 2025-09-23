# Project Structure Deep Dive

This document provides a detailed breakdown of the `mcp-boilerplate-ts`
directory structure. Understanding the role of each folder and file is crucial
for effective development and contribution.

## High-Level Overview

The project is structured as a monorepo-style TypeScript project, separating
concerns into distinct directories. This modular approach makes the codebase
easier to navigate, test, and maintain.

```
mcp-boilerplate-ts/
├── deployment/       # Docker and containerization configurations
├── dist/             # Compiled TypeScript output (ephemeral)
├── docs/             # Project documentation (you are here)
├── examples/         # Standalone examples demonstrating features
├── node_modules/     # Project dependencies (managed by npm)
├── scripts/          # Helper scripts for automation
├── servers/          # Main server implementations (e.g., Express, WebSocket)
├── src/              # Core application source code
│   ├── core/         # Core types, interfaces, and business logic
│   ├── tools/        # MCP Tool implementations
│   └── transports/   # Transport-specific logic
├── templates/        # Configuration or code templates
├── tests/            # Automated tests (unit, integration)
├── .eslintrc.js      # ESLint configuration for code quality
├── .gitignore        # Specifies files for Git to ignore
├── .prettierrc.js    # Prettier configuration for code formatting
├── Dockerfile        # Defines the Docker image for the application
├── docker-compose.yml# Defines multi-container Docker applications
├── jest.config.js    # Jest test runner configuration
├── package.json      # Project metadata and dependencies
└── tsconfig.json     # TypeScript compiler configuration
```

---

## Core Directories

### `src/`

This is the most important directory, containing the core application logic.

- **`src/core/`**: This is the heart of the MCP application. It contains
  transport-agnostic logic, including:
  - `McpServer.ts`: The central orchestration class.
  - `McpTool.ts`: The interface and base class for all tools.
  - `types.ts`: Core data structures, interfaces, and type definitions used
    across the project.
  - `errors.ts`: Custom error classes.

- **`src/tools/`**: Contains concrete implementations of the `McpTool`
  interface. Each tool encapsulates a specific piece of business logic (e.g.,
  `EchoTool`, `SystemInfoTool`).

- **`src/transports/`**: Handles the communication layer. This is where you'd
  find adapters for different protocols. For example, `ExpressTransport.ts`
  would adapt incoming HTTP requests to the MCP server format.

### `servers/`

This directory contains the runnable server entry points. Each subdirectory
represents a complete, runnable server configuration that ties together the core
logic from `src/` with a specific transport and set of tools.

- **`servers/express-basic/`**: An example of an Express.js server that uses the
  MCP core. It has an `index.ts` that instantiates `McpServer`, an
  `ExpressTransport`, and a set of tools.

### `tests/`

This directory mirrors the `src/` directory and contains all automated tests.

- **`tests/core/`**: Unit tests for the core logic in `src/core/`.
- **`tests/tools/`**: Unit tests for individual tools.
- **`tests/integration/`**: Integration tests that verify the interaction
  between different components (e.g., server, transport, and tools working
  together).

---

## Supporting Directories

### `deployment/`

Contains all files related to deploying the application.

- **`Dockerfile`**: A multi-stage Dockerfile that builds the TypeScript code and
  creates a lean, production-ready container image.
- **`docker-compose.yml`**: A configuration file for running the application and
  any associated services (like a database or reverse proxy) using Docker
  Compose.

### `docs/`

Contains all project documentation, including this file.

### `examples/`

Contains simple, standalone code snippets and files that demonstrate how to use
specific features of the framework. These are not full servers but are useful
for learning and debugging.

### `scripts/`

Holds automation scripts for various development tasks, such as deployment,
database migration, or build processes.

---

## Configuration Files

- **`package.json`**: The standard Node.js project manifest. It defines project
  metadata, dependencies (`dependencies`, `devDependencies`), and scripts
  (`scripts`) for building, testing, and running the application.

- **`tsconfig.json`**: The configuration file for the TypeScript compiler
  (`tsc`). It specifies compiler options, such as the target JavaScript version
  (`target`), module system (`module`), and source paths (`include`, `exclude`).

- **`jest.config.js`**: Configures the Jest testing framework. It defines the
  test environment, specifies the TypeScript preprocessor (`ts-jest`), and sets
  up code coverage reporting.

- **`.eslintrc.js`**: Configures ESLint, a static analysis tool that finds and
  fixes problems in your code. It enforces a consistent code style and helps
  prevent common bugs.

- **`.prettierrc.js`**: Configures Prettier, an opinionated code formatter. It
  ensures that all code in the project follows a consistent style, eliminating
  debates over formatting.
