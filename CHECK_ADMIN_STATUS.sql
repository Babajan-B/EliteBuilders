-- ============================================================================
-- CHECK ADMIN ACCOUNT STATUS
-- ============================================================================
-- Run this to verify the admin account is set up correctly
-- ============================================================================

-- Check if admin user exists in auth.users
SELECT 
  'AUTH USER' as check_type,
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ Email not confirmed'
  END as email_status
FROM auth.users
WHERE email = 'babajan@bioinformatics.com';

-- Check if admin profile exists
SELECT 
  'PROFILE' as check_type,
  id,
  email,
  display_name,
  role,
  created_at,
  github_url,
  linkedin_url,
  CASE 
    WHEN role = 'admin' THEN '✅ Admin Role Set'
    WHEN role IS NULL THEN '❌ No Role Set'
    ELSE '⚠️ Role: ' || role
  END as role_status
FROM public.profiles
WHERE email = 'babajan@bioinformatics.com';

-- Combined status check
SELECT 
  au.id as user_id,
  au.email,
  p.role,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  p.role = 'admin' as is_admin,
  p.id IS NOT NULL as profile_exists,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN '❌ Email not confirmed'
    WHEN p.role != 'admin' THEN '❌ Not admin (role: ' || COALESCE(p.role, 'null') || ')'
    WHEN p.id IS NULL THEN '❌ No profile'
    ELSE '✅ Ready to login'
  END as overall_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email = 'babajan@bioinformatics.com';

-- ============================================================================
-- EXPECTED RESULT IF EVERYTHING IS CORRECT:
-- ============================================================================
-- 
-- email_confirmed: true ✅
-- is_admin: true ✅  
-- profile_exists: true ✅
-- overall_status: '✅ Ready to login' ✅
--
-- ============================================================================
-- IF SOMETHING IS WRONG:
-- ============================================================================
--
-- email_confirmed: false
--   → Run DISABLE_EMAIL_CONFIRMATION.sql
--   → Disable "Enable email confirmations" in Dashboard
--
-- is_admin: false
--   → Run CREATE_ADMIN_COMPLETE.sql
--
-- profile_exists: false
--   → The database trigger should have created it automatically
--   → Check if trigger exists (run CHECK_DATABASE_STATUS.sql)
--
-- ============================================================================
