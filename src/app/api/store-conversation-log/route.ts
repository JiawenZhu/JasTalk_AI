import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

interface ConversationEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      conversationHistory,
      analysisData,
      sessionUsage,
      agentId,
      agentName,
      interviewStatus,
      interviewNote
    } = body;

    // Generate unique call ID
    const callId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Format transcript for storage
    const transcript = conversationHistory.map((entry: ConversationEntry) => ({
      role: entry.role,
      text: entry.text,
      timestamp: entry.timestamp
    }));

    // Store conversation log in database
    const { data: log, error } = await supabase
      .from('conversation_logs')
      .insert({
        call_id: callId,
        agent_id: agentId || 'default',
        agent_name: agentName || 'AI Interviewer',
        candidate_name: user.id || user.user_metadata?.full_name || user.email || 'Anonymous',
        transcript: transcript,
        post_call_analysis: analysisData || {},
        duration_seconds: sessionUsage?.duration ? sessionUsage.duration * 60 : 0,
        call_cost: {
          inputTokens: sessionUsage?.inputTokens || 0,
          outputTokens: sessionUsage?.outputTokens || 0,
          ttsCharacters: sessionUsage?.ttsCharacters || 0,
          estimatedCost: 0
        },
        summary: analysisData?.summary || null,
        detailed_summary: interviewNote || `Interview ${interviewStatus || 'completed'} with ${conversationHistory.length} exchanges`,
        metadata: {
          sessionUsage,
          timestamp: new Date().toISOString(),
          interviewStatus: interviewStatus || 'completed',
          interviewNote: interviewNote || null
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing conversation log:', error);
      return NextResponse.json({ 
        error: 'Failed to store conversation log',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      callId: log.call_id,
      logId: log.id 
    });

  } catch (error) {
    console.error('Error in POST /api/store-conversation-log:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
