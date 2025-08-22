import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createServerClient } from '@/lib/supabase-server';

// GET /api/interviews - Fetch user's interviews
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use admin client for database operations
    const adminSupabase = createAdminClient();

    const { data: interviews, error } = await adminSupabase
      .from('interviews')
      .select(`
        *,
        utterances:utterances(count),
        analysis:interview_analysis(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching interviews:', error);
      return NextResponse.json({ error: 'Failed to fetch interviews' }, { status: 500 });
    }

    return NextResponse.json({ interviews });
  } catch (error) {
    console.error('Unexpected error in GET /api/interviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/interviews - Create new interview
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use admin client for database operations
    const adminSupabase = createAdminClient();
    const body = await request.json();

    const { 
      interviewer_name, 
      job_title, 
      key_skills, 
      agent_id, 
      total_questions 
    } = body;

    const { data: interview, error } = await adminSupabase
      .from('interviews')
      .insert({
        user_id: user.id,
        interviewer_name,
        job_title,
        key_skills,
        agent_id,
        total_questions,
        status: 'IN_PROGRESS'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating interview:', error);
      return NextResponse.json({ error: 'Failed to create interview' }, { status: 500 });
    }

    console.log('✅ Created new interview:', interview.id);
    return NextResponse.json({ interview });
  } catch (error) {
    console.error('Unexpected error in POST /api/interviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
