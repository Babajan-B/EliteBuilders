# Verify Supabase API Keys

## The "Invalid API key" Error

The sign-in page shows "Supabase Status: ✅ Connected" which means the **Supabase client** is working. But when you try to sign in, you get "Invalid API key" error.

This usually means:
1. **The anon key is wrong** (most likely)
2. **The API key has expired**
3. **The Supabase project was reset**

## Get Fresh Keys

### Step 1: Go to Supabase Dashboard
https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/settings/api

### Step 2: Copy the Keys
You'll see several keys:
- **Project URL**: `https://vhoarjcbkcptqlyfdhsx.supabase.co`
- **anon public**: `eyJhbGciOi...` (JWT token)
- **service_role**: `eyJhbGciOi...` (JWT token)

### Step 3: Update .env.local

Open: `/Users/jaan/Desktop/Hackathon/elitebuilders/.env.local`

Replace the current keys with the fresh ones:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://vhoarjcbkcptqlyfdhsx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste the fresh anon key here>
SUPABASE_SERVICE_ROLE_KEY=<paste the fresh service_role key here>
```

### Step 4: Restart Server

```bash
cd /Users/jaan/Desktop/Hackathon
./STOP.sh
./START.sh
```

### Step 5: Try Again

Go to http://localhost:3001/auth/signin and try logging in.

## If Still Not Working

Check the browser console (F12) for the actual error message. It might say:
- "Invalid login credentials" (wrong email/password)
- "Email not confirmed" (user exists but not confirmed)
- "User not found" (user doesn't exist)

Share the exact error message from the console!

## Quick Test

Open browser console (F12) and run:

```javascript
fetch('https://vhoarjcbkcptqlyfdhsx.supabase.co/rest/v1/challenges?select=*', {
  headers: {
    'apikey': 'YOUR_ANON_KEY_HERE',
    'Authorization': 'Bearer YOUR_ANON_KEY_HERE'
  }
})
.then(r => r.json())
.then(console.log)
```

Replace `YOUR_ANON_KEY_HERE` with your actual anon key. If this returns data, your key is valid.
