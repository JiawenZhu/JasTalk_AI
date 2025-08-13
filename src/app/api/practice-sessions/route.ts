import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get cookies from the request to properly authenticate the user
    const cookieStore = await cookies();
    const supabase = createServerClient();
    
    // Get current user with proper authentication context
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User authentication failed:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Fetching practice sessions for user:', {
      userId: user.id,
      userEmail: user.email,
      timestamp: new Date().toISOString()
    });

    // Get user's practice sessions with proper RLS enforcement
    const { data: sessions, error } = await supabase
      .from('practice_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching practice sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch practice sessions' }, { status: 500 });
    }

    console.log(`📊 Found ${sessions?.length || 0} sessions for user ${user.id}`);

    // Additional security check: verify all sessions belong to the current user
    const userSessions = sessions?.filter(session => session.user_id === user.id) || [];
    if (userSessions.length !== (sessions?.length || 0)) {
      console.warn('⚠️ Security warning: Some sessions do not belong to the current user');
      console.warn('⚠️ Filtered sessions:', userSessions.length, 'vs total:', sessions?.length);
    }

    // Group by interviewer + normalized questions signature; choose latest (timestamped name if tie)
    const normalizeText = (t: string) => (t || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const signatureOf = (s: any) => {
      const agent = normalizeText(s.agent_name || '');
      const qs = Array.isArray(s.questions) ? s.questions.map((q: any) => normalizeText(q.text || '')).join('|') : String(s.total_questions || 0);
      // If there is a call_id, include it to avoid merging across totally different calls with same questions
      return `${agent}__${qs}`;
    };

    const latestBySignature = new Map<string, any>();
    for (const s of userSessions) {
      const sig = signatureOf(s);
      const existing = latestBySignature.get(sig);
      if (!existing) {
        latestBySignature.set(sig, s);
        continue;
      }
      const sTs = new Date(s.created_at).getTime();
      const eTs = new Date(existing.created_at).getTime();
      if (sTs > eTs) {
        latestBySignature.set(sig, s);
      } else if (sTs === eTs) {
        const hasTimestamp = typeof s.session_name === 'string' && (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(s.session_name) || /\d{1,2}:\d{2}(:\d{2})?/.test(s.session_name));
        const existingHasTimestamp = typeof existing.session_name === 'string' && (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(existing.session_name) || /\d{1,2}:\d{2}(:\d{2})?/.test(existing.session_name));
        if (hasTimestamp && !existingHasTimestamp) {
          latestBySignature.set(sig, s);
        }
      }
    }

    const uniqueSessions = Array.from(latestBySignature.values());
    console.log(`✅ Returning ${uniqueSessions.length} unique sessions for user ${user.id}`);
    
    // Transform the data to match the frontend expectations
    const transformedSessions = uniqueSessions.map(session => {
      console.log('🔍 Debug session data:', {
        id: session.id,
        session_name: session.session_name,
        agent_name: session.agent_name,
        total_questions: session.total_questions,
        questions: session.questions,
        questions_length: session.questions?.length,
        questions_type: typeof session.questions,
        questions_is_array: Array.isArray(session.questions)
      });
      
      return {
        id: session.id,
        title: session.session_name || 'Untitled Session',
        type: session.agent_name || 'AI Interview',
        score: session.score || 0,
        date: session.created_at || new Date().toISOString(),
        endedAt: session.end_time || null,
        questionCount: session.total_questions || 0,
        status: session.status || 'in-progress'
      };
    });
    
    return NextResponse.json({ sessions: transformedSessions });
  } catch (error) {
    console.error('❌ Error in GET /api/practice-sessions:', error);
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
      call_id,
      retell_agent_id,
      retell_call_id
    } = body;

    if (!session_name) {
      return NextResponse.json({ error: 'Session name is required' }, { status: 400 });
    }

    console.log('🔍 Debug POST request data:', {
      session_name,
      agent_id,
      agent_name,
      questions,
      questions_length: questions?.length,
      questions_type: typeof questions,
      questions_is_array: Array.isArray(questions)
    });

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
        questions: questions || [], // Store the questions array
        status: 'in-progress',
        start_time: new Date().toISOString(),
        call_id: call_id,
        retell_agent_id: retell_agent_id,
        retell_call_id: retell_call_id
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
    const { sessionId, status, end_time, questions } = body;

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Update practice session
    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    if (end_time) {
      updateData.end_time = end_time;
    }
    if (questions) {
      updateData.questions = questions;
      updateData.total_questions = questions.length; // Update question count when questions change
      console.log('🔍 Debug PUT update data:', {
        questions,
        questions_length: questions.length,
        total_questions: updateData.total_questions
      });
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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionIds } = body;
    
    if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json({ error: 'Invalid session IDs' }, { status: 400 });
    }

    // Delete multiple sessions (only if they belong to the user)
    const { error } = await supabase
      .from('practice_sessions')
      .delete()
      .in('id', sessionIds)
      .eq('user_id', user.id); // Ensure user can only delete their own sessions

    if (error) {
      console.error('Error deleting practice sessions:', error);
      return NextResponse.json({ error: 'Failed to delete sessions' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `Successfully deleted ${sessionIds.length} sessions`,
      deletedCount: sessionIds.length 
    });
  } catch (error) {
    console.error('Error in DELETE /api/practice-sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
