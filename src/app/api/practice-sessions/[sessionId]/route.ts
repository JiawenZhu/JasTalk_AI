import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;
    
    // Get the specific practice session
    const { data: session, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user can only access their own sessions
      .single();

    if (error) {
      console.error('Error fetching practice session:', error);
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Load the specific session with its saved questions

    // Transform the session data to match the expected format
    const transformedSession = {
      id: session.id,
      title: session.session_name,
      type: session.agent_name ? `${session.agent_name} Interview` : 'Practice Interview',
      score: session.score || 0,
      date: session.created_at,
      questionCount: Array.isArray(session.questions) ? session.questions.length : (session.total_questions || 0),
      questions: session.questions || [],
      duration: session.duration,
      status: session.status || 'in-progress',
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      call_id: session.call_id,
      retell_call_id: session.retell_call_id,
      agent_id: session.agent_id,
      agent_name: session.agent_name,
      currentQuestionIndex: session.current_question_index || 0,
      finished_all_questions: session.finished_all_questions || false,
      responses: [] // TODO: Add responses if needed
    };

    return NextResponse.json({ session: transformedSession });
  } catch (error) {
    console.error('Error in GET /api/practice-sessions/[sessionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;
    const body = await request.json();
    
    // Only allow updating specific fields
    const allowedFields = [
      'status', 
      'end_time', 
      'questions', 
      'current_question_index', 
      'finished_all_questions',
      'score',
      'duration'
    ];
    
    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Update the session
    const { data: session, error } = await supabase
      .from('practice_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user can only update their own sessions
      .select()
      .single();

    if (error) {
      console.error('Error updating practice session:', error);
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error in PUT /api/practice-sessions/[sessionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = params;
    
    // Delete the session (only if it belongs to the user)
    const { error } = await supabase
      .from('practice_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id); // Ensure user can only delete their own sessions

    if (error) {
      console.error('Error deleting practice session:', error);
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/practice-sessions/[sessionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
