import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import Retell from 'retell-sdk';

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('call_id');

    if (!callId) {
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 });
    }

    // Get current user
    const supabase = createServerClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the call belongs to the user
    const { data: conversationLog, error: logError } = await supabase
      .from('conversation_logs')
      .select('call_id, candidate_name')
      .eq('call_id', callId)
      .eq('candidate_name', user.email)
      .single();

    if (logError || !conversationLog) {
      return NextResponse.json({ error: 'Call not found or access denied' }, { status: 404 });
    }

    // Check if Retell API key is available
    if (!process.env.RETELL_API_KEY || process.env.RETELL_API_KEY === 'your_retell_api_key') {
      console.log("No valid RETELL_API_KEY found, returning mock response");
      return NextResponse.json({
        audio_url: null,
        call_id: callId,
        status: 'mock_mode',
        message: 'Mock mode - audio recording would be available with valid Retell API key'
      });
    }

    try {
      // Fetch call data from Retell API
      const callData = await retellClient.call.retrieve(callId);
      
      if (callData.recording_url) {
        return NextResponse.json({
          audio_url: callData.recording_url,
          call_id: callId,
          status: 'completed',
          duration: callData.duration_seconds,
          public_log_url: callData.public_log_url
        });
      } else {
        // Check if call is still processing
        if (callData.call_status === 'ended' || callData.call_status === 'completed') {
          return NextResponse.json({
            audio_url: null,
            call_id: callId,
            status: 'processing',
            message: 'Audio recording is still being processed by Retell'
          });
        } else {
          return NextResponse.json({
            audio_url: null,
            call_id: callId,
            status: 'not_ready',
            message: 'Call is still in progress or not yet ended'
          });
        }
      }
    } catch (retellError: any) {
      console.error('Error fetching audio from Retell:', retellError);
      
      // Handle specific Retell API errors
      if (retellError.status === 404) {
        return NextResponse.json({
          audio_url: null,
          call_id: callId,
          status: 'not_found',
          message: 'Call not found in Retell system'
        });
      } else if (retellError.status === 401) {
        return NextResponse.json({
          audio_url: null,
          call_id: callId,
          status: 'unauthorized',
          message: 'Invalid Retell API key'
        });
      } else {
        return NextResponse.json({
          audio_url: null,
          call_id: callId,
          status: 'error',
          message: 'Failed to fetch audio recording from Retell'
        });
      }
    }

  } catch (error) {
    console.error('Error in GET /api/retell-audio:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
