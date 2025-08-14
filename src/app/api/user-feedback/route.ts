import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the request body
    const body = await request.json();
    const { sessionId, rating, feedback, interviewDuration, userId, userEmail } = body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Valid rating (1-5) is required' },
        { status: 400 }
      );
    }

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Insert feedback into the database
    const { data: feedbackData, error: insertError } = await supabase
      .from('user_feedback')
      .insert([
        {
          user_id: user.id,
          user_email: user.email,
          session_id: sessionId,
          rating: rating,
          feedback: feedback || null,
          interview_duration: interviewDuration,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting feedback:', insertError);
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    console.log('Feedback saved successfully:', feedbackData);

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback: feedbackData
    });

  } catch (error) {
    console.error('Error in user-feedback API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get feedback for the current user
    const { data: feedbackData, error: fetchError } = await supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching feedback:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: feedbackData
    });

  } catch (error) {
    console.error('Error in user-feedback GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
