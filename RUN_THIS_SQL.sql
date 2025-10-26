-- ============================================================================
-- ELITEBUILDERS DATABASE FIX
-- Run this SQL in Supabase SQL Editor
-- https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql
-- ============================================================================

-- STEP 1: Add missing profile_picture_url column
-- ----------------------------------------------------------------------------
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to user profile picture';


-- STEP 2: Enable Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;


-- STEP 3: Drop old policies to avoid conflicts
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;


-- STEP 4: Create new RLS policies
-- ----------------------------------------------------------------------------

-- Allow everyone to view profiles
CREATE POLICY "Enable read access for all users"
ON profiles
FOR SELECT
USING (true);

-- Allow authenticated users to insert their own profile (CRITICAL FOR SIGNUP!)
CREATE POLICY "Enable insert for authenticated users only"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users based on id"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to update any profile
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


-- STEP 5: Create performance indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);


-- STEP 6: Verify changes (optional - check results)
-- ----------------------------------------------------------------------------

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
