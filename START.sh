#!/bin/bash

# EliteBuilders Full-Stack Startup Script
# This script starts both backend (port 3000) and frontend (port 3001) servers

echo "🚀 Starting EliteBuilders Full-Stack Application"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the correct directory
if [ ! -d "app/api" ]; then
    echo "❌ Error: Must run this script from /Hackathon directory"
    exit 1
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Port $1 is already in use. Kill the process? (y/n)${NC}"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
            lsof -ti:$1 | xargs kill -9
            echo "✓ Killed process on port $1"
        else
            echo "❌ Cannot start server on port $1"
            return 1
        fi
    fi
    return 0
}

# Check ports
echo -e "${BLUE}Checking ports...${NC}"
check_port 3000 || exit 1
check_port 3001 || exit 1

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Backend .env.local not found${NC}"
    exit 1
fi

if [ ! -f "elitebuilders/.env.local" ]; then
    echo -e "${YELLOW}⚠️  Frontend .env.local not found${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Environment files found${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    npm install
fi

if [ ! -d "elitebuilders/node_modules" ]; then
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    cd elitebuilders && npm install && cd ..
fi

echo ""
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Start backend server in background
echo -e "${BLUE}🔧 Starting Backend API Server (port 3000)...${NC}"
npm run dev > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Check if backend is running
if ! ps -p $BACKEND_PID > /dev/null; then
    echo -e "${YELLOW}❌ Backend failed to start. Check backend.log${NC}"
    exit 1
fi

# Test backend health
echo -e "${BLUE}🔍 Testing backend connectivity...${NC}"
if curl -s http://localhost:3000/api/health/db > /dev/null; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (might still be starting up)${NC}"
fi

echo ""

# Start frontend server in background
echo -e "${BLUE}🎨 Starting Frontend Server (port 3001)...${NC}"
cd elitebuilders
npm run dev -- -p 3001 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "Frontend PID: $FRONTEND_PID"

# Wait for frontend to start
sleep 3

# Check if frontend is running
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo -e "${YELLOW}❌ Frontend failed to start. Check frontend.log${NC}"
    kill $BACKEND_PID
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Frontend is starting...${NC}"
echo ""

# Print URLs
echo "=================================================="
echo -e "${GREEN}🎉 EliteBuilders is running!${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📍 URLs:${NC}"
echo "   Backend API:  http://localhost:3000/api"
echo "   Frontend App: http://localhost:3001"
echo ""
echo -e "${BLUE}📊 Health Check:${NC}"
echo "   curl http://localhost:3000/api/health/db"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo -e "${BLUE}🛑 To Stop:${NC}"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   Or run: ./STOP.sh"
echo ""
echo "=================================================="

# Save PIDs to file for easy shutdown
echo "$BACKEND_PID" > .backend.pid
echo "$FRONTEND_PID" > .frontend.pid

# Keep script running and show logs
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Trap Ctrl+C
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; rm -f .backend.pid .frontend.pid backend.log frontend.log; exit 0" INT

# Show combined logs
tail -f backend.log frontend.log
