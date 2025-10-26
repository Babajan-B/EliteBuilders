/**
 * GET /api/health/gemini - Test Gemini API connectivity
 */

import { successResponse, errorResponse, ErrorCode } from '@/lib/errors';
import { testGeminiConnection } from '@/lib/gemini-client';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        'GEMINI_API_KEY not configured'
      );
    }

    // Test connection
    const isConnected = await testGeminiConnection();

    if (!isConnected) {
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        'Gemini API connection test failed'
      );
    }

    return successResponse({
      status: 'healthy',
      model: 'gemini-1.5-flash',
      api_key_configured: true,
      connection_test: 'passed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Gemini health check error:', error);
    return errorResponse(
      ErrorCode.INTERNAL_ERROR,
      `Gemini API error: ${(error as Error).message}`
    );
  }
}
