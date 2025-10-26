# Admin Invitation System - Complete Guide

## 🚀 Quick Start

### 1. Start the Server
```bash
cd /Users/jaan/Desktop/Hackathon
./restart-servers.sh
```

### 2. Access Admin Panel
- URL: http://localhost:3001/admin
- Login with admin account: `babajan@bioinformaticsbb.com`

### 3. Send Invitation
- Click "Send Invitation" tab
- Enter email, select role (judge/sponsor), add name (optional)
- Click "Send Invitation"

---

## 📧 How It Works

### Invitation Flow
1. **Admin sends invitation** → Creates user account with temporary password
2. **Email sent** → Recipient gets email with login credentials
3. **Recipient logs in** → Uses provided email and temporary password
4. **Auto-redirected** → Judge → `/judge`, Sponsor → `/sponsor`

### No Extra Verification
- ✅ Email is auto-confirmed
- ✅ No verification links needed
- ✅ User can login immediately
- ✅ Prompted to change password after first login

---

## 🎨 Email Template

### Subject
`Invitation to join EliteBuilders as a [Judge/Sponsor]`

### Content Includes
- ✅ Professional header with gradient
- ✅ Role-specific benefits
- ✅ Login credentials (email + temp password)
- ✅ Primary CTA button "Log In Now →"
- ✅ Plain text link fallback
- ✅ Security reminder (change password)
- ✅ Footer with support info

### Text Version
- ✅ Full plain-text version included
- ✅ All credentials visible
- ✅ Works in all email clients

---

## 🔧 Troubleshooting

### Issue 1: Email Not Sending

**Symptoms:**
- Admin sees "Failed to send invitation email"
- Console shows email errors

**Solutions:**

#### A. Check MailerSend API Key
```bash
cd /Users/jaan/Desktop/Hackathon
./test-connections.sh
```

**Expected:** `✅ MailerSend API Key is VALID`

**If Failed:**
1. Go to https://www.mailersend.com/
2. Navigate to: Settings → API Tokens
3. Create new token with **ALL permissions**:
   - ✅ Email send
   - ✅ Email activity
   - ✅ Domains
   - ✅ Templates
4. Copy token and update `.env.local`:
   ```bash
   MAILERSEND_API_KEY=mlsn.your_new_key_here
   ```
5. Restart server: `./restart-servers.sh`

#### B. Verify Sender Domain
```bash
# Check sender email domain status
curl -X GET "https://api.mailersend.com/v1/domains" \
  -H "Authorization: Bearer YOUR_API_KEY" | jq .
```

**Required:**
- Domain must be verified
- DKIM records configured
- SPF records configured

**Fix:**
1. Go to MailerSend → Domains
2. Verify your domain
3. Add DNS records (DKIM, SPF, DMARC)
4. Wait for verification (can take 24-48 hours)

#### C. Check Rate Limits
- Free tier: 3,000 emails/month
- Limit: 12 emails/second

**If rate limited:**
- Wait 1 hour
- Upgrade plan
- Or use retry logic (already implemented)

---

### Issue 2: User Created But Email Failed

**What Happens:**
- Account IS created
- Profile IS created  
- Email NOT sent

**Solution:**
1. Check server console logs:
   ```
   ⚠️  EMAIL SEND FAILED - Manual delivery required:
      Email: judge@example.com
      Password: JUDGEXYZ123!ABC
      Role: judge
   ```

2. Manually send credentials:
   - Copy email & password from console
   - Send via alternate method (Slack, phone, etc.)
   - User can log in immediately

3. Check MailerSend dashboard:
   - https://www.mailersend.com/
   - Activity → Email Activity
   - Look for failed sends
   - Check error message

---

### Issue 3: "User already exists"

**Cause:** Email already registered

**Solutions:**
- Use different email
- Or delete existing user:
  ```sql
  -- In Supabase SQL Editor
  DELETE FROM auth.users WHERE email = 'user@example.com';
  DELETE FROM profiles WHERE email = 'user@example.com';
  ```

---

### Issue 4: Recipient Can't Log In

**Symptoms:**
- "Invalid credentials" error
- "Email not confirmed" error

**Solutions:**

#### A. Verify user was created
```sql
-- Check in Supabase SQL Editor
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'recipient@example.com';
```

**Should show:**
- ✅ `email_confirmed_at` is NOT NULL
- ✅ User exists

**If NULL:**
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'recipient@example.com';
```

#### B. Password issues
- Ensure recipient copied password exactly (case-sensitive)
- Check for extra spaces
- Try password reset flow

---

### Issue 5: Wrong Dashboard After Login

**Symptoms:**
- Judge redirected to builder page
- Sponsor redirected to wrong page

**Solution:**
```sql
-- Verify role in database
SELECT email, role FROM profiles WHERE email = 'user@example.com';

-- Fix role if wrong
UPDATE profiles SET role = 'judge' WHERE email = 'user@example.com';
```

Then have user log out and log back in.

---

## 🔍 Testing Checklist

### Before Sending Invitations

- [ ] Run `./test-connections.sh`
- [ ] ✅ Supabase connection works
- [ ] ✅ MailerSend API key valid
- [ ] ✅ Sender domain verified
- [ ] ✅ Server running on :3001

### After Sending Invitation

- [ ] Check admin panel shows success message
- [ ] Check server console for any errors
- [ ] Verify email received in recipient inbox
- [ ] Check email has correct:
  - [ ] Email address
  - [ ] Temporary password
  - [ ] Login link
- [ ] Test login with provided credentials
- [ ] Verify redirect to correct dashboard

---

## 🎯 Dashboard Links

### Judge Dashboard
- URL: `/judge`
- Features:
  - View assigned submissions
  - Score submissions
  - Provide feedback
  - Lock reviews

### Sponsor Dashboard  
- URL: `/sponsor`
- Features:
  - Create competitions
  - Manage prizes
  - View submissions
  - Create posts (coming soon)

---

## 📊 Monitoring

### Check Email Delivery Status
```bash
# Get recent email activity
curl -X GET "https://api.mailersend.com/v1/activity" \
  -H "Authorization: Bearer YOUR_API_KEY" | jq .
```

### Check User Creation
```sql
-- Recent invitations
SELECT email, role, status, created_at 
FROM invitations 
ORDER BY created_at DESC 
LIMIT 10;

-- Recent user signups
SELECT email, created_at, email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🆘 Emergency Contacts

### If All Else Fails

1. **Check server logs:**
   ```bash
   cd /Users/jaan/Desktop/Hackathon/elitebuilders
   npm run dev
   # Watch for errors in console
   ```

2. **Manual user creation:**
   ```sql
   -- Create user manually in Supabase Dashboard
   -- Auth → Users → Add User
   -- Then update role in profiles table
   ```

3. **Contact MailerSend Support:**
   - https://www.mailersend.com/help
   - Usually respond within 24 hours

---

## ✅ Success Indicators

You know it's working when:
- ✅ Admin sees "Invitation sent successfully"
- ✅ No errors in server console
- ✅ Email appears in recipient inbox within 1 minute
- ✅ Recipient can log in with provided credentials
- ✅ Recipient lands on correct dashboard
- ✅ Profile shows correct role

---

## 📝 Common Errors Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `403 Forbidden` | API key lacks permissions | Regenerate key with all scopes |
| `401 Unauthorized` | Invalid API key | Check `.env.local` for correct key |
| `429 Too Many Requests` | Rate limit exceeded | Wait 1 hour or upgrade plan |
| `Invalid domain` | Sender domain not verified | Verify domain in MailerSend |
| `DKIM not found` | DNS records missing | Add DKIM records to DNS |
| `User already exists` | Email already registered | Use different email |
| `Profile creation failed` | RLS policy issue | Check RLS policies on profiles table |

