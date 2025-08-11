import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Retell webhook received:', JSON.stringify(body, null, 2));

    const { event_type, call_id, agent_id, agent_name, retell_llm_dynamic_variables } = body;

    // Handle different webhook events
    switch (event_type) {
      case 'call_ended':
        await handleCallEnded(body);
        break;
      case 'call_started':
        await handleCallStarted(body);
        break;
      case 'transcript_updated':
        await handleTranscriptUpdated(body);
        break;
      default:
        console.log(`Unhandled event type: ${event_type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing Retell webhook:', error);
    logger.error('Retell webhook error:', error instanceof Error ? { message: error.message, stack: error.stack } : { value: String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleCallStarted(data: any) {
  console.log('Call started:', data.call_id);
  
  try {
    const supabase = createServerClient();
    
    // Update practice session status to active
    const { error } = await supabase
      .from('practice_sessions')
      .update({ 
        status: 'active',
        start_time: new Date().toISOString()
      })
      .eq('call_id', data.call_id);

    if (error) {
      console.error('Error updating practice session status:', error);
    }
  } catch (error) {
    console.error('Error handling call started:', error);
  }
}

async function handleCallEnded(data: any) {
  console.log('Call ended:', data.call_id);
  
  try {
    const supabase = createServerClient();
    
    // Extract call data
    const {
      call_id,
      agent_id,
      agent_name,
      retell_llm_dynamic_variables,
      call_summary,
      transcript,
      call_cost,
      duration_seconds,
      post_call_analysis
    } = data;

    // Get candidate name from dynamic variables
    const candidateName = retell_llm_dynamic_variables?.name || retell_llm_dynamic_variables?.candidate_name || 'Unknown';

    // Update practice session with call results
    const { error: updateError } = await supabase
      .from('practice_sessions')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        duration_seconds: duration_seconds || 0,
        score: calculateScore(post_call_analysis),
        metadata: {
          call_summary,
          post_call_analysis,
          call_cost,
          agent_id,
          agent_name,
          candidate_name: candidateName
        }
      })
      .eq('call_id', call_id);

    if (updateError) {
      console.error('Error updating practice session:', updateError);
    }

    // Store detailed conversation log
    await storeConversationLog({
      call_id,
      agent_id,
      agent_name,
      candidate_name: candidateName,
      call_summary,
      transcript,
      post_call_analysis,
      duration_seconds,
      call_cost
    });

    console.log(`Call ${call_id} completed and logged successfully`);
    
  } catch (error) {
    console.error('Error handling call ended:', error);
  }
}

async function handleTranscriptUpdated(data: any) {
  console.log('Transcript updated for call:', data.call_id);
  
  try {
    const supabase = createServerClient();
    
    // Store real-time transcript updates
    const { error } = await supabase
      .from('practice_responses')
      .insert({
        practice_session_id: await getPracticeSessionId(data.call_id),
        question_id: null, // Will be updated when we can map to specific questions
        user_response: data.transcript?.user_message || '',
        ai_feedback: data.transcript?.agent_message || '',
        response_duration_seconds: data.transcript?.duration || 0,
        metadata: {
          timestamp: data.transcript?.timestamp,
          speaker: data.transcript?.speaker
        }
      });

    if (error) {
      console.error('Error storing transcript update:', error);
    }
  } catch (error) {
    console.error('Error handling transcript update:', error);
  }
}

async function storeConversationLog(data: {
  call_id: string;
  agent_id: string;
  agent_name: string;
  candidate_name: string;
  call_summary: any;
  transcript: any;
  post_call_analysis: any;
  duration_seconds: number;
  call_cost: any;
}) {
  try {
    const supabase = createServerClient();
    
    // Create conversation log entry with simplified schema
    const { error } = await supabase
      .from('conversation_logs')
      .insert({
        call_id: data.call_id,
        agent_id: data.agent_id,
        agent_name: data.agent_name,
        candidate_name: data.candidate_name,
        transcript: data.transcript || [],
        post_call_analysis: data.post_call_analysis || {},
        duration_seconds: data.duration_seconds
      });

    if (error) {
      console.error('Error storing conversation log:', error);
    } else {
      console.log(`Conversation log stored for call ${data.call_id}`);
    }
  } catch (error) {
    console.error('Error in storeConversationLog:', error);
  }
}

async function getPracticeSessionId(callId: string): Promise<string | null> {
  try {
    const supabase = createServerClient();
    
    const { data, error } = await supabase
      .from('practice_sessions')
      .select('id')
      .eq('call_id', callId)
      .single();

    if (error) {
      console.error('Error getting practice session ID:', error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Error in getPracticeSessionId:', error);
    return null;
  }
}

function calculateScore(postCallAnalysis: any): number {
  if (!postCallAnalysis) return 0;
  
  // Extract score from post-call analysis
  // This will depend on how Retell provides scoring data
  const score = postCallAnalysis.score || postCallAnalysis.overall_score || 0;
  return Math.round(score * 100); // Convert to percentage if needed
} 
