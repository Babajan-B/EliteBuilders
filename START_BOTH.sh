#!/bin/bash

echo "🚀 Starting EliteBuilders (Both Servers)"
echo "========================================"
echo ""

# Kill existing
echo "1️⃣ Stopping any existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
pkill -9 -f "next dev" 2>/dev/null
sleep 2

# Start backend (port 3000)
echo "2️⃣ Starting BACKEND (port 3000)..."
cd /Users/jaan/Desktop/Hackathon
npm run dev > backend.log 2>&1 &
echo $! > .backend.pid
sleep 3

# Start frontend (port 3001)
echo "3️⃣ Starting FRONTEND (port 3001)..."
cd /Users/jaan/Desktop/Hackathon/elitebuilders
PORT=3001 npm run dev > frontend.log 2>&1 &
echo $! > .frontend.pid
sleep 3

echo ""
echo "✅ BOTH SERVERS STARTED!"
echo ""
echo "📍 Open: http://localhost:3001"
echo ""
echo "⚠️  CRITICAL: RUN THIS SQL FIRST IN SUPABASE:"
echo "   https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx"
echo "   → SQL Editor → New Query"
echo "   → Copy/paste: FIX_CHALLENGES_RLS.sql"
echo "   → Click RUN"
echo ""
echo "📝 To check status: ./STATUS.sh"
echo "📝 To stop servers: ./STOP.sh"
echo ""
