# Testing and Validation Strategy

A robust testing and validation strategy is critical to maintaining the quality, reliability, and maintainability of the `mcp-boilerplate-ts` project. This document outlines the tools, structure, and procedures for testing your code before it is integrated.

---

## 1. Testing Framework

The project uses a modern and widely-adopted testing stack for TypeScript applications:

-   **Test Runner**: [Jest](https://jestjs.io/) is used as the primary testing framework for its speed, powerful mocking capabilities, and all-in-one nature.
-   **TypeScript Integration**: `ts-jest` is a preprocessor that allows Jest to run tests written in TypeScript directly, without a separate compilation step.
-   **Assertion Library**: We use Jest's built-in `expect` library for writing clear and expressive assertions.

---

## 2. How to Run Tests

All test commands are conveniently available as `npm` scripts in the `package.json` file.

-   **Run the Full Test Suite:**
    To execute every test in the project once, run:
    ```bash
    npm test
    ```

-   **Run in Watch Mode:**
    For an interactive development experience, watch mode automatically re-runs tests related to files you've changed since the last commit.
    ```bash
    npm test -- --watch
    ```

-   **Generate a Coverage Report:**
    To check how much of your code is covered by tests, run the following command. A detailed report will be generated in the `coverage/` directory.
    ```bash
    npm test -- --coverage
    ```

---

## 3. Test Structure and Organization

The `tests/` directory is a mirror of the `src/` directory. This co-location makes it easy to find the tests corresponding to a specific source file.

-   **`tests/core/`**: Contains **unit tests** for the fundamental building blocks of the MCP architecture, such as the `McpServer` itself. These tests focus on a single class or module in isolation.

-   **`tests/tools/`**: Contains **unit tests** for individual `McpTool` implementations. Each tool should have its own test file (e.g., `EchoTool.test.ts`).

-   **`tests/integration/`**: Contains **integration tests** that verify the collaboration between multiple components. For example, an integration test might spin up an `McpServer`, attach a real `ExpressTransport` and several tools, and then make HTTP requests to ensure the entire stack works together correctly.

---

## 4. Writing Tests

When adding a new feature or fixing a bug, you should accompany your code with corresponding tests.

### Example: Unit Test for `EchoTool`

Here is a simplified example of what a unit test for a tool might look like in `tests/tools/EchoTool.test.ts`:

```typescript
import { EchoTool } from '../../src/tools/EchoTool';

describe('EchoTool', () => {
  let echoTool: EchoTool;

  // Set up a new instance before each test
  beforeEach(() => {
    echoTool = new EchoTool();
  });

  it('should have the correct name', () => {
    expect(echoTool.name).toBe('echo');
  });

  it('should return the same message for the "reply" command', async () => {
    const params = { message: 'Hello, World!' };
    const response = await echoTool.execute('reply', params, {});

    expect(response.success).toBe(true);
    expect(response.data).toBe(params.message);
  });

  it('should return an error for an unknown command', async () => {
    const response = await echoTool.execute('unknownCommand', {}, {});

    expect(response.success).toBe(false);
    expect(response.error).toBe('Unknown command');
  });
});
```

---

## 5. Manual End-to-End Validation

Automated tests are essential, but they are not a substitute for real-world validation. Before a feature is considered "done," it must be proven to work by running the application and interacting with it.

1.  **Start the development server:**
    ```bash
    npm run dev -- --server=express-basic
    ```

2.  **Use a client to interact with the API.**
    For a RESTful API, `curl` is an excellent tool. Open a new terminal and send a request to your running server.

    **Example `curl` command:**
    ```bash
    curl -X POST http://localhost:3000/api/echo/reply \
         -H "Content-Type: application/json" \
         -d '{"message": "hello from curl"}'
    ```

3.  **Verify the output.**
    You should receive the expected response from the server:
    ```json
    {
      "success": true,
      "data": "hello from curl"
    }
    ```
    Confirming this round-trip behavior is the final proof that your changes work as intended.

---

## 6. Pre-Commit Quality Checks

To ensure that only high-quality, consistent code is committed to the repository, always run the following checks locally before pushing your changes:

1.  **Format Code**: `npm run format`
2.  **Lint Code**: `npm run lint`
3.  **Run All Tests**: `npm test`

Automating these checks in a pre-commit hook is highly recommended.