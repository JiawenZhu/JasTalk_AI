import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Function to generate personalized improvement resources based on analysis
function generatePersonalizedResources(questionAnalysis?: Array<any>, geminiAnalysis?: any): string {
  if (!questionAnalysis && !geminiAnalysis) {
    return '';
  }

  const resourceMap: { [key: string]: Array<{ title: string; url: string; description: string }> } = {
    'communication': [
      { title: 'Communication Skills for Technical Interviews', url: 'https://www.youtube.com/watch?v=8jPQjjsBbIc', description: 'Master clear communication in technical interviews' },
      { title: 'How to Explain Complex Technical Concepts', url: 'https://www.youtube.com/watch?v=8jPQjjsBbIc', description: 'Learn to break down complex topics clearly' }
    ],
    'technical': [
      { title: 'System Design Interview Preparation', url: 'https://www.youtube.com/watch?v=8jPQjjsBbIc', description: 'Comprehensive system design interview guide' },
      { title: 'Data Structures & Algorithms Practice', url: 'https://www.youtube.com/watch?v=8jPQjjsBbIc', description: 'Essential DSA concepts for interviews' }
    ],
    'problem-solving': [
      { title: 'Problem Solving Framework for Interviews', url: 'https://www.youtube.com/watch?v=8jPQjjsBbIc', description: 'Structured approach to solving interview problems' },
      { title: 'Technical Problem Solving Strategies', url: 'https://www.youtube.com/watch?v=8jPQjjsBbIc', description: 'Effective strategies for technical challenges' }
    ],
    'confidence': [
      { title: 'Building Confidence in Technical Interviews', url: 'https://www.youtube.com/watch?v=8jPQjjsBbIc', description: 'Boost your confidence and presence' },
      { title: 'Interview Body Language and Presence', url: 'https://www.youtube.com/watch?v=8jPQjjsBbIc', description: 'Master non-verbal communication' }
    ],
    'clarity': [
      { title: 'Clear Communication in Tech Interviews', url: 'https://www.youtube.com/watch?v=8jPQjjsBbIc', description: 'Improve clarity and articulation' },
      { title: 'Structuring Your Interview Responses', url: 'https://www.youtube.com/watch?v=8jPQjjsBbIc', description: 'Organize your thoughts effectively' }
    ],
    'completeness': [
      { title: 'Complete Interview Responses', url: 'https://www.youtube.com/watch?v=8jPQjjsBbIc', description: 'Ensure comprehensive answers' },
      { title: 'Interview Answer Framework', url: 'https://www.youtube.com/watch?v=8jPQjjsBbIc', description: 'Structure for complete responses' }
    ]
  };

  const identifiedAreas = new Set<string>();
  
  // Analyze question analysis for weaknesses
  if (questionAnalysis) {
    questionAnalysis.forEach(q => {
      if (q.areasForImprovement) {
        q.areasForImprovement.forEach((area: string) => {
          const lowerArea = area.toLowerCase();
          if (lowerArea.includes('communication') || lowerArea.includes('clarity')) identifiedAreas.add('communication');
          if (lowerArea.includes('technical') || lowerArea.includes('depth')) identifiedAreas.add('technical');
          if (lowerArea.includes('problem') || lowerArea.includes('solving')) identifiedAreas.add('problem-solving');
          if (lowerArea.includes('confidence') || lowerArea.includes('nervous')) identifiedAreas.add('confidence');
          if (lowerArea.includes('complete') || lowerArea.includes('thorough')) identifiedAreas.add('completeness');
        });
      }
    });
  }

  // Analyze Gemini analysis for weaknesses
  if (geminiAnalysis?.recommendations) {
    geminiAnalysis.recommendations.forEach((rec: string) => {
      const lowerRec = rec.toLowerCase();
      if (lowerRec.includes('communication') || lowerRec.includes('clarity')) identifiedAreas.add('communication');
      if (lowerRec.includes('technical') || lowerRec.includes('depth')) identifiedAreas.add('technical');
      if (lowerRec.includes('problem') || lowerRec.includes('solving')) identifiedAreas.add('problem-solving');
      if (lowerRec.includes('confidence') || lowerRec.includes('nervous')) identifiedAreas.add('confidence');
      if (lowerRec.includes('complete') || lowerRec.includes('thorough')) identifiedAreas.add('completeness');
    });
  }

  if (identifiedAreas.size === 0) {
    return '';
  }

  let resourcesHtml = `
    <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 5px;">
      <h3 style="color: #007bff; margin: 0 0 15px 0; font-size: 18px;">🎯 Recommended Resources for Improvement</h3>
      <p style="margin: 0 0 15px 0; color: #6c757d; font-size: 14px;">Based on your interview performance, here are targeted resources to help you improve:</p>
  `;

  identifiedAreas.forEach(area => {
    const areaResources = resourceMap[area];
    if (areaResources) {
      resourcesHtml += `<h4 style="color: #495057; margin: 20px 0 10px 0; font-size: 16px; text-transform: capitalize;">${area.replace('-', ' ')} Skills</h4>`;
      areaResources.forEach(resource => {
        resourcesHtml += `
          <div style="margin: 10px 0; padding: 10px; background-color: white; border-radius: 4px; border: 1px solid #dee2e6;">
            <a href="${resource.url}" style="color: #007bff; text-decoration: none; font-weight: 600; display: block; margin-bottom: 5px;">
              📺 ${resource.title}
            </a>
            <p style="margin: 0; color: #6c757d; font-size: 13px;">${resource.description}</p>
          </div>
        `;
      });
    }
  });

  resourcesHtml += `</div>`;
  return resourcesHtml;
}

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
  // Enhanced conversation logs and question analysis
  conversationTranscript?: Array<{
    turnNumber: number;
    speaker: 'USER' | 'AGENT';
    text: string;
    timestamp: string;
    questionContext?: string;
    responseQuality?: {
      clarity: string;
      completeness: string;
      technicalDepth: string;
      confidence: string;
    };
  }>;
  questionAnalysis?: Array<{
    questionNumber: number;
    questionText: string;
    userResponse: string;
    aiFeedback: string;
    strengths: string[];
    areasForImprovement: string[];
    score: number;
    topic: string;
    difficulty: string;
  }>;
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
      conversationTranscript,
      questionAnalysis,
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

            <!-- Detailed Conversation Transcript Section -->
            ${conversationTranscript && conversationTranscript.length > 0 ? `
            <div style="margin: 25px 0;">
              <h3 style="color: #2d3748; margin-bottom: 15px;">📝 Complete Conversation Transcript</h3>
              <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 20px 0; color: #065f46; font-size: 14px; line-height: 1.6;">
                  Review your complete conversation exchange. Each turn shows the question context and your response quality.
                </p>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                  ${conversationTranscript.map((turn, index) => `
                    <div style="background: #ffffff; border-radius: 6px; padding: 16px; border-left: 4px solid ${turn.speaker === 'USER' ? '#10b981' : '#3b82f6'};">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-weight: 600; color: ${turn.speaker === 'USER' ? '#065f46' : '#1e40af'}; font-size: 14px;">
                          ${turn.speaker === 'USER' ? '👤 You' : '🤖 Interviewer'}
                        </div>
                        <div style="color: #6b7280; font-size: 11px;">Turn ${turn.turnNumber}</div>
                      </div>
                      
                      <div style="margin-bottom: 8px;">
                        <div style="color: #374151; font-size: 13px; line-height: 1.5; white-space: pre-wrap;">${turn.text}</div>
                      </div>
                      
                      ${turn.questionContext ? `
                      <div style="background: #f3f4f6; border-radius: 4px; padding: 8px; margin-bottom: 8px;">
                        <div style="font-weight: 600; color: #374151; margin-bottom: 2px; font-size: 11px;">Question Context:</div>
                        <div style="color: #6b7280; font-size: 11px;">${turn.questionContext}</div>
                      </div>
                      ` : ''}
                      
                      ${turn.responseQuality ? `
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
                        <div style="background: #f9fafb; border-radius: 4px; padding: 8px;">
                          <div style="font-weight: 600; color: #059669; margin-bottom: 2px; font-size: 10px;">Clarity:</div>
                          <div style="color: #6b7280; font-size: 10px;">${turn.responseQuality.clarity}</div>
                        </div>
                        <div style="background: #f9fafb; border-radius: 4px; padding: 8px;">
                          <div style="font-weight: 600; color: #059669; margin-bottom: 2px; font-size: 10px;">Completeness:</div>
                          <div style="color: #6b7280; font-size: 10px;">${turn.responseQuality.completeness}</div>
                        </div>
                        <div style="background: #f9fafb; border-radius: 4px; padding: 8px;">
                          <div style="font-weight: 600; color: #059669; margin-bottom: 2px; font-size: 10px;">Technical Depth:</div>
                          <div style="color: #6b7280; font-size: 10px;">${turn.responseQuality.technicalDepth}</div>
                        </div>
                        <div style="background: #f9fafb; border-radius: 4px; padding: 8px;">
                          <div style="font-weight: 600; color: #059669; margin-bottom: 2px; font-size: 10px;">Confidence:</div>
                          <div style="color: #6b7280; font-size: 10px;">${turn.responseQuality.confidence}</div>
                        </div>
                      </div>
                      ` : ''}
                      
                      <div style="color: #9ca3af; font-size: 10px; margin-top: 8px; text-align: right;">
                        ${new Date(turn.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            ` : ''}

            <!-- Question-by-Question Analysis Section -->
            ${questionAnalysis && questionAnalysis.length > 0 ? `
            <div style="margin: 25px 0;">
              <h3 style="color: #2d3748; margin-bottom: 15px;">🔍 Question-by-Question Performance Analysis</h3>
              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <p style="margin: 0 0 20px 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  Detailed breakdown of how you performed on each question, including specific feedback and improvement areas.
                </p>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 16px;">
                  ${questionAnalysis.map((question, index) => `
                    <div style="background: #ffffff; border-radius: 6px; padding: 20px; border-left: 4px solid #f59e0b;">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
                        <div>
                          <div style="font-weight: 600; color: #92400e; margin-bottom: 8px; font-size: 16px;">
                            Question ${question.questionNumber}: ${question.topic}
                          </div>
                          <div style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">
                            Difficulty: <span style="font-weight: 600; color: #374151;">${question.difficulty}</span>
                          </div>
                          <div style="color: #6b7280; font-size: 12px;">
                            Score: <span style="font-weight: 600; color: #374151;">${question.score}/10</span>
                          </div>
                        </div>
                        <div style="background: ${question.score >= 8 ? '#dcfce7' : question.score >= 6 ? '#fef3c7' : '#fee2e2'}; border-radius: 6px; padding: 8px 12px; text-align: center; min-width: 60px;">
                          <div style="font-weight: 700; color: ${question.score >= 8 ? '#166534' : question.score >= 6 ? '#92400e' : '#dc2626'}; font-size: 16px;">${question.score}</div>
                          <div style="color: ${question.score >= 8 ? '#166534' : question.score >= 6 ? '#92400e' : '#dc2626'}; font-size: 10px;">/10</div>
                        </div>
                      </div>
                      
                      <div style="margin-bottom: 16px;">
                        <div style="font-weight: 600; color: #374151; margin-bottom: 8px; font-size: 14px;">Question:</div>
                        <div style="color: #6b7280; font-size: 13px; line-height: 1.5; background: #f9fafb; padding: 12px; border-radius: 6px;">${question.questionText}</div>
                      </div>
                      
                      <div style="margin-bottom: 16px;">
                        <div style="font-weight: 600; color: #374151; margin-bottom: 8px; font-size: 14px;">Your Response:</div>
                        <div style="color: #6b7280; font-size: 13px; line-height: 1.5; background: #f9fafb; padding: 12px; border-radius: 6px;">${question.userResponse}</div>
                      </div>
                      
                      <div style="margin-bottom: 16px;">
                        <div style="font-weight: 600; color: #374151; margin-bottom: 8px; font-size: 14px;">AI Feedback:</div>
                        <div style="color: #6b7280; font-size: 13px; line-height: 1.5; background: #f9fafb; padding: 12px; border-radius: 6px;">${question.aiFeedback}</div>
                      </div>
                      
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div>
                          <div style="font-weight: 600; color: #059669; margin-bottom: 8px; font-size: 13px;">✅ Strengths:</div>
                          <ul style="margin: 0; padding-left: 16px; color: #6b7280; font-size: 12px;">
                            ${question.strengths.map(strength => `<li>${strength}</li>`).join('')}
                          </ul>
                        </div>
                        <div>
                          <div style="font-weight: 600; color: #dc2626; margin-bottom: 8px; font-size: 13px;">💡 Areas for Improvement:</div>
                          <ul style="margin: 0; padding-left: 16px; color: #6b7280; font-size: 12px;">
                            ${question.areasForImprovement.map(area => `<li>${area}</li>`).join('')}
                          </ul>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            ` : ''}

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

            <!-- Recommended Resources Section -->
            ${generatePersonalizedResources(questionAnalysis, geminiAnalysis)}

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
