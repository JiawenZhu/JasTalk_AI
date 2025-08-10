import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('call_id') || 'call_d22f2f4813f15985d6d4d557ac4';
    const agentId = searchParams.get('agent_id') || 'agent_9e08fe6af4631b5ee94f7f036f';

    // Fetch conversation log for the specific call
    const { data: conversationLog, error } = await supabase
      .from('conversation_logs')
      .select(`
        id,
        call_id,
        agent_id,
        agent_name,
        candidate_name,
        transcript,
        post_call_analysis,
        duration_seconds,
        created_at
      `)
      .eq('call_id', callId)
      .single();

    if (error) {
      console.error('Error fetching conversation log:', error);
      return NextResponse.json({ error: 'Failed to fetch conversation log' }, { status: 500 });
    }

    if (!conversationLog) {
      return NextResponse.json({ error: 'Conversation log not found' }, { status: 404 });
    }

    // Get audio recording from Retell API
    let audioData: any = null;
    try {
      // Use relative path to work in both dev and prod
      const audioResponse = await fetch(`${request.nextUrl.origin}/api/retell-audio?call_id=${callId}`);
      if (audioResponse.ok) {
        audioData = await audioResponse.json();
      }
    } catch (audioError) {
      console.error('Error fetching audio data:', audioError);
    }

    // Get practice session data
    const { data: practiceSession } = await supabase
      .from('practice_sessions')
      .select('questions, session_name, status')
      .eq('retell_call_id', callId)
      .single();

    // Parse transcript to extract question-answer pairs
    const transcript = conversationLog.transcript || [];
    const timeline = Array.isArray(audioData?.transcript_timeline) ? audioData.transcript_timeline : [];
    const questionAnswers = [];

    if (practiceSession?.questions) {
      const questions = practiceSession.questions;
      
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const questionId = `${callId}_q${i}`;
        
        // Find the corresponding answer in the transcript
        let answer = '';
        let answerTimestamp = '';
        let questionTimestamp = '';
        
        // Try to align using rich timeline first
        if (timeline.length > 0) {
          // Find first agent line that fuzzy-matches start of question
          const prefix = question.text.slice(0, 30).toLowerCase();
          const agentIdx = timeline.findIndex((t: any) => t.speaker === 'agent' && (t.text || '').toLowerCase().includes(prefix));
          if (agentIdx >= 0) {
            questionTimestamp = String(timeline[agentIdx].ts_sec || 0);
            // Find next user turn after agent question
            for (let k = agentIdx + 1; k < timeline.length; k++) {
              if (timeline[k].speaker === 'user') {
                answerTimestamp = String(timeline[k].ts_sec || 0);
                break;
              }
            }
          }
        }
        // Fallback: use raw transcript array if timeline not available
        if (!answerTimestamp) {
          for (let j = 0; j < transcript.length; j++) {
            const entry = transcript[j];
            if (entry.speaker === 'agent' && entry.content.includes(question.text.substring(0, 50))) {
              questionTimestamp = entry.timestamp || questionTimestamp;
              for (let k = j + 1; k < transcript.length; k++) {
                const answerEntry = transcript[k];
                if (answerEntry.speaker === 'user') {
                  answer += (answer ? ' ' : '') + answerEntry.content;
                  answerTimestamp = answerEntry.timestamp || answerTimestamp;
                } else if (answerEntry.speaker === 'agent' && answerEntry.content.includes('?')) {
                  break;
                }
              }
              break;
            }
          }
        }
        
        if (answer) {
          questionAnswers.push({
            id: questionId,
            question: question.text,
            answer: answer,
            audioUrl: audioData?.audio_url || null,
            duration: conversationLog.duration_seconds || 0,
            timestamp: conversationLog.created_at,
            category: question.category || 'Interview Question',
            difficulty: question.difficulty || 'medium',
            practiceSessionId: callId,
            callId: callId,
            agentName: conversationLog.agent_name,
            callDuration: conversationLog.duration_seconds,
            answerTimestamp: answerTimestamp,
            questionTimestamp: questionTimestamp
          });
        }
      }
    }

    return NextResponse.json({
      // Top-level fields for easy consumption by UI
      audio_url: audioData?.audio_url || null,
      duration_seconds: conversationLog?.duration_seconds ?? audioData?.duration ?? null,
      created_at: conversationLog?.created_at ?? null,
      agent_name: conversationLog?.agent_name ?? practiceSession?.session_name ?? null,
      transcript: Array.isArray(conversationLog?.transcript) ? conversationLog?.transcript : [],
      // Rich payloads for advanced usage/debugging
      conversationLog,
      audioData,
      practiceSession,
      questionAnswers
    });

  } catch (error) {
    console.error('Error in retell-call-data API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
