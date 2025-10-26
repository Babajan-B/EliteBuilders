-- ============================================================================
-- IMMEDIATE FIX - Based on Your Database Check Results
-- ============================================================================
-- You have 2 users without profiles:
-- - 78eb5166-5fc1-43a6-8cfb-f37b6f82b2f2 (b.babajaan@gmail.com)
-- - b98d24db-ea06-457f-ac08-67c0df7a46ed (babajaan@gmail.com)
--
-- IMPORTANT: Your database has a check constraint requiring github_url and
-- linkedin_url for 'builder' role. This fix includes placeholder URLs that
-- you can update later in your profile settings.
--
-- This SQL will:
-- 1. Create the missing trigger (with placeholder URLs)
-- 2. Create profiles for your existing users (with placeholder URLs)
-- 3. Ensure future signups work automatically
--
-- Run this in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql/new
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Create the trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert new profile for the user
  -- Note: Includes github_url and linkedin_url to satisfy check constraint
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    role,
    github_url,
    linkedin_url
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'builder',
    COALESCE(NEW.raw_user_meta_data->>'github_url', 'https://github.com/placeholder'),
    COALESCE(NEW.raw_user_meta_data->>'linkedin_url', 'https://linkedin.com/in/placeholder')
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update it
    UPDATE public.profiles
    SET 
      email = NEW.email,
      display_name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
      github_url = COALESCE(NEW.raw_user_meta_data->>'github_url', github_url),
      linkedin_url = COALESCE(NEW.raw_user_meta_data->>'linkedin_url', linkedin_url)
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Don't fail user creation if profile creation fails
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- ============================================================================
-- PART 2: Create the trigger
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- PART 3: Fix RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove INSERT policy (trigger handles this now)
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;

-- SELECT policy (anyone can view)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
CREATE POLICY "Enable read access for all users"
  ON public.profiles
  FOR SELECT
  USING (true);

-- UPDATE policy (users can update their own)
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
CREATE POLICY "Enable update for users based on id"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PART 4: Create profiles for YOUR existing users
-- ============================================================================

-- Create profile for b.babajaan@gmail.com
-- Note: Added placeholder URLs to satisfy check constraint
INSERT INTO public.profiles (id, email, display_name, role, github_url, linkedin_url)
VALUES (
  '78eb5166-5fc1-43a6-8cfb-f37b6f82b2f2',
  'b.babajaan@gmail.com',
  'b.babajaan@gmail.com',
  'builder',
  'https://github.com/placeholder',  -- Placeholder - update in profile settings
  'https://linkedin.com/in/placeholder'  -- Placeholder - update in profile settings
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    github_url = EXCLUDED.github_url,
    linkedin_url = EXCLUDED.linkedin_url;

-- Create profile for babajaan@gmail.com
-- Note: Added placeholder URLs to satisfy check constraint
INSERT INTO public.profiles (id, email, display_name, role, github_url, linkedin_url)
VALUES (
  'b98d24db-ea06-457f-ac08-67c0df7a46ed',
  'babajaan@gmail.com',
  'babajaan@gmail.com',
  'builder',
  'https://github.com/placeholder',  -- Placeholder - update in profile settings
  'https://linkedin.com/in/placeholder'  -- Placeholder - update in profile settings
)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email,
    display_name = EXCLUDED.display_name,
    github_url = EXCLUDED.github_url,
    linkedin_url = EXCLUDED.linkedin_url;

COMMIT;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check trigger was created
SELECT 
  '✅ TRIGGER' as status,
  trigger_name,
  event_object_table as target_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check function was created
SELECT 
  '✅ FUNCTION' as status,
  routine_name as name,
  security_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- Verify all users now have profiles
SELECT 
  '✅ VERIFICATION' as status,
  COUNT(*) as user_count,
  'Users in auth.users' as description
FROM auth.users;

SELECT 
  '✅ VERIFICATION' as status,
  COUNT(*) as profile_count,
  'Profiles in public.profiles' as description
FROM public.profiles;

-- Check for any remaining users without profiles (should be NONE)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ SUCCESS: All users have profiles!'
    ELSE '⚠️  WARNING: ' || COUNT(*)::text || ' users still missing profiles'
  END as final_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Show your profiles
SELECT 
  '✅ YOUR PROFILES' as status,
  id,
  email,
  display_name,
  role,
  created_at
FROM public.profiles
WHERE email IN ('b.babajaan@gmail.com', 'babajaan@gmail.com')
ORDER BY created_at;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- If you see:
-- ✅ TRIGGER: on_auth_user_created
-- ✅ FUNCTION: handle_new_user
-- ✅ SUCCESS: All users have profiles!
-- ✅ YOUR PROFILES: (2 rows)
--
-- Then everything is fixed! 🎉
--
-- Now you can:
-- 1. Try signing in with: b.babajaan@gmail.com or babajaan@gmail.com
-- 2. Or test new signup at: http://localhost:3001/auth/signup
-- 3. New signups will automatically create profiles from now on!
-- ============================================================================

