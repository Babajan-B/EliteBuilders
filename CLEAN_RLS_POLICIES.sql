-- CLEAN UP DUPLICATE RLS POLICIES

-- Drop old policies that might conflict
DROP POLICY IF EXISTS "p_profiles_self_read" ON profiles;
DROP POLICY IF EXISTS "p_profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Create clean, simple policies

-- SELECT: All authenticated users can read all profiles
CREATE POLICY "profiles_select_all"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- INSERT: Users can only insert their own profile
CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can only update their own profile
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;
