/**
 * GET /api/challenges/[id] - Get challenge by ID
 * PATCH /api/challenges/[id] - Update challenge (sponsor owner/manager)
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { parseAndValidate, PatchChallengeSchema } from '@/lib/validate';
import { errorResponse, successResponse, ErrorCode } from '@/lib/errors';
import { requireAuth, requireSponsorRole } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * GET /api/challenges/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = supabaseAdmin();

    const { data, error } = await db
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return errorResponse(ErrorCode.NOT_FOUND, 'Challenge not found');
    }

    return successResponse(data);
  } catch (err) {
    console.error('Unexpected error in GET /api/challenges/[id]:', err);
    return errorResponse(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred');
  }
}

/**
 * PATCH /api/challenges/[id]
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const user = await requireAuth(request);

    // Validate request body
    const validation = await parseAndValidate(request, PatchChallengeSchema);
    if (!validation.success) {
      return Response.json(validation.error, { status: 400 });
    }

    const updates = validation.data;
    const db = supabaseAdmin();

    // Get challenge to verify ownership
    const { data: challenge, error: fetchError } = await db
      .from('challenges')
      .select('sponsor_org_id')
      .eq('id', id)
      .single();

    if (fetchError || !challenge) {
      return errorResponse(ErrorCode.NOT_FOUND, 'Challenge not found');
    }

    // Verify user is owner/manager of the sponsor org
    await requireSponsorRole(challenge.sponsor_org_id, user.id, 'owner', 'manager');

    // Update challenge
    const { data: updated, error: updateError } = await db
      .from('challenges')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating challenge:', updateError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to update challenge');
    }

    return successResponse(updated);
  } catch (err) {
    console.error('Unexpected error in PATCH /api/challenges/[id]:', err);
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
