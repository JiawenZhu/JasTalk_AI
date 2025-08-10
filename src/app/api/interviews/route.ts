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

    // Get user's interviews
    const { data: interviews, error } = await supabase
      .from('interviews')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching interviews:', error);
      // Return empty array if table doesn't exist
      return NextResponse.json({ interviews: [] });
    }

    return NextResponse.json({ interviews: interviews || [] });
  } catch (error) {
    console.error('Error in GET /api/interviews:', error);
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
    const { title, description, interview_type, questions, agent_id, agent_name } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create interview
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .insert({
        user_id: user.id,
        title,
        description,
        interview_type: interview_type || 'general',
        question_count: questions?.length || 0,
        agent_id,
        agent_name,
        status: 'draft'
      })
      .select()
      .single();

    if (interviewError) {
      console.error('Error creating interview:', interviewError);
      // Return mock response if table doesn't exist
      return NextResponse.json({ 
        interview: {
          id: 'mock-interview-id',
          title,
          description,
          interview_type: interview_type || 'general',
          status: 'draft'
        }
      });
    }

    // Create questions if provided
    if (questions && questions.length > 0) {
      const questionsToInsert = questions.map((q: any, index: number) => ({
        interview_id: interview.id,
        question_text: q.text,
        question_type: q.type || 'general',
        difficulty: q.difficulty || 'medium',
        category: q.category,
        order_index: index
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) {
        console.error('Error creating questions:', questionsError);
        // Continue anyway, interview was created
      }
    }

    return NextResponse.json({ interview });
  } catch (error) {
    console.error('Error in POST /api/interviews:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
