/**
 * POST /api/sponsors/orgs - Create a new sponsor organization
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { parseAndValidate, OrgCreateSchema } from '@/lib/validate';
import { errorResponse, successResponse, ErrorCode } from '@/lib/errors';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * POST /api/sponsors/orgs
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await requireAuth(request);

    // Validate request body
    const validation = await parseAndValidate(request, OrgCreateSchema);
    if (!validation.success) {
      return Response.json(validation.error, { status: 400 });
    }

    const { org_name, verified } = validation.data;
    const db = supabaseAdmin();

    // Create organization
    const { data: org, error: orgError } = await db
      .from('sponsor_orgs')
      .insert({
        org_name,
        owner_profile_id: user.id,
        verified,
      })
      .select()
      .single();

    if (orgError) {
      console.error('Error creating sponsor organization:', orgError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to create organization');
    }

    // Add creator as owner in sponsor_members
    const { error: memberError } = await db.from('sponsor_members').insert({
      org_id: org.id,
      profile_id: user.id,
      role: 'owner',
    });

    if (memberError) {
      console.error('Error adding owner as member:', memberError);
      // Try to rollback org creation (best effort)
      await db.from('sponsor_orgs').delete().eq('id', org.id);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to set up organization membership');
    }

    return successResponse(org, 201);
  } catch (err) {
    console.error('Unexpected error in POST /api/sponsors/orgs:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

    if (errorMessage.includes('Authentication required')) {
      return errorResponse(ErrorCode.UNAUTHORIZED, errorMessage);
    }

    return errorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
  }
}
