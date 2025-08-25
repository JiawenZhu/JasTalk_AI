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
  // New Gemini pause analysis fields
  geminiAnalysis?: {
    analysisType?: string;
    sessionProgress?: {
      questionsCovered: number;
      totalExchanges: number;
      sessionDurationEstimate: string;
      pausePoint: string;
    };
    conversationSummary?: string;
    questionBreakdown?: Array<{
      questionNumber: number;
      topic: string;
      interviewerApproach: string;
      candidateResponse: string;
      responseQuality: {
        clarity: string;
        completeness: string;
        technicalDepth: string;
        demonstratedSkills: string[];
      };
      strengths: string[];
      areasForImprovement: string[];
    }>;
    overallAssessment?: {
      engagementLevel: string;
      communicationEffectiveness: string;
      technicalDemonstration: string;
      professionalDemeanor: string;
    };
    resumeContext?: {
      keyLearnings: string[];
      nextSessionFocus: string[];
      confidenceIndicators: string[];
    };
    timestampMarker?: string;
    recommendationsForResume?: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Interview pause summary email request received');
    
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
      resumeUrl,
      geminiAnalysis
    }: InterviewPauseSummaryRequest = await request.json();

    if (!to || !username || !interviewTitle || !interviewerName) {
      console.error('❌ Missing required fields:', { to, username, interviewTitle, interviewerName });
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, username, interviewTitle, and interviewerName are required'
      }, { status: 400 });
    }

    // Validate SendGrid configuration
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (!sendgridApiKey) {
      console.error('❌ SENDGRID_API_KEY environment variable is not set');
      return NextResponse.json({
        success: false,
        error: 'SendGrid API key not configured'
      }, { status: 500 });
    }

    console.log('🔑 SendGrid API key configured, length:', sendgridApiKey.length);
    console.log('📬 Sending email to:', to, 'from:', process.env.SENDGRID_FROM_EMAIL || 'noreply@jastalk.com');

    // Set API key
    sgMail.setApiKey(sendgridApiKey);

    const progressPercentage = Math.round((questionsAnswered / totalQuestions) * 100);
    const progressColor = progressPercentage >= 80 ? '#38a169' : progressPercentage >= 60 ? '#d69e2e' : '#e53e3e';
    const progressEmoji = progressPercentage >= 80 ? '🚀' : progressPercentage >= 60 ? '👍' : '💪';

    const pauseSummaryEmail = {
      to,
      from: 'noreply@jastalk.com',
      fromName: 'Jastalk.AI Interview Coach',
      subject: `⏸️ Jastalk.AI - Your Interview Pause Analysis`,
      text: `Hi ${username}, your interview "${interviewTitle}" with ${interviewerName} has been paused. Progress: ${questionsAnswered}/${totalQuestions} questions (${progressPercentage}%). Duration: ${duration}. View your detailed pause analysis in this email.`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 700px; margin: 0 auto; background: #ffffff; color: #333333;">
          <!-- Header -->
          <div style="text-align: center; padding: 40px 20px; border-bottom: 1px solid #e5e7eb; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);">
            <div style="background: rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; display: inline-block;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; margin-bottom: 8px;">Jastalk.AI</h1>
              <p style="margin: 0; font-size: 16px; color: #e0e7ff; font-weight: 500;">Professional Interview Performance Analysis</p>
            </div>
          </div>

          <!-- Greeting -->
          <div style="padding: 40px 20px 20px 20px;">
            <p style="margin: 0 0 30px 0; font-size: 18px; color: #374151; line-height: 1.6;">
              Dear ${username},
            </p>
            <p style="margin: 0 0 40px 0; font-size: 16px; color: #6b7280; line-height: 1.6;">
              Your interview practice session has been paused. Below you'll find your detailed pause analysis with progress insights and recommendations to help you continue effectively when you resume.
            </p>
          </div>

          <!-- Session Overview Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #3b82f6; padding-left: 16px;">
              📋 Session Overview
            </h2>
            
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
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

          <!-- Performance Matrix Section -->
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #10b981; padding-left: 16px;">
              📊 Performance Matrix
            </h2>
            
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
              <p style="margin: 0 0 20px 0; color: #065f46; font-size: 16px; line-height: 1.6; font-weight: 500;">
                ${conversationSummary}
              </p>
              
              <!-- Performance Score -->
              <div style="text-align: center; background: #ffffff; border: 2px solid #10b981; border-radius: 12px; padding: 24px; margin: 20px 0;">
                <div style="font-size: 32px; font-weight: 700; color: #059669; margin-bottom: 8px;">${progressPercentage}%</div>
                <div style="font-size: 16px; color: #065f46; font-weight: 600;">Overall Session Completion</div>
                <div style="font-size: 14px; color: #6b7280; margin-top: 8px;">
                  ${questionsAnswered} of ${totalQuestions} questions completed in ${duration}
                </div>
              </div>
            </div>
          </div>

          <!-- AI Pause Analysis Section -->
          ${geminiAnalysis ? `
          <div style="padding: 0 20px 20px 20px;">
            <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; border-left: 4px solid #8b5cf6; padding-left: 16px;">
              🤖 AI Pause Analysis
            </h2>
            
            <!-- Session Progress Summary -->
            ${geminiAnalysis.sessionProgress ? `
            <div style="background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">📊 Session Progress Summary</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="background: #ffffff; border-radius: 8px; padding: 16px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: #1e40af; margin-bottom: 4px;">${geminiAnalysis.sessionProgress.questionsCovered}</div>
                  <div style="color: #6b7280; font-size: 14px;">Questions Covered</div>
                </div>
                <div style="background: #ffffff; border-radius: 8px; padding: 16px; text-align: center;">
                  <div style="font-size: 24px; font-weight: 700; color: #059669; margin-bottom: 4px;">${geminiAnalysis.sessionProgress.totalExchanges}</div>
                  <div style="color: #6b7280; font-size: 14px;">Total Exchanges</div>
                </div>
              </div>
              <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                <div style="color: #374151; font-size: 14px; margin-bottom: 8px;"><strong>Duration Estimate:</strong> ${geminiAnalysis.sessionProgress.sessionDurationEstimate}</div>
                <div style="color: #374151; font-size: 14px;"><strong>Pause Point:</strong> ${geminiAnalysis.sessionProgress.pausePoint}</div>
              </div>
            </div>
            ` : ''}
            
            <!-- Conversation Summary -->
            ${geminiAnalysis.conversationSummary ? `
            <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">📝 Conversation Summary</h3>
              <p style="margin: 0; color: #374151; line-height: 1.6; font-size: 15px;">${geminiAnalysis.conversationSummary}</p>
            </div>
            ` : ''}
            
            <!-- Question-by-Question Breakdown -->
            ${geminiAnalysis.questionBreakdown && geminiAnalysis.questionBreakdown.length > 0 ? `
            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">🔍 Question-by-Question Breakdown</h3>
              <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
                ${geminiAnalysis.questionBreakdown.map((question, index) => `
                  <div style="background: #ffffff; border-radius: 8px; padding: 20px; border-left: 4px solid #f59e0b;">
                    <div style="font-weight: 600; color: #92400e; margin-bottom: 12px; font-size: 16px;">Question ${question.questionNumber}: ${question.topic}</div>
                    <div style="margin-bottom: 12px;">
                      <div style="font-weight: 600; color: #374151; margin-bottom: 4px;">Your Response:</div>
                      <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">${question.candidateResponse}</div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
                      <div>
                        <div style="font-weight: 600; color: #059669; margin-bottom: 4px;">Strengths:</div>
                        <ul style="margin: 0; padding-left: 16px; color: #6b7280; font-size: 14px;">
                          ${question.strengths.map(strength => `<li>${strength}</li>`).join('')}
                        </ul>
                      </div>
                      <div>
                        <div style="font-weight: 600; color: #dc2626; margin-bottom: 4px;">Areas for Improvement:</div>
                        <ul style="margin: 0; padding-left: 16px; color: #6b7280; font-size: 14px;">
                          ${question.areasForImprovement.map(area => `<li>${area}</li>`).join('')}
                        </ul>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
            
            <!-- Overall Assessment -->
            ${geminiAnalysis.overallAssessment ? `
            <div style="background: #fdf2f8; border: 1px solid #ec4899; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">📊 Overall Session Assessment</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="background: #ffffff; border-radius: 8px; padding: 16px;">
                  <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">Engagement Level</div>
                  <div style="color: #6b7280; font-size: 14px;">${geminiAnalysis.overallAssessment.engagementLevel}</div>
                </div>
                <div style="background: #ffffff; border-radius: 8px; padding: 16px;">
                  <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">Communication</div>
                  <div style="color: #6b7280; font-size: 14px;">${geminiAnalysis.overallAssessment.communicationEffectiveness}</div>
                </div>
                <div style="background: #ffffff; border-radius: 8px; padding: 16px;">
                  <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">Technical Skills</div>
                  <div style="color: #6b7280; font-size: 14px;">${geminiAnalysis.overallAssessment.technicalDemonstration}</div>
                </div>
                <div style="background: #ffffff; border-radius: 8px; padding: 16px;">
                  <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">Professional Demeanor</div>
                  <div style="color: #6b7280; font-size: 14px;">${geminiAnalysis.overallAssessment.professionalDemeanor}</div>
                </div>
              </div>
            </div>
            ` : ''}
            
            <!-- Resume Context -->
            ${geminiAnalysis.resumeContext ? `
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">🔄 Resume Context</h3>
              <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
                <div>
                  <div style="font-weight: 600; color: #0c4a6e; margin-bottom: 8px;">Key Learnings:</div>
                  <ul style="margin: 0; padding-left: 16px; color: #374151; font-size: 14px;">
                    ${geminiAnalysis.resumeContext.keyLearnings.map(learning => `<li>${learning}</li>`).join('')}
                  </ul>
                </div>
                <div>
                  <div style="font-weight: 600; color: #0c4a6e; margin-bottom: 8px;">Next Session Focus:</div>
                  <ul style="margin: 0; padding-left: 16px; color: #374151; font-size: 14px;">
                    ${geminiAnalysis.resumeContext.nextSessionFocus.map(focus => `<li>${focus}</li>`).join('')}
                  </ul>
                </div>
                <div>
                  <div style="font-weight: 600; color: #0c4a6e; margin-bottom: 8px;">Confidence Indicators:</div>
                  <ul style="margin: 0; padding-left: 16px; color: #374151; font-size: 14px;">
                    ${geminiAnalysis.resumeContext.confidenceIndicators.map(indicator => `<li>${indicator}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
            ` : ''}
            
            <!-- Timestamp Marker -->
            ${geminiAnalysis.timestampMarker ? `
            <div style="background: #fefce8; border: 1px solid #eab308; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
              <div style="font-weight: 600; color: #92400e; font-size: 16px;">⏱️ ${geminiAnalysis.timestampMarker}</div>
            </div>
            ` : ''}
            
            <!-- Recommendations for Resume -->
            ${geminiAnalysis.recommendationsForResume && geminiAnalysis.recommendationsForResume.length > 0 ? `
            <div style="background: #fdf2f8; border: 1px solid #ec4899; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 600;">💡 Recommendations for Resume</h3>
              <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                ${geminiAnalysis.recommendationsForResume.map((rec, index) => `
                  <div style="background: #ffffff; border-radius: 8px; padding: 16px; border-left: 4px solid #ec4899;">
                    <div style="font-weight: 600; color: #be185d; margin-bottom: 4px;">Tip ${index + 1}</div>
                    <div style="color: #374151; font-size: 14px; line-height: 1.5;">${rec}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}
          </div>
          ` : ''}

          <!-- Action Section -->
          <div style="padding: 0 20px 20px 20px; text-align: center;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; margin-bottom: 20px;">
              <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 20px; font-weight: 600;">🚀 Take Your Interview Skills to the Next Level</h3>
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 16px; line-height: 1.5;">
                Based on your performance analysis, you have valuable insights to improve your interview skills. Practice more to see your scores improve!
              </p>
              <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                <a href="${resumeUrl}" 
                   style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(59, 130, 246, 0.3);">
                  🔄 Resume This Session
                </a>
                <a href="/practice/new" 
                   style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.3);">
                  🆕 Start New Practice
                </a>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 30px 20px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px; font-weight: 500;">
              Thank you for using Jastalk.AI for your interview preparation.
            </p>
            <p style="margin: 0 0 16px 0; color: #9ca3af; font-size: 12px;">
              © 2024 Jastalk.AI. All rights reserved. | AI-Powered Interview Performance Analysis
            </p>
            <div style="display: flex; justify-content: center; gap: 20px; margin-top: 16px;">
              <span style="color: #9ca3af; font-size: 11px;">📧 noreply@jastalk.com</span>
              <span style="color: #9ca3af; font-size: 11px;">🌐 jastalk.ai</span>
            </div>
          </div>
        </div>
      `
    };

    // Send email with retry logic
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📧 Attempt ${attempt}/${maxRetries} to send email to ${to}`);
        
        const result = await sgMail.send(pauseSummaryEmail);
        console.log('✅ Email sent successfully on attempt', attempt, 'Message ID:', result[0]?.headers['x-message-id']);
        
        return NextResponse.json({
          success: true,
          message: 'Interview pause summary email sent successfully',
          attempt: attempt,
          messageId: result[0]?.headers['x-message-id']
        });
        
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Email attempt ${attempt} failed:`, {
          error: error.message,
          code: error.code,
          response: error.response?.body
        });
        
        // If this is the last attempt, don't wait
        if (attempt === maxRetries) break;
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
            }
    }
    
    // All retries failed
    console.error('❌ All email attempts failed. Final error:', lastError);
    
    // Return detailed error information for debugging
    return NextResponse.json({
      success: false,
      error: 'Failed to send interview pause summary email after all retries',
      details: {
        attempts: maxRetries,
        lastError: lastError?.message || 'Unknown error',
        errorCode: lastError?.code || 'N/A',
        sendgridResponse: lastError?.response?.body || 'N/A'
      }
    }, { status: 500 });
    
  } catch (error) {
    console.error('❌ Unexpected error in email route:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error occurred while processing email request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
