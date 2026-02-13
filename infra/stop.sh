#!/bin/bash
# ContentForge Infrastructure Shutdown Script

set -e

echo "🛑 Stopping ContentForge Infrastructure..."
echo ""

docker compose down

echo ""
echo "✅ All services stopped."
echo ""
echo "💡 To remove all data, run: docker compose down -v"
echo ""
