/**
 * POST /api/score - Trigger scoring job for a submission
 * Computes AutoScore + LLM score (Gemini 1.5 Flash) and updates submission status
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { parseAndValidate, ScoreSchema } from '@/lib/validate';
import { errorResponse, successResponse, ErrorCode } from '@/lib/errors';
import { scoreSubmissionWithLLM } from '@/lib/gemini-client';

export const runtime = 'nodejs';

interface AutoScoreResult {
  score_auto: number;
  checks_json: {
    has_repo: boolean;
    has_deck: boolean;
    has_demo: boolean;
    has_writeup: boolean;
    writeup_length: number;
  };
}

/**
 * Compute AutoScore (0-20) based on presence checks
 */
function computeAutoScore(submission: {
  repo_url?: string | null;
  deck_url?: string | null;
  demo_url?: string | null;
  writeup_md?: string | null;
}): AutoScoreResult {
  const checks = {
    has_repo: !!submission.repo_url,
    has_deck: !!submission.deck_url,
    has_demo: !!submission.demo_url,
    has_writeup: !!submission.writeup_md && submission.writeup_md.length >= 400,
    writeup_length: submission.writeup_md?.length || 0,
  };

  let score = 0;
  if (checks.has_repo) score += 5;
  if (checks.has_deck) score += 5;
  if (checks.has_demo) score += 5;
  if (checks.has_writeup) score += 5;

  return {
    score_auto: score,
    checks_json: checks,
  };
}

// LLM scoring is now handled by lib/gemini-client.ts
// Using Gemini 1.5 Flash with structured prompts for consistent evaluation

/**
 * POST /api/score
 */
export async function POST(request: Request) {
  try {
    // Validate request body
    const validation = await parseAndValidate(request, ScoreSchema);
    if (!validation.success) {
      return Response.json(validation.error, { status: 400 });
    }

    const { submissionId } = validation.data;
    const db = supabaseAdmin();

    // Fetch submission with challenge rubric
    const { data: submission, error: submissionError } = await db
      .from('submissions')
      .select(
        `
        *,
        challenges(rubric_json)
      `
      )
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return errorResponse(ErrorCode.NOT_FOUND, 'Submission not found');
    }

    // Check if submission is in a valid state for scoring
    if (submission.status === 'FINAL') {
      return errorResponse(ErrorCode.BAD_REQUEST, 'Submission is already finalized');
    }

    // Extract rubric from challenge
    const rubric = (submission as { challenges: { rubric_json: Record<string, unknown> } }).challenges
      ?.rubric_json || {};

    // Compute AutoScore
    const autoScore = computeAutoScore(submission);

    // Upsert autoscores
    const { error: autoScoreError } = await db.from('autoscores').upsert(
      {
        submission_id: submissionId,
        score_auto: autoScore.score_auto,
        checks_json: autoScore.checks_json,
      },
      { onConflict: 'submission_id' }
    );

    if (autoScoreError) {
      console.error('Error upserting autoscores:', autoScoreError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to save autoscores');
    }

    // Compute LLM score using Gemini 1.5 Flash
    console.log(`[Scoring] Computing LLM score for submission ${submissionId}...`);
    const llmScore = await scoreSubmissionWithLLM(submission, rubric);
    console.log(`[Scoring] LLM score computed: ${llmScore.score_llm}/60`);

    // Generate prompt hash for reproducibility tracking
    const promptHash = Buffer.from(
      `gemini-1.5-flash-${submissionId}-${Date.now()}`
    ).toString('base64').substring(0, 32);

    // Upsert llmscores
    const { error: llmScoreError } = await db.from('llmscores').upsert(
      {
        submission_id: submissionId,
        score_llm: llmScore.score_llm,
        rubric_scores_json: llmScore.rubric_scores_json,
        rationale_md: llmScore.rationale_md,
        model_id: 'gemini-1.5-flash',
        model_version: 'latest',
        prompt_hash: promptHash,
      },
      { onConflict: 'submission_id' }
    );

    if (llmScoreError) {
      console.error('Error upserting llmscores:', llmScoreError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to save LLM scores');
    }

    // Update submission status to PROVISIONAL
    const { error: statusError } = await db
      .from('submissions')
      .update({ status: 'PROVISIONAL' })
      .eq('id', submissionId);

    if (statusError) {
      console.error('Error updating submission status:', statusError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to update submission status');
    }

    return successResponse({
      submissionId,
      score_llm: llmScore.score_llm,
      score_auto: autoScore.score_auto,
      status: 'PROVISIONAL',
    });
  } catch (err) {
    console.error('Unexpected error in POST /api/score:', err);
    return errorResponse(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred');
  }
}
