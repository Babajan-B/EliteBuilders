# Admin Invitation Email Implementation Guide

## ✅ What's Implemented

### 1. **Automated User Creation**
- When admin sends invitation, system automatically:
  - Creates user account in Supabase Auth
  - Generates secure temporary password
  - Creates user profile with role (judge/sponsor)
  - Sends email with credentials

### 2. **Professional Email Template**
- Clean, responsive design
- Includes login credentials
- Clear call-to-action button
- Plain-text fallback link
- Support footer

### 3. **Simple Login Flow**
- No extra verification needed
- User logs in with provided credentials
- Automatically redirected to their dashboard

## 🚀 How to Run

### Start Development Server
```bash
cd /Users/jaan/Desktop/Hackathon
./dev-server.sh
```

Or manually:
```bash
cd elitebuilders
npm run dev
```

## 📧 Email Template Features

### Subject Line
- "Invitation to join EliteBuilders as a Judge/Sponsor"

### Preheader
- "You've been invited!"

### Body Content
- Personalized greeting
- Role-specific benefits
- Login credentials (highlighted)
- Primary CTA button
- Plain-text fallback link
- Professional footer

### Security
- Temporary password generation
- Encourages password change after first login
- Email confirmation auto-enabled

## 🔐 Environment Variables Required

Make sure `.env.local` has:
```env
# MailerSend
MAILERSEND_API_KEY=your_api_key_here
MAILERSEND_FROM_EMAIL=info@yourdomain.com
MAILERSEND_FROM_NAME=EliteBuilders

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

## 📋 Dashboard Redirects

After login:
- **Judges** → `/judge` (Judge Dashboard)
- **Sponsors** → `/sponsor` (Investor Dashboard)
- **Builders** → `/my-submissions`
- **Admins** → `/admin`

## 🛠️ Troubleshooting

### Email Not Sending
1. Check MailerSend API key is correct
2. Verify domain is verified in MailerSend
3. Check email address is valid
4. Look at server logs for error details

### User Creation Fails
1. Check Supabase service role key is set
2. Verify database has necessary tables
3. Check RLS policies allow admin operations

### Can't Login
1. Verify credentials from email
2. Check user was created in Supabase Auth
3. Verify profile exists in database

## 📊 API Endpoints

### POST /api/admin/invite
**Request:**
```json
{
  "email": "judge@example.com",
  "role": "judge",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "message": "Invitation sent successfully",
    "email": "judge@example.com",
    "role": "judge",
    "expiresAt": "2024-11-02T12:00:00Z"
  }
}
```

## 🎯 Testing Checklist

- [ ] Admin can send invitation
- [ ] Email arrives with credentials
- [ ] User can login with provided password
- [ ] User is redirected to correct dashboard
- [ ] Email template looks professional
- [ ] Error handling works for duplicate emails
- [ ] Logs show success/failure status
