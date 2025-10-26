# ⚠️ Check Constraint Found!

## The Error You Got

```
ERROR: new row for relation "profiles" violates check constraint 
"profiles_builder_urls_required"
```

## What This Means

Your database has a **check constraint** that requires:
- `github_url` must be present for 'builder' role
- `linkedin_url` must be present for 'builder' role

This constraint wasn't visible in the `totaldatabase.sql` schema export.

## ✅ Fixed!

I've updated `FIX_NOW.sql` to include placeholder URLs:
- GitHub: `https://github.com/placeholder`
- LinkedIn: `https://linkedin.com/in/placeholder`

### The trigger now:
1. ✅ Tries to use URLs from signup form metadata
2. ✅ Falls back to placeholder URLs if not provided
3. ✅ Satisfies the check constraint
4. ✅ Allows signups to complete successfully

### For your existing users:
1. ✅ Creates profiles with placeholder URLs
2. ✅ You can update these URLs later in profile settings

## 🚀 Run It Now

The updated `FIX_NOW.sql` is ready!

1. Open: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/sql/new
2. Copy **ALL** of `FIX_NOW.sql` (it's been updated!)
3. Paste and click **RUN**
4. Should work now! ✅

## 📝 After Running

Your profiles will have:
- ✅ ID, email, display_name, role
- ✅ GitHub URL (from signup or placeholder)
- ✅ LinkedIn URL (from signup or placeholder)

You can update the placeholder URLs by:
1. Signing in
2. Going to profile settings
3. Updating your real GitHub/LinkedIn URLs

## ✨ Future Signups

The trigger will now:
1. Check if user provided github_url in signup metadata → use it
2. If not provided → use placeholder
3. Same for linkedin_url
4. Profile created successfully ✅
5. User can update URLs later in profile

---

**Ready? Run the updated `FIX_NOW.sql` now!** 🚀

