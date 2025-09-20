# Core Architectural Concepts

This document explains the fundamental concepts behind the Master Control Program (MCP) architecture as implemented in this TypeScript boilerplate. Understanding these concepts is essential for building and extending the application effectively.

The primary goal of this architecture is **separation of concerns**. By decoupling the business logic from the transport layer, we can create a more flexible, scalable, and testable system.

---

## 1. The `McpServer`

The `McpServer` is the brain of the application. It acts as a central orchestrator that manages the application's state, tools, and lifecycle.

**Key Responsibilities:**

-   **Tool Registry**: It maintains a collection of available "tools" that encapsulate specific business logic.
-   **Command Dispatching**: It receives standardized requests, identifies the target tool and command, and dispatches the request to the appropriate tool for execution.
-   **State Management**: It holds the central application state and provides a controlled way for tools to interact with it.
-   **Lifecycle Hooks**: It manages the application's startup and shutdown sequences.

Crucially, the `McpServer` is **transport-agnostic**. It has no knowledge of HTTP, WebSockets, or any other communication protocol. It operates on a standardized `McpRequest` and produces an `McpResponse`.

```typescript
// Simplified representation of the McpServer
class McpServer {
  private tools: Map<string, McpTool>;
  private state: ApplicationState;

  constructor() {
    this.tools = new Map();
    this.state = { isRunning: false };
  }

  // Register a new tool
  addTool(tool: McpTool): void {
    this.tools.set(tool.name, tool);
  }

  // Process a standardized request
  async execute(request: McpRequest): Promise<McpResponse> {
    const tool = this.tools.get(request.tool);
    if (!tool) {
      return { error: 'Tool not found' };
    }
    return tool.execute(request.command, request.params, this.state);
  }
}
```

---

## 2. `McpTool`: The Unit of Logic

An `McpTool` is the fundamental building block of business logic in the MCP architecture. Each tool is a self-contained module with a single responsibility.

**Key Characteristics:**

-   **Encapsulated**: A tool bundles a set of related commands. For example, a `UserManagementTool` might have `createUser`, `getUser`, and `deleteUser` commands.
-   **Stateless (by default)**: Tools should ideally be stateless. They receive the current application state from the `McpServer` during execution, operate on it, and return a result, but they do not hold their own internal state.
-   **Standardized Interface**: Every tool must implement a common interface, typically an `execute` method, which the `McpServer` uses to invoke its functionality.

This design makes tools highly modular and reusable. You can easily add, remove, or replace tools in the `McpServer` without affecting the rest of the system.

```typescript
// Simplified representation of an McpTool
interface McpTool {
  readonly name: string;
  execute(command: string, params: any, state: ApplicationState): Promise<McpResponse>;
}

// Example implementation
class EchoTool implements McpTool {
  public readonly name = 'echo';

  async execute(command: string, params: any): Promise<McpResponse> {
    if (command === 'reply') {
      return { success: true, data: params.message };
    }
    return { success: false, error: 'Unknown command' };
  }
}
```

---

## 3. `McpTransport`: The Bridge to the World

The `McpTransport` layer is the bridge between the outside world and the `McpServer`. Its sole responsibility is to adapt a specific communication protocol (like HTTP) to the standardized format that the `McpServer` understands.

**Key Responsibilities:**

-   **Listen for Incoming Connections**: It binds to a port and listens for incoming requests (e.g., an Express server listening on port 3000).
-   **Adapt Requests**: It translates a protocol-specific request (e.g., an `express.Request` object) into a generic `McpRequest` object. This involves parsing the URL, headers, and body to determine the target tool, command, and parameters.
-   **Invoke the Server**: It passes the standardized `McpRequest` to the `McpServer`'s `execute` method.
-   **Adapt Responses**: It takes the generic `McpResponse` returned by the server and translates it back into a protocol-specific response (e.g., setting the status code and sending a JSON body in an `express.Response`).

By isolating the transport logic, you can support multiple protocols simultaneously. For instance, the same `McpServer` instance, with the same tools, could be exposed via a REST API (using an `ExpressTransport`) and a WebSocket API (using a `WebSocketTransport`).

---

## 4. The Data Flow: A Complete Journey

Here is the typical lifecycle of a request in the MCP system:

1.  **Client Request**: A client sends a request to a public endpoint (e.g., `POST /api/echo/reply`).

2.  **Transport Layer (Adapter)**:
    -   The `ExpressTransport` receives the HTTP request.
    -   It parses the URL (`/echo/reply`) and body to create a standardized `McpRequest` object:
        ```json
        {
          "tool": "echo",
          "command": "reply",
          "params": { "message": "Hello, World!" }
        }
        ```

3.  **`McpServer` (Orchestrator)**:
    -   The transport calls `mcpServer.execute(mcpRequest)`.
    -   The server looks up the `echo` tool in its registry.
    -   It calls `echoTool.execute('reply', { message: '...' }, currentState)`.

4.  **`McpTool` (Business Logic)**:
    -   The `EchoTool` executes its logic for the `reply` command.
    -   It returns a standardized `McpResponse` object:
        ```json
        {
          "success": true,
          "data": "Hello, World!"
        }
        ```

5.  **Return to Transport**:
    -   The `McpServer` passes the `McpResponse` back to the `ExpressTransport`.
    -   The transport translates this into an HTTP response, setting the status to `200 OK` and sending the `data` as the JSON body.

This clean separation ensures that the `EchoTool` developer doesn't need to know anything about HTTP, and the `ExpressTransport` developer doesn't need to know anything about the echo logic.