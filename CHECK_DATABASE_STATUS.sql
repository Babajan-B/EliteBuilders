-- ============================================================================
-- CHECK DATABASE STATUS - Run This First to See What's Missing
-- ============================================================================
-- Copy and paste this entire file into Supabase SQL Editor
-- This will show you what exists and what needs to be created
-- ============================================================================

-- 1. Check if trigger exists
SELECT 
  'TRIGGER CHECK' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.triggers 
      WHERE trigger_name = 'on_auth_user_created'
    ) THEN '✅ Trigger EXISTS'
    ELSE '❌ Trigger MISSING - needs to be created'
  END as status;

-- 2. Check if function exists
SELECT 
  'FUNCTION CHECK' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'handle_new_user'
    ) THEN '✅ Function EXISTS'
    ELSE '❌ Function MISSING - needs to be created'
  END as status;

-- 3. Check profiles table structure
SELECT 
  'PROFILES TABLE CHECK' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN '✅ Profiles table EXISTS'
    ELSE '❌ Profiles table MISSING'
  END as status;

-- 4. Check profiles columns
SELECT 
  'PROFILES COLUMNS' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Check RLS is enabled
SELECT 
  'RLS CHECK' as check_type,
  CASE 
    WHEN relrowsecurity THEN '✅ RLS is ENABLED on profiles'
    ELSE '❌ RLS is DISABLED on profiles'
  END as status
FROM pg_class
WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace;

-- 6. Check RLS policies
SELECT 
  'RLS POLICIES' as info,
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 7. Check users vs profiles count
SELECT 
  'USER COUNT' as info,
  COUNT(*) as total,
  'Users in auth.users' as description
FROM auth.users;

SELECT 
  'PROFILE COUNT' as info,
  COUNT(*) as total,
  'Profiles in public.profiles' as description
FROM public.profiles;

-- 8. Find users WITHOUT profiles
SELECT 
  'USERS WITHOUT PROFILES' as info,
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- ============================================================================
-- INTERPRETATION OF RESULTS:
-- ============================================================================
--
-- If you see:
-- ❌ Trigger MISSING → Need to create trigger
-- ❌ Function MISSING → Need to create function
-- Users WITHOUT PROFILES → Need to create profiles for existing users
--
-- Then you need to run the COMPLETE_SIGNUP_FIX_ALL_IN_ONE.sql file
--
-- ============================================================================

