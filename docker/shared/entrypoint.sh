#!/bin/sh
# Unified entrypoint script - determines service type from environment variable
set -e

# Get service type from environment variable (runtime decision)
SERVICE_TYPE=${SERVICE_TYPE:-agent}

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [${SERVICE_TYPE^^}] $1"
}

wait_for_service() {
    local service_url="$1"
    local service_name="$2"
    local max_attempts="${3:-30}"
    local attempt=1
    
    log "Waiting for $service_name to be ready at $service_url"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$service_url/health" > /dev/null 2>&1; then
            log "$service_name is ready!"
            return 0
        fi
        log "Attempt $attempt/$max_attempts: $service_name not ready, waiting 3 seconds..."
        sleep 3
        attempt=$((attempt + 1))
    done
    
    log "WARNING: $service_name failed to become ready after $max_attempts attempts"
    return 1
}

init_directories() {
    log "Creating service directories for $SERVICE_TYPE..."
    mkdir -p /app/logs /app/data /app/config
    
    case "$SERVICE_TYPE" in
        "agent")
            mkdir -p /app/data/cache /app/data/monitoring
            ;;
        "manager") 
            mkdir -p /app/data/agents /app/data/configurations /app/data/monitoring
            ;;
        "proxy")
            mkdir -p /app/data/messages /app/data/clients /app/data/stats
            mkdir -p /app/data/messages/pending /app/data/messages/sent /app/data/messages/failed
            ;;
    esac
    
    log "Service directories created for $SERVICE_TYPE"
}

wait_for_dependencies() {
    case "$SERVICE_TYPE" in
        "agent")
            # Agent depends on both Manager and Proxy
            if [ -n "$FLOW_CONTROL_MANAGER_URL" ]; then
                wait_for_service "$FLOW_CONTROL_MANAGER_URL" "Spark Manager" 30 || {
                    log "WARNING: Manager not ready, using local config only"
                }
            fi
            
            if [ -n "$PROXY_SERVER_URL" ]; then
                proxy_base_url=$(echo "$PROXY_SERVER_URL" | sed 's|/api/messages||')
                wait_for_service "$proxy_base_url" "Spark Proxy" 30 || {
                    log "ERROR: Proxy not ready, agent cannot function properly"
                    exit 1
                }
            fi
            ;;
        "proxy")
            # Proxy optionally waits for Manager
            if [ -n "$FLOW_CONTROL_MANAGER_URL" ]; then
                wait_for_service "$FLOW_CONTROL_MANAGER_URL" "Spark Manager" 20 || {
                    log "Manager not ready, proxy will operate independently"
                }
            fi
            ;;
        "manager")
            # Manager doesn't wait for anyone (it starts first)
            log "Manager is the primary service, starting immediately..."
            ;;
        *)
            log "Unknown service type: $SERVICE_TYPE"
            exit 1
            ;;
    esac
}

setup_signal_handlers() {
    trap "log 'Received SIGTERM, shutting down $SERVICE_TYPE...'; kill -TERM \$child 2>/dev/null; wait \$child" TERM
    trap "log 'Received SIGINT, shutting down $SERVICE_TYPE...'; kill -INT \$child 2>/dev/null; wait \$child" INT
    trap "log 'Received SIGHUP, reloading $SERVICE_TYPE configuration...'; kill -HUP \$child 2>/dev/null" HUP
}

print_startup_info() {
    log "=== Spark $SERVICE_TYPE Starting ==="
    log "Environment: ${NODE_ENV:-production}"
    log "Log Level: ${LOG_LEVEL:-info}"
    
    case "$SERVICE_TYPE" in
        "agent")
            log "API Port: ${API_PORT:-3000}"
            log "Proxy URL: ${PROXY_SERVER_URL:-not-set}"
            log "Manager URL: ${FLOW_CONTROL_MANAGER_URL:-not-set}"
            log "Scheduler Mode: ${SCHEDULER_MODE:-continuous}"
            log "Selected Link: ${SELECTED_LINK:-wifi}"
            ;;
        "manager")
            log "Manager Port: ${MANAGER_PORT:-9000}"
            log "Agent Timeout: ${AGENT_TIMEOUT:-300000}ms"
            log "Default Scheduler: ${DEFAULT_SCHEDULER_MODE:-continuous}"
            ;;
        "proxy")
            log "HTTP Port: ${HTTP_PORT:-8080}"
            log "WebSocket Port: ${WS_PORT:-8081}"
            log "Max Connections: ${MAX_CONNECTIONS:-1000}"
            log "Manager URL: ${FLOW_CONTROL_MANAGER_URL:-not-set}"
            ;;
    esac
    log "=================================="
}

main() {
    log "Starting Spark $SERVICE_TYPE initialization..."
    
    # Validate service type
    case "$SERVICE_TYPE" in
        "agent"|"manager"|"proxy")
            log "Service type validated: $SERVICE_TYPE"
            ;;
        *)
            log "ERROR: Invalid SERVICE_TYPE '$SERVICE_TYPE'. Must be: agent, manager, or proxy"
            exit 1
            ;;
    esac
    
    # Initialize service-specific directories
    init_directories
    
    # Wait for required dependencies
    wait_for_dependencies
    
    # Setup signal handlers for graceful shutdown
    setup_signal_handlers
    
    # Print startup information
    print_startup_info
    
    log "Starting Spark $SERVICE_TYPE process..."
    
    # Start the Node.js application with the service type argument
    exec node dist/index.js "$SERVICE_TYPE" &
    child=$!
    wait $child
}

main "$@"