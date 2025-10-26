/**
 * Test: Submissions API
 * Tests POST create with fire-and-forget score trigger
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { makeSupabaseMock } from './utils/supabase-mock';
import { SUBMISSION_ID, CHALLENGE_ID, USER_ID } from './utils/TEST_IDS';

// Set up environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

// Mock database
const mockDb: any = {
  profiles: [],
  challenges: [],
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

// Mock auth
let mockAuthUser = { id: USER_ID, email: 'builder@test.com', role: 'builder' };

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(async () => mockAuthUser),
}));

// Mock global fetch
const mockFetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ ok: true }),
  })
) as any;

// Import after mocks are set up
import { POST } from '../app/api/submissions/route';

describe('POST /api/submissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset auth
    mockAuthUser = { id: USER_ID, email: 'builder@test.com', role: 'builder' };
    // Reset database
    mockDb.submissions = [];
    // Set up global fetch mock
    global.fetch = mockFetch;
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create submission with SCORING status', async () => {
    // Active challenge with future deadline
    mockDb.challenges = [
      {
        id: CHALLENGE_ID,
        is_active: true,
        deadline_utc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const requestBody = {
      challenge_id: CHALLENGE_ID,
      repo_url: 'https://github.com/test/repo',
      deck_url: 'https://deck.test',
      demo_url: 'https://demo.test',
      writeup_md: '# My amazing submission\n\nThis is a detailed writeup...',
    };

    const request = new Request('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.ok).toBe(true);
    expect(json.data).toHaveProperty('id');
    expect(json.data.status).toBe('SCORING');
    expect(json.data.user_id).toBe(USER_ID);
    expect(json.data.challenge_id).toBe(CHALLENGE_ID);

    // Check submission was added to database
    expect(mockDb.submissions.length).toBe(1);
    expect(mockDb.submissions[0].status).toBe('SCORING');
  });

  it('should trigger fire-and-forget score endpoint', async () => {
    mockDb.challenges = [
      {
        id: CHALLENGE_ID,
        is_active: true,
        deadline_utc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const requestBody = {
      challenge_id: CHALLENGE_ID,
      repo_url: 'https://github.com/test/repo',
      deck_url: 'https://deck.test',
      demo_url: 'https://demo.test',
      writeup_md: '# Submission',
    };

    const request = new Request('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.ok).toBe(true);

    // Verify fetch was called to trigger scoring
    expect(mockFetch).toHaveBeenCalled();
    const fetchCall = mockFetch.mock.calls[0];
    expect(fetchCall[0]).toContain('/api/score');
  });

  it('should reject submission for non-existent challenge', async () => {
    mockDb.challenges = []; // No challenges

    const requestBody = {
      challenge_id: CHALLENGE_ID,
      repo_url: 'https://github.com/test/repo',
      writeup_md: '# Submission',
    };

    const request = new Request('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
    expect(json.error.message).toContain('Challenge not found');
  });

  it('should reject submission for inactive challenge', async () => {
    mockDb.challenges = [
      {
        id: CHALLENGE_ID,
        is_active: false,
        deadline_utc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const requestBody = {
      challenge_id: CHALLENGE_ID,
      repo_url: 'https://github.com/test/repo',
      writeup_md: '# Submission',
    };

    const request = new Request('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('BAD_REQUEST');
    expect(json.error.message).toContain('not active');
  });

  it('should reject submission after deadline', async () => {
    mockDb.challenges = [
      {
        id: CHALLENGE_ID,
        is_active: true,
        deadline_utc: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Past deadline
      },
    ];

    const requestBody = {
      challenge_id: CHALLENGE_ID,
      repo_url: 'https://github.com/test/repo',
      writeup_md: '# Submission',
    };

    const request = new Request('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('BAD_REQUEST');
    expect(json.error.message).toContain('deadline');
  });

  it('should return validation error for missing required fields', async () => {
    const requestBody = {
      challenge_id: CHALLENGE_ID,
      // Missing repo_url
    };

    const request = new Request('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('BAD_REQUEST');
  });

  it('should return validation error for invalid URLs', async () => {
    mockDb.challenges = [
      {
        id: CHALLENGE_ID,
        is_active: true,
        deadline_utc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const requestBody = {
      challenge_id: CHALLENGE_ID,
      repo_url: 'not-a-url',
      writeup_md: '# Submission',
    };

    const request = new Request('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should not fail submission creation if scoring trigger fails', async () => {
    mockDb.challenges = [
      {
        id: CHALLENGE_ID,
        is_active: true,
        deadline_utc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Mock fetch to fail
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    const requestBody = {
      challenge_id: CHALLENGE_ID,
      repo_url: 'https://github.com/test/repo',
      deck_url: 'https://deck.test',
      demo_url: 'https://demo.test',
      writeup_md: '# Submission',
    };

    const request = new Request('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    // Submission should still succeed even if scoring trigger fails
    expect(json.ok).toBe(true);
    expect(json.data).toHaveProperty('id');
    expect(response.status).toBe(201);
  });

  it('should include user_id from auth in submission', async () => {
    mockDb.challenges = [
      {
        id: CHALLENGE_ID,
        is_active: true,
        deadline_utc: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const requestBody = {
      challenge_id: CHALLENGE_ID,
      repo_url: 'https://github.com/test/repo',
      writeup_md: '# Submission',
    };

    const request = new Request('http://localhost:3000/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.ok).toBe(true);
    expect(json.data.user_id).toBe(USER_ID);
    expect(mockDb.submissions[0].user_id).toBe(USER_ID);
  });
});
