-- ============================================================================
-- COMPLETE ADMIN SETUP - FOR TESTING ONLY
-- ============================================================================
-- This creates a profile for an admin user with placeholder URLs
-- NOTE: You still need to create the AUTH USER in Supabase Dashboard first
-- 
-- Prerequisites:
-- 1. Create auth user in Dashboard → Authentication → Add User
--    - Email: babajan@bioinformatics.com
--    - Password: proteins123
--    - Auto Confirm: ON
-- 2. Then run this SQL
-- ============================================================================

-- Find the user by email
DO $$
DECLARE
  admin_user_id UUID;
  user_email TEXT := 'babajan@bioinformatics.com';
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = user_email;

  IF admin_user_id IS NULL THEN
    RAISE NOTICE '❌ User not found in auth.users!';
    RAISE NOTICE '';
    RAISE NOTICE 'STEP 1: Create the auth user first:';
    RAISE NOTICE '   1. Go to: Supabase Dashboard → Authentication → Users';
    RAISE NOTICE '   2. Click "Add User"';
    RAISE NOTICE '   3. Enter email: %', user_email;
    RAISE NOTICE '   4. Enter password: proteins123';
    RAISE NOTICE '   5. Check "Auto Confirm User"';
    RAISE NOTICE '   6. Click "Create User"';
    RAISE NOTICE '';
    RAISE NOTICE 'STEP 2: Then run this SQL again';
    RETURN;
  END IF;

  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = admin_user_id) THEN
    -- Update existing profile to admin
    UPDATE public.profiles
    SET role = 'admin',
        display_name = 'Admin User'
    WHERE id = admin_user_id;
    
    RAISE NOTICE '✅ Existing profile upgraded to admin role!';
  ELSE
    -- Create new profile with admin role
    INSERT INTO public.profiles (
      id,
      email,
      display_name,
      role,
      github_url,
      linkedin_url
    ) VALUES (
      admin_user_id,
      user_email,
      'Admin User',
      'admin',
      'https://github.com/admin',
      'https://linkedin.com/in/admin'
    );
    
    RAISE NOTICE '✅ New admin profile created!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Admin Account Details:';
  RAISE NOTICE '   Email: %', user_email;
  RAISE NOTICE '   Password: proteins123';
  RAISE NOTICE '   Role: admin';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now sign in with these credentials!';

END $$;

-- Verify the admin profile was created/updated
SELECT 
  '✅ ADMIN PROFILE' as status,
  id,
  email,
  display_name,
  role,
  created_at
FROM public.profiles
WHERE email = 'babajan@bioinformatics.com';

-- ============================================================================
-- COMPLETE INSTRUCTIONS:
-- ============================================================================
--
-- METHOD A: Create Auth User via Dashboard (Easiest)
-- ----------------------------------------
-- 1. Go to: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/auth/users
-- 2. Click "Add User"
-- 3. Email: babajan@bioinformatics.com
-- 4. Password: proteins123
-- 5. Check "Auto Confirm User"
-- 6. Click "Create User"
-- 7. Run this SQL
-- 8. Sign in!
--
-- METHOD B: Use Your Signup Flow
-- ----------------------------------------
-- 1. Go to your signup page
-- 2. Create account with email: babajan@bioinformatics.com
-- 3. Run this SQL
-- 4. Sign in!
--
-- ============================================================================
