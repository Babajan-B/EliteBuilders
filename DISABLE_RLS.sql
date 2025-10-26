-- DISABLE RLS FOR TESTING
-- This removes all Row Level Security restrictions

-- Disable RLS on challenges table
ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;

-- Disable RLS on submissions table
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;

-- Disable RLS on profiles table
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Disable RLS on other tables (if they exist)
ALTER TABLE IF EXISTS invitations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS judge_assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sponsor_orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sponsor_org_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (cleanup)
DROP POLICY IF EXISTS "challenges_public_read" ON challenges;
DROP POLICY IF EXISTS "challenges_select_all" ON challenges;
DROP POLICY IF EXISTS "Enable read access for all users" ON challenges;
DROP POLICY IF EXISTS "submissions_select_own" ON submissions;
DROP POLICY IF EXISTS "submissions_insert_own" ON submissions;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Success message
SELECT 'RLS DISABLED - All tables are now open for testing!' as status;
