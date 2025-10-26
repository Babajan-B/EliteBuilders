/**
 * GET /api/sponsors/orgs/[orgId] - Get sponsor organization details with members
 * Auth-aware: Only accessible to org members or admins
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { getUser, getSponsorOrgRole } from '@/lib/auth';
import { errorResponse, successResponse, ErrorCode } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * GET /api/sponsors/orgs/[orgId]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    const db = supabaseAdmin();

    // Get current user
    const user = await getUser(request);

    // Check if user has access to this org
    let hasAccess = false;

    if (user) {
      // Check if user is a member of this org
      const role = await getSponsorOrgRole(orgId, user.id);
      hasAccess = role !== null;

      // If user has 'admin' role, they can access any org
      if (!hasAccess && user.role === 'admin') {
        hasAccess = true;
      }
    }

    // If no access, return 404 to mask existence
    if (!hasAccess) {
      return errorResponse(ErrorCode.NOT_FOUND, 'Organization not found');
    }

    // Fetch organization with members and their profile info
    const { data: org, error: orgError } = await db
      .from('sponsor_orgs')
      .select(
        `
        id,
        org_name,
        website,
        logo_url,
        verified,
        owner_profile_id,
        sponsor_members(
          profile_id,
          role
        )
      `
      )
      .eq('id', orgId)
      .single();

    if (orgError || !org) {
      return errorResponse(ErrorCode.NOT_FOUND, 'Organization not found');
    }

    // Fetch profile details for members
    const memberProfileIds = (org.sponsor_members || []).map((m: any) => m.profile_id);
    let profiles: any[] = [];
    
    if (memberProfileIds.length > 0) {
      const { data: profileData } = await db
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', memberProfileIds);
      
      profiles = profileData || [];
    }

    // Create a map of profiles by ID for quick lookup
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // Format members array to include profile data
    const formattedOrg = {
      ...org,
      members: (org.sponsor_members || []).map((member: any) => {
        const profile = profileMap.get(member.profile_id);
        return {
          profile_id: member.profile_id,
          role: member.role,
          display_name: profile?.display_name || 'Unknown',
          avatar_url: profile?.avatar_url || null,
        };
      }),
    };

    // Remove the nested sponsor_members field
    delete (formattedOrg as any).sponsor_members;

    return successResponse(formattedOrg);
  } catch (err) {
    console.error('Unexpected error in GET /api/sponsors/orgs/[orgId]:', err);
    return errorResponse(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred');
  }
}
