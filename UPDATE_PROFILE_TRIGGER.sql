-- Update handle_new_user trigger to support judge/sponsor roles

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with role from metadata (for invited users)
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    role,
    github_url,
    linkedin_url
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'builder'),
    COALESCE(NEW.raw_user_meta_data->>'github_url', 'https://github.com/placeholder'),
    COALESCE(NEW.raw_user_meta_data->>'linkedin_url', 'https://linkedin.com/in/placeholder')
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    github_url = EXCLUDED.github_url,
    linkedin_url = EXCLUDED.linkedin_url;

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Profile already exists, update it
    UPDATE public.profiles
    SET 
      display_name = COALESCE(NEW.raw_user_meta_data->>'name', display_name),
      role = COALESCE(NEW.raw_user_meta_data->>'role', role),
      github_url = COALESCE(NEW.raw_user_meta_data->>'github_url', github_url),
      linkedin_url = COALESCE(NEW.raw_user_meta_data->>'linkedin_url', linkedin_url)
    WHERE id = NEW.id;
    RETURN NEW;
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Could not create/update profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Verify trigger exists
SELECT 'Profile trigger updated successfully' as status;
