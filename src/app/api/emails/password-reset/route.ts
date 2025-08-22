import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

interface PasswordResetRequest {
  to: string;
  username: string;
  resetUrl: string;
  expiresIn: string; // e.g., "15 minutes"
}

export async function POST(request: NextRequest) {
  try {
    const { to, username, resetUrl, expiresIn }: PasswordResetRequest = await request.json();

    if (!to || !username || !resetUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, username, and resetUrl are required'
      }, { status: 400 });
    }

    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const resetEmail = {
      to,
      from: 'noreply@jastalk.com',
      fromName: 'Jastalk.AI Security',
      subject: '🔐 Reset Your Jastalk.AI Password',
      text: `Hi ${username}, you requested a password reset. Click the link to reset your password: ${resetUrl}. This link expires in ${expiresIn}.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%); padding: 40px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🔐 Password Reset Request</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Hi ${username}, we received your request</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 20px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              We received a request to reset your password for your Jastalk.AI account. 
              If you didn't make this request, you can safely ignore this email.
            </p>

            <div style="background: #fed7d7; border: 1px solid #feb2b2; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="color: #c53030; margin-top: 0;">⚠️ Important:</h4>
              <p style="color: #742a2a; margin: 0; font-size: 14px;">
                This password reset link will expire in <strong>${expiresIn}</strong>. 
                For security reasons, please reset your password as soon as possible.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #e53e3e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                🔑 Reset Password
              </a>
            </div>

            <p style="color: #4a5568; font-size: 14px; text-align: center; margin: 20px 0;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #3182ce; word-break: break-all;">${resetUrl}</a>
            </p>

            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="color: #2d3748; margin-top: 0;">🔒 Security Tips:</h4>
              <ul style="color: #4a5568; margin: 0; font-size: 14px; line-height: 1.6;">
                <li>Choose a strong, unique password</li>
                <li>Never share your password with anyone</li>
                <li>Enable two-factor authentication if available</li>
                <li>Use different passwords for different accounts</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #2d3748; padding: 30px 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
              Questions? Contact us at <a href="mailto:support@jastalk.com" style="color: #63b3ed;">support@jastalk.com</a>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.6;">
              © 2024 Jastalk.AI. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    // Send the email
    await sgMail.send(resetEmail);

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully!',
      details: {
        to,
        username,
        subject: resetEmail.subject,
        expiresIn
      }
    });

  } catch (error) {
    console.error('Password reset email error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send password reset email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
