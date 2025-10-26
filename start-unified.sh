#!/bin/bash
echo "✅ Starting unified server (Frontend + Backend)..."
cd /Users/jaan/Desktop/Hackathon
PORT=3000 npm run dev &
sleep 5
echo ""
echo "🌐 Server: http://localhost:3000"
echo "🔑 Login: http://localhost:3000/auth/signin"
echo ""
tail -f /dev/null
