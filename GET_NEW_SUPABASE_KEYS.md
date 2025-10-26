# 🔥 CRITICAL: Get New Supabase API Keys

## Current Problem
❌ **All Supabase API keys are INVALID**

## How to Fix

### Step 1: Go to Supabase Dashboard
Open: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx

### Step 2: Get New Keys
1. Click **"Settings"** (gear icon in left sidebar)
2. Click **"API"**
3. Find **"Project API keys"** section
4. Copy these keys:

#### A. Project URL
```
https://vhoarjcbkcptqlyfdhsx.supabase.co
```

#### B. anon public key
- Look for: **"Project API keys"** → **anon public**
- Copy the full key

#### C. service_role key
- Look for: **"Project API keys"** → **service_role** (click "Reveal")
- ⚠️  Keep this secret! Never commit to git!

### Step 3: Update `.env.local`
```bash
# Open the file
cd /Users/jaan/Desktop/Hackathon/elitebuilders
nano .env.local

# Update these values:
NEXT_PUBLIC_SUPABASE_URL=https://vhoarjcbkcptqlyfdhsx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_your_new_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=paste_your_new_service_role_key_here
```

### Step 4: Test
```bash
# Run the test script
./test-connections.sh

# Should show: ✅ Supabase connection successful
```

### Step 5: Restart Server
```bash
./restart-servers.sh
```

---

## Why Did This Happen?

Possible reasons:
1. Keys were rotated/regenerated
2. Project was paused/resumed
3. Keys expired (if time-limited)
4. Keys were manually revoked

---

## ⚠️  Security Note

**NEVER:**
- ❌ Commit `.env.local` to git
- ❌ Share service_role key publicly
- ❌ Use service_role key in frontend code

**ALWAYS:**
- ✅ Use `anon` key for frontend
- ✅ Use `service_role` key only in backend API routes
- ✅ Keep `.env.local` in `.gitignore`

