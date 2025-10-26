/**
 * POST /api/submissions - Create a new submission
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { parseAndValidate, CreateSubmissionSchema } from '@/lib/validate';
import { errorResponse, successResponse, ErrorCode } from '@/lib/errors';
import { requireAuth } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * POST /api/submissions
 */
export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await requireAuth(request);

    // Validate request body
    const validation = await parseAndValidate(request, CreateSubmissionSchema);
    if (!validation.success) {
      return Response.json(validation.error, { status: 400 });
    }

    const data = validation.data;
    const db = supabaseAdmin();

    // Verify challenge exists and is active
    const { data: challenge, error: challengeError } = await db
      .from('challenges')
      .select('id, is_active, deadline_utc')
      .eq('id', data.challenge_id)
      .single();

    if (challengeError || !challenge) {
      return errorResponse(ErrorCode.NOT_FOUND, 'Challenge not found');
    }

    if (!challenge.is_active) {
      return errorResponse(ErrorCode.BAD_REQUEST, 'Challenge is not active');
    }

    // Check if deadline has passed
    const deadline = new Date(challenge.deadline_utc);
    if (deadline < new Date()) {
      return errorResponse(ErrorCode.BAD_REQUEST, 'Challenge deadline has passed');
    }

    // Create submission with SCORING status (will be scored immediately)
    const { data: submission, error: createError } = await db
      .from('submissions')
      .insert({
        user_id: user.id,
        challenge_id: data.challenge_id,
        repo_url: data.repo_url,
        deck_url: data.deck_url,
        demo_url: data.demo_url,
        writeup_md: data.writeup_md,
        status: 'SCORING',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating submission:', createError);
      return errorResponse(ErrorCode.INTERNAL_ERROR, 'Failed to create submission');
    }

    // Fire-and-forget: trigger scoring endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    fetch(`${baseUrl}/api/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: submission.id }),
    }).catch((err) => {
      // Log error but don't fail the submission creation
      console.error('Failed to trigger scoring (fire-and-forget):', err);
    });

    return successResponse(submission, 201);
  } catch (err) {
    console.error('Unexpected error in POST /api/submissions:', err);
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';

    if (errorMessage.includes('Authentication required')) {
      return errorResponse(ErrorCode.UNAUTHORIZED, errorMessage);
    }

    return errorResponse(ErrorCode.INTERNAL_ERROR, errorMessage);
  }
}
