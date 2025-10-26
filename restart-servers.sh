#!/bin/bash

echo "🔄 Stopping all running servers..."
pkill -f "next dev" 2>/dev/null
pkill -f "node.*elitebuilders" 2>/dev/null
sleep 2

echo "🧹 Cleaning Next.js cache..."
cd /Users/jaan/Desktop/Hackathon/elitebuilders
rm -rf .next

echo "🚀 Starting Next.js development server..."
cd /Users/jaan/Desktop/Hackathon/elitebuilders
npm run dev &

SERVER_PID=$!
echo "✅ Server started with PID: $SERVER_PID"
echo ""
echo "📊 Server is starting..."
echo "   Frontend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Wait for server to start
sleep 5

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
   echo "✅ Server is running successfully!"
else
   echo "❌ Server failed to start. Check the logs above."
fi

# Keep script running
wait $SERVER_PID
