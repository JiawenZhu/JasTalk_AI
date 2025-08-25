import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase-server';

// POST /api/utterances - Log conversation utterances
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();

    const { interview_id, utterances } = body;

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

    // Handle single utterance or batch
    const utterancesToInsert = Array.isArray(utterances) ? utterances : [utterances];
    
    // Add interview_id and calculate word_count for each utterance
    const processedUtterances = utterancesToInsert.map(utterance => ({
      interview_id,
      speaker: utterance.speaker,
      text: utterance.text,
      timestamp: utterance.timestamp || new Date().toISOString(),
      word_count: utterance.text.split(' ').length,
      duration_seconds: utterance.duration_seconds || null,
      confidence_score: utterance.confidence_score || null
    }));

    const { data: insertedUtterances, error } = await supabase
      .from('utterances')
      .insert(processedUtterances)
      .select();

    if (error) {
      console.error('Error inserting utterances:', error);
      return NextResponse.json({ error: 'Failed to log utterances' }, { status: 500 });
    }

    console.log(`✅ Logged ${insertedUtterances.length} utterances for interview ${interview_id}`);
    return NextResponse.json({ utterances: insertedUtterances });
  } catch (error) {
    console.error('Unexpected error in POST /api/utterances:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
