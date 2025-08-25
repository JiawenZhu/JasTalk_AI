import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateTranscript, convertConversationHistoryToTranscript } from '@/types/interview';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/interviews - Retrieve conversation logs with transcripts (with RLS policies)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('call_id');
    const candidateName = searchParams.get('candidate_name');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('conversation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters if provided
    if (callId) {
      query = query.eq('call_id', callId);
    }
    if (candidateName) {
      query = query.ilike('candidate_name', `%${candidateName}%`);
    }

    const { data: conversationLogs, error } = await query;

    if (error) {
      console.error('Error fetching conversation logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversation logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: conversationLogs,
      pagination: {
        limit,
        offset,
        total: conversationLogs?.length || 0
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET /api/interviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/interviews - Create/update conversation log with transcript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { call_id, candidate_name, transcript, interview_start_time, interview_end_time } = body;

    // Validate required fields
    if (!call_id || !candidate_name || !transcript) {
      return NextResponse.json(
        { error: 'Missing required fields: call_id, candidate_name, transcript' },
        { status: 400 }
      );
    }

    // Validate transcript structure
    if (!validateTranscript(transcript)) {
      return NextResponse.json(
        { error: 'Invalid transcript format. Must be an array of objects with role, content, and timestamp.' },
        { status: 400 }
      );
    }

    // Check if conversation log already exists for this call_id
    const { data: existingLog, error: fetchError } = await supabase
      .from('conversation_logs')
      .select('id')
      .eq('call_id', call_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing conversation log:', fetchError);
      return NextResponse.json(
        { error: 'Failed to check existing conversation log' },
        { status: 500 }
      );
    }

    let result;
    if (existingLog) {
      // Update existing conversation log with transcript
      const { data: updatedLog, error: updateError } = await supabase
        .from('conversation_logs')
        .update({
          transcript,
          interview_start_time: interview_start_time ? new Date(interview_start_time).toISOString() : null,
          interview_end_time: interview_end_time ? new Date(interview_end_time).toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLog.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating conversation log:', updateError);
        return NextResponse.json(
          { error: 'Failed to update conversation log' },
          { status: 500 }
        );
      }
      result = updatedLog;
    } else {
      // Create new conversation log with transcript
      const { data: newLog, error: insertError } = await supabase
        .from('conversation_logs')
        .insert({
          call_id,
          candidate_name,
          transcript,
          interview_start_time: interview_start_time ? new Date(interview_start_time).toISOString() : null,
          interview_end_time: interview_end_time ? new Date(interview_end_time).toISOString() : null
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating conversation log:', insertError);
        return NextResponse.json(
          { error: 'Failed to create conversation log' },
          { status: 500 }
        );
      }
      result = newLog;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: existingLog ? 'Conversation log updated successfully' : 'Conversation log created successfully'
    }, { status: existingLog ? 200 : 201 });

  } catch (error) {
    console.error('Unexpected error in POST /api/interviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/interviews - Update an existing interview
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, transcript, interview_end_time } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Interview ID is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {};
    
    if (transcript) {
      if (!validateTranscript(transcript)) {
        return NextResponse.json(
          { error: 'Invalid transcript format' },
          { status: 400 }
        );
      }
      updateData.transcript = transcript;
    }

    if (interview_end_time) {
      const endTime = new Date(interview_end_time);
      if (isNaN(endTime.getTime())) {
        return NextResponse.json(
          { error: 'Invalid interview_end_time format' },
          { status: 400 }
        );
      }
      updateData.interview_end_time = endTime.toISOString();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update the interview
    const { data: interview, error } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating interview:', error);
      return NextResponse.json(
        { error: 'Failed to update interview' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: interview,
      message: 'Interview updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error in PUT /api/interviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/interviews - Delete an interview
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Interview ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('interviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting interview:', error);
      return NextResponse.json(
        { error: 'Failed to delete interview' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Interview deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE /api/interviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
