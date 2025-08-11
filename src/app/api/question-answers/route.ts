import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { parseTranscriptToQuestionAnswers } from '@/lib/transcript-parser';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch practice sessions with their Retell data
    const { data: practiceSessions, error } = await supabase
      .from('practice_sessions')
      .select(`
        id,
        session_name,
        agent_id,
        agent_name,
        retell_agent_id,
        retell_call_id,
        questions,
        status,
        created_at,
        duration_seconds,
        score
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching practice sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch practice sessions' }, { status: 500 });
    }

    // If no practice sessions found, return empty array
    if (!practiceSessions || practiceSessions.length === 0) {
      return NextResponse.json({ questionAnswers: [] });
    }

    // Transform practice sessions into question-answer format
    const questionAnswers = [];
    
    for (const session of practiceSessions || []) {
      try {
        // Get audio recording from Retell API using the session's retell_call_id
        let audioData = null;
        if (session.retell_call_id) {
          try {
            const audioResponse = await fetch(`${process.env.LIVE_URL}/api/retell-audio?call_id=${session.retell_call_id}`);
            if (audioResponse.ok) {
              audioData = await audioResponse.json();
            }
          } catch (audioError) {
            console.error(`Error fetching audio for call ${session.retell_call_id}:`, audioError);
          }
        }
        
        // Get conversation log for this session
        const { data: conversationLog } = await supabase
          .from('conversation_logs')
          .select('transcript, duration_seconds')
          .eq('call_id', session.retell_call_id)
          .single();
        
        if (session.questions && session.questions.length > 0) {
          const questions = session.questions;
          const transcript = conversationLog?.transcript || [];
          
          // Match questions with answers from transcript
          for (let i = 0; i < questions.length; i++) {
            const question = questions[i];
            const questionId = `${session.id}_q${i}`;
            
            // Find the corresponding answer in the transcript
            let answer = '';
            let answerTimestamp = '';
            
            // Look for user responses after agent questions
            for (let j = 0; j < transcript.length; j++) {
              const entry = transcript[j];
              if (entry.speaker === 'agent' && entry.content.includes(question.text.substring(0, 50))) {
                // Found the question, now look for the answer
                for (let k = j + 1; k < transcript.length; k++) {
                  const answerEntry = transcript[k];
                  if (answerEntry.speaker === 'user') {
                    answer += (answer ? ' ' : '') + answerEntry.content;
                    answerTimestamp = answerEntry.timestamp || '';
                  } else if (answerEntry.speaker === 'agent' && answerEntry.content.includes('?')) {
                    // Next question found, stop looking for answer
                    break;
                  }
                }
                break;
              }
            }
            
            // If no answer found in transcript, create a placeholder
            if (!answer) {
              answer = 'No answer recorded';
            }
            
            questionAnswers.push({
              id: questionId,
              question: question.text,
              answer: answer,
              audioUrl: audioData?.audio_url || null,
              duration: session.duration_seconds || 0,
              timestamp: session.created_at,
              category: question.category || 'Interview Question',
              difficulty: question.difficulty || 'medium',
              practiceSessionId: session.id,
              callId: session.retell_call_id,
              agentName: session.agent_name,
              callDuration: session.duration_seconds,
              answerTimestamp: answerTimestamp,
              sessionName: session.session_name,
              score: session.score
            });
          }
        }
        
      } catch (error) {
        console.error(`Error processing practice session ${session.id}:`, error);
        // Continue with other sessions even if one fails
      }
    }

    return NextResponse.json({ questionAnswers });

  } catch (error) {
    console.error('Error in question-answers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      question,
      answer,
      audioUrl,
      duration,
      category,
      difficulty,
      practiceSessionId,
      callId
    } = body;

    // Insert new question answer
    const { data, error } = await supabase
      .from('question_answers')
      .insert({
        user_email: user.email,
        question,
        answer,
        audio_url: audioUrl,
        duration: duration || 0,
        category: category || 'General',
        difficulty: difficulty || 'medium',
        practice_session_id: practiceSessionId,
        call_id: callId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating question answer:', error);
      return NextResponse.json({ error: 'Failed to create question answer' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      questionAnswer: data 
    });

  } catch (error) {
    console.error('Error in question-answers POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
