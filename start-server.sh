#!/bin/bash

echo "🛑 Stopping any running servers..."
pkill -9 -f "next dev" 2>/dev/null
sleep 1

echo "🧹 Cleaning cache..."
rm -rf .next
rm -rf elitebuilders/.next

echo "🚀 Starting server on http://localhost:3000..."
cd /Users/jaan/Desktop/Hackathon

PORT=3000 npm run dev &

echo "✅ Server starting..."
echo "   URL: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
wait
