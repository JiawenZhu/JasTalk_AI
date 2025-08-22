import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

interface InterviewPauseSummaryRequest {
  to: string;
  username: string;
  interviewerName: string;
  interviewTitle: string;
  questionsAnswered: number;
  totalQuestions: number;
  duration: string;
  conversationSummary: string;
  detailedLogs: Array<{
    speaker: 'user' | 'ai';
    text: string;
    timestamp: string;
  }>;
  resumeUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      to, 
      username, 
      interviewerName,
      interviewTitle, 
      questionsAnswered,
      totalQuestions,
      duration, 
      conversationSummary,
      detailedLogs,
      resumeUrl
    }: InterviewPauseSummaryRequest = await request.json();

    if (!to || !username || !interviewTitle || !interviewerName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, username, interviewTitle, and interviewerName are required'
      }, { status: 400 });
    }

    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const progressPercentage = Math.round((questionsAnswered / totalQuestions) * 100);
    const progressColor = progressPercentage >= 80 ? '#38a169' : progressPercentage >= 60 ? '#d69e2e' : '#e53e3e';
    const progressEmoji = progressPercentage >= 80 ? '🚀' : progressPercentage >= 60 ? '👍' : '💪';

    const pauseSummaryEmail = {
      to,
      from: 'noreply@jastalk.com',
      fromName: 'Jastalk.AI Interview Coach',
      subject: `📋 Jastalk.AI - Interview Session Summary & Resume Link`,
      text: `Hi ${username}, your interview "${interviewTitle}" with ${interviewerName} has been paused. Progress: ${questionsAnswered}/${totalQuestions} questions (${progressPercentage}%). Duration: ${duration}. Check your email for conversation summary and detailed logs.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; color: #333333;">
          <!-- Header -->
          <div style="text-align: center; padding: 40px 20px; border-bottom: 1px solid #e5e7eb; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);">
            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; display: inline-block;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Jastalk.AI</h1>
              <p style="margin: 0; font-size: 16px; color: #e0e7ff; font-weight: 500;">Professional Interview Practice Platform</p>
            </div>
          </div>

          <!-- Greeting -->
          <div style="padding: 40px 20px 20px 20px;">
            <p style="margin: 0 0 30px 0; font-size: 18px; color: #374151; line-height: 1.6;">
              Dear ${username},
            </p>
            <p style="margin: 0 0 40px 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
              Your interview practice session has been successfully paused and saved. Below you'll find a comprehensive summary of your progress, conversation details, and a direct link to resume your session when you're ready to continue.
            </p>
          </div>

          <!-- Interview Overview Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #3b82f6; padding-left: 16px;">
              Session Progress Summary
            </h2>
            
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <div>
                  <h3 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #111827;">${interviewTitle}</h3>
                  <p style="margin: 0; color: #6b7280; font-size: 14px;">Interviewer: <strong>${interviewerName}</strong></p>
                </div>
                <div style="text-align: center; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; min-width: 80px;">
                  <div style="font-size: 24px; font-weight: 700; color: ${progressColor}; margin-bottom: 4px;">${progressPercentage}%</div>
                  <div style="font-size: 12px; color: #6b7280;">Complete</div>
                </div>
              </div>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="text-align: center; padding: 16px; background: #ffffff; border-radius: 6px; border: 1px solid #e5e7eb;">
                  <div style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 4px;">${questionsAnswered}</div>
                  <div style="font-size: 12px; color: #6b7280;">Questions Answered</div>
                </div>
                <div style="text-align: center; padding: 16px; background: #ffffff; border-radius: 6px; border: 1px solid #e5e7eb;">
                  <div style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 4px;">${duration}</div>
                  <div style="font-size: 12px; color: #6b7280;">Session Duration</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Conversation Summary Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #10b981; padding-left: 16px;">
              Key Discussion Points
            </h2>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
              <p style="margin: 0; color: #065f46; font-size: 16px; line-height: 1.6;">
                ${conversationSummary}
              </p>
            </div>
          </div>

          <!-- Detailed Logs Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #f59e0b; padding-left: 16px;">
              Complete Conversation Transcript
            </h2>
            
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 24px; margin-bottom: 30px; max-height: 400px; overflow-y: auto;">
              ${detailedLogs.map((log, index) => `
                <div style="margin-bottom: 16px; padding: 16px; background: #ffffff; border-radius: 6px; border: 1px solid #e5e7eb;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 600; color: ${log.speaker === 'ai' ? '#1e40af' : '#059669'}; font-size: 14px; display: flex; align-items: center;">
                      ${log.speaker === 'ai' ? '🤖 ' + interviewerName : '👤 You'}
                    </span>
                    <span style="color: #9ca3af; font-size: 12px; font-weight: 500;">
                      ${new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
                    ${log.text}
                  </p>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Action Section -->
          <div style="padding: 0 20px 20px 20px; text-align: center;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">Ready to Continue?</h3>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
                Your interview progress has been automatically saved. Click the button below to resume your session exactly where you left off.
              </p>
              <a href="${resumeUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);">
                🔄 Resume Interview Session
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 30px 20px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">
              Thank you for using Jastalk.AI for your interview preparation.
            </p>
            <p style="margin: 0 0 16px 0; color: #9ca3af; font-size: 12px;">
              © 2024 Jastalk.AI. All rights reserved. | Professional Interview Practice Platform
            </p>
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 16px;">
              <span style="color: #9ca3af; font-size: 11px;">📧 noreply@jastalk.com</span>
              <span style="color: #9ca3af; font-size: 11px;">🌐 jastalk.ai</span>
            </div>
          </div>
        </div>
      `
    };

    // Send email
    await sgMail.send(pauseSummaryEmail);

    return NextResponse.json({
      success: true,
      message: 'Interview pause summary email sent successfully'
    });

  } catch (error) {
    console.error('Error sending interview pause summary email:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send interview pause summary email'
    }, { status: 500 });
  }
}
