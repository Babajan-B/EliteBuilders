/**
 * GET /api/leaderboard - Get leaderboard for a challenge
 * Prefers 'leaderboard' view if available, otherwise computes scores manually
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { parseSearchParams, LeaderboardQuerySchema } from '@/lib/validate';
import { errorResponse, successResponse, ErrorCode } from '@/lib/errors';

export const runtime = 'nodejs';

interface LeaderboardEntry {
  rank: number;
  submission_id: string;
  user_id: string;
  display_name: string;
  score_auto: number;
  score_llm: number;
  score_display: number;
  status: string;
  created_at: string;
}

/**
 * GET /api/leaderboard
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = parseSearchParams(searchParams, LeaderboardQuerySchema);

    if (!validation.success) {
      return Response.json(validation.error, { status: 400 });
    }

    const { challenge_id, limit = 100 } = validation.data;
    const db = supabaseAdmin();

    // Always fetch from submissions with joins to ensure we get all fields
    // Don't rely on leaderboard view as it may have missing/undefined fields
    const { data: submissions, error } = await db
      .from('submissions')
      .select(
        `
        id,
        user_id,
        status,
        created_at,
        autoscores(score_auto),
        llmscores(score_llm),
        judge_reviews(final_score, locked_bool),
        profiles!submissions_user_id_fkey(display_name)
      `
      )
      .eq('challenge_id', challenge_id)
      .in('status', ['PROVISIONAL', 'FINAL'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to fetch leaderboard');
    }

    // Compute display scores
    const leaderboard: LeaderboardEntry[] = submissions.map((submission: Record<string, unknown>) => {
      // Handle both array (from mock) and object (from real DB) formats
      const autoscoresData = submission.autoscores as { score_auto?: number }[] | { score_auto?: number } | null;
      const llmscoresData = submission.llmscores as { score_llm?: number }[] | { score_llm?: number } | null;
      const judgeReviewsData = submission.judge_reviews as 
        { final_score?: number; locked_bool?: boolean }[] | 
        { final_score?: number; locked_bool?: boolean } | 
        null;

      const autoScore = Array.isArray(autoscoresData) 
        ? (autoscoresData[0]?.score_auto ?? 0)
        : (autoscoresData?.score_auto ?? 0);
      
      const llmScore = Array.isArray(llmscoresData)
        ? (llmscoresData[0]?.score_llm ?? 0)
        : (llmscoresData?.score_llm ?? 0);
      
      const judgeReview = Array.isArray(judgeReviewsData)
        ? judgeReviewsData[0]
        : judgeReviewsData;

      // Always compute score_display server-side
      // If locked_bool && final_score exists, use final_score
      // Otherwise use provisional: 0.2 * auto + 0.6 * llm
      let scoreDisplay: number;

      if (judgeReview?.locked_bool && judgeReview.final_score !== null && judgeReview.final_score !== undefined) {
        // Final score (judge-locked)
        scoreDisplay = judgeReview.final_score;
      } else {
        // Provisional score: 0.2*auto + 0.6*llm
        scoreDisplay = 0.2 * autoScore + 0.6 * llmScore;
      }

      return {
        submission_id: submission.id as string,
        user_id: submission.user_id as string,
        display_name: ((submission.profiles as { display_name?: string } | null)?.display_name) || 'Anonymous',
        score_auto: autoScore,
        score_llm: llmScore,
        score_display: Math.round(scoreDisplay * 100) / 100, // Round to 2 decimals
        status: submission.status as string,
        created_at: submission.created_at as string,
        rank: 0, // Will be set below
      };
    });

    // Sort by score_display descending
    leaderboard.sort((a, b) => b.score_display - a.score_display);

    // Add rank
    const rankedLeaderboard = leaderboard.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return successResponse(rankedLeaderboard);
  } catch (err) {
    console.error('Unexpected error in GET /api/leaderboard:', err);
    return errorResponse(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred');
  }
}
