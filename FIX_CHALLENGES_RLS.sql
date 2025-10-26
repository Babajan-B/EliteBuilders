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
