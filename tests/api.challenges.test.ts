/**
 * Test: Challenges API
 * Tests GET list and POST create functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeSupabaseMock } from './utils/supabase-mock';
import { CHALLENGE_ID, USER_ID, ORG_ID } from './utils/TEST_IDS';

// Set up environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

// Mock database
const mockDb = {
  profiles: [],
  challenges: [
    {
      id: CHALLENGE_ID,
      sponsor_org_id: ORG_ID,
      title: 'AI Challenge 2025',
      brief_md: 'Build an AI app',
      tags: ['ai', 'ml'],
      is_active: true,
      rubric_json: {},
      deadline_utc: '2025-12-31T23:59:59Z',
      created_at: '2025-01-01T00:00:00Z',
    },
    {
      id: '11111111-1111-1111-1111-111111111112',
      sponsor_org_id: ORG_ID,
      title: 'Web3 Challenge',
      brief_md: 'Build a dApp',
      tags: ['blockchain'],
      is_active: true,
      rubric_json: {},
      deadline_utc: '2025-12-31T23:59:59Z',
      created_at: '2025-01-02T00:00:00Z',
    },
  ],
  sponsor_orgs: [],
  sponsor_members: [
    {
      org_id: ORG_ID,
      profile_id: USER_ID,
      role: 'owner',
    },
  ],
  submissions: [],
  autoscores: [],
  llmscores: [],
  judge_reviews: [],
  challenge_judges: [],
  leaderboard: [],
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
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(async () => ({
    id: USER_ID,
    email: 'test@example.com',
    role: 'sponsor',
  })),
  requireSponsorRole: vi.fn(async () => 'owner'),
}));

// Import after mocks are set up
import { GET, POST } from '../app/api/challenges/route';

describe('GET /api/challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return array of challenges', async () => {
    const url = new URL('http://localhost:3000/api/challenges');
    const request = new Request(url, { method: 'GET' });

    const response = await GET(request);
    const json = await response.json();

    expect(json).toHaveProperty('ok');
    expect(json.ok).toBe(true);
    expect(json).toHaveProperty('data');
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });

  it('should filter challenges by search query', async () => {
    const url = new URL('http://localhost:3000/api/challenges?q=AI');
    const request = new Request(url, { method: 'GET' });

    const response = await GET(request);
    const json = await response.json();

    expect(json.ok).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.data[0].title).toContain('AI');
  });

  it('should filter challenges by tag', async () => {
    const url = new URL('http://localhost:3000/api/challenges?tag=ai');
    const request = new Request(url, { method: 'GET' });

    const response = await GET(request);
    const json = await response.json();

    expect(json.ok).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });

  it('should filter by active status', async () => {
    const url = new URL('http://localhost:3000/api/challenges?active=true');
    const request = new Request(url, { method: 'GET' });

    const response = await GET(request);
    const json = await response.json();

    expect(json.ok).toBe(true);
  });
});

describe('POST /api/challenges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create challenge and return id', async () => {
    const requestBody = {
      sponsor_org_id: ORG_ID,
      title: 'New AI Challenge',
      brief_md: '# Build something awesome',
      rubric_json: { demo: 15, functionality: 20 },
      tags: ['ai', 'innovation'],
      deadline_utc: '2025-12-31T23:59:59Z',
      is_active: true,
    };

    const request = new Request('http://localhost:3000/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json).toHaveProperty('ok');
    expect(json.ok).toBe(true);
    expect(json).toHaveProperty('data');
    expect(json.data).toHaveProperty('title', 'New AI Challenge');
    expect(response.status).toBe(201);
  });

  it('should reject invalid challenge data', async () => {
    const requestBody = {
      // Missing required fields
      title: 'Incomplete',
    };

    const request = new Request('http://localhost:3000/api/challenges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(json.ok).toBe(false);
    expect(json).toHaveProperty('error');
    expect(response.status).toBe(400);
  });

  it('should reject invalid datetime format', async () => {
    const requestBody = {
      sponsor_org_id: ORG_ID,
      title: 'Test Challenge',
      brief_md: 'Test',
      rubric_json: {},
      tags: [],
      deadline_utc: 'not-a-date',
    };

    const request = new Request('http://localhost:3000/api/challenges', {
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
