import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase';

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

    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient();

    // Check for existing active sessions and mark them as paused
    const { data: existingSessions } = await adminSupabase
      .from('interview_sessions')
      .select('id, session_key')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (existingSessions && existingSessions.length > 0) {
      console.log(`⏸️ Found ${existingSessions.length} active sessions, marking as paused`);
      
      await adminSupabase
        .from('interview_sessions')
        .update({ 
          status: 'paused',
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('status', 'active');
    }

    // Create new session
    const { data: session, error: insertError } = await adminSupabase
      .from('interview_sessions')
      .insert({
        user_id: user.id,
        session_key: sessionKey,
        agent_id: agentId,
        agent_name: agentName,
        agent_voice: agentVoice,
        questions: questions,
        current_question_index: 0,
        questions_completed: 0,
        conversation_history: [],
        status: 'active',
        time_spent: 0,
        current_turn: 'waiting'
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

    // Create initial snapshot
    await adminSupabase
      .from('interview_session_snapshots')
      .insert({
        session_id: session.id,
        snapshot_type: 'question_start',
        question_index: 0,
        conversation_state: { questions, agentName, agentVoice },
        session_metadata: {
          initial_setup: true,
          questions_count: questions.length
        }
      });

    console.log(`✅ Session created successfully: ${sessionKey}`);

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        sessionKey: session.session_key,
        agentName: session.agent_name,
        totalQuestions: session.questions?.length || 0,
        currentQuestionIndex: session.current_question_index,
        questionsCompleted: session.questions_completed,
        status: session.status
      }
    });

  } catch (error) {
    console.error('❌ Error in POST /api/interview-sessions:', error);
    
return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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

    const adminSupabase = createAdminClient();
    
    let query = adminSupabase
      .from('interview_sessions')
      .select(`
        id,
        session_key,
        agent_id,
        agent_name,
        agent_voice,
        current_question_index,
        questions_completed,
        status,
        last_activity_at,
        started_at,
        completed_at,
        time_spent,
        estimated_duration
        ${includeHistory ? ',conversation_history, questions, last_ai_response, last_user_response, current_turn' : ''}
      `)
      .eq('user_id', user.id) // user.id is already UUID, no need for casting
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
        ...session,
        completionPercentage: totalQuestions > 0 ? Math.round((session.questions_completed / totalQuestions) * 100) : 0,
        questionsRemaining: Math.max(0, totalQuestions - session.questions_completed),
        canResume: session.status === 'active' || session.status === 'paused',
        timeSpentMinutes: Math.round((session.time_spent || 0) / 60),
        lastActivityMinutesAgo: session.last_activity_at ? Math.round((Date.now() - new Date(session.last_activity_at).getTime()) / (1000 * 60)) : 0
      };
    }) || [];

    // Get summary statistics
    const activeSessions = sessionsWithMetadata.filter(s => s.status === 'active').length;
    const pausedSessions = sessionsWithMetadata.filter(s => s.status === 'paused').length;
    const completedSessions = sessionsWithMetadata.filter(s => s.status === 'completed').length;

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
