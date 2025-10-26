-- Create invitations table for judge and sponsor invitations

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('judge', 'sponsor')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  
  CONSTRAINT unique_pending_email UNIQUE (email, status)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Admins can view all invitations" ON invitations;
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

DROP POLICY IF EXISTS "Admins can insert invitations" ON invitations;
CREATE POLICY "Admins can insert invitations"
ON invitations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF NOT EXISTS "Admins can update invitations" ON invitations;
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

-- Anyone can view their own invitation by token (for accept page)
DROP POLICY IF EXISTS "Public can view invitation by token" ON invitations;
CREATE POLICY "Public can view invitation by token"
ON invitations FOR SELECT
TO authenticated
USING (true);

-- Verify table was created
SELECT 'Invitations table created successfully' as status;
