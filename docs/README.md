# MCP Boilerplate (TypeScript) Documentation

Welcome to the comprehensive documentation for the MCP Boilerplate project, implemented in TypeScript. This document serves as the central hub for developers to understand the project's architecture, setup, and core concepts.

## 1. Project Overview

The `mcp-boilerplate-ts` is a foundational template for building robust, scalable, and maintainable server applications using the Master Control Program (MCP) architecture. It provides a well-defined structure, pre-configured tools, and example implementations to accelerate development.

The core philosophy is to separate concerns clearly:
-   **Core Logic**: Abstract business logic and protocol definitions.
-   **Transport Layer**: Handle the specifics of communication (e.g., HTTP, WebSockets).
-   **Server Orchestration**: Manage the application lifecycle, tools, and services.

This boilerplate comes with everything you need to get started, including linting, formatting, testing, and deployment configurations.

## 2. Project Structure

The repository is organized into several key directories, each with a specific purpose.

```
mcp-boilerplate-ts/
├── deployment/       # Docker and containerization configurations
├── dist/             # Compiled TypeScript output
├── docs/             # Project documentation (you are here)
├── examples/         # Standalone examples demonstrating features
├── node_modules/     # Project dependencies
├── scripts/          # Helper scripts for automation
├── servers/          # Main server implementations (e.g., Express, WebSocket)
├── src/              # Core application source code
│   ├── core/         # Core types, interfaces, and business logic
│   ├── tools/        # MCP Tool implementations
│   └── transports/   # Transport-specific logic
├── templates/        # Configuration or code templates
├── tests/            # Automated tests (unit, integration)
├── .eslintrc.js      # ESLint configuration
├── jest.config.js    # Jest test runner configuration
├── package.json      # Project metadata and dependencies
└── tsconfig.json     # TypeScript compiler configuration
```

### Key Directories

-   **`src`**: The heart of the application. All core logic, types, and transport-agnostic code resides here.
-   **`servers`**: Contains the entry points for different server types. For example, `servers/express` would set up an MCP-enabled Express server.
-   **`examples`**: Practical, runnable examples that showcase how to use different parts of the framework. These are excellent for learning and experimentation.
-   **`tests`**: Houses the entire test suite. We use Jest for testing.
-   **`deployment`**: Contains `Dockerfile` and `docker-compose.yml` for easy containerization and deployment.

## 3. Getting Started

Follow these steps to get the project up and running on your local machine.

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18.x or later recommended)
-   [npm](https://www.npmjs.com/) (usually comes with Node.js)
-   [Docker](https://www.docker.com/) (for containerized deployment)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/netadx1ai/mcp-boilerplate-ts.git
    cd mcp-boilerplate-ts
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Application

To start one of the example servers, you can use the following command:

```bash
npm run dev -- --server=express-basic
```

This command transpiles the TypeScript code and runs the specified server from the `servers/` directory.

## 4. Core Concepts

_(This section will be expanded to cover the MCP architecture, Tool model, and State management patterns used in the project.)_

## 5. Available Scripts

The `package.json` file contains a set of useful scripts for development and maintenance:

-   `npm run dev`: Starts the application in development mode with hot-reloading. Requires a `--server` argument.
-   `npm run build`: Compiles the TypeScript code into JavaScript in the `dist/` directory.
-   `npm run start`: Runs the compiled code from the `dist/` directory.
-   `npm test`: Executes the entire test suite using Jest.
-   `npm run lint`: Lints the codebase using ESLint to check for code quality issues.
-   `npm run format`: Formats the entire codebase using Prettier.

## 6. Testing

To run the test suite, execute:

```bash
npm test
```

This will run all files ending in `.test.ts` or `.spec.ts` within the `tests/` directory.

## 7. Deployment

This project is configured for Docker-based deployment.

-   **`Dockerfile`**: Defines the image for the application.
-   **`docker-compose.yml`**: Provides an easy way to run the application and any related services (like databases or caches).

To build and run the application using Docker:

```bash
# Build the Docker image
docker-compose build

# Start the application
docker-compose up
```
