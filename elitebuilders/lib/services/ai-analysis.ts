/**
 * AI Analysis Service
 * Automatically analyzes submissions using Gemini LLM
 */

import { scoreSubmissionWithLLM } from '@/lib/gemini-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface SubmissionForAnalysis {
  id: string;
  user_id: string;
  challenge_id: string;
  repo_url?: string | null;
  deck_url?: string | null;
  demo_url?: string | null;
  writeup_md?: string | null;
}

export interface AIAnalysisResult {
  score_llm: number;
  rubric_scores_json: Record<string, number>;
  rationale_md: string;
  ai_analyzed_at: string;
}

/**
 * Analyze a submission using AI and store results
 * This function is called automatically after a submission is created
 */
export async function analyzeSubmissionWithAI(
  submissionId: string
): Promise<AIAnalysisResult | null> {
  const supabase = getSupabaseBrowserClient();

  try {
    console.log(`[AI Analysis] Starting analysis for submission ${submissionId}`);

    // 1. Fetch the submission
    const { data: submission, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (fetchError || !submission) {
      console.error('[AI Analysis] Failed to fetch submission:', fetchError);
      return null;
    }

    // 2. Check if already analyzed
    if (submission.ai_analyzed_at) {
      console.log('[AI Analysis] Submission already analyzed, skipping');
      return {
        score_llm: submission.score_llm,
        rubric_scores_json: submission.rubric_scores_json,
        rationale_md: submission.rationale_md,
        ai_analyzed_at: submission.ai_analyzed_at,
      };
    }

    // 3. Run AI analysis
    console.log('[AI Analysis] Calling Gemini LLM...');
    const analysisResult = await scoreSubmissionWithLLM(
      {
        repo_url: submission.repo_url,
        deck_url: submission.deck_url,
        demo_url: submission.demo_url,
        writeup_md: submission.writeup_md,
      },
      {} // rubric config (default rubric is used in gemini-client)
    );

    console.log('[AI Analysis] LLM returned score:', analysisResult.score_llm);

    // 4. Store results in database
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        score_llm: analysisResult.score_llm,
        rubric_scores_json: analysisResult.rubric_scores_json,
        rationale_md: analysisResult.rationale_md,
        ai_analyzed_at: now,
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('[AI Analysis] Failed to store results:', updateError);
      return null;
    }

    console.log('[AI Analysis] ✅ Analysis complete and stored');

    return {
      score_llm: analysisResult.score_llm,
      rubric_scores_json: analysisResult.rubric_scores_json,
      rationale_md: analysisResult.rationale_md,
      ai_analyzed_at: now,
    };
  } catch (error) {
    console.error('[AI Analysis] Error during analysis:', error);
    return null;
  }
}

/**
 * Batch analyze multiple submissions
 * Useful for re-analyzing existing submissions
 */
export async function batchAnalyzeSubmissions(
  submissionIds: string[]
): Promise<{
  successful: number;
  failed: number;
  results: Array<{ id: string; success: boolean; error?: string }>;
}> {
  const results: Array<{ id: string; success: boolean; error?: string }> = [];
  let successful = 0;
  let failed = 0;

  for (const submissionId of submissionIds) {
    try {
      const result = await analyzeSubmissionWithAI(submissionId);
      if (result) {
        results.push({ id: submissionId, success: true });
        successful++;
      } else {
        results.push({ id: submissionId, success: false, error: 'Analysis returned null' });
        failed++;
      }
    } catch (error) {
      results.push({
        id: submissionId,
        success: false,
        error: (error as Error).message,
      });
      failed++;
    }

    // Add small delay between API calls to avoid rate limiting
    if (submissionIds.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return { successful, failed, results };
}
