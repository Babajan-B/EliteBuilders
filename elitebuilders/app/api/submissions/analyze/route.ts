/**
 * API Route: Trigger AI Analysis for Submission
 * POST /api/submissions/analyze
 *
 * Automatically analyzes a submission using Gemini LLM
 * Results are stored in database and only visible to judges
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeSubmissionWithAI } from '@/lib/services/ai-analysis';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/submissions/analyze - Starting...');

    const body = await request.json();
    const { submissionId, forceReanalyze } = body;

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Force reanalyze: ${forceReanalyze ? 'YES' : 'NO'}`);

    // Create Supabase client with cookies
    console.log('👤 Creating Supabase client with cookies...');
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[API] Auth check:', { hasUser: !!user, error: authError?.message });

    if (authError || !user) {
      console.log('[API] ❌ Not authenticated');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('[API] User role:', profile?.role);

    if (!profile || profile.role !== 'admin') {
      console.log('[API] ❌ Not admin. Role:', profile?.role);
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    console.log(`✅ Authenticated: ${user.email} (${profile.role})`);

    // Verify submission exists
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

    // Trigger AI analysis with progress tracking
    console.log(`[API] 🚀 Triggering AI analysis for submission ${submissionId}`);
    console.log(`[API] 👤 Requested by: ${user.email} (${user.role})`);
    
    const result = await analyzeSubmissionWithAI(submissionId, forceReanalyze);

    if (!result) {
      console.error(`[API] ❌ AI analysis failed for submission ${submissionId}`);
      return NextResponse.json(
        { error: 'AI analysis failed' },
        { status: 500 }
      );
    }
    
    console.log(`[API] ✅ AI analysis completed for submission ${submissionId}`);

    return NextResponse.json({
      success: true,
      submissionId,
      analyzed: true,
      analysis: result,
    }, { status: 200 });
  } catch (error) {
    console.error('[API] ❌ Error in AI analysis endpoint:', error);
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

    // Create Supabase client with cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    );

    // Verify authentication
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
