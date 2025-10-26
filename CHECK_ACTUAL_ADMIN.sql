-- ============================================================================
-- CHECK ACTUAL ADMIN - DEBUG
-- ============================================================================
-- Let's see which user you set as admin
-- ============================================================================

-- Show ALL users with their roles
SELECT 
  '👥 ALL USERS' as info,
  id,
  email,
  display_name,
  role,
  created_at,
  CASE 
    WHEN role = 'admin' THEN '👑 ADMIN'
    WHEN role = 'builder' THEN '🔨 Builder'
    WHEN role = 'judge' THEN '⚖️ Judge'
    WHEN role = 'sponsor' THEN '💰 Sponsor'
    ELSE '❓ Unknown'
  END as role_icon
FROM public.profiles
ORDER BY created_at DESC;

-- Count by role
SELECT 
  '📊 ROLE SUMMARY' as info,
  role,
  COUNT(*) as count,
  STRING_AGG(email, ', ') as users
FROM public.profiles
GROUP BY role
ORDER BY COUNT(*) DESC;

-- Check if babajan@bioinformatics.com exists
SELECT 
  '🔍 LOOKING FOR ADMIN EMAIL' as info,
  email,
  role,
  CASE 
    WHEN email = 'babajan@bioinformatics.com' THEN '✅ This is the admin email we want'
    WHEN email LIKE '%babajan%' THEN '⚠️ Similar email found'
    ELSE ''
  END as note
FROM public.profiles
WHERE email LIKE '%babajan%' OR email LIKE '%bioinformatics%';

-- If no match, show all emails
SELECT 
  '📧 ALL EMAILS IN SYSTEM' as info,
  email
FROM public.profiles
ORDER BY email;

-- ============================================================================
-- INSTRUCTIONS:
-- ============================================================================
--
-- Look at the output and tell me:
-- 1. Which email is currently set as admin?
-- 2. Which email did you log in with?
-- 3. Do you see 'babajan@bioinformatics.com' in the list?
--
-- ============================================================================

