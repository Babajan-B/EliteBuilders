-- Check if the admin user exists and their status

SELECT 
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed'
    ELSE '❌ Not confirmed'
  END as confirmation_status
FROM auth.users
WHERE email = 'babajan@bioinformaticsbb.com';
