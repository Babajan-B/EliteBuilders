# How to Get New Supabase API Keys (5 Steps)

## Your Database is Fine - Just Need New Keys!

### Step 1: Open Supabase Dashboard
**Click this link:** https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx/settings/api

### Step 2: Get the ANON Key
1. Look for **"Project API keys"** section
2. Find **"anon"** key (first one, public)
3. Click **"Copy"** button next to it

### Step 3: Get the SERVICE ROLE Key
1. Scroll down a bit
2. Find **"service_role"** key (it's secret!)
3. Click **"Reveal"** button
4. Click **"Copy"** button next to it

### Step 4: Update Your .env.local File
```bash
# Open the file
cd /Users/jaan/Desktop/Hackathon/elitebuilders
nano .env.local
```

Replace these lines:
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=paste_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=paste_service_role_key_here
```

### Step 5: Restart Server
```bash
cd /Users/jaan/Desktop/Hackathon
./restart-servers.sh
```

---

## That's It! ✅

Your database never stopped - you just need fresh API keys.

---

## Need Help?

If you can't find the keys:
1. Make sure you're logged into Supabase
2. Make sure you're on the right project
3. The keys are on the **Settings → API** page

