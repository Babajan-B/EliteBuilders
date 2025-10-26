/**
 * DELETE /api/sponsors/orgs/[orgId]/members/[profileId] - Remove a member from sponsor organization
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { errorResponse, successResponse, ErrorCode } from '@/lib/errors';
import { requireAuth, requireSponsorRole } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * DELETE /api/sponsors/orgs/[orgId]/members/[profileId]
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ orgId: string; profileId: string }> }
) {
  try {
    const { orgId, profileId } = await params;

    // Check authentication
    const user = await requireAuth(request);
    const db = supabaseAdmin();

    // Verify user is owner/manager of the organization
    await requireSponsorRole(orgId, user.id, 'owner', 'manager');

    // Check if trying to remove the organization owner
    const { data: org, error: orgError } = await db
      .from('sponsor_orgs')
      .select('owner_profile_id')
      .eq('id', orgId)
      .single();

    if (orgError || !org) {
      return errorResponse(ErrorCode.NOT_FOUND, 'Organization not found');
    }

    if (org.owner_profile_id === profileId) {
      return errorResponse(ErrorCode.BAD_REQUEST, 'Cannot remove organization owner');
    }

    // Remove member
    const { error: deleteError } = await db
      .from('sponsor_members')
      .delete()
      .eq('org_id', orgId)
      .eq('profile_id', profileId);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to remove member');
    }

    return successResponse({ message: 'Member removed successfully' });
  } catch (err) {
    console.error(
      'Unexpected error in DELETE /api/sponsors/orgs/[orgId]/members/[profileId]:',
      err
    );
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
