# Fix Profile Fetch Error

## 🚨 The Problem

You're getting these errors:
1. `Dashboard: Profile fetch error: {}`
2. `Error fetching submissions: {}`
3. User profile not showing

**Root cause:** The profile was never created in the database, even though you signed up.

---

## ✅ Quick Fix

### Step 1: Create Missing Profiles

Run this SQL in Supabase Dashboard:
**File:** `CREATE_MISSING_PROFILE.sql`

Or run directly:

```sql
-- Create profiles for all users without them
INSERT INTO public.profiles (
  id,
  email,
  display_name,
  role,
  github_url,
  linkedin_url
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', au.email),
  'builder',
  'https://github.com/placeholder',
  'https://linkedin.com/in/placeholder'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
```

**Run in:** https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql/new

### Step 2: Refresh Browser

1. Clear your browser cache
2. Reload the page
3. Your profile should now show! ✅

---

## 🔍 Why Did This Happen?

The database trigger `handle_new_user` is supposed to automatically create a profile when you sign up. But it didn't run because:

1. **You signed up before the trigger was installed**
2. **The trigger failed** during profile creation
3. **RLS blocked the trigger** (shouldn't happen with SECURITY DEFINER)

---

## ✅ Verify It Worked

After running the SQL, check:

```sql
SELECT 
  au.email,
  p.display_name,
  p.role,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ Profile Exists'
    ELSE '❌ Missing Profile'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
```

All users should show "✅ Profile Exists".

---

## 🚀 Future Prevention

Make sure the trigger exists for future signups:

```sql
-- Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

If it doesn't exist, run `FIX_NOW.sql` to create it.

---

## 📋 Checklist

- [ ] Ran `CREATE_MISSING_PROFILE.sql`
- [ ] Verified all users have profiles
- [ ] Cleared browser cache
- [ ] Reloaded page
- [ ] Profile now shows ✅
- [ ] No more "Profile fetch error" ✅
- [ ] No more "Error fetching submissions" ✅

---

## 🎉 Done!

Your profile should now show correctly, and you won't get those errors anymore.
