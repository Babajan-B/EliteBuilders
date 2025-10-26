-- ============================================================================
-- COMPLETE SIGNUP FIX - ALL IN ONE
-- ============================================================================
-- This script does EVERYTHING needed to fix signup:
-- 1. Creates the trigger function
-- 2. Creates the trigger on auth.users
-- 3. Fixes RLS policies
-- 4. Creates profiles for existing users without profiles
-- 5. Verifies everything is working
--
-- IMPORTANT: Run this in Supabase Dashboard SQL Editor ONLY
-- https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql/new
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Create the function that will auto-create profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new profile for the user
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'builder'
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update it
    UPDATE public.profiles
    SET 
      email = NEW.email,
      display_name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Don't fail user creation if profile creation fails
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically creates a profile when a new user signs up. Runs with elevated privileges to bypass RLS.';

-- ============================================================================
-- PART 2: Create the trigger on auth.users table
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
  'Trigger that fires after a new user is created to automatically create their profile';

-- ============================================================================
-- PART 3: Fix RLS Policies
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old INSERT policy (trigger handles inserts now)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;

-- Drop any other conflicting policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create/Update SELECT policy (anyone can view profiles)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
CREATE POLICY "Enable read access for all users"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Create/Update UPDATE policy (users can update their own profile)
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
CREATE POLICY "Enable update for users based on id"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- PART 4: Create profiles for existing users without profiles
-- ============================================================================

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

COMMIT;

-- ============================================================================
-- PART 5: Verification
-- ============================================================================

-- Check trigger was created
SELECT 
  '✅ TRIGGER' as component,
  trigger_name,
  event_manipulation as event,
  event_object_table as target_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check function was created
SELECT 
  '✅ FUNCTION' as component,
  routine_name as name,
  routine_type as type,
  security_type as security
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- Check RLS policies
SELECT 
  '✅ RLS POLICIES' as component,
  policyname as policy_name,
  cmd as operation
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- Check user and profile counts match
SELECT 
  '✅ USER/PROFILE COUNT' as component,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.profiles)
    THEN '✅ All users have profiles!'
    ELSE '⚠️ Some users missing profiles'
  END as status;

-- Show any users still without profiles (should be none)
SELECT 
  '⚠️ USERS WITHOUT PROFILES' as component,
  u.id,
  u.email,
  'Missing profile - may need manual fix' as issue
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '
  ============================================================================
  ✅ SIGNUP FIX COMPLETE!
  ============================================================================
  
  What was done:
  1. ✅ Created handle_new_user() function
  2. ✅ Created on_auth_user_created trigger
  3. ✅ Fixed RLS policies on profiles table
  4. ✅ Created profiles for existing users
  
  Next steps:
  1. Check the verification output above
  2. Go to http://localhost:3001/auth/signup
  3. Test signup with a NEW email address
  4. Should work perfectly now!
  
  The trigger will automatically create profiles for all new signups.
  ============================================================================
  ';
END $$;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================
-- If you see any errors above:
--
-- 1. "must be owner of relation users" 
--    → You are NOT running this in Supabase Dashboard
--    → Open browser: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql
--
-- 2. "relation profiles does not exist"
--    → Your profiles table is missing
--    → You need to run the main database setup first
--
-- 3. Verification shows users without profiles
--    → Run this again, or manually create profiles
--
-- ============================================================================

