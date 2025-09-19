#!/bin/bash

# =============================================================================
# MCP TypeScript Boilerplate - Docker Entrypoint
# =============================================================================
#
# Flexible entrypoint script for Docker deployment of MCP servers.
# Supports running individual servers, multiple servers, or all servers.
#
# Usage:
#   docker run mcp-boilerplate-ts                    # Run all servers
#   docker run mcp-boilerplate-ts news-data          # Run specific server
#   docker run mcp-boilerplate-ts template analytics # Run multiple servers
#
# Environment Variables:
#   MCP_SERVERS - Comma-separated list of servers to run
#   MCP_MODE    - "single" or "multi" (default: auto-detect)
#   NODE_ENV    - "production", "development", or "test"
#   DEBUG       - Debug logging pattern
#
# @author MCP Boilerplate Team
# @version 1.0.0
# =============================================================================

set -euo pipefail

# =============================================================================
# Constants and Configuration
# =============================================================================

readonly SCRIPT_NAME="$(basename "$0")"
readonly APP_DIR="/app"
readonly LOG_DIR="/app/logs"
readonly DATA_DIR="/app/data"

# Available servers
readonly AVAILABLE_SERVERS=(
    "news-data"
    "template"
    "analytics"
    "database"
    "api-gateway"
    "workflow"
)

# Available templates
readonly AVAILABLE_TEMPLATES=(
    "basic-server"
    "api-wrapper"
    "database-integration"
    "authenticated-server"
)

# Default configuration
readonly DEFAULT_NODE_ENV="${NODE_ENV:-production}"
readonly DEFAULT_LOG_LEVEL="${LOG_LEVEL:-info}"
readonly DEFAULT_PORT_START=8000

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    local level="$1"
    shift
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$level] $*" >&2
}

info() { log "INFO" "$@"; }
warn() { log "WARN" "$@"; }
error() { log "ERROR" "$@"; }
debug() { 
    if [[ "${DEBUG:-}" == *"docker"* ]] || [[ "${NODE_ENV:-}" == "development" ]]; then
        log "DEBUG" "$@"
    fi
}

fatal() {
    error "$@"
    exit 1
}

# Check if item is in array
contains() {
    local item="$1"
    shift
    local array=("$@")
    
    for element in "${array[@]}"; do
        if [[ "$element" == "$item" ]]; then
            return 0
        fi
    done
    return 1
}

# Validate server name
validate_server() {
    local server="$1"
    
    if contains "$server" "${AVAILABLE_SERVERS[@]}" "${AVAILABLE_TEMPLATES[@]}"; then
        return 0
    fi
    
    error "Unknown server: $server"
    error "Available servers: ${AVAILABLE_SERVERS[*]}"
    error "Available templates: ${AVAILABLE_TEMPLATES[*]}"
    return 1
}

# Get server workspace path
get_server_path() {
    local server="$1"
    
    if contains "$server" "${AVAILABLE_SERVERS[@]}"; then
        echo "servers/${server}-server"
    elif contains "$server" "${AVAILABLE_TEMPLATES[@]}"; then
        echo "templates/${server}-template"
    else
        fatal "Invalid server: $server"
    fi
}

# Get server port
get_server_port() {
    local server="$1"
    local base_port=$DEFAULT_PORT_START
    
    case "$server" in
        "news-data") echo $((base_port + 0)) ;;
        "template") echo $((base_port + 1)) ;;
        "analytics") echo $((base_port + 2)) ;;
        "database") echo $((base_port + 3)) ;;
        "api-gateway") echo $((base_port + 4)) ;;
        "workflow") echo $((base_port + 5)) ;;
        "basic-server") echo $((base_port + 10)) ;;
        "api-wrapper") echo $((base_port + 11)) ;;
        "database-integration") echo $((base_port + 12)) ;;
        "authenticated-server") echo $((base_port + 13)) ;;
        *) echo "$base_port" ;;
    esac
}

# =============================================================================
# Setup and Initialization
# =============================================================================

setup_environment() {
    info "Setting up environment..."
    
    # Ensure required directories exist
    mkdir -p "$LOG_DIR" "$DATA_DIR"
    
    # Set environment variables
    export NODE_ENV="$DEFAULT_NODE_ENV"
    export LOG_LEVEL="$DEFAULT_LOG_LEVEL"
    
    # Configure Node.js options for production
    if [[ "$NODE_ENV" == "production" ]]; then
        export NODE_OPTIONS="${NODE_OPTIONS:-} --enable-source-maps --max-old-space-size=512"
    else
        export NODE_OPTIONS="${NODE_OPTIONS:-} --enable-source-maps"
    fi
    
    debug "Environment: NODE_ENV=$NODE_ENV, LOG_LEVEL=$LOG_LEVEL"
    debug "Node options: $NODE_OPTIONS"
}

pre_flight_checks() {
    info "Running pre-flight checks..."
    
    # Check Node.js version
    local node_version
    node_version=$(node --version | sed 's/v//')
    local major_version
    major_version=$(echo "$node_version" | cut -d. -f1)
    
    if [[ "$major_version" -lt 18 ]]; then
        fatal "Node.js 18+ required, found: $node_version"
    fi
    
    debug "Node.js version: $node_version ✓"
    
    # Check if dist directory exists
    if [[ ! -d "$APP_DIR/dist" ]]; then
        fatal "Built application not found. Run 'npm run build' first."
    fi
    
    debug "Built application found ✓"
    
    # Check if node_modules exists
    if [[ ! -d "$APP_DIR/node_modules" ]]; then
        fatal "Node modules not found. Run 'npm install' first."
    fi
    
    debug "Node modules found ✓"
    
    info "Pre-flight checks completed successfully"
}

# =============================================================================
# Server Management
# =============================================================================

run_single_server() {
    local server="$1"
    local port
    port=$(get_server_port "$server")
    local workspace
    workspace=$(get_server_path "$server")
    
    info "Starting single server: $server on port $port"
    
    # Set server-specific environment
    export PORT="$port"
    export SERVER_NAME="$server"
    
    # Change to server directory
    cd "$APP_DIR/$workspace" || fatal "Server directory not found: $workspace"
    
    # Check if dist exists
    if [[ ! -d "dist" ]]; then
        fatal "Server not built: $workspace/dist not found"
    fi
    
    info "🚀 Starting $server server on port $port"
    info "📁 Working directory: $workspace"
    info "🔌 Transport: stdio (MCP protocol)"
    
    # Start the server
    exec node dist/index.js
}

run_multiple_servers() {
    local servers=("$@")
    local pids=()
    
    info "Starting multiple servers: ${servers[*]}"
    
    # Start each server in background
    for server in "${servers[@]}"; do
        local port
        port=$(get_server_port "$server")
        local workspace
        workspace=$(get_server_path "$server")
        local log_file="$LOG_DIR/${server}-server.log"
        
        info "Starting $server server on port $port"
        
        # Start server in background with logging
        (
            cd "$APP_DIR/$workspace" || exit 1
            PORT="$port" SERVER_NAME="$server" node dist/index.js
        ) > "$log_file" 2>&1 &
        
        local pid=$!
        pids+=("$pid")
        
        info "Started $server server (PID: $pid, Port: $port, Log: $log_file)"
        
        # Brief delay between starts
        sleep 1
    done
    
    info "All servers started. PIDs: ${pids[*]}"
    info "Logs available in: $LOG_DIR"
    info "Use 'docker logs <container>' to see combined output"
    
    # Setup signal handlers for graceful shutdown
    shutdown_servers() {
        info "Shutting down servers gracefully..."
        
        for pid in "${pids[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                info "Stopping PID $pid"
                kill -TERM "$pid"
            fi
        done
        
        # Wait for graceful shutdown
        local timeout=30
        while [[ $timeout -gt 0 ]]; do
            local running=0
            for pid in "${pids[@]}"; do
                if kill -0 "$pid" 2>/dev/null; then
                    ((running++))
                fi
            done
            
            if [[ $running -eq 0 ]]; then
                info "All servers stopped gracefully"
                break
            fi
            
            debug "Waiting for $running servers to stop... (${timeout}s remaining)"
            sleep 1
            ((timeout--))
        done
        
        # Force kill if necessary
        for pid in "${pids[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                warn "Force killing PID $pid"
                kill -KILL "$pid"
            fi
        done
        
        exit 0
    }
    
    # Trap signals
    trap shutdown_servers SIGTERM SIGINT SIGHUP
    
    # Wait for all servers
    wait
}

# =============================================================================
# Argument Processing
# =============================================================================

determine_servers() {
    local servers=()
    
    # Check environment variable first
    if [[ -n "${MCP_SERVERS:-}" ]]; then
        IFS=',' read -ra servers <<< "$MCP_SERVERS"
        info "Using servers from MCP_SERVERS environment: ${servers[*]}"
    elif [[ $# -gt 0 ]]; then
        # Use command line arguments
        servers=("$@")
        info "Using servers from command line: ${servers[*]}"
    else
        # Default to all production servers
        servers=("${AVAILABLE_SERVERS[@]}")
        info "No servers specified, using all production servers: ${servers[*]}"
    fi
    
    # Validate all servers
    for server in "${servers[@]}"; do
        if ! validate_server "$server"; then
            fatal "Invalid server configuration"
        fi
    done
    
    echo "${servers[@]}"
}

show_usage() {
    cat << EOF
Usage: $SCRIPT_NAME [server1] [server2] ...

MCP TypeScript Boilerplate Docker Entrypoint

Arguments:
  server1, server2, ...  Specific servers to run

Available Production Servers:
  news-data      - News aggregation and analysis
  template       - Code generation and scaffolding  
  analytics      - Data analytics and reporting
  database       - Database operations and management
  api-gateway    - API routing and load balancing
  workflow       - Workflow automation and orchestration

Available Templates:
  basic-server           - Simple MCP server template
  api-wrapper           - API integration template
  database-integration  - Database integration template
  authenticated-server  - Authentication template

Environment Variables:
  MCP_SERVERS   - Comma-separated list of servers (overrides args)
  MCP_MODE      - "single" or "multi" (default: auto-detect)
  NODE_ENV      - "production", "development", or "test"
  DEBUG         - Debug logging pattern (e.g., "mcp:*")
  PORT          - Base port number (default: 8000)

Examples:
  $SCRIPT_NAME                           # Run all production servers
  $SCRIPT_NAME news-data template        # Run specific servers
  $SCRIPT_NAME basic-server              # Run basic template
  
  # With environment variables
  MCP_SERVERS=news-data,analytics $SCRIPT_NAME
  DEBUG=mcp:* $SCRIPT_NAME news-data

Health Check:
  curl http://localhost:8000/health

Logs:
  docker logs <container_id>
  # Or check individual server logs in /app/logs/

EOF
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    # Handle help
    if [[ "${1:-}" == "--help" ]] || [[ "${1:-}" == "-h" ]]; then
        show_usage
        exit 0
    fi
    
    # Setup
    setup_environment
    pre_flight_checks
    
    # Determine which servers to run
    local servers
    read -ra servers <<< "$(determine_servers "$@")"
    
    info "🐳 MCP TypeScript Boilerplate Docker Container"
    info "📦 Environment: $NODE_ENV"
    info "🚀 Starting ${#servers[@]} server(s): ${servers[*]}"
    
    # Run servers
    if [[ ${#servers[@]} -eq 1 ]]; then
        # Single server mode
        info "📡 Single server mode"
        run_single_server "${servers[0]}"
    else
        # Multiple server mode
        info "📡 Multiple server mode"
        run_multiple_servers "${servers[@]}"
    fi
}

# =============================================================================
# Error Handling
# =============================================================================

# Global error handler
error_handler() {
    local line_number="$1"
    local error_code="$2"
    local command="$BASH_COMMAND"
    
    error "Error occurred in $SCRIPT_NAME at line $line_number"
    error "Command: $command"
    error "Exit code: $error_code"
    
    # Cleanup if needed
    if [[ -n "${pids:-}" ]]; then
        warn "Cleaning up running processes..."
        for pid in "${pids[@]}"; do
            if kill -0 "$pid" 2>/dev/null; then
                kill -TERM "$pid"
            fi
        done
    fi
    
    exit "$error_code"
}

trap 'error_handler ${LINENO} $?' ERR

# =============================================================================
# Bootstrap
# =============================================================================

# Ensure we're in the right directory
cd "$APP_DIR" || fatal "Cannot change to app directory: $APP_DIR"

# Run main function
main "$@"