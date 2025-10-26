# LLM Integration - Technical Deep Dive

## 🤖 Overview

EliteBuilders uses **Google Gemini AI** for automated submission evaluation. The system implements a two-phase LLM pipeline: **Screening** and **Scoring**.

---

## 📡 Gemini AI Integration

### **API Configuration**

```typescript
// lib/gemini-client.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
```

### **Environment Variables**
```bash
GOOGLE_AI_API_KEY=your_api_key_here
```

---

## 🔍 Phase 1: LLM Screening

### **Purpose**
Quick pre-filter to validate submissions meet basic requirements.

### **Implementation**

```typescript
async function screenSubmission(submission: {
  repo_url: string;
  writeup_md: string;
  demo_url?: string;
}) {
  const prompt = `
Evaluate this coding competition submission:

REPOSITORY: ${submission.repo_url}
DESCRIPTION: ${submission.writeup_md}
DEMO: ${submission.demo_url || 'Not provided'}

CRITERIA:
1. Does the submission address the competition requirements?
2. Is the repository accessible and valid?
3. Are submission guidelines followed?
4. Is the technical approach feasible?
5. Rate overall validity (1-10)

OUTPUT (JSON):
{
  "valid": true/false,
  "validity_score": 0-10,
  "category": "web_app|api|ml|other",
  "flag_reason": "string or null",
  "screening_notes": "brief summary"
}
`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
```

### **Screening Output**

```json
{
  "valid": true,
  "validity_score": 8,
  "category": "web_app",
  "flag_reason": null,
  "screening_notes": "Complete React app with proper documentation"
}
```

**Decision Logic**:
- `valid: true` → Proceed to scoring
- `valid: false` → Flag for manual review
- `validity_score < 5` → Automatic flag

---

## ⭐ Phase 2: LLM Scoring

### **Multi-Dimensional Scoring Rubric**

Each submission is evaluated across **5 dimensions** with different weights:

| Dimension | Weight | Focus Area |
|-----------|--------|------------|
| Code Quality | 25% | Structure, best practices, efficiency |
| Problem Solving | 25% | Approach, algorithms, edge cases |
| Documentation | 20% | README, comments, setup |
| Innovation | 20% | Novel solutions, creativity |
| Technical Complexity | 10% | Stack sophistication, architecture |

### **Scoring Implementation**

```typescript
async function scoreSubmission(challenge: Challenge, submission: Submission) {
  const rubric = challenge.rubric_json; // Competition-specific criteria
  
  const prompt = `
You are an expert coding competition judge. Evaluate this submission.

CHALLENGE: ${challenge.title}
${challenge.brief_md}

SUBMISSION:
- Repository: ${submission.repo_url}
- Description: ${submission.writeup_md}
- Demo: ${submission.demo_url}

RUBRIC:
${JSON.stringify(rubric, null, 2)}

SCORE ACROSS 5 DIMENSIONS (0-100 each):

1. CODE QUALITY (25% weight)
   Evaluate:
   - Code structure and organization
   - Best practices and patterns
   - Efficiency and optimization
   - Error handling
   Score: ___

2. PROBLEM SOLVING (25% weight)
   Evaluate:
   - Approach to the challenge
   - Algorithm design and complexity
   - Edge case handling
   - Solution completeness
   Score: ___

3. DOCUMENTATION (20% weight)
   Evaluate:
   - README quality and completeness
   - Code comments and explanations
   - Setup/deployment instructions
   - API documentation (if applicable)
   Score: ___

4. INNOVATION (20% weight)
   Evaluate:
   - Novel solutions or approaches
   - Creative problem-solving
   - Unique features
   - Out-of-the-box thinking
   Score: ___

5. TECHNICAL COMPLEXITY (10% weight)
   Evaluate:
   - Technology stack sophistication
   - Architecture decisions
   - Scalability considerations
   - Integration complexity
   Score: ___

OUTPUT FORMAT (strict JSON):
{
  "overall_score": 0-100,
  "dimension_scores": {
    "code_quality": 0-100,
    "problem_solving": 0-100,
    "documentation": 0-100,
    "innovation": 0-100,
    "technical_complexity": 0-100
  },
  "rationale": "2-3 sentence explanation of overall score",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "judge_notes": "Any additional context for human judges"
}

Calculate overall_score using weighted average:
overall_score = (code_quality * 0.25) + (problem_solving * 0.25) + (documentation * 0.20) + (innovation * 0.20) + (technical_complexity * 0.10)
`;

  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text());
  
  // Calculate weighted average
  const calculated = (
    parsed.dimension_scores.code_quality * 0.25 +
    parsed.dimension_scores.problem_solving * 0.25 +
    parsed.dimension_scores.documentation * 0.20 +
    parsed.dimension_scores.innovation * 0.20 +
    parsed.dimension_scores.technical_complexity * 0.10
  );
  
  return {
    ...parsed,
    overall_score: Math.round(calculated),
    timestamp: new Date().toISOString()
  };
}
```

### **Example Scoring Output**

```json
{
  "overall_score": 87,
  "dimension_scores": {
    "code_quality": 92,
    "problem_solving": 85,
    "documentation": 90,
    "innovation": 88,
    "technical_complexity": 75
  },
  "rationale": "Strong implementation with clean code and excellent documentation. Innovative approach to the problem using modern tech stack.",
  "strengths": [
    "Clean, modular code structure",
    "Comprehensive README with screenshots",
    "Thoughtful error handling"
  ],
  "improvements": [
    "Add unit tests",
    "Consider caching for performance",
    "Add API rate limiting"
  ],
  "judge_notes": "Well-executed project that fully addresses the challenge requirements. Minor improvements could enhance production-readiness."
}
```

---

## 🔄 Complete Submission Flow with LLM

```typescript
async function processSubmission(submissionId: string) {
  // 1. Fetch submission
  const submission = await getSubmission(submissionId);
  const challenge = await getChallenge(submission.challenge_id);
  
  // 2. Update status: QUEUED
  await updateStatus(submissionId, 'QUEUED');
  
  // 3. LLM Screening
  const screening = await screenSubmission(submission);
  
  if (!screening.valid) {
    // Flag for manual review
    await updateStatus(submissionId, 'FLAGGED');
    await logFlagReason(submissionId, screening.flag_reason);
    return;
  }
  
  // 4. Update status: SCORING
  await updateStatus(submissionId, 'SCORING');
  
  // 5. LLM Scoring
  const scores = await scoreSubmission(challenge, submission);
  
  // 6. Save AI scores
  await saveLLMScores(submissionId, {
    score_llm: scores.overall_score,
    rubric_scores_json: scores.dimension_scores,
    rationale_md: scores.rationale,
    screened_at: new Date(),
  });
  
  // 7. Update status: PROVISIONAL (waiting for judge)
  await updateStatus(submissionId, 'PROVISIONAL');
  
  // 8. Notify judges (optional)
  await notifyJudges(submissionId);
  
  return scores;
}
```

---

## 💾 Database Schema for LLM Scores

```sql
-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  challenge_id UUID,
  user_id UUID,
  repo_url TEXT,
  writeup_md TEXT,
  demo_url TEXT,
  status VARCHAR(50), -- QUEUED, SCORING, PROVISIONAL, FINAL
  created_at TIMESTAMP
);

-- LLM scoring results
CREATE TABLE llm_scores (
  id UUID PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id),
  score_llm INTEGER, -- 0-100 overall score
  rubric_scores_json JSONB, -- Dimension scores
  rationale_md TEXT,
  screened_at TIMESTAMP,
  calculated_at TIMESTAMP
);

-- Judge reviews (override AI scores)
CREATE TABLE judge_reviews (
  id UUID PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id),
  judge_id UUID,
  final_score INTEGER,
  delta_pct DECIMAL, -- % change from AI score
  notes_md TEXT,
  locked_bool BOOLEAN,
  created_at TIMESTAMP
);
```

---

## 🎯 LLM Scoring Accuracy & Validation

### **Quality Assurance**

1. **Prompt Engineering**
   - Clear, structured prompts
   - Explicit JSON output format
   - Weighted scoring instructions
   - Examples in prompts

2. **Validation Checks**
   ```typescript
   function validateLLMOutput(output: any): boolean {
     return (
       output.overall_score >= 0 && output.overall_score <= 100 &&
       Object.values(output.dimension_scores).every(
         score => score >= 0 && score <= 100
       ) &&
       output.rationale.length > 50 &&
       output.strengths.length >= 2 &&
       output.improvements.length >= 2
     );
   }
   ```

3. **Judge Feedback Loop**
   - Track when judges override AI scores
   - Calculate accuracy: % of AI scores accepted
   - Identify systematic biases
   - Refine prompts based on feedback

### **Accuracy Metrics**

```typescript
async function calculateLLMAccuracy() {
  const reviews = await getJudgeReviews();
  
  const stats = {
    total: reviews.length,
    accepted: reviews.filter(r => Math.abs(r.delta_pct) < 5).length,
    minor_adjustments: reviews.filter(r => r.delta_pct >= -10 && r.delta_pct <= 10).length,
    major_changes: reviews.filter(r => Math.abs(r.delta_pct) > 10).length,
  };
  
  return {
    acceptance_rate: (stats.accepted / stats.total * 100).toFixed(1) + '%',
    minor_adjustment_rate: (stats.minor_adjustments / stats.total * 100).toFixed(1) + '%',
    major_change_rate: (stats.major_changes / stats.total * 100).toFixed(1) + '%',
  };
}
```

**Target Metrics**:
- 90%+ acceptance rate
- <5% major changes
- Average delta <5 points

---

## 🚀 Performance Optimization

### **Caching Strategy**

```typescript
// Cache similar submissions
const cacheKey = hashSubmission(submission);
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const scores = await scoreSubmission(challenge, submission);
await redis.setex(cacheKey, 3600, JSON.stringify(scores)); // 1 hour TTL
```

### **Batch Processing**

```typescript
async function scoreBatchSubmission(submissions: Submission[]) {
  const prompts = submissions.map(s => buildPrompt(s));
  const results = await Promise.all(
    prompts.map(p => model.generateContent(p))
  );
  return results.map(r => JSON.parse(r.response.text()));
}
```

### **Rate Limiting**

- Gemini API: 60 requests/minute (free tier)
- Queue submission scoring
- Implement exponential backoff

---

## 🔒 Error Handling & Fallbacks

```typescript
async function scoreSubmissionSafe(submission: Submission) {
  try {
    return await scoreSubmission(submission);
  } catch (error) {
    // Log error
    console.error('LLM scoring failed:', error);
    
    // Fallback to manual review
    await updateStatus(submission.id, 'REQUIRES_MANUAL_REVIEW');
    await notifyAdmins({
      submission_id: submission.id,
      error: error.message,
    });
    
    // Return placeholder
    return {
      overall_score: 0,
      dimension_scores: {},
      rationale: 'Scoring failed - manual review required',
    };
  }
}
```

---

## 📊 LLM Integration Status

- ✅ Gemini AI API integrated
- ✅ Screening phase implemented
- ✅ Multi-dimensional scoring active
- ✅ Judge override system working
- ✅ Database schema optimized
- ✅ Error handling implemented
- ✅ Performance optimization in place

---

## 🧪 Testing LLM Integration

### **Test Submission Scoring**

```typescript
const testSubmission = {
  repo_url: 'https://github.com/user/repo',
  writeup_md: 'A full-stack web application...',
  demo_url: 'https://demo.example.com'
};

const scores = await scoreSubmission(testChallenge, testSubmission);
console.log('LLM Scores:', scores);
```

### **Validate Output**

```typescript
assert(scores.overall_score >= 0 && scores.overall_score <= 100);
assert(Object.keys(scores.dimension_scores).length === 5);
assert(scores.rationale.length > 50);
```

---

**Current Status**: ✅ Fully Integrated and Production-Ready
