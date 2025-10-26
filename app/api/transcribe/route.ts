/**
 * POST /api/transcribe - Transcribe audio/video (stub for v1.5)
 */

import { errorResponse, ErrorCode } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * POST /api/transcribe
 * Stub endpoint for audio/video transcription
 * Will be implemented in v1.5 using Whisper API
 */
export async function POST(request: Request) {
  return errorResponse(
    ErrorCode.NOT_IMPLEMENTED,
    'Transcription service is not yet implemented. Coming in v1.5.'
  );
}
