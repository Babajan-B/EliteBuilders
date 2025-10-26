#!/bin/bash

# EliteBuilders Server Shutdown Script

echo "🛑 Stopping EliteBuilders Servers..."

# Kill by PID files
if [ -f ".backend.pid" ]; then
    BACKEND_PID=$(cat .backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        kill $BACKEND_PID
        echo "✓ Stopped backend (PID: $BACKEND_PID)"
    fi
    rm -f .backend.pid
fi

if [ -f ".frontend.pid" ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        kill $FRONTEND_PID
        echo "✓ Stopped frontend (PID: $FRONTEND_PID)"
    fi
    rm -f .frontend.pid
fi

# Fallback: Kill by port
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "✓ Killed process on port 3000"
lsof -ti:3001 | xargs kill -9 2>/dev/null && echo "✓ Killed process on port 3001"

# Clean up logs
rm -f backend.log frontend.log

echo "✓ All servers stopped"
