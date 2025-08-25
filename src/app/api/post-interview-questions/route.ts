import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';


interface QuestionSubmission {
  questions: string;
  category: string;
  rating: number | null;
  needsFollowUp: boolean;
  contactPreference: string;
  interviewId?: string;
  agentName?: string;
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📝 Processing post-interview question submission...');
    
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      questions,
      category,
      rating,
      needsFollowUp,
      contactPreference,
      interviewId,
      agentName,
      timestamp
    }: QuestionSubmission = body;

    // Validate required fields
    if (!questions?.trim()) {
      return NextResponse.json({ error: 'Question text is required' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: 'Question category is required' }, { status: 400 });
    }

    console.log(`📋 Question submission: Category=${category}, NeedsFollowUp=${needsFollowUp}`);

    // Use admin client to bypass RLS
    const supabase = createAdminClient();

    // Generate unique submission ID
    const submissionId = `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store question in database
    const { data: questionRecord, error: insertError } = await supabase
      .from('post_interview_questions')
      .insert({
        id: submissionId,
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email || 'Anonymous',
        question_text: questions.trim(),
        category: category,
        rating: rating,
        needs_followup: needsFollowUp,
        contact_preference: contactPreference,
        interview_id: interviewId,
        agent_name: agentName,
        submitted_at: timestamp,
        status: needsFollowUp ? 'pending_response' : 'acknowledged',
        metadata: {
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          submission_source: 'post_interview_modal'
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error storing question:', insertError);
      return NextResponse.json({ 
        error: 'Failed to store question',
        details: insertError.message 
      }, { status: 500 });
    }

    console.log(`✅ Question stored successfully: ${submissionId}`);

    // If user needs follow-up, create a notification/task for admin
    if (needsFollowUp) {
      try {
        await supabase
          .from('admin_notifications')
          .insert({
            type: 'user_question',
            title: `New User Question: ${category}`,
            message: `User ${user.email} asked: "${questions.substring(0, 100)}${questions.length > 100 ? '...' : ''}"`,
            priority: rating && rating <= 2 ? 'high' : 'medium',
            data: {
              questionId: submissionId,
              userId: user.id,
              category,
              rating
            },
            created_at: new Date().toISOString()
          });
        
        console.log('📢 Admin notification created for follow-up');
      } catch (notificationError) {
        console.warn('⚠️ Failed to create admin notification:', notificationError);
        // Don't fail the main request if notification fails
      }
    }

    // Track analytics
    try {
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'post_interview_question',
          user_id: user.id,
          data: {
            category,
            has_rating: rating !== null,
            rating,
            needs_followup: needsFollowUp,
            question_length: questions.length,
            agent_name: agentName
          },
          timestamp: new Date().toISOString()
        });
      
      console.log('📊 Analytics event recorded');
    } catch (analyticsError) {
      console.warn('⚠️ Failed to record analytics:', analyticsError);
      // Don't fail the main request if analytics fails
    }

    return NextResponse.json({
      success: true,
      submissionId,
      message: needsFollowUp 
        ? 'Question submitted! We\'ll respond according to your preference.'
        : 'Thank you for your feedback!',
      needsFollowUp
    });

  } catch (error) {
    console.error('❌ Error in POST /api/post-interview-questions:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve questions for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you might want to implement proper role checking)
    const isAdmin = user.email?.includes('admin') || user.user_metadata?.role === 'admin';
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');

    const supabase = createAdminClient();
    let query = supabase
      .from('post_interview_questions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: questions, error } = await query;

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch questions',
        details: error.message 
      }, { status: 500 });
    }

    // Get summary statistics
    const { data: stats, error: statsError } = await supabase
      .from('post_interview_questions')
      .select('category, needs_followup, rating, status')
      .gte('submitted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

    const summary = {
      total: questions?.length || 0,
      byCategory: {},
      averageRating: 0,
      pendingFollowUp: 0
    };

    if (stats) {
      stats.forEach(q => {
        (summary.byCategory as any)[q.category] = ((summary.byCategory as any)[q.category] || 0) + 1;
        if (q.needs_followup && q.status === 'pending_response') {
          summary.pendingFollowUp++;
        }
      });
      
      const ratingsWithValues = stats.filter(q => q.rating !== null);
      if (ratingsWithValues.length > 0) {
        summary.averageRating = ratingsWithValues.reduce((sum, q) => sum + q.rating, 0) / ratingsWithValues.length;
      }
    }

    return NextResponse.json({
      success: true,
      questions,
      summary,
      pagination: {
        limit,
        offset,
        hasMore: (questions?.length || 0) === limit
      }
    });

  } catch (error) {
    console.error('Error in GET /api/post-interview-questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
