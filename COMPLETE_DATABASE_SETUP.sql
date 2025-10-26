-- ============================================================================
-- ELITEBUILDERS COMPLETE DATABASE SETUP
-- Run this SQL in Supabase SQL Editor
-- https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql
-- ============================================================================
-- This script will:
-- 1. Fix the profiles table (add missing column + RLS policies)
-- 2. Create invitations table for admin panel
-- 3. Set up all necessary indexes and constraints
-- ============================================================================


-- ============================================================================
-- PART 1: FIX PROFILES TABLE
-- ============================================================================

-- Add missing profile_picture_url column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

COMMENT ON COLUMN profiles.profile_picture_url IS 'URL to user profile picture';


-- Enable Row Level Security on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;


-- Drop old/conflicting policies on profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;


-- Create RLS policies for profiles
CREATE POLICY "Enable read access for all users"
ON profiles
FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users only"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update for users based on id"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

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


-- Add indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);


-- ============================================================================
-- PART 2: CREATE INVITATIONS TABLE
-- ============================================================================

-- Create invitations table for managing judge and sponsor invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('judge', 'sponsor')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  name TEXT -- Optional: invitee's name
);

COMMENT ON TABLE invitations IS 'Stores invitation records for judges and sponsors';
COMMENT ON COLUMN invitations.email IS 'Email address of the invitee';
COMMENT ON COLUMN invitations.role IS 'Role to assign when invitation is accepted (judge or sponsor)';
COMMENT ON COLUMN invitations.token IS 'Unique token for invitation link';
COMMENT ON COLUMN invitations.status IS 'Current status of invitation (pending, accepted, expired)';
COMMENT ON COLUMN invitations.invited_by IS 'Profile ID of admin who sent the invitation';
COMMENT ON COLUMN invitations.expires_at IS 'Expiration timestamp for the invitation';
COMMENT ON COLUMN invitations.accepted_at IS 'Timestamp when invitation was accepted';
COMMENT ON COLUMN invitations.name IS 'Optional name of the invitee';


-- Create indexes for invitations table
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);


-- Enable Row Level Security on invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;


-- Drop old/conflicting policies on invitations
DROP POLICY IF EXISTS "Admins can view all invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON invitations;
DROP POLICY IF EXISTS "Users can view their own invitations" ON invitations;


-- Create RLS policies for invitations

-- Policy: Only admins can view all invitations
CREATE POLICY "Admins can view all invitations"
ON invitations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can create invitations
CREATE POLICY "Admins can create invitations"
ON invitations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can update invitations
CREATE POLICY "Admins can update invitations"
ON invitations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Users can view invitations sent to their email
CREATE POLICY "Users can view their own invitations"
ON invitations
FOR SELECT
TO authenticated
USING (
  email IN (
    SELECT email FROM profiles WHERE id = auth.uid()
  )
);


-- ============================================================================
-- PART 3: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp on invitations
CREATE OR REPLACE FUNCTION update_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_invitations_updated_at() IS 'Automatically updates updated_at timestamp';


-- Create trigger for invitations updated_at
DROP TRIGGER IF EXISTS update_invitations_updated_at_trigger ON invitations;

CREATE TRIGGER update_invitations_updated_at_trigger
BEFORE UPDATE ON invitations
FOR EACH ROW
EXECUTE FUNCTION update_invitations_updated_at();


-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_old_invitations() IS 'Marks pending invitations as expired if past expiration date';


-- ============================================================================
-- PART 4: VERIFICATION QUERIES
-- ============================================================================

-- Verify profiles table structure
SELECT
  'profiles' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Verify invitations table structure
SELECT
  'invitations' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'invitations'
ORDER BY ordinal_position;

-- Check RLS is enabled on both tables
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('profiles', 'invitations')
AND schemaname = 'public';

-- List all RLS policies
SELECT
  tablename,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename IN ('profiles', 'invitations')
ORDER BY tablename, policyname;

-- Check indexes
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('profiles', 'invitations')
AND schemaname = 'public'
ORDER BY tablename, indexname;


-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
--
-- What was done:
-- ✅ Added profile_picture_url column to profiles table
-- ✅ Fixed RLS policies on profiles table (allows signup to work)
-- ✅ Created invitations table for admin panel
-- ✅ Set up RLS policies for invitations (admin-only access)
-- ✅ Created indexes for performance
-- ✅ Added helper functions and triggers
--
-- Next steps:
-- 1. Test user signup at http://localhost:3001/auth/signup
-- 2. Create an admin user (see instructions below)
-- 3. Access admin panel at http://localhost:3001/admin
--
-- To create an admin user, run this SQL (replace with your email):
--
--   UPDATE profiles
--   SET role = 'admin'
--   WHERE email = 'your-email@example.com';
--
-- ============================================================================
