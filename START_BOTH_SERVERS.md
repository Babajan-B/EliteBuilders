# Start Both Backend & Frontend

## Easy Way (Recommended)

From the root directory:

```bash
cd /Users/jaan/Desktop/Hackathon
./START.sh
```

This starts both:
- Backend: http://localhost:3000
- Frontend: http://localhost:3001

---

## Manual Way (Two Terminals)

### Terminal 1 - Backend:
```bash
cd /Users/jaan/Desktop/Hackathon
npm run dev
```

### Terminal 2 - Frontend:
```bash
cd /Users/jaan/Desktop/Hackathon/elitebuilders
npm run dev
```

---

## Stop Servers

```bash
cd /Users/jaan/Desktop/Hackathon
./STOP.sh
```

---

## After Starting

Go to: **http://localhost:3001** (frontend)

The frontend at port 3001 will communicate with backend at port 3000 automatically.

---

## For Admin Panel

1. Start both servers (using START.sh)
2. Go to http://localhost:3001/admin
3. Sign in with admin credentials
4. Send invitations!
