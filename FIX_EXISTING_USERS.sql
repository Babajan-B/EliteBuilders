-- ============================================================================
-- FIX EXISTING USERS - Create Profiles for Users Without Them
-- ============================================================================
-- Run this AFTER installing the trigger to fix any existing users
-- that were created before the trigger existed.
-- ============================================================================

-- Step 1: Find users without profiles
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'name' as name,
  p.id as profile_exists
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- If you see any users listed above, run this to create their profiles:

-- Step 2: Create profiles for existing users without profiles
INSERT INTO public.profiles (id, email, display_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', u.email) as display_name,
  'builder' as role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify all users now have profiles
SELECT 
  COUNT(*) as total_users
FROM auth.users;

SELECT 
  COUNT(*) as total_profiles
FROM public.profiles;

-- These numbers should match!

-- ============================================================================
-- CLEANUP: If you want to delete test users completely
-- ============================================================================

-- To see all users:
-- SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- To delete a specific test user (replace with actual email):
-- DELETE FROM auth.users WHERE email = 'test@example.com';
-- The profile will be automatically deleted due to CASCADE

-- ============================================================================

