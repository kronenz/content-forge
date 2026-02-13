#!/bin/bash
# ContentForge Infrastructure Startup Script

set -e

echo "🚀 Starting ContentForge Infrastructure..."
echo ""

# Check if .env exists
if [ ! -f ../.env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp ../.env.example ../.env
    echo "✅ Created .env file. Please edit it with your actual values."
    echo ""
fi

# Start services
echo "📦 Starting Docker services..."
docker compose up -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check service health
echo ""
echo "🔍 Service Status:"
docker compose ps

echo ""
echo "✅ Infrastructure started successfully!"
echo ""
echo "📊 Access URLs:"
echo "  - PostgreSQL: localhost:54322 (user: postgres, password: postgres)"
echo "  - Redis: localhost:6379"
echo "  - n8n: http://localhost:5678 (user: admin, password: changeme)"
echo ""
echo "📝 Next steps:"
echo "  1. Edit .env with your API keys"
echo "  2. Run 'docker compose logs -f' to view logs"
echo "  3. Run './stop.sh' to stop all services"
echo ""
