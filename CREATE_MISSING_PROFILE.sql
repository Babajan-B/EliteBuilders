-- ============================================================================
-- CREATE MISSING PROFILE FOR CURRENT USER
-- ============================================================================
-- This script creates a profile for the currently logged-in user
-- if one doesn't exist yet.
-- ============================================================================

-- First, let's see all users without profiles
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created,
  CASE 
    WHEN p.id IS NULL THEN '❌ No Profile'
    ELSE '✅ Has Profile'
  END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- Create profiles for all users without them
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  role,
  github_url,
  linkedin_url
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email),
  'builder',
  'https://github.com/placeholder',
  'https://linkedin.com/in/placeholder'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Verify all users now have profiles
SELECT 
  au.email,
  p.display_name,
  p.role,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Profile Exists'
    ELSE '❌ Missing Profile'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- ============================================================================
-- WHAT THIS DOES:
-- ============================================================================
--
-- 1. Shows all users who don't have profiles (❌ No Profile)
-- 2. Creates missing profiles for all users without them
-- 3. Verifies all users now have profiles (✅ Profile Exists)
--
-- This fixes the "Profile fetch error" issue where users can't see their profile
-- because the trigger didn't run or failed during signup.
--
-- ============================================================================
