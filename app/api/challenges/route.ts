/**
 * GET /api/challenges - List challenges with filters
 * POST /api/challenges - Create a new challenge (sponsor owner/manager)
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { parseSearchParams, parseAndValidate, GetChallengesQuerySchema, CreateChallengeSchema } from '@/lib/validate';
import { errorResponse, successResponse, ErrorCode, ok, fail } from '@/lib/errors';
import { requireAuth, requireSponsorRole } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * GET /api/challenges
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const validation = parseSearchParams(searchParams, GetChallengesQuerySchema);

    if (!validation.success) {
      return Response.json(validation.error, { status: 400 });
    }

    const { q, tag, active } = validation.data;
    const db = supabaseAdmin();

    let query = db
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply search filter
    if (q) {
      query = query.or(`title.ilike.%${q}%,brief_md.ilike.%${q}%`);
    }

    // Apply tag filter
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    // Apply active filter
    if (active !== undefined) {
      query = query.eq('is_active', active === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching challenges:', error);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to fetch challenges');
    }

    return successResponse(data);
  } catch (err) {
    console.error('Unexpected error in GET /api/challenges:', err);
    return errorResponse(ErrorCode.INTERNAL_ERROR, 'An unexpected error occurred');
  }
}

/**
 * POST /api/challenges
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await requireAuth(request);

    // Validate request body
    const validation = await parseAndValidate(request, CreateChallengeSchema);
    if (!validation.success) {
      return Response.json(validation.error, { status: 400 });
    }

    const data = validation.data;
    const db = supabaseAdmin();

    // Verify user is owner/manager of the sponsor org
    await requireSponsorRole(data.sponsor_org_id, user.id, 'owner', 'manager');

    // Create challenge
    const { data: challenge, error: createError } = await db
      .from('challenges')
      .insert(data)
      .select()
      .single();

    if (createError) {
      console.error('Error creating challenge:', createError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to create challenge');
    }

    return successResponse(challenge, 201);
  } catch (err) {
    console.error('Unexpected error in POST /api/challenges:', err);
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
