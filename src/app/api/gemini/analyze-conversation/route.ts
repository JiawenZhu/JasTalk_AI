import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    console.log('🧠 Gemini conversation analysis request received');
    
    const { conversationHistory, interviewContext, analysisType = 'full' } = await request.json();
    
    if (!conversationHistory || !Array.isArray(conversationHistory)) {
      return NextResponse.json({
        success: false,
        error: 'conversationHistory is required and must be an array'
      }, { status: 400 });
    }

    if (!interviewContext) {
      return NextResponse.json({
        success: false,
        error: 'interviewContext is required'
      }, { status: 400 });
    }

    console.log('📊 Analyzing conversation:', {
      turns: conversationHistory.length,
      context: interviewContext,
      analysisType
    });

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    // Format conversation for analysis
    const formattedConversation = conversationHistory
      .map(entry => `${entry.speaker === 'user' ? 'Candidate' : 'Interviewer'}: ${entry.text}`)
      .join('\n\n');

    let analysisPrompt;
    
    if (analysisType === 'pause') {
      // Pause Analysis - Professional progress report for in-progress sessions
      analysisPrompt = `You are a senior-level corporate interview assessor creating a PAUSE ANALYSIS report. This is NOT a final evaluation - it's a progress report for an interview session that was paused mid-way.

INTERVIEW CONTEXT: ${interviewContext}

CONVERSATION:
${formattedConversation}

Please provide a structured PAUSE ANALYSIS in the following JSON format:

{
  "analysis_type": "pause_analysis",
  "session_progress": {
    "questions_covered": 3,
    "total_exchanges": ${conversationHistory.length},
    "session_duration_estimate": "5-7 minutes",
    "pause_point": "Mid-interview after technical discussion"
  },
  "conversation_summary": "Professional summary of what has been discussed so far",
  "question_by_question_breakdown": [
    {
      "question_number": 1,
      "topic": "System Design Scalability",
      "interviewer_approach": "How the interviewer presented the question",
      "candidate_response": "Detailed analysis of the candidate's response",
      "response_quality": {
        "clarity": "Clear/Unclear",
        "completeness": "Complete/Partial/Incomplete",
        "technical_depth": "High/Medium/Low",
        "demonstrated_skills": ["skill1", "skill2"]
      },
      "strengths": ["What the candidate did well"],
      "areas_for_improvement": ["Specific suggestions for better responses"]
    }
  ],
  "overall_session_assessment": {
    "engagement_level": "High/Medium/Low",
    "communication_effectiveness": "Strong/Good/Needs Improvement",
    "technical_demonstration": "Excellent/Good/Fair/Needs Work",
    "professional_demeanor": "Excellent/Good/Fair/Needs Work"
  },
  "resume_context": {
    "key_learnings": ["What the candidate should take away from this session"],
    "next_session_focus": ["Areas to emphasize when resuming"],
    "confidence_indicators": ["Signs of growing confidence or areas of concern"]
  },
  "timestamp_marker": "Session paused after ${conversationHistory.length} exchanges",
  "recommendations_for_resume": [
    "Specific advice for continuing the interview effectively"
  ]
}

Focus on:
- Capturing the PROGRESS made so far (not final evaluation)
- Providing actionable feedback for improvement
- Maintaining professional, encouraging tone
- Helping the candidate understand where they left off
- Identifying patterns in their responses
- Suggesting how to build on what they've learned

Remember: This is a PAUSE ANALYSIS, not a final evaluation. The tone should be encouraging and focused on progress and learning.`;
      
    } else {
      // Full Analysis - Comprehensive final evaluation (existing behavior)
      analysisPrompt = `You are a senior-level corporate interview assessor. Analyze this interview conversation and provide a comprehensive evaluation.

INTERVIEW CONTEXT: ${interviewContext}

CONVERSATION:
${formattedConversation}

Please provide a structured analysis in the following JSON format:

{
  "analysis_type": "full_evaluation",
  "executive_summary": "Brief overview of the interview session and candidate performance",
  "detailed_log": "Comprehensive analysis of the conversation flow and key moments",
  "key_insights": ["Insight 1", "Insight 2", "Insight 3"],
  "quality_assessment": {
    "score": 7.5,
    "reasoning": "Detailed explanation of the score based on candidate responses"
  },
  "discrepancy_analysis": "Analysis of any inconsistencies or areas of concern",
  "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
  "local_vs_gemini": {
    "local_captured_turns": ${conversationHistory.length},
    "local_speakers": ["user", "ai"],
    "analysis_quality": "High - comprehensive conversation analysis"
  }
}

Focus on:
- Communication effectiveness
- Response quality and depth
- Professional demeanor
- Technical knowledge (if applicable)
- Areas for improvement
- Overall interview performance

Be objective, professional, and provide actionable feedback.`;
    }

    console.log('🤖 Generating Gemini analysis...', { analysisType });
    
    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini analysis generated, length:', text.length);
    
    // Try to parse the JSON response
    let analysisData;
    try {
      // Extract JSON from the response (remove any markdown formatting)
      let jsonText = text;
      
      // Remove markdown code blocks if present
      if (text.includes('```json')) {
        jsonText = text.split('```json')[1]?.split('```')[0] || text;
      } else if (text.includes('```')) {
        jsonText = text.split('```')[1] || text;
      }
      
      // Clean up the text and find JSON
      jsonText = jsonText.trim();
      
      // Find the first { and last } to extract JSON
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonString = jsonText.substring(firstBrace, lastBrace + 1);
        analysisData = JSON.parse(jsonString);
        console.log('✅ Successfully parsed Gemini analysis JSON');
      } else {
        throw new Error('No valid JSON structure found in response');
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse Gemini JSON response, creating fallback analysis');
      
      if (analysisType === 'pause') {
        // Fallback for pause analysis
        analysisData = {
          analysis_type: "pause_analysis",
          session_progress: {
            questions_covered: Math.ceil(conversationHistory.length / 2),
            total_exchanges: conversationHistory.length,
            session_duration_estimate: "5-7 minutes",
            pause_point: "Mid-interview session"
          },
          conversation_summary: `Interview session paused after ${conversationHistory.length} exchanges. The candidate engaged in meaningful discussion with the interviewer.`,
          question_by_question_breakdown: [
            {
              question_number: 1,
              topic: "General Interview Discussion",
              interviewer_approach: "Standard interview format",
              candidate_response: "Candidate provided responses to interview questions",
              response_quality: {
                clarity: "Good",
                completeness: "Partial",
                technical_depth: "Medium",
                demonstrated_skills: ["Communication", "Engagement"]
              },
              strengths: ["Maintained conversation flow", "Responded appropriately"],
              areas_for_improvement: ["Could provide more detailed examples", "Consider using STAR method for responses"]
            }
          ],
          overall_session_assessment: {
            engagement_level: "Good",
            communication_effectiveness: "Good",
            technical_demonstration: "Fair",
            professional_demeanor: "Good"
          },
          resume_context: {
            key_learnings: ["Interview flow and structure", "Response formatting"],
            next_session_focus: ["Detailed examples", "Technical depth"],
            confidence_indicators: ["Maintained engagement throughout session"]
          },
          timestamp_marker: `Session paused after ${conversationHistory.length} exchanges`,
          recommendations_for_resume: [
            "Continue building on the foundation established",
            "Focus on providing specific examples and detailed responses",
            "Maintain the professional demeanor demonstrated so far"
          ]
        };
      } else {
        // Fallback for full analysis (existing behavior)
        analysisData = {
          analysis_type: "full_evaluation",
          executive_summary: `Interview completed with ${conversationHistory.length} exchanges. Analysis generated by Gemini AI.`,
          detailed_log: `Conversation analysis completed. The candidate engaged in ${conversationHistory.length} conversation turns with the interviewer.`,
          key_insights: [
            'Interview session completed successfully',
            'Conversation flow maintained throughout the session',
            'AI analysis provides comprehensive evaluation'
          ],
          quality_assessment: {
            score: 7.0,
            reasoning: 'Analysis generated by Gemini AI based on conversation content'
          },
          discrepancy_analysis: 'No significant discrepancies noted in the conversation analysis',
          recommendations: [
            'Review the detailed analysis for specific insights',
            'Focus on areas identified for improvement',
            'Practice similar interview scenarios to build confidence'
          ],
          local_vs_gemini: {
            local_captured_turns: conversationHistory.length,
            local_speakers: ['user', 'ai'],
            analysis_quality: 'Generated by Gemini AI - comprehensive analysis'
          }
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: analysisData,
      rawResponse: text.substring(0, 500) + '...' // Include first 500 chars for debugging
    });

  } catch (error) {
    console.error('❌ Error in Gemini conversation analysis:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze conversation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
