import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

interface WelcomeEmailRequest {
  to: string;
  username: string;
  verificationUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const { to, username, verificationUrl }: WelcomeEmailRequest = await request.json();

    if (!to || !username || !verificationUrl) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, username, and verificationUrl are required'
      }, { status: 400 });
    }

    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const welcomeEmail = {
      to,
      from: 'noreply@jastalk.com',
      fromName: 'Jastalk.AI Team',
      subject: '🎉 Welcome to Jastalk.AI - Your AI Interview Practice Platform!',
      text: `Hi ${username}, welcome to Jastalk.AI! We're excited to have you on board. Click this link to verify your email: ${verificationUrl}. Start practicing with AI interviewers and improve your skills today!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); padding: 40px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">🎉 Welcome to Jastalk.AI!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Hi ${username}, we're thrilled to have you!</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 20px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">Your AI Interview Practice Journey Begins</h2>
            
            <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              Welcome to the future of interview preparation! Jastalk.AI combines cutting-edge AI technology 
              with proven interview techniques to help you excel in your career.
            </p>

            <!-- What You Get -->
            <div style="background: #f0fff4; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #38a169;">
              <h3 style="color: #2f855a; margin-top: 0; margin-bottom: 15px;">🚀 What You Get</h3>
              <ul style="color: #4a5568; margin: 0; font-size: 16px; line-height: 1.6; padding-left: 20px;">
                <li><strong>AI Interviewers:</strong> Practice with multiple AI personalities</li>
                <li><strong>Real-time Feedback:</strong> Get instant insights on your performance</li>
                <li><strong>Custom Questions:</strong> Tailored to your industry and role</li>
                <li><strong>Progress Tracking:</strong> Monitor your improvement over time</li>
                <li><strong>Voice Interaction:</strong> Natural conversation practice</li>
              </ul>
            </div>

            <!-- Verification Section -->
            <div style="background: #ebf8ff; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #3182ce;">
              <h3 style="color: #2c5282; margin-top: 0; margin-bottom: 15px;">✅ Verify Your Email</h3>
              <p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px; line-height: 1.6;">
                To get started, please verify your email address by clicking the button below:
              </p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" 
                   style="display: inline-block; background: #3182ce; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                  🔐 Verify Email Address
                </a>
              </div>
            </div>

            <!-- Getting Started -->
            <div style="background: #fffaf0; padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #ed8936;">
              <h3 style="color: #c05621; margin-top: 0; margin-bottom: 15px;">🎯 Getting Started</h3>
              <ol style="color: #4a5568; margin: 0; font-size: 16px; line-height: 1.6; padding-left: 20px;">
                <li>Verify your email address (click the button above)</li>
                <li>Complete your profile and preferences</li>
                <li>Choose your first AI interviewer</li>
                <li>Start practicing with custom questions</li>
                <li>Track your progress and improvements</li>
              </ol>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://jastalk.ai'}/dashboard" 
                 style="display: inline-block; background: #4299e1; color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px;">
                🚀 Start Practicing Now
              </a>
            </div>

            <!-- Support Info -->
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
              <h4 style="color: #2d3748; margin-top: 0; margin-bottom: 10px;">Need Help?</h4>
              <p style="color: #718096; margin: 0; font-size: 14px;">
                Our support team is here to help! Contact us at 
                <a href="mailto:support@jastalk.com" style="color: #4299e1;">support@jastalk.com</a>
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #2d3748; padding: 30px 20px; text-align: center; color: white;">
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">
              Ready to ace your next interview? Let's get started!
            </p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.6;">
              © 2024 Jastalk.AI. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    // Send email
    await sgMail.send(welcomeEmail);

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully'
    });

  } catch (error) {
    console.error('Error sending welcome email:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send welcome email'
    }, { status: 500 });
  }
}
