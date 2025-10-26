-- FIX RLS INFINITE RECURSION ON PROFILES TABLE
-- Error: "infinite recursion detected in policy for relation profiles"

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- Create simple, non-recursive policies

-- Policy 1: Anyone can SELECT all profiles
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Users can INSERT their own profile
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 3: Users can UPDATE their own profile
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify policies
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles';
