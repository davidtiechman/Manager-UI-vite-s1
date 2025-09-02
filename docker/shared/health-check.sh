#!/bin/sh
# Generic health check script for all Spark services
set -e

SERVICE_TYPE=${SERVICE_TYPE:-agent}
TIMEOUT=${HEALTH_CHECK_TIMEOUT:-10}

get_health_url() {
    case "$SERVICE_TYPE" in
        "agent")
            echo "http://localhost:${API_PORT:-3000}/health"
            ;;
        "manager")
            echo "http://localhost:${MANAGER_PORT:-9000}/health"
            ;;
        "proxy")
            echo "http://localhost:${HTTP_PORT:-8080}/health"
            ;;
        *)
            echo "http://localhost:3000/health"  # fallback
            ;;
    esac
}

check_http_health() {
    local health_url=$(get_health_url)
    
    if curl -s -f --max-time "$TIMEOUT" "$health_url" > /dev/null 2>&1; then
        echo "✓ Spark $SERVICE_TYPE HTTP endpoint is healthy"
        return 0
    else
        echo "✗ Spark $SERVICE_TYPE HTTP health check failed"
        return 1
    fi
}

check_process() {
    if pgrep -f "node.*dist/index.js.*$SERVICE_TYPE" > /dev/null; then
        echo "✓ Spark $SERVICE_TYPE process is running"
        return 0
    else
        echo "✗ Spark $SERVICE_TYPE process is not running"
        return 1
    fi
}

check_service_specific() {
    case "$SERVICE_TYPE" in
        "proxy")
            # Additional WebSocket port check for proxy
            local ws_port=${WS_PORT:-8081}
            if nc -z localhost "$ws_port" 2>/dev/null; then
                echo "✓ WebSocket port $ws_port is accessible"
                return 0
            else
                echo "✗ WebSocket port $ws_port is not accessible"
                return 1
            fi
            ;;
        "manager"|"agent")
            # For manager and agent, just return success
            return 0
            ;;
    esac
}

check_logs() {
    local log_file="/app/logs/Spark-${SERVICE_TYPE^}.log"
    
    if [ -f "$log_file" ]; then
        if find "$log_file" -mmin -5 2>/dev/null | grep -q .; then
            echo "✓ Recent log activity detected"
            return 0
        else
            echo "⚠ No recent log activity"
            return 1
        fi
    else
        echo "⚠ Log file not found: $log_file"
        return 1
    fi
}

main() {
    echo "Running Spark $SERVICE_TYPE health check..."
    
    local exit_code=0
    
    # Check if process is running
    if ! check_process; then
        exit_code=1
    fi
    
    # Check HTTP health endpoint
    if ! check_http_health; then
        exit_code=1
    fi
    
    # Service-specific checks
    if ! check_service_specific; then
        exit_code=1
    fi
    
    # Check logs (warning only)
    check_logs || echo "Log check is informational only"
    
    if [ $exit_code -eq 0 ]; then
        echo "✓ All health checks passed for $SERVICE_TYPE"
    else
        echo "✗ Health check failed for $SERVICE_TYPE"
    fi
    
    exit $exit_code
}

main "$@"