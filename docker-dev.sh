set -e

echo " Product Explorer - Development Environment"
echo "============================================="

show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  up       Start all services in development mode"
    echo "  down     Stop all services"
    echo "  restart  Restart all services"
    echo "  logs     Show logs for all services"
    echo "  backend  Show backend logs only"
    echo "  db       Show database logs only"
    echo "  redis    Show redis logs only"
    echo "  shell    Open shell in backend container"
    echo "  clean    Remove all containers and volumes"
    echo "  build    Rebuild all images"
    echo "  status   Show status of all services"
    echo ""
}

if ! command -v docker-compose &> /dev/null; then
    echo "docker-compose is not installed or not in PATH"
    exit 1
fi

# Set environment file
ENV_FILE=".env.docker"
if [ ! -f "$ENV_FILE" ]; then
    echo "  $ENV_FILE not found, copying from .env.example"
    cp .env.example "$ENV_FILE"
fi

case "${1:-up}" in
    "up")
        echo " Starting development environment..."
        docker-compose --profile dev --env-file "$ENV_FILE" up -d
        echo " Services started!"
        echo " Backend API: http://localhost:3001"
        echo " API Docs: http://localhost:3001/api/docs"
        echo " PostgreSQL: localhost:5433"
        echo " Redis: localhost:6380"
        ;;
    "down")
        echo " Stopping all services..."
        docker-compose --profile dev down
        echo " Services stopped!"
        ;;
    "restart")
        echo " Restarting all services..."
        docker-compose --profile dev --env-file "$ENV_FILE" restart
        echo " Services restarted!"
        ;;
    "logs")
        echo " Showing logs for all services..."
        docker-compose --profile dev logs -f
        ;;
    "backend")
        echo " Showing backend logs..."
        docker-compose --profile dev logs -f backend-dev
        ;;
    "db")
        echo " Showing database logs..."
        docker-compose logs -f postgres
        ;;
    "redis")
        echo " Showing redis logs..."
        docker-compose logs -f redis
        ;;
    "shell")
        echo " Opening shell in backend container..."
        docker-compose --profile dev exec backend-dev sh
        ;;
    "clean")
        echo " Cleaning up containers and volumes..."
        docker-compose --profile dev down -v --remove-orphans
        docker system prune -f
        echo " Cleanup complete!"
        ;;
    "build")
        echo " Rebuilding all images..."
        docker-compose --profile dev --env-file "$ENV_FILE" build --no-cache
        echo " Build complete!"
        ;;
    "status")
        echo " Service status:"
        docker-compose --profile dev ps
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    *)
        echo " Unknown command: $1"
        show_usage
        exit 1
        ;;
esac