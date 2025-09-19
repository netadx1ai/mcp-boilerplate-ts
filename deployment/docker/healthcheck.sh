#!/bin/bash

# =============================================================================
# MCP TypeScript Boilerplate - Docker Health Check
# =============================================================================
#
# Health check script for Docker containers running MCP servers.
# Checks server responsiveness, memory usage, and basic functionality.
#
# Usage:
#   ./healthcheck.sh                    # Check all running servers
#   ./healthcheck.sh news-data          # Check specific server
#   ./healthcheck.sh --detailed         # Detailed health report
#
# Exit Codes:
#   0 - Healthy
#   1 - Unhealthy
#   2 - Warning (degraded but functional)
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
readonly MAX_MEMORY_MB=512
readonly MAX_RESPONSE_TIME_MS=5000
readonly DEFAULT_TIMEOUT=10

# Health check thresholds
readonly MEMORY_WARNING_THRESHOLD=80  # % of MAX_MEMORY_MB
readonly RESPONSE_TIME_WARNING_MS=2000
readonly CPU_WARNING_THRESHOLD=80     # % CPU usage

# Available servers with their expected ports
declare -A SERVER_PORTS=(
    ["news-data"]="8000"
    ["template"]="8001"
    ["analytics"]="8002"
    ["database"]="8003"
    ["api-gateway"]="8004"
    ["workflow"]="8005"
    ["basic-server"]="8010"
    ["api-wrapper"]="8011"
    ["database-integration"]="8012"
    ["authenticated-server"]="8013"
)

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
    if [[ "${DEBUG:-}" == *"health"* ]] || [[ "${VERBOSE:-}" == "true" ]]; then
        log "DEBUG" "$@"
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Get memory usage in MB
get_memory_usage() {
    local pid="$1"
    
    if command_exists ps; then
        # Get RSS memory in KB, convert to MB
        local memory_kb
        memory_kb=$(ps -o rss= -p "$pid" 2>/dev/null | tr -d ' ')
        if [[ -n "$memory_kb" && "$memory_kb" =~ ^[0-9]+$ ]]; then
            echo $((memory_kb / 1024))
        else
            echo "0"
        fi
    else
        echo "0"
    fi
}

# Get CPU usage percentage
get_cpu_usage() {
    local pid="$1"
    
    if command_exists ps; then
        local cpu_percent
        cpu_percent=$(ps -o %cpu= -p "$pid" 2>/dev/null | tr -d ' ')
        if [[ -n "$cpu_percent" && "$cpu_percent" =~ ^[0-9.]+$ ]]; then
            echo "${cpu_percent%.*}" # Remove decimal part
        else
            echo "0"
        fi
    else
        echo "0"
    fi
}

# Check if process is running
is_process_running() {
    local pid="$1"
    kill -0 "$pid" 2>/dev/null
}

# =============================================================================
# MCP Server Health Checks
# =============================================================================

check_mcp_server_health() {
    local server="$1"
    local detailed="${2:-false}"
    
    debug "Checking health for server: $server"
    
    # Find server process
    local server_pattern
    if [[ "$server" == *"-server" ]]; then
        server_pattern="$server"
    else
        server_pattern="${server}-server"
    fi
    
    # Look for Node.js processes running our servers
    local pids
    pids=$(pgrep -f "node.*${server_pattern}" 2>/dev/null || true)
    
    if [[ -z "$pids" ]]; then
        error "Server $server is not running (no matching process found)"
        return 1
    fi
    
    local main_pid
    main_pid=$(echo "$pids" | head -n1)
    
    debug "Found server process PID: $main_pid"
    
    # Check if process is actually running
    if ! is_process_running "$main_pid"; then
        error "Server $server process is not responding (PID: $main_pid)"
        return 1
    fi
    
    # Get resource usage
    local memory_mb
    memory_mb=$(get_memory_usage "$main_pid")
    local cpu_percent
    cpu_percent=$(get_cpu_usage "$main_pid")
    
    debug "Resource usage - Memory: ${memory_mb}MB, CPU: ${cpu_percent}%"
    
    # Check memory usage
    local memory_threshold=$((MAX_MEMORY_MB * MEMORY_WARNING_THRESHOLD / 100))
    local memory_status="OK"
    local exit_code=0
    
    if [[ "$memory_mb" -gt "$MAX_MEMORY_MB" ]]; then
        memory_status="CRITICAL"
        error "Server $server memory usage too high: ${memory_mb}MB > ${MAX_MEMORY_MB}MB"
        exit_code=1
    elif [[ "$memory_mb" -gt "$memory_threshold" ]]; then
        memory_status="WARNING"
        warn "Server $server memory usage high: ${memory_mb}MB > ${memory_threshold}MB"
        if [[ $exit_code -eq 0 ]]; then
            exit_code=2
        fi
    fi
    
    # Check CPU usage
    local cpu_status="OK"
    if [[ "$cpu_percent" -gt "$CPU_WARNING_THRESHOLD" ]]; then
        cpu_status="WARNING"
        warn "Server $server CPU usage high: ${cpu_percent}%"
        if [[ $exit_code -eq 0 ]]; then
            exit_code=2
        fi
    fi
    
    # Output health status
    if [[ "$detailed" == "true" ]]; then
        cat << EOF
{
  "server": "$server",
  "status": "$([ $exit_code -eq 0 ] && echo "healthy" || [ $exit_code -eq 2 ] && echo "warning" || echo "unhealthy")",
  "pid": $main_pid,
  "memory": {
    "used_mb": $memory_mb,
    "max_mb": $MAX_MEMORY_MB,
    "status": "$memory_status"
  },
  "cpu": {
    "percent": $cpu_percent,
    "status": "$cpu_status"
  },
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
    else
        local status_emoji
        case $exit_code in
            0) status_emoji="✅" ;;
            2) status_emoji="⚠️" ;;
            *) status_emoji="❌" ;;
        esac
        
        info "$status_emoji $server: Memory ${memory_mb}MB, CPU ${cpu_percent}%, PID $main_pid"
    fi
    
    return $exit_code
}

# =============================================================================
# System Health Checks
# =============================================================================

check_system_health() {
    local detailed="${1:-false}"
    
    debug "Checking system health"
    
    # Check disk space
    local disk_usage
    disk_usage=$(df "$APP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    
    local disk_status="OK"
    local exit_code=0
    
    if [[ "$disk_usage" -gt 90 ]]; then
        disk_status="CRITICAL"
        error "Disk usage critical: ${disk_usage}%"
        exit_code=1
    elif [[ "$disk_usage" -gt 80 ]]; then
        disk_status="WARNING"
        warn "Disk usage high: ${disk_usage}%"
        if [[ $exit_code -eq 0 ]]; then
            exit_code=2
        fi
    fi
    
    # Check system load
    local load_avg
    if command_exists uptime; then
        load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    else
        load_avg="0.0"
    fi
    
    # Check if logs directory is writable
    local log_writable="true"
    if [[ ! -w "$LOG_DIR" ]]; then
        log_writable="false"
        warn "Log directory not writable: $LOG_DIR"
        if [[ $exit_code -eq 0 ]]; then
            exit_code=2
        fi
    fi
    
    if [[ "$detailed" == "true" ]]; then
        cat << EOF
{
  "system": {
    "status": "$([ $exit_code -eq 0 ] && echo "healthy" || [ $exit_code -eq 2 ] && echo "warning" || echo "unhealthy")",
    "disk": {
      "usage_percent": $disk_usage,
      "status": "$disk_status"
    },
    "load_average": "$load_avg",
    "log_writable": $log_writable,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
EOF
    else
        local status_emoji
        case $exit_code in
            0) status_emoji="✅" ;;
            2) status_emoji="⚠️" ;;
            *) status_emoji="❌" ;;
        esac
        
        info "$status_emoji System: Disk ${disk_usage}%, Load $load_avg, Logs ${log_writable}"
    fi
    
    return $exit_code
}

# =============================================================================
# Comprehensive Health Check
# =============================================================================

run_health_check() {
    local servers=("$@")
    local detailed="${DETAILED:-false}"
    local overall_status=0
    
    info "🏥 Running health check for MCP servers"
    
    # Check system health first
    if ! check_system_health "$detailed"; then
        case $? in
            2) 
                warn "System health warning detected"
                if [[ $overall_status -eq 0 ]]; then
                    overall_status=2
                fi
                ;;
            *) 
                error "System health critical"
                overall_status=1
                ;;
        esac
    fi
    
    # Check each server
    for server in "${servers[@]}"; do
        if ! check_mcp_server_health "$server" "$detailed"; then
            case $? in
                2) 
                    warn "Server $server health warning"
                    if [[ $overall_status -eq 0 ]]; then
                        overall_status=2
                    fi
                    ;;
                *) 
                    error "Server $server health critical"
                    overall_status=1
                    ;;
            esac
        fi
    done
    
    # Summary
    local status_text
    case $overall_status in
        0) status_text="HEALTHY" ;;
        2) status_text="WARNING" ;;
        *) status_text="UNHEALTHY" ;;
    esac
    
    info "🏁 Overall health: $status_text"
    
    return $overall_status
}

# =============================================================================
# Quick Health Check (for Docker HEALTHCHECK)
# =============================================================================

quick_health_check() {
    debug "Running quick health check"
    
    # Check if any MCP server processes are running
    local mcp_processes
    mcp_processes=$(pgrep -f "node.*server" 2>/dev/null | wc -l)
    
    if [[ "$mcp_processes" -eq 0 ]]; then
        error "No MCP server processes found"
        return 1
    fi
    
    debug "Found $mcp_processes MCP server process(es)"
    
    # Check basic system resources
    local memory_total_kb
    if command_exists free; then
        memory_total_kb=$(free | awk '/^Mem:/ {print $2}')
        local memory_used_kb
        memory_used_kb=$(free | awk '/^Mem:/ {print $3}')
        local memory_percent
        memory_percent=$((memory_used_kb * 100 / memory_total_kb))
        
        if [[ "$memory_percent" -gt 95 ]]; then
            error "System memory critically high: ${memory_percent}%"
            return 1
        fi
    fi
    
    # Check disk space
    local disk_usage
    disk_usage=$(df "$APP_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [[ "$disk_usage" -gt 95 ]]; then
        error "Disk usage critically high: ${disk_usage}%"
        return 1
    fi
    
    debug "Quick health check passed"
    return 0
}

# =============================================================================
# Argument Processing and Main
# =============================================================================

parse_arguments() {
    local detailed=false
    local quick=false
    local servers=()
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --detailed|-d)
                detailed=true
                shift
                ;;
            --quick|-q)
                quick=true
                shift
                ;;
            --help|-h)
                show_health_usage
                exit 0
                ;;
            --*)
                error "Unknown option: $1"
                show_health_usage
                exit 1
                ;;
            *)
                servers+=("$1")
                shift
                ;;
        esac
    done
    
    # Export for use in other functions
    export DETAILED="$detailed"
    export QUICK="$quick"
    
    echo "${servers[@]}"
}

show_health_usage() {
    cat << EOF
Usage: $SCRIPT_NAME [options] [server1] [server2] ...

MCP TypeScript Boilerplate Health Check

Options:
  --detailed, -d     Show detailed health information in JSON format
  --quick, -q        Quick health check for Docker HEALTHCHECK
  --help, -h         Show this help message

Arguments:
  server1, server2   Specific servers to check (default: all running)

Examples:
  $SCRIPT_NAME                    # Check all running servers
  $SCRIPT_NAME news-data          # Check specific server
  $SCRIPT_NAME --detailed         # Detailed JSON health report
  $SCRIPT_NAME --quick            # Quick check for Docker

Health Status Codes:
  0 - Healthy (all systems operational)
  1 - Unhealthy (critical issues found)
  2 - Warning (degraded but functional)

Environment Variables:
  VERBOSE         - Enable verbose logging
  DEBUG           - Enable debug logging (use "health" for this script)
  HEALTH_TIMEOUT  - Health check timeout in seconds (default: 10)

EOF
}

main() {
    # Parse arguments
    local servers
    read -ra servers <<< "$(parse_arguments "$@")"
    
    # Quick mode for Docker HEALTHCHECK
    if [[ "${QUICK:-false}" == "true" ]]; then
        quick_health_check
        exit $?
    fi
    
    # Determine servers to check
    if [[ ${#servers[@]} -eq 0 ]]; then
        # Auto-detect running servers
        debug "Auto-detecting running servers"
        for server in "${!SERVER_PORTS[@]}"; do
            if pgrep -f "node.*${server}" >/dev/null 2>&1; then
                servers+=("$server")
            fi
        done
        
        if [[ ${#servers[@]} -eq 0 ]]; then
            warn "No running MCP servers detected"
            info "Available servers: ${!SERVER_PORTS[*]}"
            exit 2
        fi
        
        debug "Detected running servers: ${servers[*]}"
    fi
    
    # Run health check
    run_health_check "${servers[@]}"
    local health_status=$?
    
    # Exit with appropriate code
    case $health_status in
        0) 
            info "🎉 All systems healthy"
            ;;
        2) 
            warn "⚠️ System operational with warnings"
            ;;
        *) 
            error "💥 Critical health issues detected"
            ;;
    esac
    
    exit $health_status
}

# =============================================================================
# Error Handling
# =============================================================================

error_handler() {
    local line_number="$1"
    local error_code="$2"
    
    error "Health check failed at line $line_number (exit code: $error_code)"
    exit 1
}

trap 'error_handler ${LINENO} $?' ERR

# =============================================================================
# Bootstrap
# =============================================================================

# Ensure we're in the right directory
cd "$APP_DIR" 2>/dev/null || {
    error "Cannot access app directory: $APP_DIR"
    exit 1
}

# Run main function
main "$@"