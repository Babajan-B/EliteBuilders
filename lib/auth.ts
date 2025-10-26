/**
 * Authentication and authorization utilities
 */

import { supabaseAdmin } from './supabase-server';

export interface User {
  id: string;
  email?: string;
  role?: string;
}

/**
 * Get current user from request (stub/mock for now)
 * In production, this would extract from session/JWT
 */
export async function getUser(request?: Request): Promise<User | null> {
  // TODO: Replace with actual session/JWT extraction
  // For now, return a mock user for development
  // In production, use Supabase auth or JWT verification

  // Mock user - for integration testing, use seeded profile ID
  // This user (Bob Builder) is a member of the seeded org
  return {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'bob@example.com',
    role: 'builder',
  };
}

/**
 * Require authentication and return user
 * Throws error if not authenticated
 */
export async function requireAuth(request?: Request): Promise<User> {
  const user = await getUser(request);

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Require specific role(s)
 * Throws error if user doesn't have required role
 */
export async function requireRole(
  request: Request | undefined,
  ...roles: string[]
): Promise<User> {
  const user = await requireAuth(request);

  if (!user.role || !roles.includes(user.role)) {
    throw new Error(`Access denied. Required roles: ${roles.join(', ')}`);
  }

  return user;
}

/**
 * Check if user is an assigned judge for a challenge
 */
export async function isAssignedJudge(
  challengeId: string,
  judgeId: string
): Promise<boolean> {
  try {
    const db = supabaseAdmin();

    const { data, error } = await db
      .from('challenge_judges')
      .select('judge_id')
      .eq('challenge_id', challengeId)
      .eq('judge_id', judgeId)
      .single();

    if (error || !data) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Verify user has access to sponsor organization
 * Returns the user's role in the org (owner, manager, member) or null
 */
export async function getSponsorOrgRole(
  orgId: string,
  userId: string
): Promise<string | null> {
  try {
    const db = supabaseAdmin();

    const { data, error } = await db
      .from('sponsor_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('profile_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.role;
  } catch {
    return null;
  }
}

/**
 * Require sponsor org access with specific role(s)
 */
export async function requireSponsorRole(
  orgId: string,
  userId: string,
  ...roles: string[]
): Promise<string> {
  const userRole = await getSponsorOrgRole(orgId, userId);

  if (!userRole || !roles.includes(userRole)) {
    throw new Error(`Access denied. Required org roles: ${roles.join(', ')}`);
  }

  return userRole;
}
