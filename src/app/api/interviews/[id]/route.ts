import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase-server';

// GET /api/interviews/[id] - Fetch specific interview
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use admin client for database operations
    const supabase = createAdminClient();

    const { data: interview, error } = await supabase
      .from('interviews')
      .select(`
        *,
        utterances:utterances(*),
        analysis:interview_analysis(*)
      `)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json({ interview });
  } catch (error) {
    console.error('Unexpected error in GET /api/interviews/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/interviews/[id] - Update interview status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use admin client for database operations
    const supabase = createAdminClient();
    const body = await request.json();

    const { status, questions_answered, completed_at } = body;

    const updateData: any = { status };
    if (questions_answered !== undefined) updateData.questions_answered = questions_answered;
    if (completed_at !== undefined) updateData.completed_at = completed_at;

    const { data: interview, error } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating interview:', error);
      return NextResponse.json({ error: 'Failed to update interview' }, { status: 500 });
    }

    console.log(`✅ Updated interview ${params.id} status to ${status}`);
    return NextResponse.json({ interview });
  } catch (error) {
    console.error('Unexpected error in PATCH /api/interviews/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
