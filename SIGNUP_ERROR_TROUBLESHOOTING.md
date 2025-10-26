# Signup Error Troubleshooting

## ❌ Error: "must be owner of relation users"

### What This Means
You tried to run the SQL script locally or through a client that doesn't have superuser privileges. The `auth.users` table is a system table owned by Supabase's authentication system.

### ✅ Solution: Use Supabase Dashboard

**You MUST run the SQL in the Supabase Dashboard SQL Editor.**

#### Step-by-Step:

1. **Open your browser** (Chrome, Firefox, Safari, etc.)

2. **Go to:** https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql

3. **Log in to Supabase** if prompted

4. **Copy the SQL** from `RUN_SIGNUP_TRIGGER_FIX.sql`

5. **Paste into the SQL Editor** (the big text box on the page)

6. **Click the "RUN" button** (usually green, bottom right)

7. **Wait for success message**

#### What You Should See:
```
Success. No rows returned
```

Or verification output showing:
- `on_auth_user_created` trigger created
- RLS policies listed

---

## Why This Happens

### The Technical Reason:
- `auth.users` is owned by `supabase_auth_admin` role
- Your service role key has elevated privileges BUT still can't create triggers on `auth.*` tables
- The Supabase Dashboard SQL Editor runs as the `postgres` superuser role
- Only postgres role can create triggers on `auth.users`

### Permission Hierarchy:
```
postgres (superuser)           ← Supabase Dashboard uses this
  ├── supabase_admin
  ├── supabase_auth_admin      ← Owns auth.users
  │     └── auth.users table
  └── service_role             ← Your SUPABASE_SERVICE_ROLE_KEY
        └── Can bypass RLS, but can't modify auth schema
```

---

## Alternative Solutions (If Dashboard Doesn't Work)

### Option 1: Use Supabase CLI Migration

If you have Supabase CLI installed:

```bash
cd /Users/jaan/Desktop/Hackathon
supabase db reset
```

Then create a new migration:
```bash
supabase migration new signup_trigger
```

Copy the SQL from `RUN_SIGNUP_TRIGGER_FIX.sql` into the new migration file, then:
```bash
supabase db push
```

### Option 2: Contact Supabase Support

If neither method works, there might be a configuration issue with your project. Contact Supabase support through the dashboard.

---

## Verify the Fix Worked

After successfully running the SQL, verify the trigger exists:

```sql
-- Run this in Supabase SQL Editor
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Expected Output:**
| trigger_name | event_object_table | action_timing | event_manipulation |
|--------------|-------------------|---------------|-------------------|
| on_auth_user_created | users | AFTER | INSERT |

---

## Common Mistakes

### ❌ Don't Do This:
- Running SQL through `psql` command line
- Using a local PostgreSQL client (DBeaver, pgAdmin)
- Running through Node.js scripts
- Using `SUPABASE_SERVICE_ROLE_KEY` in code to execute SQL

### ✅ Do This:
- Use Supabase Dashboard SQL Editor (web browser)
- Or use Supabase CLI migrations
- Make sure you're logged into the correct project

---

## Still Getting Errors?

### Check Your Project URL
Make sure you're in the correct Supabase project:
- Project URL: https://vhoarjcbkcptqlyfdhsx.supabase.co
- Dashboard: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx

### Check SQL Editor Location
The SQL Editor should be at:
- **SQL Editor** (left sidebar)
- **→ New query** (top right button)
- Or direct link: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql/new

### Screenshot Your Error
If you continue to get errors:
1. Take a screenshot of the entire error message
2. Check the exact SQL you pasted
3. Make sure you copied ALL the SQL (from line 1 to the end)

---

## What Happens Next

Once the trigger is successfully created:

1. ✅ New users signing up will automatically get a profile created
2. ✅ No more RLS blocking errors
3. ✅ Signup will work correctly
4. ✅ Users will be redirected to dashboard

---

## Test After Fix

1. Go to: http://localhost:3001/auth/signup
2. Create a test account:
   - Name: Test User
   - Email: test@example.com
   - Password: testpass123
   - GitHub: https://github.com/test
   - LinkedIn: https://linkedin.com/in/test
3. Click "Sign Up"
4. Should redirect to dashboard successfully

Check the database:
```sql
SELECT id, email, display_name, role, created_at
FROM profiles
WHERE email = 'test@example.com';
```

You should see the profile created automatically! 🎉

