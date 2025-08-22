import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const logId = url.searchParams.get('logId');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Use admin client to fetch conversation logs
    const adminSupabase = createAdminClient();
    
    // If logId is provided, fetch single log
    if (logId) {
      const { data: log, error } = await adminSupabase
        .from('conversation_logs')
        .select('*')
        .eq('id', logId)
        .eq('candidate_name', user.id || user.user_metadata?.full_name || user.email || 'Anonymous')
        .single();

      if (error || !log) {
        return NextResponse.json({ error: 'Log not found' }, { status: 404 });
      }

      // Return single log
      return NextResponse.json({
        id: log.id,
        call_id: log.call_id,
        agent_id: log.agent_id,
        agent_name: log.agent_name,
        candidate_name: log.candidate_name,
        transcript: log.transcript,
        post_call_analysis: log.post_call_analysis,
        duration_seconds: log.duration_seconds,
        created_at: log.created_at,
        metadata: log.metadata
      });
    }

    // Fetch legacy conversation logs
    const { data: logs, error } = await adminSupabase
      .from('conversation_logs')
      .select('*')
      .eq('candidate_name', user.id || user.user_metadata?.full_name || user.email || 'Anonymous')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversation logs:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch conversation logs',
        details: error.message 
      }, { status: 500 });
    }

    // 🔧 FIXED: Fetch NEW PIPELINE interviews with separate utterances query
    const { data: interviews, error: interviewsError } = await adminSupabase
      .from('interviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (interviewsError) {
      console.error('Error fetching interviews:', interviewsError);
      // Don't fail the whole request, just log the error
    }

    // 🔧 FIXED: Fetch utterances separately for better reliability
    let allUtterances: any[] = [];
    if (interviews && interviews.length > 0) {
      const interviewIds = interviews.map(i => i.id);
      const { data: utterances, error: utterancesError } = await adminSupabase
        .from('utterances')
        .select('*')
        .in('interview_id', interviewIds)
        .order('timestamp', { ascending: true });

      if (utterancesError) {
        console.error('Error fetching utterances:', utterancesError);
      } else {
        allUtterances = utterances || [];
        console.log(`📝 Fetched ${allUtterances.length} utterances for ${interviews.length} interviews`);
      }
    }

    // 🔧 FIXED: Fetch analysis separately
    let allAnalysis: any[] = [];
    if (interviews && interviews.length > 0) {
      const interviewIds = interviews.map(i => i.id);
      const { data: analysis, error: analysisError } = await adminSupabase
        .from('interview_analysis')
        .select('*')
        .in('interview_id', interviewIds);

      if (analysisError) {
        console.error('Error fetching analysis:', analysisError);
      } else {
        allAnalysis = analysis || [];
        console.log(`📊 Fetched ${allAnalysis.length} analysis records for ${interviews.length} interviews`);
      }
    }

    // Transform legacy logs
    const transformedLogs = logs.map(log => ({
      id: log.id,
      callId: log.call_id,
      agentName: log.agent_name,
      candidateName: log.candidate_name,
      summary: log.summary,
      detailedSummary: log.detailed_summary,
      duration: log.duration_seconds,
      createdAt: log.created_at,
      transcript: log.transcript,
      analysis: log.post_call_analysis,
      callCost: log.call_cost,
      metadata: log.metadata,
      source: 'legacy'
    }));

    // 🔧 FIXED: Transform NEW PIPELINE interviews with proper utterances mapping
    const transformedInterviews = (interviews || []).map(interview => {
      // Get utterances for this specific interview
      const interviewUtterances = allUtterances.filter(u => u.interview_id === interview.id);
      
      // Convert utterances to transcript format
      const transcript = interviewUtterances
        .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((utterance: any) => ({
          role: utterance.speaker === 'USER' ? 'user' : 'model',
          text: utterance.text,
          timestamp: utterance.timestamp
        }));

      // Calculate duration from utterances
      const duration = interviewUtterances.length > 0 
        ? Math.floor((new Date(interviewUtterances[interviewUtterances.length - 1].timestamp).getTime() - 
                     new Date(interviewUtterances[0].timestamp).getTime()) / 1000)
        : 0;

      // Get analysis data for this interview
      const interviewAnalysis = allAnalysis.find(a => a.interview_id === interview.id);
      const rawAnalysis = interviewAnalysis?.analysis_data || null;
      
      const analysis = rawAnalysis ? {
        ...rawAnalysis,
        // Ensure key_insights exists (some legacy analysis might not have it)
        key_insights: rawAnalysis.key_insights || [
          "Review your communication style",
          "Focus on technical depth in responses",
          "Practice structured problem-solving"
        ],
        // Normalize speaking metrics format
        speaking_metrics: {
          estimated_words_per_minute: rawAnalysis.speaking_metrics?.words_per_minute || 0,
          response_quality: 75, // Default value
          filler_word_usage: rawAnalysis.speaking_metrics?.filler_word_usage || 'Low'
        }
      } : null;

      return {
        id: interview.id,
        callId: interview.id, // Use interview ID as call ID
        agentName: interview.interviewer_name,
        candidateName: user.user_metadata?.full_name || user.email || 'Anonymous',
        summary: analysis?.detailed_feedback || null,
        detailedSummary: analysis?.detailed_feedback || null,
        duration: duration,
        createdAt: interview.created_at,
        transcript: transcript,
        analysis: analysis,
        callCost: null,
        metadata: {
          interviewStatus: interview.status === 'ANALYSIS_COMPLETE' ? 'completed' : 
                          interview.status === 'COMPLETED' ? 'completed' : 
                          interview.status === 'IN_PROGRESS' ? 'paused' : 'unknown',
          source: 'new_pipeline',
          job_title: interview.job_title,
          key_skills: interview.key_skills,
          total_questions: interview.total_questions,
          questions_answered: interview.questions_answered
        },
        source: 'new_pipeline'
      };
    });

    // Combine and sort all logs by creation date
    const allLogs = [...transformedLogs, ...transformedInterviews]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);

    // 🔧 ENHANCED DEBUGGING: More detailed logging
    console.log('📊 Conversation logs debug:', {
      legacyLogs: transformedLogs.length,
      newPipelineLogs: transformedInterviews.length,
      totalCombined: allLogs.length,
      totalUtterances: allUtterances.length,
      totalAnalysis: allAnalysis.length,
      sampleNewPipelineTranscript: transformedInterviews[0]?.transcript?.slice(0, 3) || 'none',
      sampleLegacyTranscript: transformedLogs[0]?.transcript?.slice(0, 3) || 'none',
      newPipelineWithUtterances: transformedInterviews.filter(i => i.transcript.length > 0).length,
      newPipelineWithoutUtterances: transformedInterviews.filter(i => i.transcript.length === 0).length
    });

    return NextResponse.json({ 
      success: true, 
      logs: allLogs,
      total: allLogs.length
    });

  } catch (error) {
    console.error('Error in GET /api/get-conversation-logs:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
