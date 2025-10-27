import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/users
 * Fetch all judges and sponsors for admin
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const user = await requireAuth(['admin']);
    const supabase = await getSupabaseServerClient();

    // Fetch judges
    const { data: judges, error: judgesError } = await supabase
      .from('profiles')
      .select('id, email, role, display_name, created_at')
      .eq('role', 'judge')
      .order('created_at', { ascending: false });

    if (judgesError) {
      console.error('Error fetching judges:', judgesError);
    }

    // Fetch sponsors
    const { data: sponsors, error: sponsorsError } = await supabase
      .from('profiles')
      .select('id, email, role, display_name, created_at')
      .eq('role', 'sponsor')
      .order('created_at', { ascending: false });

    if (sponsorsError) {
      console.error('Error fetching sponsors:', sponsorsError);
    }

    return NextResponse.json({
      judges: judges || [],
      sponsors: sponsors || [],
    }, { status: 200 });
  } catch (error) {
    console.error('[API] Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: (error as Error).message },
      { status: 500 }
    );
  }
}
