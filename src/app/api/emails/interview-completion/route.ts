import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

interface InterviewCompletionRequest {
  to: string;
  username: string;
  interviewTitle: string;
  score: number;
  totalQuestions: number;
  duration: string;
  feedback: string;
  improvementTips: string[];
  nextSteps: string;
  // Gemini analysis fields for enhanced completion reports
  geminiAnalysis?: {
    analysisType?: string;
    executiveSummary: string;
    detailedLog: string;
    keyInsights: string[];
    qualityAssessment: {
      score: number;
      reasoning: string;
    };
    discrepancyAnalysis: string;
    recommendations: string[];
    localVsGemini: {
      localCapturedTurns: number;
      localSpeakers: string[];
      analysisQuality: number | string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const { 
      to, 
      username, 
      interviewTitle, 
      score, 
      totalQuestions, 
      duration, 
      feedback, 
      improvementTips, 
      nextSteps,
      geminiAnalysis
    }: InterviewCompletionRequest = await request.json();

    if (!to || !username || !interviewTitle) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: to, username, and interviewTitle are required'
      }, { status: 400 });
    }

    // Set API key
    sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

    const scorePercentage = Math.round((score / totalQuestions) * 100);
    const scoreColor = scorePercentage >= 80 ? '#38a169' : scorePercentage >= 60 ? '#d69e2e' : '#e53e3e';
    const scoreEmoji = scorePercentage >= 80 ? '🎉' : scorePercentage >= 60 ? '👍' : '💪';

    const completionEmail = {
      to,
      from: 'noreply@jastalk.com',
      fromName: 'Jastalk.AI Interview Coach',
      subject: `📊 Interview Complete: ${interviewTitle}`,
      text: `Hi ${username}, your interview "${interviewTitle}" is complete! Score: ${score}/${totalQuestions} (${scorePercentage}%). Duration: ${duration}. Check your email for detailed feedback and improvement tips.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); padding: 40px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">📊 Interview Complete!</h1>
            <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Great job, ${username}!</p>
          </div>

          <!-- Main Content -->
          <div style="padding: 40px 20px;">
            <h2 style="color: #2d3748; margin-bottom: 20px;">${interviewTitle}</h2>
            
            <!-- Score Summary -->
            <div style="background: #f7fafc; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 10px;">${scoreEmoji}</div>
              <h3 style="color: #2d3748; margin: 10px 0; font-size: 24px;">Your Score</h3>
              <div style="font-size: 36px; font-weight: bold; color: ${scoreColor}; margin: 10px 0;">
                ${scorePercentage}%
              </div>
              <p style="color: #4a5568; margin: 5px 0; font-size: 16px;">
                ${score} out of ${totalQuestions} questions correct
              </p>
              <p style="color: #718096; margin: 5px 0; font-size: 14px;">
                Duration: ${duration}
              </p>
            </div>

            <!-- Feedback Section -->
            <div style="margin: 25px 0;">
              <h3 style="color: #2d3748; margin-bottom: 15px;">💬 AI Feedback</h3>
              <div style="background: #edf2f7; padding: 20px; border-radius: 8px; border-left: 4px solid #4299e1;">
                <p style="color: #2d3748; margin: 0; font-size: 16px; line-height: 1.6;">
                  ${feedback}
                </p>
              </div>
            </div>

            <!-- Improvement Tips -->
            ${improvementTips && improvementTips.length > 0 ? `
            <div style="margin: 25px 0;">
              <h3 style="color: #2d3748; margin-bottom: 15px;">🚀 Improvement Tips</h3>
              <div style="background: #f0fff4; padding: 20px; border-radius: 8px; border-left: 4px solid #38a169;">
                <ul style="color: #2d3748; margin: 0; font-size: 16px; line-height: 1.6; padding-left: 20px;">
                  ${improvementTips.map(tip => `<li style="margin-bottom: 8px;">${tip}</li>`).join('')}
                </ul>
              </div>
            </div>
            ` : ''}

            <!-- Next Steps -->
            <div style="margin: 25px 0;">
              <h3 style="color: #2d3748; margin-bottom: 15px;">📋 Next Steps</h3>
              <div style="background: #fffaf0; padding: 20px; border-radius: 8px; border-left: 4px solid #ed8936;">
                <p style="color: #2d3748; margin: 0; font-size: 16px; line-height: 1.6;">
                  ${nextSteps}
                </p>
              </div>
            </div>

            <!-- AI Performance Analysis -->
            ${geminiAnalysis ? `
            <div style="margin: 25px 0;">
              <h3 style="color: #2d3748; margin-bottom: 15px;">🤖 AI Performance Analysis</h3>
              
              <!-- Executive Summary -->
              ${geminiAnalysis.executiveSummary ? `
              <div style="background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h4 style="color: #111827; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📋 Executive Summary</h4>
                <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.6;">${geminiAnalysis.executiveSummary}</p>
              </div>
              ` : ''}
              
              <!-- Quality Assessment -->
              ${geminiAnalysis.qualityAssessment ? `
              <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h4 style="color: #111827; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">⭐ Quality Assessment</h4>
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                  <div style="background: #10b981; color: white; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; margin-right: 16px;">
                    <span style="font-size: 20px; font-weight: 700;">${geminiAnalysis.qualityAssessment.score}</span>
                  </div>
                  <div>
                    <div style="font-size: 18px; font-weight: 600; color: #059669; margin-bottom: 4px;">${geminiAnalysis.qualityAssessment.score}/10</div>
                    <div style="color: #374151; font-size: 13px;">${geminiAnalysis.qualityAssessment.reasoning}</div>
                  </div>
                </div>
              </div>
              ` : ''}
              
              <!-- Key Insights -->
              ${geminiAnalysis.keyInsights && geminiAnalysis.keyInsights.length > 0 ? `
              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h4 style="color: #111827; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">🔍 Key Insights</h4>
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                  ${geminiAnalysis.keyInsights.map((insight, index) => `
                    <div style="background: #ffffff; border-radius: 6px; padding: 12px; border-left: 3px solid #f59e0b;">
                      <div style="font-weight: 600; color: #92400e; margin-bottom: 4px; font-size: 13px;">Insight ${index + 1}</div>
                      <div style="color: #374151; font-size: 13px; line-height: 1.5;">${insight}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
              
              <!-- Recommendations -->
              ${geminiAnalysis.recommendations && geminiAnalysis.recommendations.length > 0 ? `
              <div style="background: #fdf2f8; border: 1px solid #ec4899; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h4 style="color: #111827; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">💡 AI Recommendations</h4>
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                  ${geminiAnalysis.recommendations.map((rec, index) => `
                    <div style="background: #ffffff; border-radius: 6px; padding: 12px; border-left: 3px solid #ec4899;">
                      <div style="font-weight: 600; color: #be185d; margin-bottom: 4px; font-size: 13px;">Recommendation ${index + 1}</div>
                      <div style="color: #374151; font-size: 13px; line-height: 1.5;">${rec}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
            </div>
            ` : ''}

            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://jastalk.ai'}/dashboard" 
                 style="display: inline-block; background: #4299e1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                🚀 Practice Again
              </a>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0; color: #718096; font-size: 14px;">
              <p>Keep practicing to improve your interview skills!</p>
              <p>© 2024 Jastalk.AI. All rights reserved.</p>
            </div>
          </div>
        </div>
      `
    };

    // Send email
    await sgMail.send(completionEmail);

    return NextResponse.json({
      success: true,
      message: 'Interview completion email sent successfully'
    });

  } catch (error) {
    console.error('Error sending interview completion email:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send interview completion email'
    }, { status: 500 });
  }
}
