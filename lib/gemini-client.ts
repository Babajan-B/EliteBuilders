/**
 * Google Gemini API Client
 * LLM-powered submission scoring using Gemini 1.5 Flash
 *
 * API Docs: https://ai.google.dev/gemini-api/docs/quickstart#rest
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash'; // Latest Flash model, free tier, fast, good quality
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
  };
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    message: string;
    code: number;
  };
}

/**
 * Call Gemini API with retry logic
 */
async function callGeminiAPI(
  prompt: string,
  temperature = 0.2,
  maxRetries = 2
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const request: GeminiRequest = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature, // Low temperature for consistent scoring
      maxOutputTokens: 2048, // Increased to allow full JSON responses
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Gemini API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`
        );
      }

      const data: GeminiResponse = await response.json();

      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message}`);
      }

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('No response from Gemini API');
      }

      const candidate = data.candidates[0];

      // Check if response was truncated
      if (candidate.finishReason === 'MAX_TOKENS') {
        throw new Error('Response truncated due to MAX_TOKENS limit. Consider increasing maxOutputTokens.');
      }

      if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
        console.error('Invalid response structure:', JSON.stringify(data, null, 2));
        throw new Error('Invalid response structure from Gemini API');
      }

      const text = candidate.content.parts[0].text;
      if (!text) {
        throw new Error('Empty text in Gemini response');
      }

      return text;
    } catch (error) {
      lastError = error as Error;
      console.error(`Gemini API attempt ${attempt + 1} failed:`, error);

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new Error('Failed to call Gemini API after retries');
}

/**
 * Score a submission using Gemini LLM
 * Returns structured rubric scores
 */
export async function scoreSubmissionWithLLM(submission: {
  repo_url?: string | null;
  deck_url?: string | null;
  demo_url?: string | null;
  writeup_md?: string | null;
}, rubric: Record<string, unknown>): Promise<{
  score_llm: number;
  rubric_scores_json: Record<string, number>;
  rationale_md: string;
}> {
  // Build context for the LLM
  const repoInfo = submission.repo_url ? `Repository: ${submission.repo_url}` : 'No repository provided';
  const deckInfo = submission.deck_url ? `Pitch Deck: ${submission.deck_url}` : 'No pitch deck provided';
  const demoInfo = submission.demo_url ? `Demo: ${submission.demo_url}` : 'No demo provided';
  const writeup = submission.writeup_md || 'No writeup provided';

  // Truncate writeup if too long (keep within context window)
  const maxWriteupLength = 8000; // ~2000 tokens
  const truncatedWriteup = writeup.length > maxWriteupLength
    ? writeup.substring(0, maxWriteupLength) + '\n\n[Truncated for length...]'
    : writeup;

  // Construct the scoring prompt
  const prompt = `You are an expert hackathon judge evaluating a project submission. Your task is to provide fair, objective scores based on the rubric below.

RUBRIC (Total: 60 points):
1. Problem Fit (0-15 points): How well does the solution address the stated challenge? Is the problem clearly understood? Is the solution relevant and appropriate?
2. Technical Depth (0-20 points): Code quality, architecture design, use of appropriate technologies, innovation in technical approach, implementation quality.
3. UX & Demo Quality (0-15 points): User experience design, demo presentation quality, ease of use, visual polish, documentation clarity.
4. Impact & Clarity (0-10 points): Potential real-world impact, scalability, clarity of explanation, completeness of documentation.

SUBMISSION DETAILS:
${repoInfo}
${deckInfo}
${demoInfo}

PROJECT WRITEUP:
${truncatedWriteup}

INSTRUCTIONS:
1. Carefully evaluate the submission based on the information provided
2. If a repository/demo is mentioned but not accessible, you can still evaluate based on the writeup
3. If information is missing (e.g., no demo), score that aspect lower but fairly
4. Provide specific, constructive feedback in your rationale

Return ONLY a valid JSON object with this EXACT structure (no markdown, no code blocks):
{
  "problem_fit": <number 0-15>,
  "tech_depth": <number 0-20>,
  "ux_flow": <number 0-15>,
  "impact": <number 0-10>,
  "rationale": "<2-4 sentences explaining the scores, being specific about strengths and areas for improvement>"
}`;

  try {
    // Call Gemini API
    const responseText = await callGeminiAPI(prompt, 0.2);

    // Parse JSON response
    let parsed: any;
    try {
      // Try to parse directly
      parsed = JSON.parse(responseText);
    } catch {
      // If wrapped in markdown code blocks, extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from LLM response');
      }
    }

    // Validate scores are within bounds
    const problemFit = Math.max(0, Math.min(15, Number(parsed.problem_fit) || 0));
    const techDepth = Math.max(0, Math.min(20, Number(parsed.tech_depth) || 0));
    const uxFlow = Math.max(0, Math.min(15, Number(parsed.ux_flow) || 0));
    const impact = Math.max(0, Math.min(10, Number(parsed.impact) || 0));

    const totalScore = problemFit + techDepth + uxFlow + impact;
    const rationale = parsed.rationale || 'LLM evaluation completed';

    return {
      score_llm: totalScore,
      rubric_scores_json: {
        problem_fit: problemFit,
        tech_depth: techDepth,
        ux_flow: uxFlow,
        impact: impact,
      },
      rationale_md: rationale,
    };
  } catch (error) {
    console.error('Error in Gemini LLM scoring:', error);

    // Fallback to deterministic scoring if LLM fails
    console.warn('Falling back to deterministic scoring');
    const writeupLength = submission.writeup_md?.length || 0;
    const baseScore = Math.min(50, Math.floor(writeupLength / 20));

    return {
      score_llm: Math.floor(baseScore * 0.8), // Conservative fallback
      rubric_scores_json: {
        problem_fit: Math.min(12, Math.floor(baseScore * 0.25)),
        tech_depth: Math.min(16, Math.floor(baseScore * 0.35)),
        ux_flow: Math.min(12, Math.floor(baseScore * 0.25)),
        impact: Math.min(8, Math.floor(baseScore * 0.15)),
      },
      rationale_md: `**FALLBACK SCORING** - LLM API unavailable (${(error as Error).message}). Deterministic score based on writeup length: ${writeupLength} characters.`,
    };
  }
}

/**
 * Test Gemini API connectivity
 */
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const response = await callGeminiAPI('Respond with: OK', 0.1);
    return response.toLowerCase().includes('ok');
  } catch (error) {
    console.error('Gemini API connection test failed:', error);
    return false;
  }
}
