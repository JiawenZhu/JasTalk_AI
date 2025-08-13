import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

interface FreeInterviewRequest {
  interviewer_id?: string;
  user_message?: string;
  session_id?: string;
  prompt?: string;
  voice?: string;
  model?: string;
  maxDuration?: number;
  interview_context?: {
    job_description?: string;
    interview_type?: string;
    difficulty?: string;
    focus_areas?: string[];
  };
}

interface FreeInterviewResponse {
  text: string;
  audio?: string;
  isComplete: boolean;
  response?: string;
  session_id?: string;
  timestamp?: string;
  metadata?: {
    model_used: string;
    response_time_ms: number;
    tokens_used?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: FreeInterviewRequest = await request.json();
    const { 
      interviewer_id, 
      user_message, 
      session_id, 
      prompt,
      voice = 'alloy', // OpenAI voice options: alloy, echo, fable, onyx, nova, shimmer
      model = 'gpt-4o-mini',
      maxDuration = 30,
      interview_context 
    } = body;

    // Check if this is a practice interview request (has prompt) or regular interview
    if (prompt) {
      // Practice interview mode - no authentication required
      return await handlePracticeInterview(prompt, voice, model, maxDuration);
    }

    // Regular interview mode - requires authentication
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!interviewer_id || !user_message || !session_id) {
      return NextResponse.json({ 
        error: 'Missing required fields: interviewer_id, user_message, session_id' 
      }, { status: 400 });
    }

    return await handleRegularInterview(supabase, user, body);

  } catch (error) {
    console.error('Error in Free Interview Live API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handlePracticeInterview(
  prompt: string, 
  voice: string, 
  model: string, 
  maxDuration: number
): Promise<NextResponse> {
  try {
    // Get OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY not found in environment variables');
      console.error('❌ Available env vars:', Object.keys(process.env).filter(key => key.includes('OPENAI')));
      return NextResponse.json({ error: 'OpenAI API not configured' }, { status: 500 });
    }
    
    console.log(`🔑 OpenAI API Key loaded: ${openaiApiKey.substring(0, 10)}...${openaiApiKey.substring(openaiApiKey.length - 4)}`);
    
    console.log(`Practice interview request - Voice: ${voice}, Model: ${model}, Duration: ${maxDuration}s`);
    
    const startTime = Date.now();
    
    // Call OpenAI API with the practice prompt
    const openaiResponse = await callOpenAIAPI(
      openaiApiKey,
      prompt,
      model,
      maxDuration
    );

    const responseTime = Date.now() - startTime;

    // Generate audio using Retell API for professional voice quality
    let audioUrl: string | undefined;
    try {
      console.log('🎵 Attempting to generate Retell audio...');
      audioUrl = await generateRetellAudio(openaiResponse, voice);
      console.log('✅ Retell audio generated successfully');
    } catch (audioError) {
      console.warn('⚠️ Retell audio generation failed, falling back to browser speech:', audioError);
      console.warn('⚠️ Audio error details:', {
        message: audioError instanceof Error ? audioError.message : 'Unknown error',
        stack: audioError instanceof Error ? audioError.stack : undefined
      });
      // Don't fail the entire request, just continue without audio
      audioUrl = undefined;
    }

    const response: FreeInterviewResponse = {
      text: openaiResponse,
      audio: audioUrl || 'BROWSER_FALLBACK', // Always provide audio (either real or fallback)
      isComplete: true
    };

    console.log(`Practice interview completed in ${responseTime}ms`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in practice interview:', error);
    return NextResponse.json({ 
      error: 'Failed to generate interview response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function handleRegularInterview(supabase: any, user: any, body: FreeInterviewRequest): Promise<NextResponse> {
  const { interviewer_id, user_message, session_id, interview_context } = body;

  // Get interviewer details
  const { data: interviewer, error: interviewerError } = await supabase
    .from('interviewers')
    .select('*')
    .eq('id', interviewer_id)
    .single();

  if (interviewerError || !interviewer) {
    return NextResponse.json({ error: 'Interviewer not found' }, { status: 404 });
  }

  // Check if user has access to this interviewer type
  if (interviewer.subscription_required === 'pro') {
    // Check if user has pro subscription
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (!userProfile || userProfile.subscription_tier !== 'pro') {
      return NextResponse.json({ 
        error: 'Pro subscription required for this interviewer',
        upgrade_required: true 
      }, { status: 403 });
    }
  }

  // Get OpenAI API key
  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return NextResponse.json({ error: 'OpenAI API not configured' }, { status: 500 });
  }

  // Build the interview prompt
  const systemPrompt = buildInterviewPrompt(interviewer, interview_context);
  
  const startTime = Date.now();
  
  // Call OpenAI API
  const openaiResponse = await callOpenAIAPI(
    openaiApiKey,
    systemPrompt,
    user_message || '',
    interviewer.openai_config?.model || 'gpt-4o-mini'
  );

  const responseTime = Date.now() - startTime;

  // Log the conversation
  await logConversation(supabase, {
    session_id,
    interviewer_id,
    user_message,
    ai_response: openaiResponse,
    metadata: {
      model_used: interviewer.openai_config?.model || 'gpt-4o-mini',
      response_time_ms: responseTime
    }
  });

  const response: FreeInterviewResponse = {
    text: openaiResponse,
    audio: undefined,
    isComplete: true,
    response: openaiResponse,
    session_id,
    timestamp: new Date().toISOString(),
    metadata: {
      model_used: interviewer.openai_config?.model || 'gpt-4o-mini',
      response_time_ms: responseTime
    }
  };

  return NextResponse.json(response);
}

function buildInterviewPrompt(interviewer: any, context?: any): string {
  let prompt = `You are ${interviewer.name}, an AI interviewer with the following characteristics:
- Rapport: ${interviewer.rapport}/10
- Exploration: ${interviewer.exploration}/10  
- Empathy: ${interviewer.empathy}/10
- Speed: ${interviewer.speed}/10

Personality: ${interviewer.gemini_config?.personality || 'Professional and encouraging'}
Interview Style: ${interviewer.gemini_config?.interview_style || 'Structured but conversational'}

Your role is to conduct a realistic interview. You should:
1. Ask follow-up questions based on the candidate's responses
2. Provide constructive feedback when appropriate
3. Maintain the interview flow and structure
4. Show empathy and build rapport
5. Explore the candidate's experiences and skills thoroughly

`;

  if (context?.job_description) {
    prompt += `\nJob Context:
- Position: ${context.interview_type || 'General Interview'}
- Difficulty: ${context.difficulty || 'Medium'}
- Focus Areas: ${context.focus_areas?.join(', ') || 'General skills'}
- Job Description: ${context.job_description}

Tailor your questions and follow-ups to this specific role and requirements.`;
  }

  prompt += `\n\nRemember: You are conducting a live interview. Keep responses conversational and engaging. Ask one follow-up question at a time and wait for the candidate's response.`;

  return prompt;
}

async function callOpenAIAPI(
  apiKey: string, 
  systemPrompt: string, 
  userMessageOrModel: string, 
  modelOrMaxDuration: string | number
): Promise<string> {
  try {
    // Determine if this is a practice interview call or regular interview call
    const isPracticeInterview = typeof modelOrMaxDuration === 'number';
    
    let model: string;
    let maxOutputTokens: number;
    
    if (isPracticeInterview) {
      // Practice interview mode
      model = userMessageOrModel; // In practice mode, userMessageOrModel is the model
      maxOutputTokens = Math.min(modelOrMaxDuration * 10, 800); // Estimate tokens based on duration
    } else {
      model = modelOrMaxDuration as string; // In regular mode, modelOrMaxDuration is the model
      maxOutputTokens = 800;
    }

    console.log(`Calling OpenAI API with model: ${model}, max tokens: ${maxOutputTokens}`);

    // Use the actual model parameter instead of hardcoding
    const apiEndpoint = `https://api.openai.com/v1/chat/completions`;
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userMessageOrModel
          }
        ],
        max_tokens: maxOutputTokens,
        ...(model.startsWith('gpt-5') ? {} : { temperature: 0.7, top_p: 0.95 }),
        n: 1,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('🔍 OpenAI API response structure:', JSON.stringify(data, null, 2));
    
    const generatedText = data.choices?.[0]?.message?.content;
    
    if (!generatedText) {
      console.error('❌ No text found in response. Available keys:', Object.keys(data));
      if (data.choices) {
        console.error('❌ Choices structure:', data.choices);
      }
      throw new Error('No content received from OpenAI API');
    }

    return generatedText.trim();

  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

async function logConversation(supabase: any, logData: any) {
  try {
    await supabase
      .from('conversation_logs')
      .insert({
        call_id: logData.session_id,
        agent_id: logData.interviewer_id,
        agent_name: 'OpenAI Live Agent',
        candidate_name: 'User',
        transcript: {
          messages: [
            {
              role: 'user',
              content: logData.user_message,
              timestamp: new Date().toISOString()
            },
            {
              role: 'assistant',
              content: logData.ai_response,
              timestamp: new Date().toISOString()
            }
          ]
        },
        duration_seconds: 0,
        metadata: logData.metadata
      });
  } catch (error) {
    console.error('Error logging conversation:', error);
  }
}

async function generateRetellAudio(
  text: string, 
  voice: string
): Promise<string> {
  try {
    console.log(`🎵 Generating Retell TTS audio for text: "${text.substring(0, 50)}..." with voice: ${voice}`);
    
    const apiKey = process.env.RETELL_API_KEY;
    if (!apiKey) {
      console.error('❌ RETELL_API_KEY not found in environment variables');
      console.error('❌ Available env vars:', Object.keys(process.env).filter(key => key.includes('RETELL')));
      throw new Error('Retell API not configured');
    }

    const apiEndpoint = 'https://api.retell.com/v1/tts';
    
    console.log(`🎤 Using Retell TTS with voice: ${voice}`);
    console.log(`🔑 API Key available: ${apiKey ? 'Yes' : 'No'}`);
    
    const requestBody = {
      text: text,
      voice: voice, // alloy, echo, fable, onyx, nova, shimmer
      model: 'tts-1', // Retell's TTS model
      speed: 1.0, // Default speed
      pitch: 0.0, // Default pitch
      volume: 1.0, // Default volume
      sample_rate: '16000', // Default sample rate
      output_format: 'mp3' // Default output format
    };
    
    console.log('📤 TTS Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📥 TTS Response status: ${response.status}`);
    console.log(`📥 TTS Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Retell TTS error: ${response.status} - ${errorText}`);
      
      // Try to parse the error response for more details
      try {
        const errorData = JSON.parse(errorText);
        console.error('❌ TTS Error details:', errorData);
        
        // Check if it's a billing or permission issue
        if (errorData.error?.type === 'insufficient_quota') {
          console.error('❌ TTS Error: Insufficient quota - billing may be required');
        } else if (errorData.error?.type === 'invalid_request_error') {
          console.error('❌ TTS Error: Invalid request - check API parameters');
        } else if (errorData.error?.type === 'authentication_error') {
          console.error('❌ TTS Error: Authentication failed - check API key');
        }
      } catch (parseError) {
        console.error('❌ Could not parse TTS error response:', parseError);
      }
      
      throw new Error(`Retell TTS error: ${response.status} - ${errorText}`);
    }

    // Retell TTS returns audio data directly
    const audioBlob = await response.blob();
    console.log(`🎵 Audio blob size: ${audioBlob.size} bytes`);
    console.log(`🎵 Audio blob type: ${audioBlob.type}`);
    
    // Convert blob to base64 data URL
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
    const audioUrl = `data:audio/mp3;base64,${base64}`;
    
    console.log('✅ Retell TTS audio generated successfully');
    console.log(`🎵 Audio URL length: ${audioUrl.length} characters`);
    return audioUrl;

  } catch (error) {
    console.error('❌ Error generating Retell TTS audio:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

function getVoiceConfig(voice: string): string {
  // Map voice preferences to Retell voice options
  const voiceMap: { [key: string]: string } = {
    'zephyr': 'alloy',      // Warm, conversational female voice (default for free users)
    'warm': 'alloy',        // Same as Zephyr - warm and friendly
    'professional': 'echo',  // Professional, clear voice
    'friendly': 'fable',     // Friendly, approachable voice
    'natural': 'alloy',      // Natural, conversational voice
    'alloy': 'alloy',        // Retell's warm voice
    'echo': 'echo',          // Retell's professional voice
    'fable': 'fable',        // Retell's friendly voice
    'onyx': 'onyx',          // Retell's deep voice
    'nova': 'nova',          // Retell's bright voice
    'shimmer': 'shimmer'     // Retell's soft voice
  };
  
  // Default to 'alloy' for free users (warm, conversational)
  return voiceMap[voice.toLowerCase()] || 'alloy';
}
