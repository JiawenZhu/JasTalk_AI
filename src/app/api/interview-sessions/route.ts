import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

interface CreateSessionRequest {
  agentId: string;
  agentName: string;
  agentVoice?: string;
  questions: any[];
}

interface UpdateSessionRequest {
  currentQuestionIndex?: number;
  questionsCompleted?: number;
  conversationHistory?: any[];
  lastAiResponse?: string;
  lastUserResponse?: string;
  currentTurn?: 'user' | 'ai' | 'waiting';
  timeSpent?: number;
  status?: 'active' | 'paused' | 'completed' | 'abandoned';
}

// Create a new interview session
export async function POST(request: NextRequest) {
  try {
    console.log('📝 Creating new interview session...');
    
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Unauthorized access attempt');
      
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateSessionRequest = await request.json();
    const {
      agentId,
      agentName,
      agentVoice,
      questions
    } = body;

    // Validate required fields
    if (!agentId || !agentName || !questions || questions.length === 0) {
      
      return NextResponse.json({ 
        error: 'Missing required fields: agentId, agentName, and questions are required' 
      }, { status: 400 });
    }

    // Generate unique session key
    const sessionKey = `session_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check for existing active sessions and mark them as paused
    const { data: existingSessions } = await supabase
      .from('conversation_logs')
      .select('id, call_id')
      .eq('candidate_name', user.email)
      .eq('status', 'active');

    if (existingSessions && existingSessions.length > 0) {
      console.log(`⏸️ Found ${existingSessions.length} active sessions, marking as paused`);
      
      await supabase
        .from('conversation_logs')
        .update({ 
          status: 'paused',
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('candidate_name', user.email)
        .eq('status', 'active');
    }

    // Create new session in conversation_logs table
    const { data: session, error: insertError } = await supabase
      .from('conversation_logs')
      .insert({
        call_id: sessionKey,
        candidate_name: user.email,
        agent_id: agentId,
        agent_name: agentName,
        agent_voice: agentVoice,
        questions: questions,
        current_question_index: 0,
        questions_completed: 0,
        conversation_history: [],
        status: 'active',
        time_spent: 0,
        current_turn: 'waiting',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error creating session:', insertError);
      
      return NextResponse.json({ 
        error: 'Failed to create session',
        details: insertError.message 
      }, { status: 500 });
    }

    console.log('✅ Session created successfully:', session.session_key);

            return NextResponse.json({
          success: true,
          session: {
            id: session.id,
            sessionKey: session.call_id,
            agentId: session.agent_id,
            agentName: session.agent_name,
        agentVoice: session.agent_voice,
        questions: session.questions,
        currentQuestionIndex: session.current_question_index,
        questionsCompleted: session.questions_completed,
        conversationHistory: session.conversation_history,
        status: session.status,
        timeSpent: session.time_spent,
        currentTurn: session.current_turn,
        startedAt: session.created_at,
        lastActivityAt: session.last_activity_at
      }
    });

      } catch (error) {
      console.error('❌ Error in POST /api/interview-sessions:', error);
      
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
}

// Update an existing interview session
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpdateSessionRequest = await request.json();
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const { data: session, error } = await supabase
      .from('conversation_logs')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString()
      })
      .eq('call_id', sessionId)
      .eq('candidate_name', user.email)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating session:', error);
      
      return NextResponse.json({ 
        error: 'Failed to update session',
        details: error.message 
      }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

          return NextResponse.json({
        success: true,
        session: {
          id: session.id,
          sessionKey: session.call_id,
          agentId: session.agent_id,
          agentName: session.agent_name,
        agentVoice: session.agent_voice,
        questions: session.questions,
        currentQuestionIndex: session.current_question_index,
        questionsCompleted: session.questions_completed,
        conversationHistory: session.conversation_history,
        status: session.status,
        timeSpent: session.time_spent,
        currentTurn: session.current_turn,
        startedAt: session.created_at,
        lastActivityAt: session.last_activity_at
      }
    });

  } catch (error) {
    console.error('❌ Error in PUT /api/interview-sessions:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get user's interview sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // 'active', 'paused', 'completed', etc.
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const includeHistory = url.searchParams.get('include_history') === 'true';

    let query = supabase
      .from('conversation_logs')
      .select(`
        id,
        call_id,
        agent_id,
        agent_name,
        agent_voice,
        current_question_index,
        questions_completed,
        status,
        last_activity_at,
        created_at,
        completed_at,
        time_spent,
        estimated_duration
        ${includeHistory ? ',conversation_history, questions, last_ai_response, last_user_response, current_turn' : ''}
      `)
      .eq('candidate_name', user.email)
      .order('last_activity_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('❌ Error fetching interview sessions:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      return NextResponse.json({ 
        error: 'Failed to fetch sessions',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    // Calculate additional metadata for each session
    const sessionsWithMetadata = sessions?.map((session: any) => {
      // Get total questions from questions array if available
      const totalQuestions = session.questions?.length || 0;
      
      return {
        id: session.id,
        sessionKey: session.call_id,
                  agentId: session.agent_id,
        agentName: session.agent_name,
        agentVoice: session.agent_voice,
        currentQuestionIndex: session.current_question_index,
        questionsCompleted: session.questions_completed,
        status: session.status,
        lastActivityAt: session.last_activity_at,
        startedAt: session.created_at,
        completedAt: session.completed_at,
        timeSpent: session.time_spent,
        estimatedDuration: session.estimated_duration,
        completionPercentage: totalQuestions > 0 ? Math.round((session.questions_completed / totalQuestions) * 100) : 0,
        questionsRemaining: Math.max(0, totalQuestions - session.questions_completed),
        canResume: session.status === 'active' || session.status === 'paused',
        timeSpentMinutes: Math.round((session.time_spent || 0) / 60),
        lastActivityMinutesAgo: session.last_activity_at ? Math.round((Date.now() - new Date(session.last_activity_at).getTime()) / (1000 * 60)) : 0,
        ...(includeHistory && {
          conversationHistory: session.conversation_history,
          questions: session.questions,
          lastAiResponse: session.last_ai_response,
          lastUserResponse: session.last_user_response,
          currentTurn: session.current_turn
        })
      };
    }) || [];

    // Get summary statistics
    const activeSessions = sessionsWithMetadata.filter((s: any) => s.status === 'active').length;
    const pausedSessions = sessionsWithMetadata.filter((s: any) => s.status === 'paused').length;
    const completedSessions = sessionsWithMetadata.filter((s: any) => s.status === 'completed').length;

    return NextResponse.json({
      success: true,
      sessions: sessionsWithMetadata,
      summary: {
        total: sessionsWithMetadata.length,
        active: activeSessions,
        paused: pausedSessions,
        completed: completedSessions,
        canResume: activeSessions + pausedSessions > 0
      }
    });

  } catch (error) {
    console.error('Error in GET /api/interview-sessions:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
