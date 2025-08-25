import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

interface UpdateSessionRequest {
  currentQuestionIndex?: number;
  questionsCompleted?: number;
  conversationHistory?: any[];
  lastAiResponse?: string;
  lastUserResponse?: string;
  currentTurn?: 'user' | 'ai' | 'waiting';
  timeSpent?: number;
  status?: 'active' | 'paused' | 'completed' | 'abandoned';
  snapshotType?: 'question_start' | 'question_complete' | 'pause' | 'resume' | 'error';
  responseTime?: number;
  confidenceScore?: number;
}

// Get specific session by session key
export async function GET(
  request: NextRequest,
  { params }: { params: { sessionKey: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionKey } = params;

    const { data: session, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('session_key', sessionKey)
      .eq('user_id', user.id)
      .single();

    if (error || !session) {
      console.error('Session not found:', error);
      return NextResponse.json({ 
        error: 'Session not found' 
      }, { status: 404 });
    }

    // Calculate metadata
    const sessionWithMetadata = {
      ...session,
      completionPercentage: Math.round((session.questions_completed / session.total_questions) * 100),
      questionsRemaining: session.total_questions - session.questions_completed,
      canResume: session.status === 'active' || session.status === 'paused',
      timeSpentMinutes: Math.round(session.time_spent / 60),
      currentQuestion: session.questions?.[session.current_question_index] || null,
      nextQuestion: session.questions?.[session.current_question_index + 1] || null
    };

    return NextResponse.json({
      success: true,
      session: sessionWithMetadata
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update session progress
export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionKey: string } }
) {
  try {
    console.log(`📝 Updating session progress: ${params.sessionKey}`);
    
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionKey } = params;
    const body: UpdateSessionRequest = await request.json();
    
    const {
      currentQuestionIndex,
      questionsCompleted,
      conversationHistory,
      lastAiResponse,
      lastUserResponse,
      currentTurn,
      timeSpent,
      status,
      snapshotType,
      responseTime,
      confidenceScore
    } = body;

    // First, get the current session to validate and compare
    const { data: currentSession, error: fetchError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('session_key', sessionKey)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !currentSession) {
      console.error('Session not found for update:', fetchError);
      return NextResponse.json({ 
        error: 'Session not found' 
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      last_activity_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Only update fields that are provided
    if (currentQuestionIndex !== undefined) updateData.current_question_index = currentQuestionIndex;
    if (questionsCompleted !== undefined) updateData.questions_completed = questionsCompleted;
    if (conversationHistory !== undefined) updateData.conversation_history = conversationHistory;
    if (lastAiResponse !== undefined) updateData.last_ai_response = lastAiResponse;
    if (lastUserResponse !== undefined) updateData.last_user_response = lastUserResponse;
    if (currentTurn !== undefined) updateData.current_turn = currentTurn;
    if (timeSpent !== undefined) updateData.time_spent = timeSpent;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    // Update the session
    const { data: updatedSession, error: updateError } = await supabase
      .from('interview_sessions')
      .update(updateData)
      .eq('session_key', sessionKey)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating session:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update session',
        details: updateError.message 
      }, { status: 500 });
    }

    // Create snapshot if specified
    if (snapshotType && currentQuestionIndex !== undefined) {
      try {
        await supabase
          .from('interview_session_snapshots')
          .insert({
            session_id: currentSession.id,
            snapshot_type: snapshotType,
            question_index: currentQuestionIndex,
            conversation_state: conversationHistory || currentSession.conversation_history,
            ai_response: lastAiResponse,
            user_response: lastUserResponse,
            response_time: responseTime,
            confidence_score: confidenceScore,
            session_metadata: {
              previous_question_index: currentSession.current_question_index,
              questions_completed: questionsCompleted || currentSession.questions_completed,
              current_turn: currentTurn,
              time_spent: timeSpent || currentSession.time_spent
            }
          });
        
        console.log(`📸 Created snapshot: ${snapshotType} for question ${currentQuestionIndex}`);
      } catch (snapshotError) {
        console.warn('⚠️ Failed to create snapshot:', snapshotError);
        // Don't fail the main update if snapshot creation fails
      }
    }

    // Log significant progress milestones
    if (questionsCompleted !== undefined && questionsCompleted !== currentSession.questions_completed) {
      const progressPercent = Math.round((questionsCompleted / updatedSession.total_questions) * 100);
      console.log(`📊 Progress update: ${questionsCompleted}/${updatedSession.total_questions} questions (${progressPercent}%)`);
    }

    const responseData = {
      success: true,
      session: {
        id: updatedSession.id,
        sessionKey: updatedSession.session_key,
        agentName: updatedSession.agent_name,
        totalQuestions: updatedSession.total_questions,
        currentQuestionIndex: updatedSession.current_question_index,
        questionsCompleted: updatedSession.questions_completed,
        status: updatedSession.status,
        completionPercentage: Math.round((updatedSession.questions_completed / updatedSession.total_questions) * 100),
        questionsRemaining: updatedSession.total_questions - updatedSession.questions_completed,
        timeSpent: updatedSession.time_spent,
        currentTurn: updatedSession.current_turn
      },
      updated: Object.keys(updateData).filter(key => !['last_activity_at', 'updated_at'].includes(key))
    };

    console.log(`✅ Session updated successfully: ${sessionKey}`);
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Error in PATCH /api/interview-sessions/[sessionKey]:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Delete/abandon session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionKey: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionKey } = params;

    // Mark session as abandoned instead of deleting
    const { data: updatedSession, error } = await supabase
      .from('interview_sessions')
      .update({ 
        status: 'abandoned',
        last_activity_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('session_key', sessionKey)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !updatedSession) {
      console.error('Session not found for deletion:', error);
      return NextResponse.json({ 
        error: 'Session not found' 
      }, { status: 404 });
    }

    console.log(`🗑️ Session marked as abandoned: ${sessionKey}`);

    return NextResponse.json({
      success: true,
      message: 'Session abandoned successfully'
    });

  } catch (error) {
    console.error('Error abandoning session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

