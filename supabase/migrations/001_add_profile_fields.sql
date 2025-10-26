-- Add missing fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Update RLS policies for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all profiles
CREATE POLICY IF NOT EXISTS "Users can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can insert their own profile
CREATE POLICY IF NOT EXISTS "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY IF NOT EXISTS "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy: Admins can update any profile
CREATE POLICY IF NOT EXISTS "Admins can update any profile"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);
