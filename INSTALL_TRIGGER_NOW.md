# 🚨 STOP - Install Trigger First!

## The Problem

You're trying to signup, but the database trigger isn't installed yet. That's why you're getting:
- ❌ "Error updating profile"
- ❌ "Profile fetch error"
- ❌ "Error fetching submissions"

**The user is created, but NO PROFILE exists!**

---

## 🛑 Before Testing Signup Again

**YOU MUST INSTALL THE TRIGGER FIRST**

---

## 📋 Install Trigger - Step by Step

### 1. Open This Link in Your Browser
**Click or paste this into Chrome/Firefox/Safari:**

```
https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql/new
```

### 2. Wait for Page to Load
You should see:
- Supabase logo at the top
- "SQL Editor" heading
- A big empty text box
- Your project name: `vhoarjcbkcptqlyfdhsx`

### 3. Copy ALL This SQL

Open `RUN_SIGNUP_TRIGGER_FIX.sql` and copy everything, OR copy this:

```sql
-- Create function to handle new user signup
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

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

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

-- Verification
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

### 4. Paste in the Browser
- Click in the big text box on the Supabase page
- Paste the SQL (Cmd+V or Ctrl+V)

### 5. Click RUN
- Find the green "RUN" button
- Click it
- Wait 2-3 seconds

### 6. Check for Success
You should see at the bottom:
```
trigger_name: on_auth_user_created
event_manipulation: INSERT
event_object_table: users
```

**If you see this, SUCCESS!** ✅

**If you see "ERROR: must be owner of relation users"** ❌
→ You're NOT in the Supabase Dashboard. Go back to step 1.

---

## 🧹 Clean Up Test Users

Before testing signup again, delete the test users you created:

1. Go to: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/auth/users
2. Find any test users you created
3. Click the "..." menu on each user
4. Click "Delete User"

This cleans up the users that were created WITHOUT profiles.

---

## ✅ Now Test Signup Again

After successfully installing the trigger:

1. Go to: http://localhost:3001/auth/signup
2. Fill in the form:
   - Name: Test User
   - Email: newtest@example.com (use a NEW email)
   - Password: testpass123
   - GitHub: https://github.com/test
   - LinkedIn: https://linkedin.com/in/test
3. Click "Sign Up"

**This time it should work!** 🎉

---

## 🔍 Verify It Worked

After signup, check the database:

1. Go to: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/editor
2. Click on `profiles` table
3. You should see your new user with:
   - ✅ id
   - ✅ email
   - ✅ display_name
   - ✅ role = 'builder'
   - ✅ github_url
   - ✅ linkedin_url

---

## 🚨 Still Getting Errors?

### If you get "must be owner of relation users":
- You're NOT using the Supabase Dashboard
- You must use the browser link in step 1

### If signup still fails after installing trigger:
- Check browser console for different errors
- Verify trigger exists (run verification SQL)
- Make sure you deleted old test users

---

## 📸 Need Help?

Take a screenshot showing:
1. The Supabase SQL Editor page in your browser
2. The SQL pasted in the text box
3. Any error message you see

This will help me understand what's happening.

