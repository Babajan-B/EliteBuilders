# Signup Fix Checklist

## ✅ Step-by-Step Checklist

### Before You Start
- [ ] Make sure servers are stopped (run `./STOP.sh` if needed)
- [ ] Have your Supabase login ready
- [ ] Open your code editor to view `RUN_SIGNUP_TRIGGER_FIX.sql`

---

### Apply The Fix

- [ ] **Open browser** to: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql/new
- [ ] **Log in** to Supabase if prompted
- [ ] **Open** `RUN_SIGNUP_TRIGGER_FIX.sql` in your code editor
- [ ] **Select all** text in the file (Cmd+A or Ctrl+A)
- [ ] **Copy** the SQL (Cmd+C or Ctrl+C)
- [ ] **Click** in the Supabase SQL Editor text box
- [ ] **Paste** the SQL (Cmd+V or Ctrl+V)
- [ ] **Click** the green "RUN" button
- [ ] **Wait** for success message (2-3 seconds)

---

### Verify Success

- [ ] You see: "Success. No rows returned" or similar
- [ ] Verification output shows `on_auth_user_created` trigger exists
- [ ] No red error messages

---

### Test Signup

- [ ] **Start servers**: Run `./START.sh` in terminal
- [ ] **Wait** for servers to start (30 seconds)
- [ ] **Open browser** to: http://localhost:3001/auth/signup
- [ ] **Fill form**:
  - Name: Test User
  - Email: test@example.com
  - Password: testpassword123
  - GitHub: https://github.com/test
  - LinkedIn: https://linkedin.com/in/test
  - (Profile pic optional)
- [ ] **Click** "Sign Up" button
- [ ] **Redirected** to /dashboard successfully ✅

---

### Verify in Database (Optional)

- [ ] Go to Supabase Dashboard → Table Editor
- [ ] Open `profiles` table
- [ ] See your test user profile exists with:
  - ✅ id (UUID)
  - ✅ email (test@example.com)
  - ✅ display_name (Test User)
  - ✅ role (builder)

---

## 🚨 If Something Goes Wrong

### Got Error: "must be owner of relation users"
- [ ] You're NOT in Supabase Dashboard - go back to Step 1
- [ ] Make sure you're using the browser link above
- [ ] See: `SIGNUP_ERROR_TROUBLESHOOTING.md`

### Signup Still Fails
- [ ] Check browser console (F12 → Console tab) for errors
- [ ] Verify trigger exists (see verification SQL below)
- [ ] Check environment variables in `.env.local`
- [ ] See: `HOW_TO_FIX_SIGNUP.md`

### Servers Won't Start
- [ ] Run `./STOP.sh` first
- [ ] Check ports 3000 and 3001 are free
- [ ] Try starting manually: `npm run dev`

---

## 🔍 Verification SQL (Run in Supabase)

Check if trigger exists:
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

Should return:
```
trigger_name: on_auth_user_created
event_object_table: users
```

---

## 📁 Files You Need

- `RUN_SIGNUP_TRIGGER_FIX.sql` - The SQL to run (this is the main file)
- `START_HERE_SIGNUP_FIX.md` - Simple overview
- `HOW_TO_FIX_SIGNUP.md` - Visual guide
- `SIGNUP_ERROR_TROUBLESHOOTING.md` - Detailed troubleshooting

---

## ✨ Success Criteria

You're done when:
- ✅ SQL executed without errors
- ✅ Trigger `on_auth_user_created` exists in database
- ✅ Test signup works and redirects to dashboard
- ✅ Profile appears in `profiles` table

---

## 🎉 All Done?

Great! Your signup is now working. The database trigger will automatically create profiles for all new users from now on.

**Next Steps:**
- Delete test users if needed (Supabase → Authentication → Users)
- Start building your app!
- The trigger will handle profile creation automatically

---

## Need Help?

1. Check the error message carefully
2. Look at `SIGNUP_ERROR_TROUBLESHOOTING.md`
3. Verify your environment variables
4. Make sure you're using the Supabase Dashboard (not local SQL client)

