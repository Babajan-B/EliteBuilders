/**
 * Test: POST /api/score endpoint
 * Tests the scoring endpoint with mocked dependencies
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
      rubric_json: { demo: 15, functionality: 20 },
    },
  ],
  submissions: [
    {
      id: SUBMISSION_ID,
      user_id: USER_ID,
      challenge_id: CHALLENGE_ID,
      status: 'QUEUED',
      repo_url: 'https://github.com/test/repo',
      deck_url: 'https://deck.test',
      demo_url: 'https://demo.test',
      writeup_md: 'A'.repeat(600),
      challenges: {
        rubric_json: { demo: 15, functionality: 20 },
      },
    },
  ],
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
    // Reset autoscores and llmscores
    mockDb.autoscores = [];
    mockDb.llmscores = [];
  });

  it('should return JSON envelope with ok: true on success', async () => {
    const requestBody = {
      submissionId: SUBMISSION_ID,
    };

    const request = new Request('http://localhost:3000/api/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    // Check response envelope
    expect(json).toHaveProperty('ok');
    expect(json.ok).toBe(true);
    expect(json).toHaveProperty('data');

    // Check data structure
    expect(json.data).toHaveProperty('submissionId');
    expect(json.data).toHaveProperty('status');
  });

  it('should return validation error for invalid submissionId', async () => {
    const requestBody = {
      submissionId: 'not-a-uuid',
    };

    const request = new Request('http://localhost:3000/api/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    // Check error envelope
    expect(json).toHaveProperty('ok');
    expect(json.ok).toBe(false);
    expect(json).toHaveProperty('error');
    expect(json.error).toHaveProperty('code');
    expect(json.error).toHaveProperty('message');
  });

  it('should return error envelope for missing submissionId', async () => {
    const requestBody = {};

    const request = new Request('http://localhost:3000/api/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    // Check error envelope
    expect(json).toHaveProperty('ok');
    expect(json.ok).toBe(false);
    expect(json).toHaveProperty('error');
  });
});
