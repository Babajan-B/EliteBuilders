/**
 * GET /api/profile - Get current user's profile
 * PATCH /api/profile - Update current user's profile
 */

import { supabaseAdmin, requireAuth } from '@/lib/supabase-server';
import { parseAndValidate, UpdateProfileSchema } from '@/lib/validate';
import { successResponse, errorResponse, ErrorCode } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * GET /api/profile
 * Get the authenticated user's profile information
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const db = supabaseAdmin();

    // Fetch profile from database
    const { data: profile, error } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return errorResponse(ErrorCode.NOT_FOUND, 'Profile not found');
    }

    return successResponse(profile);
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return errorResponse(ErrorCode.UNAUTHORIZED, 'Authentication required');
    }
    console.error('Unexpected error in GET /api/profile:', err);
    return errorResponse(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred');
  }
}

/**
 * PATCH /api/profile
 * Update the authenticated user's profile
 */
export async function PATCH(request: Request) {
  try {
    const user = await requireAuth();

    // Validate request body
    const validation = await parseAndValidate(request, UpdateProfileSchema);
    if (!validation.success) {
      return Response.json(validation.error, { status: 400 });
    }

    const updates = validation.data;
    const db = supabaseAdmin();

    // Update profile in database
    const { data: profile, error } = await db
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to update profile');
    }

    return successResponse(profile);
  } catch (err) {
    if ((err as Error).message === 'Unauthorized') {
      return errorResponse(ErrorCode.UNAUTHORIZED, 'Authentication required');
    }
    console.error('Unexpected error in PATCH /api/profile:', err);
    return errorResponse(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred');
  }
}
