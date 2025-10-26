import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { parseAndValidate } from '@/lib/validate';
import { successResponse, errorResponse, ErrorCode } from '@/lib/errors';
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
    const { data: profile, error: fetchProfileError } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (fetchProfileError || !profile || profile.role !== 'admin') {
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

    // Generate temporary password
    const tempPassword = `${role}${Math.random().toString(36).slice(-8)}!${Date.now().toString(36).slice(-4)}`.toUpperCase();

    // Create auth user with Supabase Admin
    const { data: authUser, error: authError } = await db.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: name || email.split('@')[0],
        role: role,
      },
    });

    if (authError || !authUser.user) {
      console.error('Error creating auth user:', authError);
      return errorResponse(ErrorCode.INTERNAL_SERVER_ERROR, `Failed to create user account: ${authError?.message}`);
    }

    // Create profile (trigger should handle this, but we'll do it manually for reliability)
    const { error: insertProfileError } = await db
      .from('profiles')
      .insert({
        id: authUser.user.id,
        email: email,
        display_name: name || email.split('@')[0],
        role: role,
        github_url: 'https://github.com/placeholder',
        linkedin_url: 'https://linkedin.com/in/placeholder',
      });

    if (insertProfileError) {
      console.warn('Profile creation warning (trigger may have handled it):', insertProfileError);
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store invitation in database
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
      console.warn('Invitation storage warning:', inviteError);
    }

    // Generate login link (direct to signin with credentials)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const loginLink = `${baseUrl}/auth/signin`;

    // Generate email content with credentials
    const { subject, htmlContent, textContent } = generateInvitationEmail(
      name || email, 
      role, 
      loginLink,
      tempPassword
    );

    // Send invitation email with retry logic
    let emailSent = false;
    let retryCount = 0;
    const maxRetries = 3;

    while (!emailSent && retryCount < maxRetries) {
      try {
        emailSent = await sendEmail({
          to: email,
          subject,
          htmlContent,
          textContent,
        });
        
        if (!emailSent) {
          retryCount++;
          console.warn(`Email send attempt ${retryCount} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
        }
      } catch (emailError) {
        console.error(`Email send error on attempt ${retryCount + 1}:`, emailError);
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }

    if (!emailSent) {
      // Log credentials for manual delivery
      console.error('⚠️  EMAIL SEND FAILED - Manual delivery required:');
      console.error(`   Email: ${email}`);
      console.error(`   Password: ${tempPassword}`);
      console.error(`   Role: ${role}`);
      
      return errorResponse(
        ErrorCode.INTERNAL_SERVER_ERROR, 
        'Account created but email delivery failed. Contact support for credentials.'
      );
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
