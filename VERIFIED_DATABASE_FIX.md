# VERIFIED Database Fix - Based on Actual Schema

## Current Database State (VERIFIED)

I've checked your actual Supabase database and found:

### ✅ Columns that EXIST in `profiles` table:
1. id (UUID)
2. email (TEXT)
3. display_name (TEXT)
4. role (TEXT)
5. bio (TEXT, nullable)
6. avatar_url (TEXT, nullable)
7. created_at (TIMESTAMP)
8. **github_url** (TEXT, nullable) ← ✅ EXISTS!
9. **linkedin_url** (TEXT, nullable) ← ✅ EXISTS!

### ❌ What's MISSING:
- **profile_picture_url** column does NOT exist

### 🔒 Current Issues:
1. Missing `profile_picture_url` column
2. Row Level Security (RLS) is blocking inserts from frontend
3. Foreign key constraint: `profiles.id` references `users.id` (from Supabase Auth)

## Root Cause of Signup Error

When a user signs up:
1. ✅ Supabase Auth creates user in `auth.users` table
2. ❌ Frontend tries to insert into `profiles` table BUT:
   - Missing `profile_picture_url` column causes error
   - RLS policy blocks insert because user session isn't fully established yet

## The Complete Fix

You need to run this SQL in Supabase to:
1. Add the missing `profile_picture_url` column
2. Fix RLS policies to allow profile creation during signup
3. Optionally: Create a database trigger to auto-create profiles

---

## SQL TO RUN IN SUPABASE

Copy and paste this EXACT SQL into your Supabase SQL Editor:

**Go to:** https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql

```sql
-- ============================================================================
-- STEP 1: Add missing column
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to user profile picture';


-- ============================================================================
-- STEP 2: Enable Row Level Security (if not already enabled)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- STEP 3: Drop existing policies to avoid conflicts
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;


-- ============================================================================
-- STEP 4: Create new RLS policies
-- ============================================================================

-- Policy 1: Allow everyone to view profiles (public read)
CREATE POLICY "Enable read access for all users"
ON profiles
FOR SELECT
USING (true);

-- Policy 2: Allow authenticated users to insert their own profile
-- This is critical for signup to work!
CREATE POLICY "Enable insert for authenticated users only"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to update their own profile
CREATE POLICY "Enable update for users based on id"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 4: Allow admins to update any profile
CREATE POLICY "Admins can update any profile"
ON profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);


-- ============================================================================
-- STEP 5: Create indexes for performance (if they don't exist)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);


-- ============================================================================
-- STEP 6: Verify the changes
-- ============================================================================

-- Check if column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name = 'profile_picture_url';

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles'
AND schemaname = 'public';

-- List all policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'profiles';
```

---

## What This SQL Does

### 1. Adds Missing Column
- Adds `profile_picture_url TEXT` to profiles table
- Makes it nullable (optional field)

### 2. Fixes RLS Policies
- **SELECT**: Everyone can view profiles (public read)
- **INSERT**: Authenticated users can insert their own profile (auth.uid() = id)
- **UPDATE**: Users can update their own profile
- **UPDATE**: Admins can update any profile

### 3. Adds Performance Indexes
- Index on `email` for faster lookups
- Index on `role` for filtering by user type

---

## After Running the SQL

### Test Signup:

1. Go to: http://localhost:3001/auth/signup
2. Fill in the signup form with:
   - Name
   - Email
   - Password
   - GitHub URL (required)
   - LinkedIn URL (required)
   - Profile Picture URL (optional)
3. Click "Sign Up"

### Expected Result:
✅ User should be created successfully
✅ Profile should be created in `profiles` table
✅ User should be redirected to `/dashboard`

### If It Still Fails:

The improved error logging will now show you the EXACT error in the browser console:
- Error message
- Error code
- Error details
- Error hint

---

## Verification Queries

After running the SQL, you can verify it worked:

```sql
-- Check the profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT *
FROM pg_policies
WHERE tablename = 'profiles';

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';
```

---

## Current Profiles in Database

You currently have 2 profiles:
1. **Alice Judge** - alice@example.com (role: judge)
2. **Bob Builder** - bob@example.com (role: builder)

Both have:
- ✅ github_url (Bob has it filled, Alice has null)
- ✅ linkedin_url (Bob has it filled, Alice has null)
- ❌ profile_picture_url (will be added by the SQL above)

---

## Summary

**What exists:**
- ✅ profiles table
- ✅ id, email, display_name, role columns
- ✅ github_url, linkedin_url columns
- ✅ avatar_url, bio columns

**What's missing:**
- ❌ profile_picture_url column

**What's broken:**
- ❌ RLS policies blocking profile creation during signup

**The fix:**
1. Add profile_picture_url column
2. Configure proper RLS policies
3. Test signup flow

Run the SQL above and your signup will work! 🚀
