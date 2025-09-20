# Local Development Setup Guide

This guide provides step-by-step instructions for setting up a local development environment for the `mcp-boilerplate-ts` project. Following these steps will ensure you have a consistent and efficient workflow.

---

## 1. Prerequisites

Before you begin, make sure you have the following software installed on your system.

-   **Node.js**: We recommend using the latest Long-Term Support (LTS) version (v18.x or later). You can download it from [nodejs.org](https://nodejs.org/).
-   **npm**: The Node Package Manager. This is usually included with your Node.js installation.
-   **Git**: A version control system for cloning the repository. You can get it from [git-scm.com](https://git-scm.com/).
-   **Docker** (Optional): Required for running the application in a containerized environment. Download it from [docker.com](https://www.docker.com/).

You can verify your Node.js and npm versions with the following commands:
```bash
node -v
npm -v
```

---

## 2. Installation

1.  **Clone the Repository**
    Open your terminal, navigate to the directory where you want to store the project, and clone the repository from GitHub.

    ```bash
    git clone https://github.com/netadx1ai/mcp-boilerplate-ts.git
    cd mcp-boilerplate-ts
    ```

2.  **Install Dependencies**
    Once inside the project directory, use `npm` to install all the required dependencies listed in `package.json`.

    ```bash
    npm install
    ```
    This command will download all necessary packages into the `node_modules/` directory.

---

## 3. Running the Application

The project is set up to run different server configurations for development.

### Development Server with Hot-Reloading

The primary script for development is `npm run dev`. It uses `ts-node-dev` to automatically transpile and restart the server whenever you save a file.

You must specify which server to run using the `--server` argument. The server names correspond to the subdirectories in the `servers/` folder.

**Example:** To run the basic Express server:
```bash
npm run dev -- --server=express-basic
```
After running this command, you should see output indicating that the server is running and listening for connections, typically on a port like `3000`.

### Running the Production Build

To test the production version of the application locally:

1.  **Build the Project:**
    This command compiles all TypeScript files from `src/` into JavaScript in the `dist/` directory.
    ```bash
    npm run build
    ```

2.  **Start the Server:**
    This command runs the compiled JavaScript code.
    ```bash
    npm run start -- --server=express-basic
    ```

---

## 4. Development Workflow & Scripts

We use several tools to maintain code quality and consistency.

-   **Formatting**: We use Prettier for opinionated code formatting. To format the entire codebase, run:
    ```bash
    npm run format
    ```

-   **Linting**: We use ESLint to find and fix potential issues in the code. To lint the project, run:
    ```bash
    npm run lint
    ```
    To automatically fix linting errors, run:
    ```bash
    npm run lint:fix
    ```

-   **Testing**: We use Jest for our test suite. To run all tests, use:
    ```bash
    npm test
    ```
    To run tests in "watch" mode, which re-runs tests on file changes:
    ```bash
    npm test -- --watch
    ```

---

## 5. Editor Configuration (Visual Studio Code)

For the best development experience, we recommend using Visual Studio Code with the following extensions:

-   [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
-   [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### Recommended VS Code Settings

To enable automatic formatting and linting on save, add the following to your VS Code `settings.json` file:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```
This configuration will automatically format your code with Prettier and fix ESLint issues every time you save a file.

---

## 6. Docker-Based Development

If you prefer an isolated environment, you can use Docker and Docker Compose.

1.  **Build the Docker Image:**
    This command builds the container image as defined in the `Dockerfile`.
    ```bash
    docker-compose build
    ```

2.  **Start the Application:**
    This command starts the application inside a Docker container.
    ```bash
    docker-compose up
    ```
    To run in the background (detached mode), use `docker-compose up -d`.