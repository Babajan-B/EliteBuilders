-- ============================================================================
-- FIX SIGNUP WITH DATABASE TRIGGER
-- This is the CORRECT way to handle profile creation in Supabase
-- ============================================================================
-- The problem: RLS blocks profile creation during signup because the session
--              isn't fully authenticated yet when we try to insert.
--
-- The solution: Database trigger that auto-creates profile when user signs up.
--               Trigger runs with SECURITY DEFINER, bypassing RLS.
-- ============================================================================


-- STEP 1: Create function to handle new user signup
-- ----------------------------------------------------------------------------
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
    'builder' -- Default role
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up';


-- STEP 2: Create trigger on auth.users table
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to create profile automatically on user signup';


-- STEP 3: Update RLS policies to allow user updates
-- ----------------------------------------------------------------------------

-- Drop the INSERT policy since we're using trigger now
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Keep the other policies
-- (These should already exist from the previous migration)

-- Verify SELECT policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Enable read access for all users'
  ) THEN
    CREATE POLICY "Enable read access for all users"
    ON profiles FOR SELECT USING (true);
  END IF;
END $$;

-- Verify UPDATE policy exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Enable update for users based on id'
  ) THEN
    CREATE POLICY "Enable update for users based on id"
    ON profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  END IF;
END $$;


-- STEP 4: Verification
-- ----------------------------------------------------------------------------

-- Check if trigger was created
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check current RLS policies on profiles
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;


-- ============================================================================
-- HOW THIS WORKS NOW:
-- ============================================================================
--
-- 1. User signs up via frontend with supabase.auth.signUp()
-- 2. Supabase creates user in auth.users table
-- 3. Database trigger AUTOMATICALLY creates profile in profiles table
-- 4. User metadata (name) is copied from signup form to display_name
-- 5. Default role is 'builder'
-- 6. Frontend no longer needs to manually create profile!
--
-- ============================================================================
-- NEXT STEPS:
-- ============================================================================
--
-- After running this SQL, UPDATE your signup code to:
-- 1. Remove the manual profile creation code
-- 2. Just call supabase.auth.signUp() with user metadata
-- 3. The trigger will handle profile creation automatically
--
-- Example signup code:
--
--   const { data, error } = await supabase.auth.signUp({
--     email,
--     password,
--     options: {
--       data: {
--         name: name,
--         github_url: githubUrl,
--         linkedin_url: linkedinUrl,
--         profile_picture_url: profilePictureUrl
--       }
--     }
--   })
--
--   // After signup, you can update the profile with additional fields:
--   if (data.user) {
--     await supabase
--       .from('profiles')
--       .update({
--         github_url: githubUrl,
--         linkedin_url: linkedinUrl,
--         profile_picture_url: profilePictureUrl
--       })
--       .eq('id', data.user.id)
--   }
--
-- ============================================================================
