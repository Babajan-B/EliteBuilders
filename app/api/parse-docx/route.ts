/**
 * POST /api/parse-docx - Parse DOCX document (stub for v1.5)
 */

import { errorResponse, ErrorCode } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * POST /api/parse-docx
 * Stub endpoint for DOCX parsing
 * Will be implemented in v1.5
 */
export async function POST(request: Request) {
  return errorResponse(
    ErrorCode.NOT_IMPLEMENTED,
    'DOCX parsing service is not yet implemented. Coming in v1.5.'
  );
}
