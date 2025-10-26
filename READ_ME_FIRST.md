# 📌 READ ME FIRST - Signup Fix

## Your Problem
Signup creates user but no profile → errors everywhere

## The Solution
Install database trigger (takes 5 minutes)

---

## 🎯 Do This Now

### 1. Open Browser
Chrome, Firefox, or Safari

### 2. Click This Link
https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql/new

### 3. Copy SQL
Open: `RUN_SIGNUP_TRIGGER_FIX.sql`
Copy all of it

### 4. Paste & Run
Paste in browser
Click "RUN" button

### 5. See Success
Should show: `trigger_name: on_auth_user_created`

---

## ✅ Then Test

1. Delete old test users at: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/auth/users
2. Go to: http://localhost:3001/auth/signup
3. Use NEW email
4. Should work now!

---

## ❌ Getting "must be owner of relation users"?

You're NOT using the Supabase Dashboard.

**Must use:** Web browser → supabase.com

**Don't use:** Terminal, VS Code, database tools

See: `WHERE_ARE_YOU_RUNNING_SQL.md`

---

## 📚 More Help

- `COMPLETE_FIX_GUIDE.md` - Full guide
- `INSTALL_TRIGGER_NOW.md` - Detailed steps
- `EXACT_STEPS_TO_FIX.md` - Step-by-step with screenshots

---

## That's It!

**Browser → Supabase Dashboard → Paste SQL → Click RUN → Done!** 🎉

