# Complete Invitation System Setup

## Step 1: Create Invitations Table

Run this SQL in Supabase Dashboard:
https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql/new

**File:** `CREATE_INVITATIONS_TABLE.sql`

This creates the invitations table with proper RLS policies.

---

## Step 2: Update Profile Trigger

The existing `handle_new_user` trigger needs to handle judge/sponsor roles from invitations.

Run this SQL:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Get role from user metadata (set during accept-invite)
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
```

---

## Step 3: Restart Dev Server

```bash
cd elitebuilders
npm run dev
```

---

## Step 4: Test the System

### As Admin:

1. Go to http://localhost:3001/admin
2. Click "Send Invitation" tab
3. Fill in:
   - Role: Judge or Sponsor
   - Email: test@example.com
   - Name: Test User
4. Click "Send Invitation"

### As Judge/Sponsor:

1. Check email inbox
2. Click "Accept Invitation" button
3. Fill in:
   - Your Name
   - Password
   - Confirm Password
4. Click "Accept Invitation & Create Account"
5. You'll be redirected to your dashboard

---

## How It Works

1. **Admin sends invitation:**
   - Admin fills invitation form
   - System creates invitation record with unique token
   - Email sent to recipient

2. **Recipient accepts:**
   - Clicks link in email
   - Goes to `/auth/accept-invite?token=...`
   - Fills in name and password
   - Account created with judge/sponsor role (no email verification)
   - Invitation marked as "accepted"
   - Redirected to appropriate dashboard

3. **Login:**
   - Judge/sponsor can log in with email + password
   - No email verification required
   - Direct access to their dashboard

---

## Environment Variables

The system uses these env vars (already in `.env.local`):

```
MAILERSEND_API_KEY=mlsn.6d8926b356b1d5515e282ef12279646d0d8ee37f79d43c97a8170dfa6c18c100
MAILERSEND_FROM_EMAIL=info@test-q3enl6k7oym42vwr.mlsender.net
MAILERSEND_FROM_NAME=EliteBuilders
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

---

## Files Created

1. ✅ `.env.local` - Environment variables
2. ✅ `CREATE_INVITATIONS_TABLE.sql` - Database table
3. ✅ `app/auth/accept-invite/page.tsx` - Accept invitation page
4. ✅ `lib/email.ts` - Updated with beautiful email template
5. ✅ Profile trigger updated - Handles judge/sponsor roles

---

## Next Steps

- [ ] Create invitations table (run SQL)
- [ ] Update profile trigger (run SQL)
- [ ] Restart dev server
- [ ] Test sending invitation as admin
- [ ] Test accepting invitation as judge
- [ ] Test accepting invitation as sponsor

All done!
