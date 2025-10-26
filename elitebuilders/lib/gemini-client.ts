/**
 * Google Gemini API Client
 * LLM-powered submission scoring using Gemini 1.5 Flash
 *
 * API Docs: https://ai.google.dev/gemini-api/docs/quickstart#rest
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash-exp'; // Experimental model (free tier, works well)
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
}, rubric: Record<string, unknown>, githubAnalysis?: string): Promise<{
  score_llm: number;
  rubric_scores_json: Record<string, number>;
  rationale_md: string;
  detailed_analysis?: any;
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

You have access to THREE PRIMARY SOURCES:
1. 📝 PROJECT WRITEUP - Written description and claims
2. 📂 GITHUB REPOSITORY - Actual code, README, dependencies, tests
3. 📊 PITCH DECK - Presentation materials, problem/solution articulation

Evaluate based on ALL available sources. Cross-verify claims with actual implementation.

RUBRIC (Total: 60 points):
1. Problem Fit (0-15 points): How well does the solution address the stated challenge? Is the problem clearly understood? Is the solution relevant and appropriate?

2. Technical Depth (0-20 points): Code quality, architecture design, use of appropriate technologies, innovation in technical approach, implementation quality. 
   CRITICAL: You have access to actual code - evaluate the REAL implementation.
   - Check README quality and documentation
   - Verify dependencies match claimed tech stack
   - Assess code structure and quality
   - Reward actual implementation over claims

3. UX & Demo Quality (0-15 points): User experience design, demo presentation quality, ease of use, visual polish, documentation clarity.
   - Pitch deck quality and professionalism
   - README documentation completeness
   - Code organization and structure
   - Visual presentation of materials

4. Impact & Clarity (0-10 points): Potential real-world impact, scalability, clarity of explanation, completeness of documentation.
   - Pitch deck articulates problem/solution clearly
   - README explains use cases and value proposition
   - Overall professional presentation across all materials

SUBMISSION DETAILS:
${repoInfo}
${deckInfo}
${demoInfo}

${githubAnalysis || ''}

PROJECT WRITEUP:
${truncatedWriteup}

EVALUATION INSTRUCTIONS:
1. **Cross-Verify Everything**: Check if writeup claims match actual code and pitch deck
   - Writeup says "AI-powered" → Verify in code (import tensorflow, openai, etc.)
   - Pitch deck claims "scalable" → Check architecture in code
   
2. **Technical Depth Priority**: Base score on ACTUAL code, not claims
   - Review README quality (installation, usage, features documented)
   - Check dependencies (package.json/requirements.txt match claims)
   - Verify main source file shows actual implementation
   - Bonus points for tests, .env.example, LICENSE
   
3. **Reward Completeness**: All three sources provided = professionalism
   - GitHub + Pitch Deck + Writeup = shows thorough preparation
   - Missing GitHub = Major penalty (no way to verify claims)
   - Missing Pitch Deck = Minor penalty (less professional presentation)
   
4. **Flag Discrepancies**: Be honest about mismatches
   - "Writeup claims X but code shows Y"
   - "Pitch deck promises X but GitHub repo has basic implementation"
   
5. **Be Fair & Specific**:
   - Cite actual evidence: "README line 15 shows...", "requirements.txt includes..."
   - Don't penalize small projects that are honest about scope
   - Reward projects that match claims with implementation
   
6. **Presentation Quality**: Pitch deck matters for communication skills
   - Clear problem/solution articulation
   - Professional slides/document structure
   - Shows ability to present technical work to non-technical audience

SCORING PRIORITY:
1. CODE QUALITY (GitHub) - Most important
2. CLAIM VERIFICATION (Writeup vs Code) - Honesty matters
3. PRESENTATION (Pitch Deck) - Communication skills
4. DOCUMENTATION (README) - Usability and clarity

Return ONLY a valid JSON object with this EXACT structure (no markdown, no code blocks):
{
  "problem_fit": <number 0-15>,
  "tech_depth": <number 0-20>,
  "ux_flow": <number 0-15>,
  "impact": <number 0-10>,
  "strengths": [
    "Specific strength 1 with evidence (e.g., 'Well-documented README with clear setup instructions')",
    "Specific strength 2 with evidence",
    "Specific strength 3 with evidence"
  ],
  "weaknesses": [
    "Specific weakness 1 with constructive feedback",
    "Specific weakness 2 with suggestions",
    "Specific weakness 3 if applicable"
  ],
  "code_quality_notes": "Brief assessment of code structure, patterns, and best practices observed",
  "tech_stack_verification": "Match between claimed tech stack and actual dependencies (be specific)",
  "documentation_quality": "Assessment of README, comments, and overall documentation",
  "recommendation": "STRONG_ACCEPT | ACCEPT | BORDERLINE | REJECT with brief justification",
  "rationale": "2-3 paragraph detailed evaluation covering all aspects and providing specific examples from the code"
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

    // Build detailed analysis object
    const detailedAnalysis = {
      scores: {
        problem_fit: problemFit,
        tech_depth: techDepth,
        ux_flow: uxFlow,
        impact: impact,
        total: totalScore
      },
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      code_quality_notes: parsed.code_quality_notes || '',
      tech_stack_verification: parsed.tech_stack_verification || '',
      documentation_quality: parsed.documentation_quality || '',
      recommendation: parsed.recommendation || 'PENDING',
      rationale: rationale,
      analyzed_at: new Date().toISOString()
    };

    return {
      score_llm: totalScore,
      rubric_scores_json: {
        problem_fit: problemFit,
        tech_depth: techDepth,
        ux_flow: uxFlow,
        impact: impact,
      },
      rationale_md: rationale,
      detailed_analysis: detailedAnalysis, // Add as separate field
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
