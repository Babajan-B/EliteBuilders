#!/bin/bash

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "🚨 YOUR APP WON'T WORK UNTIL YOU RUN THIS SQL!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "❌ Current Error: Empty Supabase error {}"
echo "❌ Reason: Database is blocking access (RLS policies)"
echo ""
echo "✅ SOLUTION: Run this SQL in Supabase Dashboard (30 seconds)"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 STEP 1: Open this URL"
echo "   https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/editor/sql"
echo ""
echo "📋 STEP 2: Click '+ New Query'"
echo ""
echo "📋 STEP 3: Copy this ENTIRE SQL block:"
echo ""
echo "═══════════════════════════════════════════════════════════"
cat << 'EOF'
-- Fix RLS policies for challenges table
DROP POLICY IF EXISTS "challenges_public_read" ON challenges;
DROP POLICY IF EXISTS "challenges_select_all" ON challenges;
DROP POLICY IF EXISTS "Enable read access for all users" ON challenges;

CREATE POLICY "challenges_public_read"
ON challenges FOR SELECT TO public USING (true);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Fix submissions table
DROP POLICY IF EXISTS "submissions_select_own" ON submissions;
DROP POLICY IF EXISTS "submissions_insert_own" ON submissions;

CREATE POLICY "submissions_select_own"
ON submissions FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "submissions_insert_own"
ON submissions FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Fix profiles table
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT TO public USING (true);

CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
EOF
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 STEP 4: Click 'RUN' button (or press Cmd+Enter)"
echo ""
echo "📋 STEP 5: Wait for 'Success. No rows returned' message"
echo ""
echo "📋 STEP 6: Refresh your browser: http://localhost:3001"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ After running this SQL, EVERYTHING will work:"
echo "   • Competitions will load"
echo "   • Submit page will work"
echo "   • My Submissions will work"
echo "   • Dashboard will work"
echo ""
echo "⏰ This is a ONE-TIME fix. Takes 30 seconds!"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
