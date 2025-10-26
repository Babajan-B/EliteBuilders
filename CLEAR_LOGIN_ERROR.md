# Fix "Invalid API key" on Login

## The Issue

The "Invalid API key" error is NOT related to login. It's from the MailerSend email service and should ONLY appear when sending invitations, not during login.

## Quick Fix

### Option 1: Clear Browser Cache

1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear site data"
4. Refresh page
5. Try logging in again

### Option 2: Use Incognito/Private Window

1. Open incognito window
2. Go to http://localhost:3001/auth/signin
3. Login should work without the error

### Option 3: Check What's Actually Failing

Open browser console (F12 → Console) and look for the actual error when you click "Sign In". The "Invalid API key" text might be:

1. Cached from a previous page
2. Coming from Supabase (not MailerSend)
3. From a different API call

## The Real Question

**Does login actually work despite the error message?**

Try this:
1. Enter: `babajan@bioinformaticsbb.com`
2. Password: `proteins123`
3. Click Sign In
4. Does it redirect to /admin?

If YES → The error is just a display bug, login works fine
If NO → Share the browser console error

## Why This Shouldn't Happen

Login flow:
```
User enters email/password 
→ Supabase.auth.signInWithPassword() 
→ NO email service involved
→ Redirect to dashboard
```

Email service is ONLY used for sending invitations, not for login!

## Next Steps

1. Try login in incognito mode
2. Check if it actually works (redirects to /admin)
3. If login works, the error is just visual
4. Share browser console output if login fails
