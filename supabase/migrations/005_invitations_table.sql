-- Create invitations table for managing judge and sponsor invitations
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('judge', 'sponsor')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- Create index on token for invitation acceptance
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Enable Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view all invitations
CREATE POLICY "Admins can view all invitations"
ON invitations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can create invitations
CREATE POLICY "Admins can create invitations"
ON invitations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Only admins can update invitations
CREATE POLICY "Admins can update invitations"
ON invitations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_invitations_updated_at_trigger
BEFORE UPDATE ON invitations
FOR EACH ROW
EXECUTE FUNCTION update_invitations_updated_at();
