set -e

echo " Product Explorer - Production Environment"
echo "============================================"

show_usage() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  up       Start all services in production mode"
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
    echo "  migrate  Run database migrations"
    echo "  seed     Run database seeding"
    echo ""
}

if ! command -v docker-compose &> /dev/null; then
    echo " docker-compose is not installed or not in PATH"
    exit 1
fi

ENV_FILE=".env.production"
if [ ! -f "$ENV_FILE" ]; then
    echo "  $ENV_FILE not found, using .env.docker as fallback"
    ENV_FILE=".env.docker"
fi

case "${1:-up}" in
    "up")
        echo " Starting production environment..."
        docker-compose --profile prod --env-file "$ENV_FILE" up -d
        echo " Services started!"
        echo " Backend API: http://localhost:3001"
        echo " API Docs: http://localhost:3001/api/docs"
        echo "  PostgreSQL: localhost:5433"
        echo " Redis: localhost:6380"
        ;;
    "down")
        echo " Stopping all services..."
        docker-compose --profile prod down
        echo " Services stopped!"
        ;;
    "restart")
        echo " Restarting all services..."
        docker-compose --profile prod --env-file "$ENV_FILE" restart
        echo " Services restarted!"
        ;;
    "logs")
        echo " Showing logs for all services..."
        docker-compose --profile prod logs -f
        ;;
    "backend")
        echo " Showing backend logs..."
        docker-compose --profile prod logs -f backend-prod
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
        docker-compose --profile prod exec backend-prod sh
        ;;
    "clean")
        echo " Cleaning up containers and volumes..."
        docker-compose --profile prod down -v --remove-orphans
        docker system prune -f
        echo " Cleanup complete!"
        ;;
    "build")
        echo " Rebuilding all images..."
        docker-compose --profile prod --env-file "$ENV_FILE" build --no-cache
        echo " Build complete!"
        ;;
    "status")
        echo " Service status:"
        docker-compose --profile prod ps
        ;;
    "migrate")
        echo " Running database migrations..."
        docker-compose --profile prod exec backend-prod npm run migration:run
        echo " Migrations complete!"
        ;;
    "seed")
        echo " Seeding database..."
        docker-compose --profile prod exec backend-prod npm run seed
        echo " Seeding complete!"
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