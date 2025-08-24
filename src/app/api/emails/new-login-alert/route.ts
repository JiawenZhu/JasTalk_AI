import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export interface NewLoginAlertRequest {
  to: string;
  username: string;
  loginTime: string;
  location: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  loginUrl: string;
  secureAccountUrl: string;
  supportEmail: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      to,
      username,
      loginTime,
      location,
      deviceInfo,
      ipAddress,
      userAgent,
      loginUrl,
      secureAccountUrl,
      supportEmail
    }: NewLoginAlertRequest = await request.json();

    if (!to || !username || !loginTime || !location) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, username, loginTime, and location are required'
      }, { status: 400 });
    }

    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const newLoginAlertEmail = {
      to,
      from: 'security@jastalk.com',
      fromName: 'Jastalk.AI Security',
      subject: `🔐 New Login Alert - ${location}`,
      text: `Hi ${username}, we detected a new login to your Jastalk.AI account from ${location} at ${loginTime}. If this wasn't you, secure your account immediately.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #333333;">
          <!-- Header -->
          <div style="text-align: center; padding: 40px 20px; border-bottom: 1px solid #e5e7eb; background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);">
            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; display: inline-block;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">🔐 Security Alert</h1>
              <p style="margin: 0; font-size: 16px; color: #fecaca; font-weight: 500;">Jastalk.AI Account Security</p>
            </div>
          </div>

          <!-- Greeting -->
          <div style="padding: 40px 20px 20px 20px;">
            <p style="margin: 0 0 30px 0; font-size: 18px; color: #374151; line-height: 1.6;">
              Hi ${username},
            </p>
            <p style="margin: 0 0 40px 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
              We detected a new login to your Jastalk.AI account. This is a security notification to ensure your account remains secure.
            </p>
          </div>

          <!-- Login Details Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #dc2626; padding-left: 16px;">
              Login Details
            </h2>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #111827;">📍 Location</h3>
                  <p style="margin: 0; color: #dc2626; font-size: 16px; font-weight: 500;">${location}</p>
                </div>
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #111827;">🕐 Time</h3>
                  <p style="margin: 0; color: #dc2626; font-size: 16px; font-weight: 500;">${loginTime}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Device Information Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #f59e0b; padding-left: 16px;">
              Device Information
            </h2>
            
            <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">💻 Device</h3>
                  <p style="margin: 0; color: #92400e; font-size: 14px;">${deviceInfo}</p>
                </div>
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">🌐 IP Address</h3>
                  <p style="margin: 0; color: #92400e; font-size: 14px; font-family: monospace;">${ipAddress}</p>
                </div>
              </div>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #fed7aa;">
                <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">🔍 User Agent</h3>
                <p style="margin: 0; color: #92400e; font-size: 12px; font-family: monospace; word-break: break-all;">${userAgent}</p>
              </div>
            </div>
          </div>

          <!-- Action Section -->
          <div style="padding: 0 20px 20px 20px; text-align: center;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">Is this you?</h3>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
                If this login was you, no action is needed. If you don't recognize this login, secure your account immediately.
              </p>
              
              <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                <a href="${loginUrl}" 
                   style="display: inline-block; background: #059669; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(5, 150, 105, 0.3);">
                  ✅ Yes, this was me
                </a>
                <a href="${secureAccountUrl}" 
                   style="display: inline-block; background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(220, 38, 38, 0.3);">
                  🚨 Secure my account
                </a>
              </div>
            </div>
          </div>

          <!-- Security Tips Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #10b981; padding-left: 16px;">
              🔒 Security Tips
            </h2>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
              <ul style="margin: 0; padding-left: 20px; color: #065f46;">
                <li style="margin-bottom: 12px; line-height: 1.6;">Use a strong, unique password for your account</li>
                <li style="margin-bottom: 12px; line-height: 1.6;">Enable two-factor authentication if available</li>
                <li style="margin-bottom: 12px; line-height: 1.6;">Never share your login credentials with anyone</li>
                <li style="margin-bottom: 12px; line-height: 1.6;">Log out from shared or public devices</li>
                <li style="margin-bottom: 0; line-height: 1.6;">Monitor your account for unusual activity</li>
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
    await sgMail.send(newLoginAlertEmail);

    return NextResponse.json({
      success: true,
      message: 'New login alert email sent successfully'
    });

  } catch (error) {
    console.error('Error sending new login alert email:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send new login alert email'
    }, { status: 500 });
  }
}

