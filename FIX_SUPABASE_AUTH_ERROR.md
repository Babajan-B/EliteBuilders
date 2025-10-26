# Fix Supabase 401 Authentication Error

## The Real Issue

The error is **NOT email API** - it's **Supabase authentication failing**!

Console shows:
```
401 from supabase.co/auth/v1/token
401 from supabase.co/rest/v1/challenges
```

This means Supabase API keys are invalid or the server wasn't restarted after adding them.

---

## Fix Steps

### Step 1: Stop All Servers

```bash
cd /Users/jaan/Desktop/Hackathon
./STOP.sh
```

Or manually kill:
```bash
pkill -f "next dev"
```

### Step 2: Verify Supabase Keys

Go to: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/settings/api

Check if these keys match what's in `.env.local`:

**Current keys in .env.local:**
- URL: `https://vhoarjcbkcptqlyfdhsx.supabase.co`
- Anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**If they DON'T match:**
1. Copy the correct keys from Supabase Dashboard
2. Update `.env.local` file

### Step 3: Restart Servers

```bash
cd /Users/jaan/Desktop/Hackathon
./START.sh
```

Or manually:
```bash
# Terminal 1
cd /Users/jaan/Desktop/Hackathon
npm run dev

# Terminal 2
cd /Users/jaan/Desktop/Hackathon/elitebuilders
npm run dev
```

### Step 4: Clear Browser & Test

1. Clear browser cache (Ctrl+Shift+Delete)
2. Go to http://localhost:3001
3. Try login again

---

## Why This Happened

Environment variables are only loaded when the server starts. If you:
1. Created `.env.local` while server was running
2. Server didn't restart
3. Keys are not loaded → 401 errors

---

## Quick Test

After restarting, open browser console and check:
- Should NOT see 401 errors
- Should see successful auth/profile loading

---

## If Still Failing

The Supabase keys might be wrong. Get fresh keys:

1. Go to https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/settings/api
2. Copy "Project URL"
3. Copy "anon public" key
4. Copy "service_role" key (click to reveal)
5. Update `.env.local`
6. Restart servers
