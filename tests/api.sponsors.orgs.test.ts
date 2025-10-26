/**
 * Test: GET /api/sponsors/orgs/[orgId] endpoint
 * Tests auth-aware organization access
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeSupabaseMock } from './utils/supabase-mock';
import { USER_ID, ORG_ID } from './utils/TEST_IDS';

// Set up environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';

// Mock database
const mockDb: any = {
  profiles: [
    { id: USER_ID, display_name: 'Alice', avatar_url: 'https://example.com/alice.jpg' },
    { id: '33333333-3333-3333-3333-333333333334', display_name: 'Bob', avatar_url: null },
  ],
  challenges: [],
  submissions: [],
  autoscores: [],
  llmscores: [],
  judge_reviews: [],
  challenge_judges: [],
  sponsor_orgs: [
    {
      id: ORG_ID,
      org_name: 'Test Corp',
      website: 'https://testcorp.com',
      logo_url: 'https://testcorp.com/logo.png',
      verified: true,
      owner_profile_id: USER_ID,
    },
  ],
  sponsor_members: [
    { org_id: ORG_ID, profile_id: USER_ID, role: 'owner' },
    { org_id: ORG_ID, profile_id: '33333333-3333-3333-3333-333333333334', role: 'manager' },
  ],
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => makeSupabaseMock(mockDb),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    toString: () => '',
  })),
}));

// Mock auth to simulate different users
let mockUser: { id: string; email: string; role: string } | null = {
  id: USER_ID,
  email: 'alice@example.com',
  role: 'builder',
};

vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(async () => mockUser),
  getSponsorOrgRole: vi.fn(async (orgId: string, userId: string) => {
    const member = mockDb.sponsor_members.find(
      (m: any) => m.org_id === orgId && m.profile_id === userId
    );
    return member ? member.role : null;
  }),
}));

// Import after mocks are set up
import { GET } from '../app/api/sponsors/orgs/[orgId]/route';

describe('GET /api/sponsors/orgs/[orgId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default user (member)
    mockUser = {
      id: USER_ID,
      email: 'alice@example.com',
      role: 'builder',
    };
  });

  it('should return organization details for org member', async () => {
    const request = new Request(`http://localhost:3000/api/sponsors/orgs/${ORG_ID}`, {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ orgId: ORG_ID }) });
    const json = await response.json();

    expect(json.ok).toBe(true);
    expect(json.data).toHaveProperty('id', ORG_ID);
    expect(json.data).toHaveProperty('org_name', 'Test Corp');
    expect(json.data).toHaveProperty('website');
    expect(json.data).toHaveProperty('verified', true);
    expect(json.data).toHaveProperty('members');
    expect(Array.isArray(json.data.members)).toBe(true);
  });

  it('should include member details with display_name', async () => {
    const request = new Request(`http://localhost:3000/api/sponsors/orgs/${ORG_ID}`, {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ orgId: ORG_ID }) });
    const json = await response.json();

    expect(json.ok).toBe(true);
    expect(json.data.members).toBeDefined();
    expect(Array.isArray(json.data.members)).toBe(true);
    expect(json.data.members.length).toBe(2);

    const ownerMember = json.data.members.find((m: any) => m.role === 'owner');
    expect(ownerMember).toBeDefined();
    expect(ownerMember.profile_id).toBe(USER_ID);
    expect(ownerMember.display_name).toBe('Alice');
    expect(ownerMember.role).toBe('owner');

    const managerMember = json.data.members.find((m: any) => m.role === 'manager');
    expect(managerMember).toBeDefined();
    expect(managerMember.display_name).toBe('Bob');
    expect(managerMember.role).toBe('manager');
  });

  it('should return 404 for non-member', async () => {
    // Set user to someone not in the org
    mockUser = {
      id: '99999999-9999-9999-9999-999999999999',
      email: 'outsider@example.com',
      role: 'builder',
    };

    const request = new Request(`http://localhost:3000/api/sponsors/orgs/${ORG_ID}`, {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ orgId: ORG_ID }) });
    const json = await response.json();

    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('should allow admin to access any org', async () => {
    // Set user to admin
    mockUser = {
      id: '99999999-9999-9999-9999-999999999999',
      email: 'admin@example.com',
      role: 'admin',
    };

    const request = new Request(`http://localhost:3000/api/sponsors/orgs/${ORG_ID}`, {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ orgId: ORG_ID }) });
    const json = await response.json();

    expect(json.ok).toBe(true);
    expect(json.data).toHaveProperty('id', ORG_ID);
  });

  it('should return 404 for non-existent org', async () => {
    const fakeOrgId = '99999999-9999-9999-9999-999999999999';

    const request = new Request(`http://localhost:3000/api/sponsors/orgs/${fakeOrgId}`, {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ orgId: fakeOrgId }) });
    const json = await response.json();

    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
  });

  it('should return JSON envelope with ok field', async () => {
    const request = new Request(`http://localhost:3000/api/sponsors/orgs/${ORG_ID}`, {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ orgId: ORG_ID }) });
    const json = await response.json();

    expect(json).toHaveProperty('ok');
    if (json.ok) {
      expect(json).toHaveProperty('data');
    } else {
      expect(json).toHaveProperty('error');
    }
  });
});
