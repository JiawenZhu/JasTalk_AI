import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase-server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// POST /api/analyze-interview - Trigger interview analysis
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use admin client for database operations
    const supabase = createAdminClient();
    const body = await request.json();

    const { interview_id } = body;

    if (!interview_id) {
      return NextResponse.json({ error: 'Interview ID is required' }, { status: 400 });
    }

    // 🔒 PHASE 1: IMMEDIATE DATA INTEGRITY CHECK
    // Prevent analysis of interviews with incomplete conversation data
    const { data: utterances, error: utterancesError } = await supabase
      .from('utterances')
      .select('speaker, text, timestamp')
      .eq('interview_id', interview_id)
      .order('timestamp', { ascending: true });

    if (utterancesError) {
      console.error('❌ Failed to fetch utterances for integrity check:', utterancesError);
      return NextResponse.json({ error: 'Failed to fetch interview data' }, { status: 500 });
    }

    // Check data integrity before proceeding
    const userUtterances = utterances.filter(u => u.speaker === 'USER');
    const agentUtterances = utterances.filter(u => u.speaker === 'AGENT');
    
    if (userUtterances.length === 0) {
      console.error(`🚨 INTERVIEW ${interview_id}: No user utterances found - marking as incomplete`);
      await supabase
        .from('interviews')
        .update({ 
          status: 'incomplete',
          metadata: { 
            data_integrity: 'MISSING_USER_RESPONSES',
            analysis_blocked: true,
            blocked_reason: 'No user utterances found during interview'
          }
        })
        .eq('id', interview_id);
      return NextResponse.json({ 
        error: 'Interview incomplete - missing user responses',
        status: 'incomplete',
        reason: 'MISSING_USER_RESPONSES'
      }, { status: 400 });
    }
    
    if (agentUtterances.length === 0) {
      console.error(`🚨 INTERVIEW ${interview_id}: No agent utterances found - marking as incomplete`);
      await supabase
        .from('interviews')
        .update({ 
          status: 'incomplete',
          metadata: { 
            data_integrity: 'MISSING_AGENT_RESPONSES',
            analysis_blocked: true,
            blocked_reason: 'No AI interviewer responses found during interview'
          }
        })
        .eq('id', interview_id);
      return NextResponse.json({ 
        error: 'Interview incomplete - missing AI responses',
        status: 'incomplete',
        reason: 'MISSING_AGENT_RESPONSES'
      }, { status: 400 });
    }

    // Data integrity check passed - proceed with analysis
    console.log(`✅ INTERVIEW ${interview_id}: Data integrity check passed. User: ${userUtterances.length}, Agent: ${agentUtterances.length}`);

    // Fetch interview and utterances
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select(`
        *,
        utterances:utterances(*)
      `)
      .eq('id', interview_id)
      .eq('user_id', user.id)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Update interview status to processing
    await supabase
      .from('interviews')
      .update({ status: 'PROCESSING_ANALYSIS' })
      .eq('id', interview_id);

    console.log(`🔄 Starting analysis for interview ${interview_id}`);

    // Prepare conversation transcript
    const transcript = interview.utterances
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((utterance: any) => `${utterance.speaker}: ${utterance.text}`)
      .join('\n');

    // Construct Gemini analysis prompt
    const analysisPrompt = `
You are an expert interview coach analyzing a mock interview session. Please provide a comprehensive analysis of the candidate's performance.

Interview Details:
- Position: ${interview.job_title || 'General'}
- Key Skills: ${interview.key_skills || 'Not specified'}
- Interviewer: ${interview.interviewer_name}
- Total Questions: ${interview.total_questions}

Conversation Transcript:
${transcript}

Please provide a detailed analysis in the following JSON format:
{
  "overall_score": <number 1-100>,
  "metrics": {
    "communication_clarity": <number 1-100>,
    "technical_knowledge": <number 1-100>,
    "problem_solving": <number 1-100>,
    "cultural_fit": <number 1-100>,
    "confidence": <number 1-100>
  },
  "strengths": [<array of strings>],
  "areas_for_improvement": [<array of strings>],
  "key_insights": [<array of strings>],
  "detailed_feedback": "<comprehensive feedback paragraph>",
  "speaking_metrics": {
    "estimated_words_per_minute": <number>,
    "response_quality": <number 1-100>,
    "filler_word_usage": "<low/medium/high>"
  },
  "recommendations": [<array of specific improvement suggestions>]
}

Focus on:
1. Content quality and relevance of responses
2. Communication style and clarity
3. Technical competency demonstration
4. Problem-solving approach
5. Behavioral indicators
6. Areas for improvement with specific suggestions
`;

    const startTime = Date.now();

    try {
      // Call Gemini API for analysis
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
      const result = await model.generateContent(analysisPrompt);
      const response = await result.response;
      const analysisText = response.text();
      
      // Parse JSON response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }
      
      const analysisData = JSON.parse(jsonMatch[0]);
      const processingTime = (Date.now() - startTime) / 1000;

      // Store analysis in database
      const { data: analysis, error: analysisError } = await supabase
        .from('interview_analysis')
        .insert({
          interview_id,
          analysis_data: analysisData,
          processing_time_seconds: processingTime,
          token_usage: {
            input_tokens: analysisText.length,
            output_tokens: JSON.stringify(analysisData).length,
            model: 'gemini-1.5-flash-latest'
          }
        })
        .select()
        .single();

      if (analysisError) {
        console.error('Error storing analysis:', analysisError);
        throw analysisError;
      }

      // Update interview status to complete
      await supabase
        .from('interviews')
        .update({ 
          status: 'ANALYSIS_COMPLETE',
          completed_at: new Date().toISOString()
        })
        .eq('id', interview_id);

      console.log(`✅ Analysis completed for interview ${interview_id} in ${processingTime}s`);
      
      return NextResponse.json({ 
        analysis: analysisData,
        processing_time: processingTime,
        analysis_id: analysis.id
      });

    } catch (apiError) {
      console.error('Gemini API error:', apiError);
      
      // Revert interview status
      await supabase
        .from('interviews')
        .update({ status: 'COMPLETED' })
        .eq('id', interview_id);

      // Generate fallback analysis
      const fallbackAnalysis = {
        overall_score: 75,
        metrics: {
          communication_clarity: 75,
          technical_knowledge: 70,
          problem_solving: 75,
          cultural_fit: 80,
          confidence: 70
        },
        strengths: ["Participated in full interview session", "Demonstrated engagement"],
        areas_for_improvement: ["Analysis temporarily unavailable - please try again"],
        key_insights: ["Interview completed successfully"],
        detailed_feedback: "Your interview session was recorded successfully. Detailed AI analysis is temporarily unavailable, but you can review your conversation transcript below.",
        speaking_metrics: {
          estimated_words_per_minute: 150,
          response_quality: 75,
          filler_word_usage: "medium"
        },
        recommendations: ["Review transcript for self-assessment", "Practice key technical concepts"]
      };

      return NextResponse.json({ 
        analysis: fallbackAnalysis,
        fallback: true,
        error: 'AI analysis temporarily unavailable'
      });
    }

  } catch (error) {
    console.error('Unexpected error in POST /api/analyze-interview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
