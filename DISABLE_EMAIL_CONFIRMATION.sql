-- ============================================================================
-- DISABLE EMAIL CONFIRMATION FOR ALL USERS
-- ============================================================================
-- This SQL confirms all existing users so they can login without email verification
-- 
-- IMPORTANT: Also go to Supabase Dashboard and disable "Enable email confirmations"
-- Settings → Authentication → Providers → Email
-- ============================================================================

-- Confirm all existing users (set email_confirmed_at to current timestamp)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Verify the update worked
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ Not Confirmed'
  END as status
FROM auth.users
ORDER BY created_at DESC;

-- Show count of confirmed vs unconfirmed
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unconfirmed_users
FROM auth.users;

-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
--
-- 1. After running this SQL, go to Supabase Dashboard:
--    https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/auth/providers
--
-- 2. Click on "Email" provider
--
-- 3. Find "Enable email confirmations" setting
--
-- 4. Turn it OFF (uncheck the box)
--
-- 5. Click "Save"
--
-- 6. Now all users can sign in without email verification!
--
-- ============================================================================
