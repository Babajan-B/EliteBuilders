/**
 * POST /api/sponsors/orgs/[orgId]/members - Add a member to sponsor organization
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { parseAndValidate, OrgAddMemberSchema } from '@/lib/validate';
import { errorResponse, successResponse, ErrorCode } from '@/lib/errors';
import { requireAuth, requireSponsorRole } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * POST /api/sponsors/orgs/[orgId]/members
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;

    // Check authentication
    const user = await requireAuth(request);

    // Validate request body
    const validation = await parseAndValidate(request, OrgAddMemberSchema);
    if (!validation.success) {
      return Response.json(validation.error, { status: 400 });
    }

    const { profile_id, role } = validation.data;
    const db = supabaseAdmin();

    // Verify user is owner/manager of the organization
    await requireSponsorRole(orgId, user.id, 'owner', 'manager');

    // Check if the profile exists
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('id')
      .eq('id', profile_id)
      .single();

    if (profileError || !profile) {
      return errorResponse(ErrorCode.NOT_FOUND, 'Profile not found');
    }

    // Add member
    const { data: newMember, error: addError } = await db
      .from('sponsor_members')
      .insert({
        org_id: orgId,
        profile_id,
        role,
      })
      .select()
      .single();

    if (addError) {
      if (addError.code === '23505') {
        // Unique constraint violation
        return errorResponse(ErrorCode.CONFLICT, 'Member already exists in organization');
      }
      console.error('Error adding member:', addError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to add member');
    }

    return successResponse(newMember, 201);
  } catch (err) {
    console.error('Unexpected error in POST /api/sponsors/orgs/[orgId]/members:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

    if (errorMessage.includes('Authentication required')) {
      return errorResponse(ErrorCode.UNAUTHORIZED, errorMessage);
    }
    if (errorMessage.includes('Access denied')) {
      return errorResponse(ErrorCode.FORBIDDEN, errorMessage);
    }

    return errorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
  }
}
