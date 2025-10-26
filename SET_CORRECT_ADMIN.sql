-- ============================================================================
-- SET CORRECT ADMIN - FIXED EMAIL
-- ============================================================================
-- The correct email is: babajan@bioinformaticsbb.com (not bioinformatics.com)
-- ============================================================================

-- Show current state
SELECT 
  '🔍 BEFORE UPDATE' as step,
  email,
  display_name,
  role
FROM public.profiles
WHERE email = 'babajan@bioinformaticsbb.com';

-- Set admin role for the CORRECT email
UPDATE public.profiles
SET 
  role = 'admin',
  display_name = 'Admin User'
WHERE email = 'babajan@bioinformaticsbb.com';

-- Verify the update worked
SELECT 
  '✅ AFTER UPDATE' as step,
  email,
  display_name,
  role,
  CASE 
    WHEN role = 'admin' THEN '✅ Admin role set correctly!'
    ELSE '❌ Still not admin: ' || role
  END as status
FROM public.profiles
WHERE email = 'babajan@bioinformaticsbb.com';

-- Final summary
SELECT 
  '📊 FINAL CHECK' as step,
  (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as admin_count,
  (SELECT email FROM public.profiles WHERE role = 'admin' LIMIT 1) as admin_email,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = 'babajan@bioinformaticsbb.com' AND role = 'admin')
    THEN '✅ Admin account ready!'
    ELSE '❌ Admin still not set!'
  END as admin_status;

-- Show all users and roles for verification
SELECT 
  '👥 ALL USERS' as step,
  email,
  display_name,
  role,
  CASE 
    WHEN role = 'admin' THEN '👑'
    WHEN role = 'builder' THEN '🔨'
    WHEN role = 'judge' THEN '⚖️'
    WHEN role = 'sponsor' THEN '💰'
  END as icon
FROM public.profiles
ORDER BY 
  CASE role
    WHEN 'admin' THEN 1
    WHEN 'judge' THEN 2
    WHEN 'sponsor' THEN 3
    WHEN 'builder' THEN 4
  END,
  email;

-- ============================================================================
-- EXPECTED OUTPUT:
-- ============================================================================
--
-- AFTER UPDATE:
-- email: babajan@bioinformaticsbb.com
-- display_name: Admin User
-- role: admin
-- status: ✅ Admin role set correctly!
--
-- FINAL CHECK:
-- admin_count: 1
-- admin_email: babajan@bioinformaticsbb.com
-- admin_status: ✅ Admin account ready!
--
-- ============================================================================

