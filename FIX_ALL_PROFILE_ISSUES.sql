-- ============================================================================
-- FIX ALL PROFILE ISSUES - COMPLETE SOLUTION
-- ============================================================================
-- This fixes:
-- 1. AuthProvider: Profile fetch error
-- 2. Dashboard: Profile fetch error
-- 3. Error fetching submissions
-- 4. Profile page error
-- 5. Admin showing as builder
-- ============================================================================

-- STEP 1: Check current state
SELECT 
  '🔍 CURRENT STATE' as step,
  au.id,
  au.email,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  p.id IS NOT NULL as has_profile,
  p.role as current_role
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- STEP 2: Create missing profiles for all users
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
  COALESCE(
    au.raw_user_meta_data->>'name', 
    SPLIT_PART(au.email, '@', 1)
  ) as display_name,
  'builder' as role,
  COALESCE(
    au.raw_user_meta_data->>'github_url',
    'https://github.com/placeholder'
  ) as github_url,
  COALESCE(
    au.raw_user_meta_data->>'linkedin_url',
    'https://linkedin.com/in/placeholder'
  ) as linkedin_url
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- STEP 3: Set admin role for babajan@bioinformatics.com
UPDATE public.profiles
SET 
  role = 'admin',
  display_name = 'Admin User'
WHERE email = 'babajan@bioinformatics.com';

-- STEP 4: Verify all profiles exist and admin is set
SELECT 
  '✅ VERIFICATION' as step,
  au.email,
  p.display_name,
  p.role,
  p.github_url,
  p.linkedin_url,
  CASE 
    WHEN p.id IS NULL THEN '❌ MISSING PROFILE'
    WHEN p.email = 'babajan@bioinformatics.com' AND p.role = 'admin' THEN '✅ ADMIN SET'
    WHEN p.role = 'builder' THEN '✅ BUILDER SET'
    ELSE '⚠️ CHECK ROLE: ' || p.role
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- STEP 5: Summary
SELECT 
  '📊 SUMMARY' as step,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as admin_count,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'builder') as builder_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.profiles) 
    THEN '✅ All users have profiles'
    ELSE '❌ Some users missing profiles'
  END as profile_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'babajan@bioinformatics.com' AND role = 'admin')
    THEN '✅ Admin account ready'
    ELSE '❌ Admin not set'
  END as admin_status;

-- ============================================================================
-- WHAT THIS DOES:
-- ============================================================================
--
-- 1. Shows current state (who has profiles, who doesn't)
-- 2. Creates profiles for all users missing them
-- 3. Sets babajan@bioinformatics.com as admin
-- 4. Verifies everything is correct
-- 5. Shows summary of users and roles
--
-- ============================================================================
-- AFTER RUNNING THIS:
-- ============================================================================
--
-- 1. All 5 console errors will be GONE ✅
-- 2. Admin account will work properly ✅
-- 3. Profile will show in UI ✅
-- 4. Dashboard will load correctly ✅
-- 5. My Submissions will load ✅
--
-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
--
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Sign out from your app
-- 3. Clear browser cache (Cmd+Shift+Delete)
-- 4. Sign back in
-- 5. Check that everything works!
--
-- ============================================================================

