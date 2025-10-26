/**
 * Test: GET /api/leaderboard endpoint
 * Tests leaderboard sorting and response envelope
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeSupabaseMock } from './utils/supabase-mock';
import { CHALLENGE_ID, SUBMISSION_ID, USER_ID } from './utils/TEST_IDS';

// Set up environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

// Mock database
const mockDb: any = {
  profiles: [
    { id: USER_ID, display_name: 'Alice' },
    { id: '33333333-3333-3333-3333-333333333334', display_name: 'Bob' },
    { id: '33333333-3333-3333-3333-333333333335', display_name: 'Charlie' },
  ],
  challenges: [],
  submissions: [
    {
      id: SUBMISSION_ID,
      user_id: USER_ID,
      challenge_id: CHALLENGE_ID,
      status: 'FINAL',
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222223',
      user_id: '33333333-3333-3333-3333-333333333334',
      challenge_id: CHALLENGE_ID,
      status: 'PROVISIONAL',
      created_at: '2025-01-02T00:00:00Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222224',
      user_id: '33333333-3333-3333-3333-333333333335',
      challenge_id: CHALLENGE_ID,
      status: 'FINAL',
      created_at: '2025-01-03T00:00:00Z',
    },
  ],
  autoscores: [
    { submission_id: SUBMISSION_ID, score_auto: 18 },
    { submission_id: '22222222-2222-2222-2222-222222222223', score_auto: 20 },
    { submission_id: '22222222-2222-2222-2222-222222222224', score_auto: 15 },
  ],
  llmscores: [
    { submission_id: SUBMISSION_ID, score_llm: 55 },
    { submission_id: '22222222-2222-2222-2222-222222222223', score_llm: 60 },
    { submission_id: '22222222-2222-2222-2222-222222222224', score_llm: 50 },
  ],
  judge_reviews: [
    { submission_id: SUBMISSION_ID, final_score: 75, locked_bool: true },
    { submission_id: '22222222-2222-2222-2222-222222222224', final_score: 65, locked_bool: true },
  ],
  challenge_judges: [],
  sponsor_orgs: [],
  sponsor_members: [],
  // Don't include leaderboard view - forces fallback to manual computation
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
import { GET } from '../app/api/leaderboard/route';

describe('GET /api/leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return JSON envelope with ok: true', async () => {
    const url = new URL(`http://localhost:3000/api/leaderboard?challenge_id=${CHALLENGE_ID}`);
    const request = new Request(url, { method: 'GET' });

    const response = await GET(request);
    const json = await response.json();

    expect(json).toHaveProperty('ok');
    expect(json.ok).toBe(true);
    expect(json).toHaveProperty('data');
    expect(Array.isArray(json.data)).toBe(true);
  });

  it('should sort submissions by score descending', async () => {
    const url = new URL(`http://localhost:3000/api/leaderboard?challenge_id=${CHALLENGE_ID}`);
    const request = new Request(url, { method: 'GET' });

    const response = await GET(request);
    const json = await response.json();

    const leaderboard = json.data;

    expect(leaderboard.length).toBeGreaterThan(0);

    for (let i = 0; i < leaderboard.length - 1; i++) {
      expect(leaderboard[i].score_display).toBeGreaterThanOrEqual(leaderboard[i + 1].score_display);
    }
  });

  it('should include rank field starting from 1', async () => {
    const url = new URL(`http://localhost:3000/api/leaderboard?challenge_id=${CHALLENGE_ID}`);
    const request = new Request(url, { method: 'GET' });

    const response = await GET(request);
    const json = await response.json();

    const leaderboard = json.data;

    expect(leaderboard[0].rank).toBe(1);

    leaderboard.forEach((entry: any, index: number) => {
      expect(entry.rank).toBe(index + 1);
    });
  });

  it('should calculate provisional scores correctly', async () => {
    const url = new URL(`http://localhost:3000/api/leaderboard?challenge_id=${CHALLENGE_ID}`);
    const request = new Request(url, { method: 'GET' });

    const response = await GET(request);
    const json = await response.json();

    const leaderboard = json.data;

    const bobEntry = leaderboard.find((e: any) => e.display_name === 'Bob');

    expect(bobEntry).toBeDefined();
    expect(bobEntry.score_auto).toBe(20);
    expect(bobEntry.score_llm).toBe(60);

    // Provisional = 0.2 * auto + 0.6 * llm = 0.2 * 20 + 0.6 * 60 = 4 + 36 = 40
    expect(bobEntry.score_display).toBe(40);
  });

  it('should use final scores when locked', async () => {
    const url = new URL(`http://localhost:3000/api/leaderboard?challenge_id=${CHALLENGE_ID}`);
    const request = new Request(url, { method: 'GET' });

    const response = await GET(request);
    const json = await response.json();

    const leaderboard = json.data;

    const aliceEntry = leaderboard.find((e: any) => e.display_name === 'Alice');

    expect(aliceEntry).toBeDefined();
    expect(aliceEntry.score_display).toBe(75);
  });

  it('should return validation error for missing challenge_id', async () => {
    const url = new URL('http://localhost:3000/api/leaderboard');
    const request = new Request(url, { method: 'GET' });

    const response = await GET(request);
    const json = await response.json();

    expect(json).toHaveProperty('ok');
    expect(json.ok).toBe(false);
    expect(json).toHaveProperty('error');
    expect(json.error).toHaveProperty('code');
  });
});
