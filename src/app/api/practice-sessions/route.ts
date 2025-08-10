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
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching practice sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch practice sessions' }, { status: 500 });
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
    for (const s of sessions || []) {
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
    return NextResponse.json({ sessions: uniqueSessions });
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
      call_id,
      retell_agent_id,
      retell_call_id
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
