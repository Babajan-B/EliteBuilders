-- =====================================================
-- Add AI Analysis Fields to Submissions Table
-- =====================================================
-- Run this SQL in Supabase SQL Editor

-- Add columns for AI analysis results
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS score_llm INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rubric_scores_json JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rationale_md TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_analyzed_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment to explain these columns
COMMENT ON COLUMN submissions.score_llm IS 'AI-generated score (0-60 points)';
COMMENT ON COLUMN submissions.rubric_scores_json IS 'Detailed rubric breakdown from AI analysis';
COMMENT ON COLUMN submissions.rationale_md IS 'AI rationale explaining the scores';
COMMENT ON COLUMN submissions.ai_analyzed_at IS 'Timestamp when AI analysis was performed';

-- Create an index for faster queries filtering by AI analysis status
CREATE INDEX IF NOT EXISTS idx_submissions_ai_analyzed ON submissions(ai_analyzed_at) WHERE ai_analyzed_at IS NOT NULL;

-- Add a computed column for score display (combining manual and AI scores if needed)
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS score_display INTEGER GENERATED ALWAYS AS (
  COALESCE(score_llm, 0)
) STORED;

COMMENT ON COLUMN submissions.score_display IS 'Display score (uses AI score)';

-- =====================================================
-- Row Level Security for AI Analysis Fields
-- =====================================================

-- Only judges and admins can see AI analysis results
-- Builders can only see status and score_display, not detailed AI rationale

-- Note: You may need to update existing RLS policies
-- The rationale_md and rubric_scores_json should only be visible to judges/admins

-- Example policy (adjust based on your existing RLS setup):
-- CREATE POLICY "Judges can view all AI analysis" ON submissions
--   FOR SELECT
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--       AND profiles.role IN ('judge', 'admin')
--     )
--   );

SELECT 'AI analysis fields added successfully!' AS status;
