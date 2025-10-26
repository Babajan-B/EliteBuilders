#!/bin/bash

echo "🎯 EliteBuilders Server Status"
echo "================================"
echo ""

# Check port 3000
if lsof -i :3000 > /dev/null 2>&1; then
  echo "✅ SERVER RUNNING on port 3000"
  echo ""
  echo "   Frontend: http://localhost:3000"
  echo "   Backend API: http://localhost:3000/api"
  echo ""
  echo "📡 Available API Endpoints:"
  echo "   - GET  /api/challenges"
  echo "   - POST /api/submissions"
  echo "   - GET  /api/profile"
  echo "   - GET  /api/leaderboard"
  echo ""
else
  echo "❌ Server NOT running"
  echo ""
  echo "To start: ./START_SERVER.sh"
fi

echo "================================"
echo ""
echo "⚠️  IMPORTANT: Before testing, run this SQL in Supabase:"
echo ""
echo "1. Go to: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx"
echo "2. SQL Editor → New Query"
echo "3. Run the SQL from: FIX_CHALLENGES_RLS.sql"
echo "4. Then refresh your browser"
echo ""
echo "================================"
