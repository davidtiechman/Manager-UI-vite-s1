#!/bin/bash
set -e

# Simplified build script for unified Docker image
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
REGISTRY="${DOCKER_REGISTRY:-}"
TAG="${DOCKER_TAG:-latest}"
IMAGE_NAME="spark"
BUILD_ARGS=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1"
    exit 1
}

# Build unified image
build_unified_image() {
    local full_image_name="$IMAGE_NAME"
    
    if [ -n "$REGISTRY" ]; then
        full_image_name="${REGISTRY}/${IMAGE_NAME}"
    fi
    
    log "Building unified Spark image..."
    log "Image: ${full_image_name}:${TAG}"
    
    if ! docker build \
        --build-arg BUILD_DATE="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
        --build-arg VCS_REF="$(git rev-parse HEAD 2>/dev/null || echo 'unknown')" \
        -t "${full_image_name}:${TAG}" \
        $BUILD_ARGS \
        "$PROJECT_ROOT"; then
        error "Failed to build unified Spark image"
    fi
    
    log "Successfully built ${full_image_name}:${TAG}"
    
    # Tag as latest if not already
    if [ "$TAG" != "latest" ]; then
        docker tag "${full_image_name}:${TAG}" "${full_image_name}:latest"
        log "Tagged as ${full_image_name}:latest"
    fi
    
    return 0
}

# Test image by running each service type
test_image() {
    local image_name="${REGISTRY:+$REGISTRY/}$IMAGE_NAME:$TAG"
    
    log "Testing unified image with different service types..."
    
    # Test each service type
    for service_type in manager proxy agent; do
        log "Testing $service_type service type..."
        
        if docker run --rm -e SERVICE_TYPE="$service_type" "$image_name" sh -c "echo 'Service type: $service_type' && ./docker/shared/entrypoint.sh --help" > /dev/null 2>&1; then
            log "✓ $service_type service type works"
        else
            error "✗ $service_type service type failed"
        fi
    done
    
    log "All service types tested successfully!"
}

# Show usage information
show_usage() {
    cat << EOF
Usage: $0 [options]

Build unified Spark Docker image that can run as agent, manager, or proxy.

Options:
  --registry REGISTRY   Docker registry prefix
  --tag TAG            Image tag (default: latest)
  --no-cache           Build without cache
  --test               Test the built image
  --push               Push to registry (requires --registry)
  --help               Show this help

Examples:
  $0                                    # Build spark:latest
  $0 --tag v1.0.0                     # Build spark:v1.0.0
  $0 --registry myregistry.com --push  # Build and push to registry
  $0 --test                            # Build and test all service types

The built image can be used for any service type:
  docker run -e SERVICE_TYPE=agent spark:latest
  docker run -e SERVICE_TYPE=manager spark:latest
  docker run -e SERVICE_TYPE=proxy spark:latest
EOF
}

# Push to registry
push_image() {
    if [ -z "$REGISTRY" ]; then
        error "Registry not specified. Use --registry option."
    fi
    
    local full_image_name="${REGISTRY}/${IMAGE_NAME}"
    
    log "Pushing ${full_image_name}:${TAG} to registry..."
    
    if ! docker push "${full_image_name}:${TAG}"; then
        error "Failed to push image to registry"
    fi
    
    if [ "$TAG" != "latest" ]; then
        log "Pushing ${full_image_name}:latest to registry..."
        docker push "${full_image_name}:latest"
    fi
    
    log "Successfully pushed to registry"
}

# Main execution
main() {
    cd "$PROJECT_ROOT"
    
    log "Starting Spark unified Docker build process..."
    log "Registry: ${REGISTRY:-local}"
    log "Tag: $TAG"
    log "Image: ${REGISTRY:+$REGISTRY/}$IMAGE_NAME:$TAG"
    
    # Build the unified image
    build_unified_image
    
    # Test if requested
    if [ "$TEST_IMAGE" = "true" ]; then
        test_image
    fi
    
    # Push if requested
    if [ "$PUSH_IMAGE" = "true" ]; then
        push_image
    fi
    
    log "Build process completed successfully!"
    
    # Show built image
    echo ""
    log "Built image:"
    docker images | grep "$IMAGE_NAME" | head -1
    
    echo ""
    log "Usage examples:"
    echo "  docker run -e SERVICE_TYPE=manager ${REGISTRY:+$REGISTRY/}$IMAGE_NAME:$TAG"
    echo "  docker run -e SERVICE_TYPE=proxy ${REGISTRY:+$REGISTRY/}$IMAGE_NAME:$TAG"
    echo "  docker run -e SERVICE_TYPE=agent ${REGISTRY:+$REGISTRY/}$IMAGE_NAME:$TAG"
    echo "  docker-compose up  # Uses spark:latest with different SERVICE_TYPE per service"
}

# Parse command line arguments
TEST_IMAGE=false
PUSH_IMAGE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        --no-cache)
            BUILD_ARGS="$BUILD_ARGS --no-cache"
            shift
            ;;
        --test)
            TEST_IMAGE=true
            shift
            ;;
        --push)
            PUSH_IMAGE=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

main "$@"