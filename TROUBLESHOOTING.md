# Troubleshooting Guide

## Common Issues & Solutions

### 1. "Module not found: Can't resolve '@/lib/errors'"
**Solution:**
```bash
cp lib/errors.ts elitebuilders/lib/
cp lib/validate.ts elitebuilders/lib/
# Restart dev server
```

### 2. "MailerSend credentials not configured"
**Solution:**
Check `.env.local` has:
```env
MAILERSEND_API_KEY=your_key
MAILERSEND_FROM_EMAIL=verified_email@domain.com
MAILERSEND_FROM_NAME=EliteBuilders
```

### 3. Email Sent but Not Delivered
**Causes:**
- Domain not verified in MailerSend
- DKIM/SPF not configured
- Email in spam folder
- Invalid email address

**Solution:**
1. Verify domain in MailerSend dashboard
2. Set up DNS records (MX, SPF, DKIM)
3. Check spam folder
4. Use valid email addresses

### 4. "Failed to create auth user"
**Causes:**
- Wrong Supabase service role key
- RLS policies blocking
- Email already exists

**Solution:**
1. Check `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Verify admin has proper permissions
3. Check if email already exists

### 5. User Created but Can't Login
**Causes:**
- Profile not created
- Wrong password
- Email confirmation required

**Solution:**
1. Check profile exists in database
2. Verify credentials from email
3. Check email_confirmed_at is set

### 6. Rate Limit Exceeded
**Solution:**
- MailerSend free tier: 12,000 emails/month
- Upgrade plan if needed
- Implement retry logic with backoff

### 7. Development Server Not Starting
**Solution:**
```bash
# Kill existing processes
pkill -f "next dev"

# Clear cache
rm -rf .next

# Reinstall dependencies
npm install

# Start server
npm run dev
```

## Error Codes

- `ErrorCode.UNAUTHORIZED` - Not an admin
- `ErrorCode.INVALID_INPUT` - Email already exists
- `ErrorCode.INTERNAL_ERROR` - Server error
- `ErrorCode.BAD_REQUEST` - Invalid input format
