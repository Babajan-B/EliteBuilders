#!/bin/bash

echo "🔍 Verifying EliteBuilders Status..."
echo ""

# Check if dev server is running
echo "1️⃣ Checking dev server..."
if lsof -i :3001 > /dev/null 2>&1; then
  echo "✅ Dev server is running on port 3001"
else
  echo "❌ Dev server is NOT running"
  echo "   Run: cd /Users/jaan/Desktop/Hackathon/elitebuilders && npm run dev"
fi

echo ""

# Check environment variables
echo "2️⃣ Checking environment variables..."
cd /Users/jaan/Desktop/Hackathon/elitebuilders
if [ -f .env.local ]; then
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
    echo "✅ Environment variables configured"
  else
    echo "❌ Missing Supabase environment variables"
  fi
else
  echo "❌ .env.local file not found"
fi

echo ""

# Check database connection
echo "3️⃣ Checking database connection..."
cd /Users/jaan/Desktop/Hackathon
if node check_challenges.js 2>/dev/null | grep -q "Challenge"; then
  echo "✅ Database connection working"
  CHALLENGE_COUNT=$(node check_challenges.js 2>/dev/null | grep -c "Challenge")
  echo "   Found $CHALLENGE_COUNT challenges in database"
else
  echo "❌ Cannot connect to database"
fi

echo ""
echo "📋 Next Steps:"
echo "==============================================="
echo "1. Apply RLS fix in Supabase SQL Editor:"
echo "   https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx"
echo ""
echo "2. Run the SQL from: FIX_CHALLENGES_RLS.sql"
echo ""
echo "3. Restart dev server:"
echo "   cd /Users/jaan/Desktop/Hackathon/elitebuilders"
echo "   npm run dev"
echo ""
echo "4. Open in browser:"
echo "   http://localhost:3001"
echo ""
echo "5. Check browser console for logs:"
echo "   - 🔧 Supabase Client Init"
echo "   - ✅ Supabase client created"
echo "   - ✅ Raw data received: X challenges"
echo "==============================================="
