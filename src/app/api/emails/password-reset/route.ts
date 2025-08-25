import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export interface PasswordResetRequest {
  to: string;
  username: string;
  resetUrl: string;
  expiryTime: string;
  supportEmail: string;
  requestTime: string;
  ipAddress: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      to,
      username,
      resetUrl,
      expiryTime,
      supportEmail,
      requestTime,
      ipAddress
    }: PasswordResetRequest = await request.json();

    if (!to || !username || !resetUrl || !expiryTime) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, username, resetUrl, and expiryTime are required'
      }, { status: 400 });
    }

    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const passwordResetEmail = {
      to,
      from: 'security@jastalk.com',
      fromName: 'Jastalk.AI Security',
      subject: '🔑 Reset Your Password - Jastalk.AI',
      text: `Hi ${username}, you requested a password reset for your Jastalk.AI account. Click the link to reset your password. This link expires in ${expiryTime}.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #333333;">
          <!-- Header -->
          <div style="text-align: center; padding: 40px 20px; border-bottom: 1px solid #e5e7eb; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);">
            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; display: inline-block;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">🔑 Password Reset</h1>
              <p style="margin: 0; font-size: 16px; color: #dbeafe; font-weight: 500;">Jastalk.AI Account Security</p>
            </div>
          </div>

          <!-- Greeting -->
          <div style="padding: 40px 20px 20px 20px;">
            <p style="margin: 0 0 30px 0; font-size: 18px; color: #374151; line-height: 1.6;">
              Hi ${username},
            </p>
            <p style="margin: 0 0 40px 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
              We received a request to reset your password for your Jastalk.AI account. If you made this request, click the button below to create a new password.
            </p>
          </div>

          <!-- Reset Button Section -->
          <div style="padding: 0 20px 20px 20px; text-align: center;">
            <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 32px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">Reset Your Password</h3>
              <p style="margin: 0 0 24px 0; color: #1e40af; font-size: 16px; line-height: 1.5;">
                Click the button below to securely reset your password
              </p>
              
              <a href="${resetUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);">
                🔐 Reset Password
              </a>
            </div>
          </div>

          <!-- Important Information Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #f59e0b; padding-left: 16px;">
              ⚠️ Important Information
            </h2>
            
            <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">⏰ Expires In</h3>
                  <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: 500;">${expiryTime}</p>
                </div>
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">🌐 Requested From</h3>
                  <p style="margin: 0; color: #92400e; font-size: 14px; font-family: monospace;">${ipAddress}</p>
                </div>
              </div>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #fed7aa;">
                <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">🕐 Request Time</h3>
                <p style="margin: 0; color: #92400e; font-size: 14px;">${requestTime}</p>
              </div>
            </div>
          </div>

          <!-- Security Warning Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #dc2626; padding-left: 16px;">
              🚨 Security Warning
            </h2>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
              <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
                <div style="width: 24px; height: 24px; background: #dc2626; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                  <span style="color: white; font-size: 14px; font-weight: bold;">!</span>
                </div>
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #dc2626;">Didn't request this?</h3>
                  <p style="margin: 0; color: #991b1b; line-height: 1.6;">
                    If you didn't request a password reset, your account may be compromised. Contact our support team immediately and do not click the reset link above.
                  </p>
                </div>
              </div>
              
              <div style="background: #ffffff; border: 1px solid #fecaca; border-radius: 6px; padding: 16px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                  <strong>Immediate actions to take:</strong>
                </p>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #991b1b;">
                  <li style="margin-bottom: 4px;">Contact support at <a href="mailto:${supportEmail}" style="color: #dc2626;">${supportEmail}</a></li>
                  <li style="margin-bottom: 4px;">Check your account for suspicious activity</li>
                  <li style="margin-bottom: 0;">Consider changing passwords on other accounts</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Password Tips Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #10b981; padding-left: 16px;">
              💡 Password Best Practices
            </h2>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
              <ul style="margin: 0; padding-left: 20px; color: #065f46;">
                <li style="margin-bottom: 12px; line-height: 1.6;">Use at least 12 characters with a mix of letters, numbers, and symbols</li>
                <li style="margin-bottom: 12px; line-height: 1.6;">Avoid common words, phrases, or personal information</li>
                <li style="margin-bottom: 12px; line-height: 1.6;">Use a unique password for each account</li>
                <li style="margin-bottom: 12px; line-height: 1.6;">Consider using a password manager for secure storage</li>
                <li style="margin-bottom: 0; line-height: 1.6;">Enable two-factor authentication for extra security</li>
              </ul>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 30px 20px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">
              Need help? Contact our support team at <a href="mailto:${supportEmail}" style="color: #3b82f6;">${supportEmail}</a>
            </p>
            <p style="margin: 0 0 16px 0; color: #9ca3af; font-size: 12px;">
              © 2024 Jastalk.AI. All rights reserved. | Professional Interview Practice Platform
            </p>
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 16px;">
              <span style="color: #9ca3af; font-size: 11px;">📧 security@jastalk.com</span>
              <span style="color: #9ca3af; font-size: 11px;">🌐 jastalk.ai</span>
            </div>
          </div>
        </div>
      `
    };

    // Send email
    await sgMail.send(passwordResetEmail);

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('Error sending password reset email:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send password reset email'
    }, { status: 500 });
  }
}
