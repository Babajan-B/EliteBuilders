/**
 * POST /api/parse-pdf - Parse PDF document (stub for v1.5)
 */

import { errorResponse, ErrorCode } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * POST /api/parse-pdf
 * Stub endpoint for PDF parsing
 * Will be implemented in v1.5
 */
export async function POST(request: Request) {
  return errorResponse(
    ErrorCode.NOT_IMPLEMENTED,
    'PDF parsing service is not yet implemented. Coming in v1.5.'
  );
}
