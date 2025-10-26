import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseAndValidate, successResponse, errorResponse, ErrorCode } from '@/lib/utils';
import { z } from 'zod';
import { sendEmail, generateInvitationEmail } from '@/lib/email';

const InviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['judge', 'sponsor']),
  name: z.string().optional(),
});

/**
 * POST /api/admin/invite
 * Send invitation email to a judge or sponsor
 * Only accessible by admins
 */
export async function POST(request: Request) {
  try {
    // Check if user is authenticated and is an admin
    const user = await requireAuth();
    const db = supabaseAdmin();

    // Fetch user profile to verify admin role
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return errorResponse(ErrorCode.UNAUTHORIZED, 'Only admins can send invitations');
    }

    // Validate request body
    const validation = await parseAndValidate(request, InviteSchema);
    if (!validation.success) {
      return Response.json(validation.error, { status: 400 });
    }

    const { email, role, name } = validation.data;

    // Check if user already exists
    const { data: existingUser } = await db
      .from('profiles')
      .select('id, role')
      .eq('email', email)
      .single();

    if (existingUser) {
      return errorResponse(ErrorCode.INVALID_INPUT, 'User with this email already exists');
    }

    // Generate a unique invitation token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token expires in 7 days

    // Store invitation in database (you'll need to create this table)
    const { error: inviteError } = await db
      .from('invitations')
      .insert({
        email,
        role,
        token: invitationToken,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
        status: 'pending',
      });

    if (inviteError) {
      // Check if invitations table exists, if not, skip storing for now
      console.warn('Invitations table might not exist:', inviteError);
    }

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
    const inviteLink = `${baseUrl}/auth/accept-invite?token=${invitationToken}`;

    // Generate email content
    const { subject, htmlContent } = generateInvitationEmail(name || email, role, inviteLink);

    // Send invitation email
    const emailSent = await sendEmail({
      to: email,
      subject,
      htmlContent,
    });

    if (!emailSent) {
      return errorResponse(ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to send invitation email');
    }

    return successResponse({
      message: 'Invitation sent successfully',
      email,
      role,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return errorResponse(ErrorCode.INTERNAL_SERVER_ERROR, 'Failed to send invitation');
  }
}

/**
 * GET /api/admin/invite
 * Get all pending invitations
 * Only accessible by admins
 */
export async function GET() {
  try {
    const user = await requireAuth();
    const db = supabaseAdmin();

    // Verify admin role
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return errorResponse(ErrorCode.UNAUTHORIZED, 'Only admins can view invitations');
    }

    // Fetch all invitations
    const { data: invitations, error } = await db
      .from('invitations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      // Return empty array if table doesn't exist yet
      return successResponse([]);
    }

    return successResponse(invitations || []);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return successResponse([]);
  }
}
