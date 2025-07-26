import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's practice sessions
    const { data: sessions, error } = await supabase
      .from('practice_sessions')
      .select(`
        *,
        interviews (
          id,
          title,
          description,
          interview_type
        ),
        practice_responses (
          id,
          question_id,
          user_response,
          ai_feedback,
          score,
          response_duration_seconds
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching practice sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch practice sessions' }, { status: 500 });
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('Error in GET /api/practice-sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
      interview_id, 
      session_name, 
      agent_id, 
      agent_name, 
      questions,
      call_id
    } = body;

    if (!session_name) {
      return NextResponse.json({ error: 'Session name is required' }, { status: 400 });
    }

    // Create practice session
    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .insert({
        user_id: user.id,
        interview_id,
        session_name,
        agent_id,
        agent_name,
        total_questions: questions?.length || 0,
        status: 'in-progress',
        start_time: new Date().toISOString(),
        call_id: call_id
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating practice session:', sessionError);
      return NextResponse.json({ error: 'Failed to create practice session' }, { status: 500 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error in POST /api/practice-sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, status, end_time } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Update practice session
    const updateData: any = { status };
    if (end_time) {
      updateData.end_time = end_time;
    }

    console.log('Updating practice session:', { sessionId, updateData, userId: user.id });

    const { data: session, error: sessionError } = await supabase
      .from('practice_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (sessionError) {
      console.error('Error updating practice session:', sessionError);
      return NextResponse.json({ 
        error: 'Failed to update practice session',
        details: sessionError.message 
      }, { status: 500 });
    }

    console.log('Practice session updated successfully:', session);
    return NextResponse.json({ session });
  } catch (error) {
    console.error('Error in PUT /api/practice-sessions:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
