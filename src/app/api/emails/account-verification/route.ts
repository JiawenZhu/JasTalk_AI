import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

export interface AccountVerificationRequest {
  to: string;
  username: string;
  verificationUrl: string;
  expiryTime: string;
  supportEmail: string;
  accountType: 'signup' | 'email_change';
}

export async function POST(request: NextRequest) {
  try {
    const {
      to,
      username,
      verificationUrl,
      expiryTime,
      supportEmail,
      accountType
    }: AccountVerificationRequest = await request.json();

    if (!to || !username || !verificationUrl || !expiryTime) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, username, verificationUrl, and expiryTime are required'
      }, { status: 400 });
    }

    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const isSignup = accountType === 'signup';
    const subject = isSignup ? '🎉 Welcome to Jastalk.AI - Verify Your Account' : '📧 Verify Your New Email Address';
    const headerTitle = isSignup ? '🎉 Welcome to Jastalk.AI' : '📧 Email Verification';
    const headerSubtitle = isSignup ? 'Professional Interview Practice Platform' : 'Account Security Verification';

    const accountVerificationEmail = {
      to,
      from: 'welcome@jastalk.com',
      fromName: 'Jastalk.AI Team',
      subject,
      text: `Hi ${username}, ${isSignup ? 'welcome to Jastalk.AI! Please verify your account by clicking the verification link. This link expires in ' : 'please verify your new email address by clicking the verification link. This link expires in '}${expiryTime}.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #333333;">
          <!-- Header -->
          <div style="text-align: center; padding: 40px 20px; border-bottom: 1px solid #e5e7eb; background: linear-gradient(135deg, #059669 0%, #10b981 100%);">
            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; display: inline-block;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">${headerTitle}</h1>
              <p style="margin: 0; font-size: 16px; color: #d1fae5; font-weight: 500;">${headerSubtitle}</p>
            </div>
          </div>

          <!-- Greeting -->
          <div style="padding: 40px 20px 20px 20px;">
            <p style="margin: 0 0 30px 0; font-size: 18px; color: #374151; line-height: 1.6;">
              Hi ${username},
            </p>
            <p style="margin: 0 0 40px 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
              ${isSignup 
                ? 'Welcome to Jastalk.AI! We\'re excited to have you join our community of professionals preparing for their next career move. To get started, please verify your email address.'
                : 'We received a request to update your email address. To complete this change, please verify your new email address below.'
              }
            </p>
          </div>

          <!-- Verification Button Section -->
          <div style="padding: 0 20px 20px 20px; text-align: center;">
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 32px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">
                ${isSignup ? 'Verify Your Account' : 'Verify Your Email'}
              </h3>
              <p style="margin: 0 0 24px 0; color: #065f46; font-size: 16px; line-height: 1.5;">
                ${isSignup 
                  ? 'Click the button below to verify your account and start practicing interviews'
                  : 'Click the button below to verify your new email address'
                }
              </p>
              
              <a href="${verificationUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(5, 150, 105, 0.3);">
                ${isSignup ? '✅ Verify Account' : '📧 Verify Email'}
              </a>
            </div>
          </div>

          ${isSignup ? `
          <!-- Getting Started Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #3b82f6; padding-left: 16px;">
              🚀 Getting Started
            </h2>
            
            <div style="background: #eff6ff; border: 1px solid #dbeafe; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">🎯 Step 1: Choose Your Interviewer</h3>
                  <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">Select from our AI-powered interviewers with different personalities and expertise levels</p>
                </div>
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">📝 Step 2: Upload Job Description</h3>
                  <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">Paste the job description to get personalized interview questions</p>
                </div>
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">🎤 Step 3: Start Practicing</h3>
                  <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">Begin your interview practice session with real-time feedback</p>
                </div>
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">📊 Step 4: Track Progress</h3>
                  <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">Monitor your improvement and review detailed performance analytics</p>
                </div>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Important Information Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #f59e0b; padding-left: 16px;">
              ⚠️ Important Information
            </h2>
            
            <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">⏰ Expires In</h3>
                  <p style="margin: 0; color: #92400e; font-size: 16px; font-weight: 500;">${expiryTime}</p>
                </div>
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827;">🔒 Security</h3>
                  <p style="margin: 0; color: #92400e; font-size: 14px;">Verification link is secure and encrypted</p>
                </div>
              </div>
            </div>
          </div>

          ${isSignup ? `
          <!-- What You'll Get Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #8b5cf6; padding-left: 16px;">
              🎁 What You'll Get
            </h2>
            
            <div style="background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 24px; height: 24px; background: #8b5cf6; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 12px;">🎯</span>
                  </div>
                  <span style="color: #581c87; font-size: 14px;">AI-Powered Interviewers</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 24px; height: 24px; background: #8b5cf6; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 12px;">📊</span>
                  </div>
                  <span style="color: #581c87; font-size: 14px;">Performance Analytics</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 24px; height: 24px; background: #8b5cf6; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 12px;">🎤</span>
                  </div>
                  <span style="color: #581c87; font-size: 14px;">Voice-Based Practice</span>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="width: 24px; height: 24px; background: #8b5cf6; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 12px;">📝</span>
                  </div>
                  <span style="color: #581c87; font-size: 14px;">Detailed Feedback</span>
                </div>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Security Notice Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #dc2626; padding-left: 16px;">
              🔒 Security Notice
            </h2>
            
            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
              <p style="margin: 0 0 16px 0; color: #991b1b; line-height: 1.6;">
                <strong>Important:</strong> Never share this verification link with anyone. Our team will never ask for your password or verification links.
              </p>
              
              <div style="background: #ffffff; border: 1px solid #fecaca; border-radius: 6px; padding: 16px;">
                <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                  <strong>If you didn't request this:</strong> Please contact our support team immediately at <a href="mailto:${supportEmail}" style="color: #dc2626;">${supportEmail}</a>
                </p>
              </div>
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
              <span style="color: #9ca3af; font-size: 11px;">📧 welcome@jastalk.com</span>
              <span style="color: #9ca3af; font-size: 11px;">🌐 jastalk.ai</span>
            </div>
          </div>
        </div>
      `
    };

    // Send email
    await sgMail.send(accountVerificationEmail);

    return NextResponse.json({
      success: true,
      message: 'Account verification email sent successfully'
    });

  } catch (error) {
    console.error('Error sending account verification email:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send account verification email'
    }, { status: 500 });
  }
}

