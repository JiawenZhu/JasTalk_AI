import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

interface Question {
  id?: string;
  text: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  expected_key_points: string[];
  follow_up_questions?: string[];
  timestamp?: string;
  interviewer_id?: string;
}

interface QuestionRequest {
  interview_id: string;
  question: Question;
}

// POST /api/questions - Log a new question
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body: QuestionRequest = await request.json();
    const { interview_id, question } = body;

    // Validate interview belongs to user
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id')
      .eq('id', interview_id)
      .eq('user_id', user.id)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Prepare question data
    const questionData = {
      ...question,
      interview_id,
      user_id: user.id,
      timestamp: question.timestamp || new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Insert question
    const { data: insertedQuestion, error } = await supabase
      .from('questions')
      .insert(questionData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting question:', error);
      return NextResponse.json({ error: 'Failed to log question' }, { status: 500 });
    }

    console.log(`✅ Logged question: ${question.text} for interview ${interview_id}`);
    
    return NextResponse.json({ 
      success: true,
      question_id: insertedQuestion.id,
      message: 'Question logged successfully'
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/questions:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error occurred while logging question',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/questions - Get questions for an interview
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const interview_id = searchParams.get('interview_id');

    if (!interview_id) {
      return NextResponse.json({ error: 'Interview ID is required' }, { status: 400 });
    }

    // Validate interview belongs to user
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id')
      .eq('id', interview_id)
      .eq('user_id', user.id)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Get questions for this interview
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .eq('interview_id', interview_id)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      questions: questions || [],
      total: questions?.length || 0
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/questions:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error occurred while fetching questions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
