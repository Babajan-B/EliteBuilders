/**
 * Test: Score API
 * Tests AutoScore + LLM stub computation and status updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeSupabaseMock } from './utils/supabase-mock';
import { SUBMISSION_ID, CHALLENGE_ID, USER_ID } from './utils/TEST_IDS';

// Set up environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

// Mock database
const mockDb: any = {
  profiles: [],
  challenges: [
    {
      id: CHALLENGE_ID,
      rubric_json: {
        demo: 15,
        functionality: 20,
      },
    },
  ],
  submissions: [],
  autoscores: [],
  llmscores: [],
  judge_reviews: [],
  challenge_judges: [],
  sponsor_orgs: [],
  sponsor_members: [],
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => makeSupabaseMock(mockDb),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    toString: () => '',
  })),
}));

// Import after mocks are set up
import { POST } from '../app/api/score/route';

describe('POST /api/score', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset scores
    mockDb.autoscores = [];
    mockDb.llmscores = [];
  });

  describe('AutoScore computation', () => {
    it('should compute full AutoScore (20) when all fields present', async () => {
      mockDb.submissions = [
        {
          id: SUBMISSION_ID,
          user_id: USER_ID,
          challenge_id: CHALLENGE_ID,
          status: 'SCORING',
          repo_url: 'https://github.com/test/repo',
          deck_url: 'https://deck.test',
          demo_url: 'https://demo.test',
          writeup_md: 'A'.repeat(600), // >= 400 chars
          challenges: {
            rubric_json: { demo: 15, functionality: 20 },
          },
        },
      ];

      const requestBody = { submissionId: SUBMISSION_ID };
      const request = new Request('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      expect(json.data.score_auto).toBe(20);
      expect(json.data.status).toBe('PROVISIONAL');

      // Check autoscore was saved
      expect(mockDb.autoscores.length).toBe(1);
      expect(mockDb.autoscores[0].score_auto).toBe(20);
    });

    it('should compute partial AutoScore when some fields missing', async () => {
      mockDb.submissions = [
        {
          id: SUBMISSION_ID,
          user_id: USER_ID,
          challenge_id: CHALLENGE_ID,
          status: 'SCORING',
          repo_url: 'https://github.com/test/repo',
          deck_url: null,
          demo_url: null,
          writeup_md: 'Short',
          challenges: {
            rubric_json: {},
          },
        },
      ];

      const requestBody = { submissionId: SUBMISSION_ID };
      const request = new Request('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      expect(json.data.score_auto).toBe(5); // Only has repo_url
    });

    it('should require writeup >= 400 chars for writeup check', async () => {
      mockDb.submissions = [
        {
          id: SUBMISSION_ID,
          user_id: USER_ID,
          challenge_id: CHALLENGE_ID,
          status: 'SCORING',
          repo_url: null,
          deck_url: null,
          demo_url: null,
          writeup_md: 'A'.repeat(399), // < 400 chars
          challenges: {
            rubric_json: {},
          },
        },
      ];

      const requestBody = { submissionId: SUBMISSION_ID };
      const request = new Request('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      expect(json.data.score_auto).toBe(0); // No fields pass
    });
  });

  describe('LLM Score computation (stub)', () => {
    it('should compute LLM score based on writeup length', async () => {
      mockDb.submissions = [
        {
          id: SUBMISSION_ID,
          user_id: USER_ID,
          challenge_id: CHALLENGE_ID,
          status: 'SCORING',
          repo_url: 'https://github.com/test/repo',
          writeup_md: 'A'.repeat(1000), // Long writeup
          challenges: {
            rubric_json: {},
          },
        },
      ];

      const requestBody = { submissionId: SUBMISSION_ID };
      const request = new Request('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      expect(json.data.score_llm).toBeGreaterThan(0);
      
      // Check llmscore was saved
      expect(mockDb.llmscores.length).toBe(1);
      expect(mockDb.llmscores[0].model_id).toBe('stub');
    });

    it('should include rubric breakdown in LLM score', async () => {
      mockDb.submissions = [
        {
          id: SUBMISSION_ID,
          user_id: USER_ID,
          challenge_id: CHALLENGE_ID,
          status: 'SCORING',
          repo_url: 'https://github.com/test/repo',
          writeup_md: 'A'.repeat(800),
          challenges: {
            rubric_json: { demo: 15, functionality: 20 },
          },
        },
      ];

      const requestBody = { submissionId: SUBMISSION_ID };
      const request = new Request('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      
      const llmScore = mockDb.llmscores[0];
      expect(llmScore.rubric_scores_json).toBeDefined();
      expect(llmScore.rationale_md).toContain('STUB SCORING');
    });

    it('should handle empty writeup gracefully', async () => {
      mockDb.submissions = [
        {
          id: SUBMISSION_ID,
          user_id: USER_ID,
          challenge_id: CHALLENGE_ID,
          status: 'SCORING',
          repo_url: 'https://github.com/test/repo',
          writeup_md: '',
          challenges: {
            rubric_json: {},
          },
        },
      ];

      const requestBody = { submissionId: SUBMISSION_ID };
      const request = new Request('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      expect(json.data.score_llm).toBe(0);
    });
  });

  describe('Status updates', () => {
    it('should update submission status to PROVISIONAL after scoring', async () => {
      mockDb.submissions = [
        {
          id: SUBMISSION_ID,
          user_id: USER_ID,
          challenge_id: CHALLENGE_ID,
          status: 'SCORING',
          repo_url: 'https://github.com/test/repo',
          writeup_md: 'Test writeup',
          challenges: {
            rubric_json: {},
          },
        },
      ];

      const requestBody = { submissionId: SUBMISSION_ID };
      const request = new Request('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      expect(json.data.status).toBe('PROVISIONAL');
      
      // Check submission status was updated
      expect(mockDb.submissions[0].status).toBe('PROVISIONAL');
    });

    it('should reject scoring for FINAL submissions', async () => {
      mockDb.submissions = [
        {
          id: SUBMISSION_ID,
          user_id: USER_ID,
          challenge_id: CHALLENGE_ID,
          status: 'FINAL',
          repo_url: 'https://github.com/test/repo',
          writeup_md: 'Test',
          challenges: {
            rubric_json: {},
          },
        },
      ];

      const requestBody = { submissionId: SUBMISSION_ID };
      const request = new Request('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('BAD_REQUEST');
    });
  });

  describe('Error handling', () => {
    it('should return NOT_FOUND for non-existent submission', async () => {
      mockDb.submissions = [];

      const requestBody = { submissionId: SUBMISSION_ID };
      const request = new Request('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('NOT_FOUND');
    });

    it('should return VALIDATION_ERROR for invalid UUID', async () => {
      const requestBody = { submissionId: 'not-a-uuid' };
      const request = new Request('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return VALIDATION_ERROR for missing submissionId', async () => {
      const requestBody = {};
      const request = new Request('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Score combination', () => {
    it('should combine AutoScore and LLM score correctly', async () => {
      mockDb.submissions = [
        {
          id: SUBMISSION_ID,
          user_id: USER_ID,
          challenge_id: CHALLENGE_ID,
          status: 'SCORING',
          repo_url: 'https://github.com/test/repo',
          deck_url: 'https://deck.test',
          demo_url: 'https://demo.test',
          writeup_md: 'A'.repeat(500),
          challenges: {
            rubric_json: {},
          },
        },
      ];

      const requestBody = { submissionId: SUBMISSION_ID };
      const request = new Request('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      expect(json.data.score_auto).toBe(20); // All 4 fields present
      expect(json.data.score_llm).toBeGreaterThan(0);
      
      // Both scores should be saved separately
      expect(mockDb.autoscores.length).toBe(1);
      expect(mockDb.llmscores.length).toBe(1);
    });

    it('should handle re-scoring (upsert behavior)', async () => {
      // Pre-populate with existing scores
      mockDb.autoscores = [
        { submission_id: SUBMISSION_ID, score_auto: 10, checks_json: {} },
      ];
      mockDb.llmscores = [
        { submission_id: SUBMISSION_ID, score_llm: 25, model_id: 'old' },
      ];

      mockDb.submissions = [
        {
          id: SUBMISSION_ID,
          user_id: USER_ID,
          challenge_id: CHALLENGE_ID,
          status: 'SCORING',
          repo_url: 'https://github.com/test/repo',
          deck_url: 'https://deck.test',
          demo_url: 'https://demo.test',
          writeup_md: 'A'.repeat(600),
          challenges: {
            rubric_json: {},
          },
        },
      ];

      const requestBody = { submissionId: SUBMISSION_ID };
      const request = new Request('http://localhost:3000/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      
      // Should still have only 1 entry per table (upserted, not inserted)
      expect(mockDb.autoscores.length).toBe(1);
      expect(mockDb.llmscores.length).toBe(1);
      
      // Scores should be updated
      expect(mockDb.autoscores[0].score_auto).toBe(20);
      expect(mockDb.llmscores[0].model_id).toBe('stub');
    });
  });
});
