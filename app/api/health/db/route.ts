/**
 * GET /api/health/db - Database health check endpoint
 * Returns database connectivity status and table counts
 */

import { supabaseAdmin } from '@/lib/supabase-server';
import { successResponse, errorResponse, ErrorCode } from '@/lib/errors';

export const runtime = 'nodejs';

/**
 * GET /api/health/db
 * Returns database health status with table counts
 */
export async function GET() {
  try {
    const db = supabaseAdmin();

    // Get current database time
    const { data: timeData, error: timeError } = await db.rpc('now').single();

    let dbNow: string;
    if (timeError || !timeData) {
      // Fallback: use a simple query to verify connection
      const { error: fallbackError } = await db.from('profiles').select('id').limit(0);
      if (fallbackError) {
        throw new Error(`Database connection failed: ${fallbackError.message}`);
      }
      dbNow = new Date().toISOString();
    } else {
      dbNow = typeof timeData === 'string' ? timeData : new Date().toISOString();
    }

    // Get profiles count
    const { count: profilesCount, error: profilesError } = await db
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profilesError) {
      console.error('Error counting profiles:', profilesError);
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        `Failed to count profiles: ${profilesError.message}`
      );
    }

    // Get challenges count
    const { count: challengesCount, error: challengesError } = await db
      .from('challenges')
      .select('*', { count: 'exact', head: true });

    if (challengesError) {
      console.error('Error counting challenges:', challengesError);
      return errorResponse(
        ErrorCode.INTERNAL_ERROR,
        `Failed to count challenges: ${challengesError.message}`
      );
    }

    // Return health check data
    return successResponse({
      now: dbNow,
      tables: {
        profiles: profilesCount ?? 0,
        challenges: challengesCount ?? 0,
      },
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(ErrorCode.INTERNAL_ERROR, `Database health check failed: ${errorMessage}`);
  }
}
