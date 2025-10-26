# Admin Panel Setup Instructions

This document provides instructions for completing the admin panel setup for EliteBuilders.

## What's Been Created

1. **Admin Panel Page** (`elitebuilders/app/admin/page.tsx`)
   - Full-featured admin dashboard
   - Send invitations to judges and sponsors
   - View all invitations (pending, accepted, expired)
   - Statistics and tracking

2. **Email Service** (`lib/email.ts`)
   - MailerSend integration for sending invitation emails
   - Beautiful HTML email templates
   - Configurable via environment variables

3. **Backend API** (`app/api/admin/invite/route.ts`)
   - POST endpoint to send invitations
   - GET endpoint to retrieve all invitations
   - Admin role verification
   - Token generation for invitation links

4. **Database Migration** (`supabase/migrations/005_invitations_table.sql`)
   - Creates `invitations` table
   - Row Level Security policies
   - Indexes for performance

## Required: Run Database Migration

You need to run the SQL migration to create the `invitations` table in your Supabase database.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://supabase.com/dashboard/project/vhoarjcbkcptqlyfdhsx
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/005_invitations_table.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI (If Installed)

```bash
# If you have Supabase CLI installed
supabase db push
```

## Environment Variables

The following environment variables have been added to `/Users/jaan/Desktop/Hackathon/.env.local`:

```bash
# MailerSend Email Service
MAILERSEND_API_KEY=mlsn.6d8926b356b1d5515e282ef12279646d0d8ee37f79d43c97a8170dfa6c18c100
MAILERSEND_FROM_EMAIL=info@test-q3enl6k7oym42vwr.mlsender.net
MAILERSEND_FROM_NAME=CreatorPulse
MAILERSEND_ADMIN_EMAIL=bioinfo.pacer@gmail.com
MAILERSEND_WEBHOOK_SECRET=your_webhook_secret_here
```

## Creating an Admin User

To access the admin panel, you need a user with the `admin` role. You can create one using the Supabase SQL editor:

1. Go to Supabase Dashboard → SQL Editor
2. Run this SQL to make an existing user an admin:

```sql
-- Replace 'your-email@example.com' with the email of the user you want to make admin
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## Accessing the Admin Panel

Once you have an admin user:

1. Sign in to the application with your admin account
2. You'll be automatically redirected to `/admin`
3. Or click on "Admin Panel" in the navigation header

## Features Available

### Send Invitations
- Select role (Judge or Sponsor)
- Enter recipient's email
- Optionally add recipient's name
- System automatically sends a beautiful HTML email with invitation link

### View Invitations
- See all invitations by status (pending, accepted, expired)
- Track who was invited and when
- Monitor acceptance status

### Email Content
The invitation email includes:
- Professional branding
- Role-specific messaging
- Secure invitation link with token
- 7-day expiration
- Clear call-to-action button

## Testing the Email Service

To test if MailerSend is working:

1. Go to the Admin Panel
2. Send a test invitation to your own email
3. Check your inbox for the invitation email
4. Verify the email looks correct and the link works

## Troubleshooting

### "Invitations table doesn't exist" error
- Run the database migration as described above

### Emails not sending
- Verify MailerSend API key is correct in `.env.local`
- Check that the backend server is running (`npm run dev` in root directory)
- Check backend console for error messages

### Can't access admin panel
- Verify your user has role = 'admin' in the profiles table
- Check browser console for errors
- Make sure you're logged in

## What Happens Next

1. Admin invites a judge or sponsor via the admin panel
2. System creates invitation record in database with unique token
3. Email is sent via MailerSend with invitation link
4. Recipient clicks link and is taken to invitation acceptance page (needs to be created)
5. After accepting, they sign up with the designated role
6. Their invitation status is updated to "accepted"

## Future Enhancements Needed

1. **Invitation Acceptance Page** (`/auth/accept-invite?token=xxx`)
   - Verify token is valid and not expired
   - Pre-fill signup form with email
   - Auto-assign correct role after signup
   - Mark invitation as accepted

2. **Resend Invitation**
   - Button to resend expired or pending invitations

3. **Revoke Invitation**
   - Ability to cancel pending invitations

4. **Email Templates**
   - Customize email design per role
   - Add more personalization

## Support

If you encounter any issues:
1. Check the backend console for errors
2. Check the frontend console for errors
3. Verify all environment variables are set correctly
4. Ensure database migration was run successfully
