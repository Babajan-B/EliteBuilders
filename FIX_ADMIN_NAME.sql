-- Fix admin display name

UPDATE public.profiles
SET display_name = 'Admin User'
WHERE email = 'babajan@bioinformaticsbb.com';

-- Verify
SELECT email, display_name, role 
FROM public.profiles 
WHERE email = 'babajan@bioinformaticsbb.com';
