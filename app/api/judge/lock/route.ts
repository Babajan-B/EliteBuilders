/**
 * PATCH /api/judge/lock - Lock a judge review and set final score
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { parseAndValidate, JudgeLockSchema } from '@/lib/validate';
import { errorResponse, successResponse, ErrorCode } from '@/lib/errors';
import { requireAuth, isAssignedJudge } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * PATCH /api/judge/lock
 */
export async function PATCH(request: Request) {
  try {
    // Check authentication
    const user = await requireAuth(request);

    // Validate request body
    const validation = await parseAndValidate(request, JudgeLockSchema);
    if (!validation.success) {
      return Response.json(validation.error, { status: 400 });
    }

    const { submissionId, delta_pct, notes_md } = validation.data;
    const db = supabaseAdmin();

    // Fetch submission with scores and challenge
    const { data: submission, error: submissionError } = await db
      .from('submissions')
      .select(
        `
        id,
        challenge_id,
        status,
        autoscores(score_auto),
        llmscores(score_llm)
      `
      )
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return errorResponse(ErrorCode.NOT_FOUND, 'Submission not found');
    }

    // Verify submission is in PROVISIONAL state
    if (submission.status !== 'PROVISIONAL') {
      return errorResponse(
        ErrorCode.BAD_REQUEST,
        'Submission must be in PROVISIONAL state to be locked'
      );
    }

    // Verify user is an assigned judge for this challenge
    const isJudge = await isAssignedJudge(submission.challenge_id, user.id);
    if (!isJudge) {
      return errorResponse(
        ErrorCode.FORBIDDEN,
        'Only assigned judges can lock submissions for this challenge'
      );
    }

    // Calculate final score
    // provisional = 0.2*auto + 0.6*llm
    // Handle both array (from mock) and object (from real DB) formats
    const autoscoresData = submission.autoscores as { score_auto?: number }[] | { score_auto?: number } | null;
    const llmscoresData = submission.llmscores as { score_llm?: number }[] | { score_llm?: number } | null;
    
    const autoScore = Array.isArray(autoscoresData)
      ? (autoscoresData[0]?.score_auto || 0)
      : (autoscoresData?.score_auto || 0);
    
    const llmScore = Array.isArray(llmscoresData)
      ? (llmscoresData[0]?.score_llm || 0)
      : (llmscoresData?.score_llm || 0);
    
    const provisionalScore = 0.2 * autoScore + 0.6 * llmScore;

    // Apply judge adjustment with clamping
    // final_score = provisional * (1 + delta_pct/100)
    // Clamp delta_pct is already validated to -20..20 by schema, but clamp the result to 0..100
    const adjustmentFactor = 1 + delta_pct / 100;
    const rawFinalScore = provisionalScore * adjustmentFactor;
    const finalScore = clamp(rawFinalScore, 0, 100);

    // Upsert judge review
    const { data: review, error: reviewError } = await db
      .from('judge_reviews')
      .upsert(
        {
          submission_id: submissionId,
          judge_id: user.id,
          delta_pct,
          notes_md,
          locked_bool: true,
          final_score: finalScore,
          locked_at: new Date().toISOString(),
        },
        {
          onConflict: 'submission_id',
        }
      )
      .select()
      .single();

    if (reviewError) {
      console.error('Error upserting judge review:', reviewError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to lock judge review');
    }

    // Update submission status to FINAL
    const { error: updateError } = await db
      .from('submissions')
      .update({ status: 'FINAL' })
      .eq('id', submissionId);

    if (updateError) {
      console.error('Error updating submission status:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to update submission status');
    }

    return successResponse({
      submission_id: submissionId,
      provisional_score: Math.round(provisionalScore * 100) / 100,
      delta_pct,
      final_score: Math.round(finalScore * 100) / 100,
      status: 'FINAL',
      locked_at: review.locked_at,
    });
  } catch (err) {
    console.error('Unexpected error in PATCH /api/judge/lock:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

    if (errorMessage.includes('Authentication required')) {
      return errorResponse(ErrorCode.UNAUTHORIZED, errorMessage);
    }
    if (errorMessage.includes('Access denied') || errorMessage.includes('Forbidden')) {
      return errorResponse(ErrorCode.FORBIDDEN, errorMessage);
    }

    return errorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
  }
}
