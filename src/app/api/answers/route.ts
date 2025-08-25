import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

interface Answer {
  id?: string;
  question_id: string;
  user_id?: string;
  text: string;
  timestamp?: string;
  quality_metrics: {
    completeness: number;
    accuracy: number;
    clarity: number;
    technical_depth: number;
    confidence: number;
  };
  google_analysis?: {
    sentiment: number;
    topic_tags: string[];
    language_complexity: string;
    professional_tone: boolean;
    technical_depth: string;
  };
}

interface AnswerRequest {
  interview_id: string;
  answer: Answer;
}

// POST /api/answers - Log a new answer
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body: AnswerRequest = await request.json();
    const { interview_id, answer } = body;

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

    // Validate question exists and belongs to this interview
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .eq('id', answer.question_id)
      .eq('interview_id', interview_id)
      .single();

    if (questionError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Prepare answer data
    const answerData = {
      ...answer,
      user_id: user.id,
      timestamp: answer.timestamp || new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Insert answer
    const { data: insertedAnswer, error } = await supabase
      .from('answers')
      .insert(answerData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting answer:', error);
      return NextResponse.json({ error: 'Failed to log answer' }, { status: 500 });
    }

    console.log(`✅ Logged answer to question ${answer.question_id} for interview ${interview_id}`);
    
    return NextResponse.json({ 
      success: true,
      answer_id: insertedAnswer.id,
      message: 'Answer logged successfully'
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/answers:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error occurred while logging answer',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/answers - Get answers for an interview
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

    // Get answers for this interview with question details
    const { data: answers, error } = await supabase
      .from('answers')
      .select(`
        *,
        questions (
          text,
          topic,
          difficulty,
          category
        )
      `)
      .eq('interview_id', interview_id)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching answers:', error);
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      answers: answers || [],
      total: answers?.length || 0
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/answers:', error);
    return NextResponse.json({
      success: false,
      error: 'Unexpected error occurred while fetching answers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
