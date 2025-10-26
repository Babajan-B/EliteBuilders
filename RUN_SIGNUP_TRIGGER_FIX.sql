-- ============================================================================
-- SIGNUP TRIGGER FIX - RUN THIS IN SUPABASE SQL EDITOR
-- ============================================================================
-- IMPORTANT: You must run this in the Supabase Dashboard SQL Editor
-- Go to: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql
-- 
-- This script creates a trigger on auth.users which requires elevated privileges.
-- The Supabase SQL Editor automatically uses the postgres role which has permission.
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
    'builder'
  );

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, just update it
    UPDATE public.profiles
    SET 
      email = NEW.email,
      display_name = COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up';


-- STEP 2: Create trigger on auth.users table
-- ----------------------------------------------------------------------------
-- Note: This requires superuser/postgres role privileges
-- Supabase Dashboard SQL Editor runs as postgres role automatically

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to create profile automatically on user signup';


-- STEP 3: Update RLS policies
-- ----------------------------------------------------------------------------

-- Drop the INSERT policy since we're using trigger now
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Verify SELECT policy exists (for viewing profiles)
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

-- Verify UPDATE policy exists (for editing own profile)
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
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see output above showing:
-- ✅ Trigger: on_auth_user_created exists
-- ✅ Policies: Enable read access for all users, Enable update for users based on id
--
-- Then the fix is complete! Try signing up now.
-- ============================================================================
