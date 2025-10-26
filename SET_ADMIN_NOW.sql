-- ============================================================================
-- SET ADMIN ROLE NOW - QUICK FIX
-- ============================================================================
-- The admin role wasn't set in the previous run
-- This will set it now
-- ============================================================================

-- Check which user should be admin
SELECT 
  '🔍 BEFORE UPDATE' as step,
  id,
  email,
  display_name,
  role,
  CASE 
    WHEN email = 'babajan@bioinformatics.com' THEN '👈 This should be admin'
    ELSE ''
  END as note
FROM public.profiles
ORDER BY created_at DESC;

-- Set admin role for babajan@bioinformatics.com
UPDATE public.profiles
SET 
  role = 'admin',
  display_name = 'Admin User'
WHERE email = 'babajan@bioinformatics.com';

-- Verify the update worked
SELECT 
  '✅ AFTER UPDATE' as step,
  id,
  email,
  display_name,
  role,
  CASE 
    WHEN email = 'babajan@bioinformatics.com' AND role = 'admin' THEN '✅ Admin role set!'
    WHEN email = 'babajan@bioinformatics.com' AND role != 'admin' THEN '❌ Still not admin!'
    ELSE ''
  END as status
FROM public.profiles
WHERE email = 'babajan@bioinformatics.com';

-- Final summary
SELECT 
  '📊 FINAL CHECK' as step,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as admin_count,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'builder') as builder_count,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'judge') as judge_count,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'sponsor') as sponsor_count,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'babajan@bioinformatics.com' AND role = 'admin')
    THEN '✅ Admin account ready!'
    ELSE '❌ Admin still not set!'
  END as admin_status;

-- ============================================================================
-- EXPECTED OUTPUT:
-- ============================================================================
--
-- BEFORE UPDATE:
-- Shows all users with their current roles
--
-- AFTER UPDATE:
-- email: babajan@bioinformatics.com
-- role: admin
-- status: ✅ Admin role set!
--
-- FINAL CHECK:
-- admin_count: 1
-- admin_status: ✅ Admin account ready!
--
-- ============================================================================

