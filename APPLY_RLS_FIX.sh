#!/bin/bash

# This script applies the RLS policies fix to your Supabase database

echo "🔧 Applying RLS policies fix..."
echo ""
echo "⚠️  INSTRUCTIONS:"
echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx"
echo "2. Click on 'SQL Editor' in the left sidebar"
echo "3. Click 'New Query'"
echo "4. Copy and paste the content from FIX_CHALLENGES_RLS.sql"
echo "5. Click 'Run' to execute"
echo ""
echo "📋 SQL to run:"
echo "==============================================="
cat /Users/jaan/Desktop/Hackathon/FIX_CHALLENGES_RLS.sql
echo ""
echo "==============================================="
echo ""
echo "✅ After running the SQL, restart your dev server:"
echo "   cd /Users/jaan/Desktop/Hackathon/elitebuilders"
echo "   npm run dev"
