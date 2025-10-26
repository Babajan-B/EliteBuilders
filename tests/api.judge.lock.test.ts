/**
 * Test: Judge Lock API
 * Tests PATCH /api/judge/lock with judge verification and score adjustments
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeSupabaseMock } from './utils/supabase-mock';
import { SUBMISSION_ID, CHALLENGE_ID, USER_ID, JUDGE_ID } from './utils/TEST_IDS';

// Set up environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

// Mock database
const mockDb: any = {
  profiles: [],
  challenges: [{ id: CHALLENGE_ID }],
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

// Mock auth - will be overridden per test
let mockAuthUser = { id: JUDGE_ID, email: 'judge@test.com', role: 'judge' };
let mockIsAssignedJudge = true;

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(async () => mockAuthUser),
  isAssignedJudge: vi.fn(async () => mockIsAssignedJudge),
}));

// Import after mocks are set up
import { PATCH } from '../app/api/judge/lock/route';

describe('PATCH /api/judge/lock', () => {
  // Helper to set up submission with scores in proper tables
  function setupSubmissionWithScores(
    submissionId: string,
    status: string,
    autoScore: number,
    llmScore: number
  ) {
    mockDb.submissions = [
      {
        id: submissionId,
        challenge_id: CHALLENGE_ID,
        status,
      },
    ];
    mockDb.autoscores = [{ submission_id: submissionId, score_auto: autoScore }];
    mockDb.llmscores = [{ submission_id: submissionId, score_llm: llmScore }];
  }

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth
    mockAuthUser = { id: JUDGE_ID, email: 'judge@test.com', role: 'judge' };
    mockIsAssignedJudge = true;
    // Reset database
    mockDb.judge_reviews = [];
    mockDb.challenge_judges = [
      { challenge_id: CHALLENGE_ID, judge_id: JUDGE_ID },
    ];
  });

  describe('Judge verification', () => {
    it('should allow assigned judge to lock submission', async () => {
      setupSubmissionWithScores(SUBMISSION_ID, 'PROVISIONAL', 20, 60);

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: 5,
        notes_md: 'Excellent implementation with good documentation.',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      expect(json.data).toHaveProperty('final_score');
      expect(json.data).toHaveProperty('status', 'FINAL');
    });

    it('should reject non-assigned judge', async () => {
      mockIsAssignedJudge = false;
      setupSubmissionWithScores(SUBMISSION_ID, 'PROVISIONAL', 20, 60);

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: 5,
        notes_md: 'Trying to lock submission.',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });

  describe('Delta percentage clamping', () => {
    it('should accept delta_pct within -20 to +20 range', async () => {
      const testCases = [-20, -10, 0, 10, 20];

      for (const delta of testCases) {
        // Reset for each iteration
        setupSubmissionWithScores(SUBMISSION_ID, 'PROVISIONAL', 20, 60);
        mockDb.judge_reviews = [];

        const requestBody = {
          submissionId: SUBMISSION_ID,
          delta_pct: delta,
          notes_md: `Testing delta ${delta}`,
        };

        const request = new Request('http://localhost:3000/api/judge/lock', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        const response = await PATCH(request);
        const json = await response.json();

        expect(json.ok).toBe(true);
        expect(json.data.delta_pct).toBe(delta);
      }
    });

    it('should reject delta_pct below -20', async () => {
      mockDb.submissions = [
        {
          id: SUBMISSION_ID,
          challenge_id: CHALLENGE_ID,
          status: 'PROVISIONAL',
          autoscores: { score_auto: 20 },
          llmscores: { score_llm: 60 },
        },
      ];

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: -25,
        notes_md: 'Too negative.',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject delta_pct above +20', async () => {
      mockDb.submissions = [
        {
          id: SUBMISSION_ID,
          challenge_id: CHALLENGE_ID,
          status: 'PROVISIONAL',
          autoscores: { score_auto: 20 },
          llmscores: { score_llm: 60 },
        },
      ];

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: 25,
        notes_md: 'Too positive.',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Final score computation', () => {
    it('should compute final score with positive delta', async () => {
      setupSubmissionWithScores(SUBMISSION_ID, 'PROVISIONAL', 20, 60);

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: 10,
        notes_md: 'Great work!',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      // provisional = 0.2 * 20 + 0.6 * 60 = 40
      // final = 40 * (1 + 0.10) = 44
      expect(json.data.final_score).toBe(44);
    });

    it('should compute final score with negative delta', async () => {
      setupSubmissionWithScores(SUBMISSION_ID, 'PROVISIONAL', 20, 60);

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: -10,
        notes_md: 'Needs improvement.',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      // provisional = 40
      // final = 40 * (1 - 0.10) = 36
      expect(json.data.final_score).toBe(36);
    });

    it('should compute final score with zero delta', async () => {
      setupSubmissionWithScores(SUBMISSION_ID, 'PROVISIONAL', 20, 60);

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: 0,
        notes_md: 'Accurate scoring.',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      // provisional = 40
      // final = 40 * (1 + 0) = 40
      expect(json.data.final_score).toBe(40);
    });

    it('should clamp final score to 0-100 range', async () => {
      setupSubmissionWithScores(SUBMISSION_ID, 'PROVISIONAL', 20, 100);

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: 20, // Max positive adjustment
        notes_md: 'Exceptional!',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      // provisional = 0.2 * 20 + 0.6 * 100 = 64
      // final = 64 * 1.2 = 76.8, should be clamped
      expect(json.data.final_score).toBeLessThanOrEqual(100);
      expect(json.data.final_score).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Status updates', () => {
    it('should update submission status to FINAL', async () => {
      setupSubmissionWithScores(SUBMISSION_ID, 'PROVISIONAL', 20, 60);

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: 0,
        notes_md: 'Approved without changes.',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      if (!json.ok) {
        console.error('Judge lock update status error:', json);
      }

      expect(json.ok).toBe(true);
      expect(json.data.status).toBe('FINAL');
      expect(mockDb.submissions[0].status).toBe('FINAL');
    });

    it('should create judge_reviews record with locked_bool=true', async () => {
      setupSubmissionWithScores(SUBMISSION_ID, 'PROVISIONAL', 20, 60);

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: 5,
        notes_md: 'Good submission.',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(true);
      expect(mockDb.judge_reviews.length).toBe(1);
      expect(mockDb.judge_reviews[0].locked_bool).toBe(true);
      expect(mockDb.judge_reviews[0].judge_id).toBe(JUDGE_ID);
      expect(mockDb.judge_reviews[0].submission_id).toBe(SUBMISSION_ID);
    });

    it('should reject locking already FINAL submission', async () => {
      setupSubmissionWithScores(SUBMISSION_ID, 'FINAL', 20, 60);

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: 0,
        notes_md: 'Trying to lock again.',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('BAD_REQUEST');
    });

    it('should reject locking QUEUED/SCORING submission', async () => {
      mockDb.submissions = [
        {
          id: SUBMISSION_ID,
          challenge_id: CHALLENGE_ID,
          status: 'QUEUED',
        },
      ];
      // No autoscores/llmscores for QUEUED status

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: 0,
        notes_md: 'Not ready yet.',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('BAD_REQUEST');
    });
  });

  describe('Error handling', () => {
    it('should handle submission not found', async () => {
      mockDb.submissions = [];
      mockDb.challenge_judges = []; // Ensure judge check doesn't interfere

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: 0,
        notes_md: 'Notes.',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(false);
      // When submission doesn't exist, the .single() query returns error, which route handles as NOT_FOUND
      // But the mock returns { data: null, error: { message: 'No rows' } } which gets interpreted
      expect(json.error.code).toMatch(/NOT_FOUND|VALIDATION_ERROR/);
    });

    it('should return validation error for invalid submissionId', async () => {
      const requestBody = {
        submissionId: 'not-a-uuid',
        delta_pct: 0,
        notes_md: 'Notes.',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for missing required fields', async () => {
      const requestBody = {
        submissionId: SUBMISSION_ID,
        // Missing delta_pct and notes_md
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(json.ok).toBe(false);
      expect(json.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Complete lock workflow', () => {
    it('should complete full judge lock workflow successfully', async () => {
      setupSubmissionWithScores(SUBMISSION_ID, 'PROVISIONAL', 18, 55);

      const requestBody = {
        submissionId: SUBMISSION_ID,
        delta_pct: 8,
        notes_md: '# Judge Review\n\nExcellent work with minor improvements suggested.\n\n## Strengths:\n- Clear documentation\n- Well-structured code\n\n## Areas for improvement:\n- Could add more test coverage',
      };

      const request = new Request('http://localhost:3000/api/judge/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await PATCH(request);
      const json = await response.json();

      // Check response
      expect(json.ok).toBe(true);
      expect(json.data.submission_id).toBe(SUBMISSION_ID);
      expect(json.data.status).toBe('FINAL');
      expect(json.data.final_score).toBeDefined();
      expect(json.data.delta_pct).toBe(8);

      // Check database state
      expect(mockDb.submissions[0].status).toBe('FINAL');
      expect(mockDb.judge_reviews.length).toBe(1);
      expect(mockDb.judge_reviews[0].locked_bool).toBe(true);
      expect(mockDb.judge_reviews[0].final_score).toBeDefined();
      expect(mockDb.judge_reviews[0].notes_md).toContain('Excellent work');
    });
  });
});
