import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { call_id, agent_name } = body;

    if (!call_id) {
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 });
    }

    // Create a test conversation log
    const { data: log, error } = await supabase
      .from('conversation_logs')
      .insert({
        call_id: call_id,
        agent_id: 'test-agent-id',
        agent_name: agent_name || 'Test Interviewer',
        candidate_name: user.email,
        transcript: [
          {
            speaker: 'agent',
            content: 'Tell me about a challenging technical problem you solved recently.',
            timestamp: new Date().toISOString()
          },
          {
            speaker: 'user',
            content: 'I recently had to optimize a database query that was taking too long to execute.',
            timestamp: new Date().toISOString()
          },
          {
            speaker: 'agent',
            content: 'That sounds interesting. What was your approach to solving this problem?',
            timestamp: new Date().toISOString()
          },
          {
            speaker: 'user',
            content: 'I started by analyzing the query execution plan and identified the bottleneck.',
            timestamp: new Date().toISOString()
          }
        ],
        post_call_analysis: {
          communication_score: 85,
          technical_score: 80,
          problem_solving_score: 82,
          confidence_score: 88,
          relevance_score: 87,
          overall_score: 84,
          strengths: [
            'Clear communication',
            'Good technical knowledge',
            'Structured problem-solving approach'
          ],
          areas_for_improvement: [
            'Could provide more specific technical details',
            'Consider elaborating on the solution implementation'
          ]
        },
        duration_seconds: 180
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating test conversation log:', error);
      return NextResponse.json({ 
        error: 'Failed to create conversation log',
        details: error.message 
      }, { status: 500 });
    }

    console.log('Test conversation log created successfully:', log);
    return NextResponse.json({ 
      success: true, 
      log,
      message: 'Test conversation log created successfully' 
    });

  } catch (error) {
    console.error('Error in test-create-log:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
