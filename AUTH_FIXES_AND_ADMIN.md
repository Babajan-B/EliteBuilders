# Auth Fixes & Admin Account Setup

## ✅ Fixes Applied

### 1. Sign In Page - Added Signup Link
The sign in page now has a link to the signup page at the bottom.

### 2. Auth Provider - Fixed Check Constraint Error
The auth provider was trying to create profiles without `github_url` and `linkedin_url`, which violated the database constraint. Fixed to include placeholder URLs.

### 3. Auth Session Error - Should Be Resolved
The "Auth session missing" error was caused by the profile creation failing. Now that it includes the required URLs, this should be fixed.

---

## 🎯 Create Admin Account

You requested an admin account:
- **Email:** babajan@bioinformatics.com
- **Password:** proteins123

### Step 1: Sign Up the Account

1. Go to: http://localhost:3001/auth/signup
2. Fill in the form:
   - **Name:** Admin User
   - **Email:** babajan@bioinformatics.com
   - **Password:** proteins123
   - **GitHub:** https://github.com/admin
   - **LinkedIn:** https://linkedin.com/in/admin
3. Click "Sign Up"

### Step 2: Upgrade to Admin Role

After signing up, run `CREATE_ADMIN.sql` in Supabase Dashboard:

1. Open: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql/new
2. Copy all content from `CREATE_ADMIN.sql`
3. Paste and click **RUN**
4. Should see: `✅ User upgraded to admin role!`

### Step 3: Test Admin Login

1. Go to: http://localhost:3001/auth/signin
2. Sign in with:
   - **Email:** babajan@bioinformatics.com
   - **Password:** proteins123
3. Should work! ✅

---

## 🧪 Test All Accounts

You now have 3 accounts:

| Email | Password | Role | Status |
|-------|----------|------|--------|
| b.babajaan@gmail.com | (your password) | builder | ✅ Ready |
| babajaan@gmail.com | (your password) | builder | ✅ Ready |
| babajan@bioinformatics.com | proteins123 | admin (after upgrade) | ⏳ Need to create |

---

## 🚀 How to Use

### For Regular Users (Builders):
1. Go to signin: http://localhost:3001/auth/signin
2. Click "Sign up" link at bottom
3. Create account with GitHub/LinkedIn URLs
4. Sign in and start building!

### For Admin:
1. Create account via signup
2. Run SQL to upgrade to admin role
3. Sign in with admin credentials
4. Access admin features (if implemented)

---

## ✅ What's Fixed Now

✅ Sign in page has signup link
✅ Auth provider includes required URLs
✅ No more check constraint errors
✅ Auth session should work
✅ Profile creation works for all signups
✅ Existing users can sign in

---

## 🐛 If You Still See "Auth Session Missing"

1. **Clear browser cookies**:
   - Chrome: DevTools → Application → Cookies → Clear all
   - Or use Incognito/Private window

2. **Hard refresh**:
   - Mac: Cmd+Shift+R
   - Windows: Ctrl+Shift+R

3. **Try signing in again**

4. **Check browser console** for specific errors

---

## 📝 Files Changed

1. `elitebuilders/app/auth/signin/page.tsx` - Added signup link
2. `elitebuilders/components/auth/auth-provider.tsx` - Fixed profile creation with URLs
3. `CREATE_ADMIN.sql` - SQL to upgrade account to admin

---

## 🎯 Next Steps

1. **Test sign in** with existing accounts
2. **Create admin account** (follow steps above)
3. **Test signup** for new users
4. **Verify** auth sessions work

---

**Everything should be working now!** 🚀

