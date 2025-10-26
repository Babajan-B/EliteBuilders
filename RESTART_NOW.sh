#!/bin/bash

echo "🔄 Restarting EliteBuilders Server..."
echo ""

# Kill existing servers
echo "1️⃣ Stopping existing servers..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
pkill -9 -f "next dev" 2>/dev/null
sleep 2

# Clear cache
echo "2️⃣ Clearing cache..."
cd /Users/jaan/Desktop/Hackathon/elitebuilders
rm -rf .next
echo "✅ Cache cleared"

# Start server
echo ""
echo "3️⃣ Starting fresh server..."
npm run dev

echo ""
echo "✅ Server should be running on http://localhost:3000"
