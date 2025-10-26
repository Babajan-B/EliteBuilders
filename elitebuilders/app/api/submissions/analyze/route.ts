/**
 * API Route: Trigger AI Analysis for Submission
 * POST /api/submissions/analyze
 *
 * Automatically analyzes a submission using Gemini LLM
 * Results are stored in database and only visible to judges
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeSubmissionWithAI } from '@/lib/services/ai-analysis';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId is required' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const supabase = getSupabaseBrowserClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user owns this submission or is admin/judge
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('user_id')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Check if user owns the submission
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isOwner = submission.user_id === user.id;
    const isJudgeOrAdmin = profile?.role === 'judge' || profile?.role === 'admin';

    if (!isOwner && !isJudgeOrAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to analyze this submission' },
        { status: 403 }
      );
    }

    // Trigger AI analysis
    console.log(`[API] Triggering AI analysis for submission ${submissionId}`);
    const result = await analyzeSubmissionWithAI(submissionId);

    if (!result) {
      return NextResponse.json(
        { error: 'AI analysis failed' },
        { status: 500 }
      );
    }

    // Return success (but don't include detailed results for non-judges)
    const response: any = {
      success: true,
      submissionId,
      analyzed: true,
    };

    // Only include detailed results for judges/admins
    if (isJudgeOrAdmin) {
      response.analysis = result;
    } else {
      // For submission owners, only return basic info
      response.message = 'Submission analyzed successfully. Results will be reviewed by judges.';
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[API] Error in AI analysis endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/submissions/analyze?submissionId=xxx
 * Check if a submission has been analyzed
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId query parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseBrowserClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch submission analysis status
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('id, ai_analyzed_at, score_llm')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      submissionId: submission.id,
      analyzed: !!submission.ai_analyzed_at,
      analyzedAt: submission.ai_analyzed_at,
      score: submission.score_llm,
    }, { status: 200 });
  } catch (error) {
    console.error('[API] Error checking analysis status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
