# 🚀 QUICK FIX GUIDE - Competitions & Submissions

## Problem
- ❌ Supabase error: {} when loading competitions
- ❌ Competitions page showing empty results
- ❌ Submission page needs to be activated

## Root Cause
The issue is **Row Level Security (RLS) policies** blocking access to the `challenges` table. The empty error object `{}` is a typical sign of RLS denying access.

---

## ✅ SOLUTION - Run This SQL in Supabase

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx
2. Click **"SQL Editor"** in left sidebar
3. Click **"New Query"**

### Step 2: Paste and Run This SQL

```sql
-- Fix RLS policies for challenges table to allow public read access

-- Drop existing policies if any
DROP POLICY IF EXISTS "challenges_public_read" ON challenges;
DROP POLICY IF EXISTS "challenges_select_all" ON challenges;
DROP POLICY IF EXISTS "Enable read access for all users" ON challenges;

-- Create a permissive policy that allows anyone (authenticated or not) to read challenges
CREATE POLICY "challenges_public_read"
ON challenges
FOR SELECT
TO public
USING (true);

-- Ensure RLS is enabled
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Also fix submissions table to allow users to see their own submissions
DROP POLICY IF EXISTS "submissions_select_own" ON submissions;
DROP POLICY IF EXISTS "submissions_insert_own" ON submissions;

CREATE POLICY "submissions_select_own"
ON submissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "submissions_insert_own"
ON submissions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Fix profiles table policies
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select_all"
ON profiles
FOR SELECT
TO public
USING (true);

CREATE POLICY "profiles_insert_own"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

### Step 3: Click "RUN" button (or press Cmd+Enter)

### Step 4: Restart Your Dev Server
```bash
cd /Users/jaan/Desktop/Hackathon/elitebuilders
npm run dev
```

---

## ✅ What This Fixes

1. **Challenges Table** - Public read access so anyone can see competitions (even when not logged in)
2. **Submissions Table** - Users can only see and create their own submissions
3. **Profiles Table** - Public read access, but users can only edit their own profile

---

## 🧪 How to Test

### 1. Test Competitions Page
- Go to: http://localhost:3001/competitions
- Should see list of 4 active competitions
- Check browser console for: `✅ HOME: Raw data received: 4 challenges`

### 2. Test Submission Page  
- Click on any active competition
- Click "Submit Entry" button
- Should see submission form
- Try submitting with:
  - GitHub URL: https://github.com/yourusername/test-repo
  - Writeup: At least 50 characters of text

### 3. Check Browser Console
Look for these logs:
- 🔧 Supabase Client Init: {hasUrl: true, hasKey: true}
- ✅ Supabase client created successfully
- 📡 Querying Supabase challenges table...
- ✅ Raw data received: 4 challenges

---

## 🎯 Submission Page Features

The submission page at `/submit/[competitionId]` includes:

✅ **Form Fields:**
- GitHub Repository URL (required)
- Pitch Deck URL (optional)
- Demo Video/Live Demo URL (optional)
- Project Writeup in Markdown (required, min 50 chars)

✅ **Validation:**
- Must be logged in
- Competition must be active
- Repository URL must be valid
- Writeup must be at least 50 characters

✅ **AI Analysis:**
- Automatically triggers Gemini AI analysis after submission
- Runs in background (doesn't block submission)
- Analyzes code quality, innovation, presentation

✅ **User Experience:**
- Shows loading state while submitting
- Success message with auto-redirect
- Can update existing submissions
- Shows if competition is closed

---

## 🐛 If Still Not Working

### Check RLS Policies Applied
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('challenges', 'submissions', 'profiles')
ORDER BY tablename, policyname;
```

### Check Browser Console
Look for any red errors. The key logs to find:
- ❌ Supabase error: (should be GONE after fix)
- ✅ Raw data received: X challenges (should show actual count)

### Verify Auth
```sql
SELECT id, email FROM auth.users LIMIT 5;
```

---

## 📝 Summary

**Before Fix:**
- RLS policies were blocking access
- Empty error object `{}`
- Competitions showing 0 results

**After Fix:**
- Public can read challenges
- Authenticated users can submit
- Proper error handling
- AI analysis enabled

**Expected Result:**
- ✅ Competitions load correctly
- ✅ Submission form works
- ✅ User can submit entries
- ✅ AI analysis triggers automatically
