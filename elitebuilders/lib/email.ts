/**
 * Email service using MailerSend
 */

interface SendEmailParams {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export async function sendEmail({ to, subject, htmlContent, textContent }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.MAILERSEND_API_KEY;
  const fromEmail = process.env.MAILERSEND_FROM_EMAIL;
  const fromName = process.env.MAILERSEND_FROM_NAME;

  if (!apiKey || !fromEmail || !fromName) {
    console.error('MailerSend credentials not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: {
          email: fromEmail,
          name: fromName,
        },
        to: [
          {
            email: to,
          },
        ],
        subject,
        html: htmlContent,
        text: textContent || htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('MailerSend error:', error);
      return false;
    }

    console.log('Email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

export function generateInvitationEmail(
  recipientName: string,
  role: 'judge' | 'sponsor',
  inviteLink: string,
  tempPassword: string
): { subject: string; htmlContent: string; textContent: string } {
  const roleTitle = role === 'judge' ? 'Judge' : 'Sponsor';

  const subject = `Invitation to join EliteBuilders as a ${roleTitle}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
    }
    .button {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏆 EliteBuilders</h1>
    <p>You've been invited!</p>
  </div>

  <div class="content">
    <h2>Hello ${recipientName || 'there'}!</h2>

    <p>We're excited to invite you to join <strong>EliteBuilders</strong> as a <strong>${roleTitle}</strong>.</p>

    ${role === 'judge' ? `
      <p>As a judge, you'll have the opportunity to:</p>
      <ul>
        <li>Review and score innovative competition submissions</li>
        <li>Provide valuable feedback to builders</li>
        <li>Help identify the best projects and ideas</li>
        <li>Shape the future of the EliteBuilders community</li>
      </ul>
    ` : `
      <p>As a sponsor, you'll have the opportunity to:</p>
      <ul>
        <li>Create and manage your own competitions</li>
        <li>Attract talented builders to solve your challenges</li>
        <li>Review submissions and award prizes</li>
        <li>Build your brand and connect with top talent</li>
      </ul>
    `}

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #374151;">Your Login Credentials</h3>
      <p style="margin: 10px 0;"><strong>Email:</strong> ${recipientName}</p>
      <p style="margin: 10px 0;"><strong>Temporary Password:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${tempPassword}</code></p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">⚠️ Please change your password after your first login for security.</p>
    </div>

    <p>Click the button below to log in and get started:</p>

    <div style="text-align: center;">
      <a href="${inviteLink}" class="button">Log In Now →</a>
    </div>

    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${inviteLink}">${inviteLink}</a>
    </p>

    <p>We look forward to having you on the platform!</p>

    <p>
      Best regards,<br>
      <strong>The EliteBuilders Team</strong>
    </p>
  </div>

  <div class="footer">
    <p>EliteBuilders - Where builders compete and innovation thrives</p>
    <p>This is an automated email. Please do not reply to this message.</p>
  </div>
</body>
</html>
  `;

  const textContent = `
EliteBuilders - ${roleTitle} Invitation

Hello ${recipientName || 'there'}!

We're excited to invite you to join EliteBuilders as a ${roleTitle}.

${role === 'judge' ? `As a judge, you'll have the opportunity to:
- Review and score innovative competition submissions
- Provide valuable feedback to builders  
- Help identify the best projects and ideas
- Shape the future of the EliteBuilders community` : `As a sponsor, you'll have the opportunity to:
- Create and manage your own competitions
- Attract talented builders to solve your challenges
- Review submissions and award prizes
- Build your brand and connect with top talent`}

YOUR LOGIN CREDENTIALS:
Email: ${recipientName}
Temporary Password: ${tempPassword}

⚠️ Please change your password after your first login for security.

Click here to log in: ${inviteLink}

We look forward to having you on the platform!

Best regards,
The EliteBuilders Team

---
This is an automated email. Please do not reply to this message.
  `;

  return { subject, htmlContent, textContent };
}
