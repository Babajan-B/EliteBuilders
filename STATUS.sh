#!/bin/bash

echo "🎯 EliteBuilders - Simple Server Status"
echo "========================================"
echo ""

# Check what's running
if lsof -i :3000 > /dev/null 2>&1; then
  echo "✅ BACKEND running on: http://localhost:3000"
  echo "   (API endpoints: /api/*)"
else
  echo "❌ BACKEND not running"
fi

if lsof -i :3001 > /dev/null 2>&1; then
  echo "✅ FRONTEND running on: http://localhost:3001"
  echo "   (Main app UI)"
else
  echo "❌ FRONTEND not running"
fi

echo ""
echo "========================================"
echo ""

if lsof -i :3000 > /dev/null 2>&1 && lsof -i :3001 > /dev/null 2>&1; then
  echo "✅ BOTH SERVERS RUNNING!"
  echo ""
  echo "📍 Open: http://localhost:3001"
  echo ""
  echo "⚠️  IMPORTANT: RUN THIS SQL IN SUPABASE:"
  echo "   https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx"
  echo "   → SQL Editor → Run: FIX_CHALLENGES_RLS.sql"
else
  echo "🚀 START BOTH SERVERS:"
  echo "   ./START_BOTH.sh"
fi

echo ""
