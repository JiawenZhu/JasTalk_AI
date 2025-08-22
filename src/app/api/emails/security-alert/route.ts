import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

interface SecurityAlertRequest {
  to: string;
  username: string;
  alertType: 'login_attempt' | 'password_change' | 'suspicious_activity' | 'account_locked';
  location?: string;
  deviceInfo?: string;
  timestamp: string;
  actionRequired?: boolean;
  actionUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      to, 
      username, 
      alertType, 
      location, 
      deviceInfo, 
      timestamp, 
      actionRequired,
      actionUrl 
    }: SecurityAlertRequest = await request.json();

    if (!to || !username || !alertType || !timestamp) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, username, alertType, and timestamp are required'
      }, { status: 400 });
    }

    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const alertConfig = {
      login_attempt: {
        subject: '🔐 New Login to Your Jastalk.AI Account',
        title: 'New Login Detected',
        icon: '🔐',
        color: '#4299e1',
        description: 'We detected a new login to your account'
      },
      password_change: {
        subject: '🔑 Password Changed - Jastalk.AI Security Alert',
        title: 'Password Changed',
        icon: '🔑',
        color: '#d69e2e',
        description: 'Your password was recently changed'
      },
      suspicious_activity: {
        subject: '⚠️ Suspicious Activity Detected - Jastalk.AI',
        title: 'Suspicious Activity',
        icon: '⚠️',
        color: '#e53e3e',
        description: 'We detected suspicious activity on your account'
      },
      account_locked: {
        subject: '🚫 Account Locked - Jastalk.AI Security',
        title: 'Account Temporarily Locked',
        icon: '🚫',
        color: '#e53e3e',
        description: 'Your account has been temporarily locked for security'
      }
    };

    const config = alertConfig[alertType];

    const securityEmail = {
      to,
      from: 'noreply@jastalk.com',
      fromName: 'Jastalk.AI Security',
      subject: config.subject,
      text: `Hi ${username}, ${config.description}. Time: ${timestamp}. ${location ? `Location: ${location}` : ''} ${deviceInfo ? `Device: ${deviceInfo}` : ''}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, ${config.color} 0%, #2d3748 100%); padding: 40px 20px; text-align: center; color: white;">
            <div style="font-size: 48px; margin-bottom: 10px;">${config.icon}</div>
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${config.title}</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Hi ${username}, this is a security alert</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 20px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Security Alert</h2>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              ${config.description}. We're sending this alert to keep you informed about your account security.
            </p>

            <!-- Alert Details -->
            <div style="background: #fed7d7; border: 1px solid #feb2b2; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h4 style="color: #c53030; margin-top: 0;">🚨 Alert Details</h4>
              <div style="color: #742a2a; font-size: 14px; line-height: 1.6;">
                <p style="margin: 5px 0;"><strong>Time:</strong> ${timestamp}</p>
                ${location ? `<p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>` : ''}
                ${deviceInfo ? `<p style="margin: 5px 0;"><strong>Device:</strong> ${deviceInfo}</p>` : ''}
                <p style="margin: 5px 0;"><strong>Alert Type:</strong> ${config.title}</p>
              </div>
            </div>

            ${actionRequired && actionUrl ? `
            <!-- Action Required -->
            <div style="background: #fffaf0; padding: 20px; border-radius: 8px; border-left: 4px solid #ed8936; margin: 25px 0;">
              <h4 style="color: #c05621; margin-top: 0;">⚡ Action Required</h4>
              <p style="color: #744210; margin: 0 0 15px 0; font-size: 14px;">
                Please review this activity and take action if needed.
              </p>
              <a href="${actionUrl}" style="background: #ed8936; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                🔍 Review Activity
              </a>
            </div>
            ` : ''}

            <!-- Security Tips -->
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <h3 style="color: #2d3748; margin-top: 0; margin-bottom: 15px;">🔒 Security Recommendations</h3>
              <ul style="color: #4a5568; margin: 0; font-size: 16px; line-height: 1.6; padding-left: 20px;">
                <li>If this was you, no action is needed</li>
                <li>If this wasn't you, change your password immediately</li>
                <li>Enable two-factor authentication for extra security</li>
                <li>Use unique passwords for different accounts</li>
                <li>Keep your device software updated</li>
              </ul>
            </div>

            <!-- Action Buttons -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://jastalk.com'}/account/security" style="background: #2d3748; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 0 10px;">
                🔐 Security Settings
              </a>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://jastalk.com'}/support" style="background: #4299e1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 0 10px;">
                🆘 Get Help
              </a>
            </div>

            <!-- Disclaimer -->
            <div style="background: #edf2f7; padding: 15px; border-radius: 6px; margin: 25px 0; text-align: center;">
              <p style="color: #4a5568; margin: 0; font-size: 12px; opacity: 0.8;">
                This is an automated security alert. If you have questions, contact our support team.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #2d3748; padding: 30px 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
              Security is our top priority. Contact us at <a href="mailto:security@jastalk.com" style="color: #63b3ed;">security@jastalk.com</a>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.6;">
              © 2024 Jastalk.AI. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    // Send the email
    await sgMail.send(securityEmail);

    return NextResponse.json({
      success: true,
      message: 'Security alert email sent successfully!',
      details: {
        to,
        username,
        alertType,
        subject: securityEmail.subject,
        timestamp
      }
    });

  } catch (error) {
    console.error('Security alert email error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to send security alert email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
