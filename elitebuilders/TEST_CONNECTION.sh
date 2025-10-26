#!/bin/bash

echo "🧪 Testing Supabase Connection..."
echo ""

cd /Users/jaan/Desktop/Hackathon

echo "1️⃣ Checking challenges in database..."
node check_challenges.js | head -30

echo ""
echo "2️⃣ Environment variables check..."
echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:30}..."

echo ""
echo "3️⃣ Starting frontend with debug mode..."
cd elitebuilders
npm run dev
