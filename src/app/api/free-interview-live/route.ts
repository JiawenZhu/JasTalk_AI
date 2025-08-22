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
    voice_system?: string;
    agent_id?: string;
    connection_id?: string;
    retell_status?: string; // Added for practice interview status
    duration_limit?: string; // Added for practice interview status
    access_level?: string; // Added for practice interview status
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

    console.log('🎤 Free Interview API called with:', { 
      hasPrompt: !!prompt, 
      hasUserMessage: !!user_message, 
      hasInterviewerId: !!interviewer_id,
      hasSessionId: !!session_id 
    });

    // Handle practice interview with Retell agent (NO authentication required)
    if (prompt && prompt.trim()) {
      console.log('🎤 Practice interview request received:', { prompt, voice, model, maxDuration });
      return await handlePracticeInterview(prompt.trim(), voice, model, maxDuration);
    }

    // Regular interview mode - requires authentication
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has sufficient credits for regular interviews
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('interview_time_remaining')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    const creditsRemaining = subscription?.interview_time_remaining || 0;
    
    if (creditsRemaining <= 0) {
      return NextResponse.json({ 
        error: 'Insufficient credits - Please add credits to continue interviews',
        creditsRemaining,
        requiredCredits: 0.01 // Minimum credit needed
      }, { status: 402 }); // Payment Required
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
    console.log('🎤 handlePracticeInterview called with:', { prompt, voice, model, maxDuration });
    
    // Get OpenAI API key for text generation
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      console.error('❌ OPENAI_API_KEY not found in environment variables');
      return NextResponse.json({ error: 'OpenAI API not configured' }, { status: 500 });
    }
    
    // Get Retell API key for agent connection
    const retellApiKey = process.env.RETELL_API_KEY;
    if (!retellApiKey) {
      console.error('❌ RETELL_API_KEY not found in environment variables');
      return NextResponse.json({ error: 'Retell API not configured' }, { status: 500 });
    }
    
    console.log(`🔑 OpenAI API Key loaded: ${openaiApiKey.substring(0, 10)}...`);
    console.log(`🔑 Retell API Key loaded: ${retellApiKey.substring(0, 10)}...`);
    
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
    console.log(`✅ OpenAI response received in ${responseTime}ms:`, openaiResponse.substring(0, 100) + '...');

    // Connect to Retell Lisa agent for real-time voice conversation (FREE for all users)
    let agentConnection: any = undefined;
    try {
      console.log('🎤 Attempting to connect to Retell Lisa agent (FREE for all users)...');
      agentConnection = await connectToRetellAgent(retellApiKey, 'lisa', maxDuration); // Pass maxDuration for 3-min limit
      console.log('✅ Retell agent connection established successfully');
    } catch (agentError) {
      console.warn('⚠️ Retell agent connection failed, falling back to enhanced browser speech:', agentError);
      console.warn('⚠️ Agent error details:', {
        message: agentError instanceof Error ? agentError.message : 'Unknown error',
        stack: agentError instanceof Error ? agentError.stack : undefined
      });
      
      // Generate enhanced browser speech instructions
      const audioUrl = await generateEnhancedBrowserSpeech(openaiResponse, voice);
      
      const response: FreeInterviewResponse = {
        text: openaiResponse,
        audio: audioUrl,
        isComplete: true,
        metadata: {
          model_used: model,
          response_time_ms: responseTime,
          voice_system: 'enhanced_browser_speech',
          retell_status: 'fallback'
        }
      };

      console.log(`Practice interview completed in ${responseTime}ms with browser speech fallback`);
      return NextResponse.json(response);
    }

    // If we have a successful agent connection, return the connection details
    const response: FreeInterviewResponse = {
      text: openaiResponse,
      audio: undefined, // No audio URL needed for agent connection
      isComplete: true,
      metadata: {
        model_used: model,
        response_time_ms: responseTime,
        voice_system: 'retell_agent',
        agent_id: agentConnection.agent_id,
        connection_id: agentConnection.connection_id,
        duration_limit: `${maxDuration} minutes`,
        access_level: 'free_user_retell_access'
      }
    };

    console.log(`Practice interview completed in ${responseTime}ms with Retell agent connection (FREE access)`);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in practice interview:', error);
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
    let messages: Array<{ role: string; content: string }>;
    
    if (isPracticeInterview) {
      // Practice interview mode
      model = userMessageOrModel; // In practice mode, userMessageOrModel is the model
      maxOutputTokens = Math.min(modelOrMaxDuration * 10, 800); // Estimate tokens based on duration
      
      // For practice interviews, use the systemPrompt as the user message
      messages = [
        {
          role: 'system',
          content: 'You are Lisa, a professional AI interviewer. Conduct a warm, engaging practice interview. Ask follow-up questions and provide constructive feedback.'
        },
        {
          role: 'user',
          content: systemPrompt // This contains the actual interview prompt
        }
      ];
    } else {
      model = modelOrMaxDuration as string; // In regular mode, modelOrMaxDuration is the model
      maxOutputTokens = 800;
      
      messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessageOrModel
        }
      ];
    }

    console.log(`Calling OpenAI API with model: ${model}, max tokens: ${maxOutputTokens}`);
    console.log(`Messages:`, messages);

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
        messages: messages,
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

    // Retell TTS API endpoint
    const apiEndpoint = 'https://api.retell.com/v1/tts';
    
    console.log(`🎤 Using Retell TTS with voice: ${voice}`);
    console.log(`🔑 API Key available: ${apiKey ? 'Yes' : 'No'}`);
    console.log(`🔑 API Key (first 10 chars): ${apiKey.substring(0, 10)}...`);
    
    const requestBody = {
      text: text,
      voice: voice,
      model: 'tts-1',
      speed: 1.0,
      pitch: 0.0,
      volume: 1.0,
      sample_rate: 16000,
      output_format: 'mp3'
    };
    
    console.log('📤 TTS Request body:', JSON.stringify(requestBody, null, 2));
    console.log('📤 TTS Request URL:', apiEndpoint);
    
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

async function generateEnhancedBrowserSpeech(text: string, voice: string): Promise<string> {
  try {
    console.log(`🎵 Generating enhanced browser speech instructions for text: "${text.substring(0, 50)}..." with voice: ${voice}`);

    // Since this runs on the server, we can't use browser APIs directly
    // Instead, return instructions for the frontend to use enhanced browser speech
    const voiceInstructions = {
      text: text,
      voice: voice,
      instructions: 'enhanced_browser_speech',
      voiceOptions: {
        'zephyr': 'Google UK English Female',
        'warm': 'Google UK English Female', 
        'professional': 'Google UK English Female',
        'friendly': 'Google UK English Female',
        'natural': 'Google UK English Female',
        'alloy': 'Google UK English Female',
        'echo': 'Google UK English Female',
        'fable': 'Google UK English Female',
        'onyx': 'Google UK English Female',
        'nova': 'Google UK English Female',
        'shimmer': 'Google UK English Female'
      }
    };

    // Return a special identifier that the frontend can recognize
    return `ENHANCED_BROWSER_SPEECH:${JSON.stringify(voiceInstructions)}`;

  } catch (error) {
    console.error('❌ Error in enhanced browser speech:', error);
    return 'BROWSER_FALLBACK';
  }
}

function getVoiceConfig(voice: string): string {
  // Map voice preferences to standard voice options that Retell might support
  const voiceMap: { [key: string]: string } = {
    'zephyr': 'alloy',      // Warm, conversational female voice (default for free users)
    'warm': 'alloy',        // Same as Zephyr - warm and friendly
    'professional': 'echo',  // Professional, clear voice
    'friendly': 'fable',     // Friendly, approachable voice
    'natural': 'alloy',      // Natural, conversational voice
    'alloy': 'alloy',        // Standard voice
    'echo': 'echo',          // Standard voice
    'fable': 'fable',        // Standard voice
    'onyx': 'onyx',          // Standard voice
    'nova': 'nova',          // Standard voice
    'shimmer': 'shimmer'     // Standard voice
  };
  
  // Default to 'alloy' for free users (warm, conversational)
  const selectedVoice = voiceMap[voice.toLowerCase()] || 'alloy';
  console.log(`🎤 Voice mapping: ${voice} -> ${selectedVoice}`);
  return selectedVoice;
}

async function connectToRetellAgent(apiKey: string, agentName: string, durationLimit: number): Promise<any> {
  try {
    console.log(`🎤 Connecting to Retell agent: ${agentName} with ${durationLimit} minute limit`);
    
    // Enforce 3-minute limit for free users
    const maxDuration = Math.min(durationLimit, 3); // Cap at 3 minutes for free users
    console.log(`⏱️ Duration limit enforced: ${maxDuration} minutes (free user limit)`);
    
    // First, get the list of available agents to find Lisa
    const agentsEndpoint = 'https://api.retell.com/v1/agents';
    console.log(`🔍 Fetching agents from: ${agentsEndpoint}`);
    
    const agentsResponse = await fetch(agentsEndpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!agentsResponse.ok) {
      const errorText = await agentsResponse.text();
      console.error(`❌ Failed to fetch agents: ${agentsResponse.status} - ${errorText}`);
      throw new Error(`Failed to fetch agents: ${agentsResponse.status}`);
    }

    const agents = await agentsResponse.json();
    console.log(`📋 Found ${agents.length} agents:`, agents.map((a: any) => ({ id: a.agent_id, name: a.agent_name })));

    // Find the Lisa agent
    const lisaAgent = agents.find((agent: any) => 
      agent.agent_name?.toLowerCase().includes('lisa') || 
      agent.agent_id?.toLowerCase().includes('lisa')
    );

    if (!lisaAgent) {
      console.error('❌ Lisa agent not found in available agents');
      console.error('❌ Available agents:', agents.map((a: any) => a.agent_name || a.agent_id));
      throw new Error('Lisa agent not found');
    }

    console.log(`✅ Found Lisa agent:`, {
      id: lisaAgent.agent_id,
      name: lisaAgent.agent_name,
      status: lisaAgent.status
    });

    // Create a connection to the Lisa agent with 3-minute limit
    const connectionEndpoint = 'https://api.retell.com/v1/connections';
    console.log(`🔗 Creating connection to agent: ${lisaAgent.agent_id} with ${maxDuration} minute limit`);
    
    const connectionResponse = await fetch(connectionEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agent_id: lisaAgent.agent_id,
        metadata: {
          interview_type: 'free_practice',
          duration_limit: `${maxDuration}_minutes`,
          user_type: 'free_user',
          access_level: 'free_retell_access',
          max_duration_seconds: maxDuration * 60
        }
      })
    });

    if (!connectionResponse.ok) {
      const errorText = await connectionResponse.text();
      console.error(`❌ Failed to create connection: ${connectionResponse.status} - ${errorText}`);
      throw new Error(`Failed to create connection: ${connectionResponse.status}`);
    }

    const connection = await connectionResponse.json();
    console.log(`✅ Connection created successfully:`, {
      connection_id: connection.connection_id,
      agent_id: connection.agent_id,
      status: connection.status,
      duration_limit: `${maxDuration} minutes`
    });

    return {
      agent_id: lisaAgent.agent_id,
      agent_name: lisaAgent.agent_name,
      connection_id: connection.connection_id,
      connection_status: connection.status,
      duration_limit: maxDuration,
      access_level: 'free_user_retell_access'
    };

  } catch (error) {
    console.error('❌ Error connecting to Retell agent:', error);
    throw error;
  }
}
