#!/bin/bash

# EliteBuilders Server Restart Script

echo "🛑 Stopping all servers..."
pkill -9 -f "next dev" 2>/dev/null
pkill -9 -f "node.*elitebuilders" 2>/dev/null
sleep 2

echo "🧹 Cleaning cache..."
cd /Users/jaan/Desktop/Hackathon/elitebuilders
rm -rf .next
echo "✅ Cache cleared"

echo ""
echo "🚀 Starting server..."
PORT=3000 npm run dev

