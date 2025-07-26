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

    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('call_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('conversation_logs')
      .select('*')
      .eq('candidate_name', user.email)
      .order('created_at', { ascending: false });

    // Filter by call_id if provided
    if (callId) {
      query = query.eq('call_id', callId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching conversation logs:', error);
      return NextResponse.json({ error: 'Failed to fetch conversation logs' }, { status: 500 });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (error) {
    console.error('Error in GET /api/conversation-logs:', error);
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
      call_id, 
      agent_id, 
      agent_name, 
      candidate_name,
      transcript,
      post_call_analysis,
      duration_seconds
    } = body;

    if (!call_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create conversation log
    const { data: log, error } = await supabase
      .from('conversation_logs')
      .insert({
        call_id,
        agent_id: agent_id || null,
        agent_name: agent_name || null,
        candidate_name: candidate_name || user.email,
        transcript: transcript || [],
        post_call_analysis: post_call_analysis || {},
        duration_seconds: duration_seconds || 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation log:', error);
      return NextResponse.json({ error: 'Failed to create conversation log' }, { status: 500 });
    }

    return NextResponse.json({ log });
  } catch (error) {
    console.error('Error in POST /api/conversation-logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
