# Restart Frontend to Load Environment Variables

## The Problem

Environment variables from `.env.local` are only loaded when the Next.js dev server **starts**. If the server was running when you added `.env.local`, the variables won't be loaded.

## Solution: Restart the Frontend Server

### Option 1: Use STOP.sh and START.sh

```bash
cd /Users/jaan/Desktop/Hackathon
./STOP.sh
./START.sh
```

### Option 2: Manual Restart

1. Stop the frontend server (Ctrl+C)
2. Start it again:
```bash
cd /Users/jaan/Desktop/Hackathon/elitebuilders
npm run dev
```

## Verify It's Working

After restart, open browser console (F12) and you should see:
- NO 401 errors
- Successful Supabase authentication

## If Still Not Working

Check the browser console for:
- `❌ Supabase credentials missing!` message
- Which env var is missing (URL or KEY)

This will tell us exactly what's wrong.
