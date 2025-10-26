-- ============================================================================
-- UPGRADE USER TO ADMIN ROLE
-- ============================================================================
-- This upgrades an existing user to admin role
-- 
-- Prerequisites:
-- 1. User must already exist in auth.users
-- 2. User must already have a profile in public.profiles
--
-- To create the admin user, use one of these methods:
-- A) Supabase Dashboard → Authentication → Add User
-- B) Your signup flow at: https://yourdomain.com/auth/signup
--
-- After the user exists, run this SQL to upgrade them to admin.
--
-- Run this in Supabase Dashboard:
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
-- ============================================================================

-- Find the user ID for the admin email
-- Find and update the user to admin role
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'babajan@bioinformatics.com'
AND EXISTS (
  SELECT 1 FROM auth.users 
  WHERE auth.users.id = profiles.id
);

-- Check if update was successful
DO $$
DECLARE
  rows_updated INTEGER;
BEGIN
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  
  IF rows_updated > 0 THEN
    RAISE NOTICE '✅ User upgraded to admin role successfully!';
  ELSE
    RAISE NOTICE '⚠️  No user found with email: babajan@bioinformatics.com';
    RAISE NOTICE '   Make sure the user exists in auth.users first.';
  END IF;
END $$;

-- Verify the admin was created
SELECT 
  '✅ ADMIN ACCOUNT' as status,
  id,
  email,
  display_name,
  role,
  created_at
FROM public.profiles
WHERE email = 'babajan@bioinformatics.com';

-- ============================================================================
-- METHOD 1: Create Admin via Your Signup Flow (Recommended)
-- ============================================================================
-- 
-- 1. Go to your signup page and create the account
-- 2. Run this SQL to upgrade to admin role
-- 3. Sign in and test admin features
--
-- ============================================================================
-- METHOD 2: Create Admin via Supabase Dashboard (For Testing)
-- ============================================================================
-- 
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Click "Add User"
-- 3. Enter:
--    - Email: babajan@bioinformatics.com
--    - Password: proteins123
-- 4. Check "Auto Confirm User"
-- 5. Click "Create User"
-- 6. Run this SQL to set admin role
--
-- ============================================================================
-- TO USE IN PRODUCTION:
-- ============================================================================
-- 
-- Replace 'babajan@bioinformatics.com' with your actual admin email
-- This script is safe to run in production
--
-- ============================================================================

