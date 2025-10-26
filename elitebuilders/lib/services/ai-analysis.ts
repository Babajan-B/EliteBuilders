/**
 * AI Analysis Service
 * Comprehensive submission analysis using multiple sources:
 * - GitHub repository (code, README, dependencies, tests)
 * - Pitch deck (presentation, problem/solution articulation)
 * - Project writeup (description and claims)
 * - [FUTURE] Demo video (OpenAI Whisper transcription)
 */

import { scoreSubmissionWithLLM } from '@/lib/gemini-client';
import { analyzeGitHubRepository, formatGitHubAnalysisForLLM } from '@/lib/github-analyzer';
import { analyzePitchDeck, formatPitchDeckForLLM } from '@/lib/pitch-deck-analyzer';
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
  detailed_analysis?: any;
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

    const sub = submission as any; // Type cast for Supabase types

    // 2. Check if already analyzed
    if (sub.ai_analyzed_at) {
      console.log('[AI Analysis] Submission already analyzed, skipping');
      return {
        score_llm: sub.score_llm,
        rubric_scores_json: sub.rubric_scores_json,
        rationale_md: sub.rationale_md,
        ai_analyzed_at: sub.ai_analyzed_at,
      };
    }

    // 3. Update status to ANALYZING
    console.log('[AI Analysis] Updating status to ANALYZING...');
    await supabase
      .from('submissions')
      .update({ status: 'ANALYZING' } as any)
      .eq('id', submissionId);

    // 4. Analyze GitHub repository if URL provided
    let githubAnalysisText = '';
    if (sub.repo_url && sub.repo_url.includes('github.com')) {
      console.log('[AI Analysis] Analyzing GitHub repository...');
      try {
        const githubAnalysis = await analyzeGitHubRepository(sub.repo_url);
        githubAnalysisText = formatGitHubAnalysisForLLM(githubAnalysis);
        console.log('[AI Analysis] GitHub analysis complete:', githubAnalysis.analysis_summary);
      } catch (error) {
        console.error('[AI Analysis] GitHub analysis failed:', error);
        githubAnalysisText = '\\n⚠️ Could not analyze GitHub repository\\n';
      }
    } else {
      console.log('[AI Analysis] No GitHub URL or non-GitHub repository');
    }

    // 5. Run AI analysis with GitHub data
    console.log('[AI Analysis] Calling Gemini LLM with GitHub context...');
    const analysisResult = await scoreSubmissionWithLLM(
      {
        repo_url: sub.repo_url,
        deck_url: sub.deck_url,
        demo_url: sub.demo_url,
        writeup_md: sub.writeup_md,
      },
      {}, // rubric config (default rubric is used in gemini-client)
      githubAnalysisText // Pass GitHub analysis to LLM
    );

    console.log('[AI Analysis] LLM returned score:', analysisResult.score_llm);

    // 6. Store results in database and update status to ANALYZED
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        status: 'ANALYZED', // Update status after successful analysis
        score_llm: analysisResult.score_llm,
        rubric_scores_json: analysisResult.rubric_scores_json,
        rationale_md: analysisResult.rationale_md,
        ai_detailed_analysis: analysisResult.detailed_analysis, // Store detailed analysis
        ai_analyzed_at: now,
      } as any)
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
      detailed_analysis: analysisResult.detailed_analysis,
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
