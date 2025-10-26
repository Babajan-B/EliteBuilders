/**
 * GET /api/submissions/[id] - Get submission by ID with scores
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { errorResponse, successResponse, ErrorCode } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * GET /api/submissions/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = supabaseAdmin();

    // Fetch submission with related scores
    const { data: submission, error: submissionError } = await db
      .from('submissions')
      .select(
        `
        *,
        autoscores(*),
        llmscores(*),
        judge_reviews(*)
      `
      )
      .eq('id', id)
      .single();

    if (submissionError || !submission) {
      return errorResponse(ErrorCode.NOT_FOUND, 'Submission not found');
    }

    // Note: In production, you might want to check permissions here
    // e.g., user is submission owner, assigned judge, or sponsor for the challenge

    return successResponse(submission);
  } catch (err) {
    console.error('Unexpected error in GET /api/submissions/[id]:', err);
    return errorResponse(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred');
  }
}
