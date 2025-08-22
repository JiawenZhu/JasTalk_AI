const WebSocket = require('ws');
const { GoogleGenAI, Modality, MediaResolution } = require('@google/genai');
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env.local') });

const wss = new WebSocket.Server({ port: 3002 });
console.log('🚀 Real-Time Conversational AI Server starting on port 3002...');

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not configured. Please add it to your .env.local file.');
  process.exit(1);
}

console.log('✅ GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = 'models/gemini-2.5-flash-live-preview';

wss.on('connection', async (ws) => {
  console.log('🔌 New client connected. Waiting for voice configuration...');
  
  let currentVoiceConfig = {
    languageCode: 'en-US',
    voiceName: 'Puck'
  };
  
  let session = null;
  let sessionInitialized = false;
  
  // Text accumulation for larger chunks
  let accumulatedText = '';
  let textBuffer = [];
  let lastTextSentTime = 0;
  const TEXT_CHUNK_SIZE = 100; // Minimum words before sending
  const TEXT_TIMEOUT = 2000; // Max time to wait before sending (2 seconds)
  
  // Helper function to count words
  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  // Helper function to send accumulated text
  const sendAccumulatedText = () => {
    if (accumulatedText.trim().length > 0) {
      console.log(`📝 Sending accumulated text chunk (${countWords(accumulatedText)} words):`, accumulatedText.substring(0, 100) + '...');
      ws.send(JSON.stringify({ type: 'text_response', data: accumulatedText.trim() }));
      accumulatedText = '';
      lastTextSentTime = Date.now();
    }
  };
  
  // Helper function to add text and potentially send
  const addTextPart = (text) => {
    accumulatedText += text;
    const wordCount = countWords(accumulatedText);
    const timeSinceLastSend = Date.now() - lastTextSentTime;
    
    // Send if we have enough words OR enough time has passed
    if (wordCount >= TEXT_CHUNK_SIZE || timeSinceLastSend >= TEXT_TIMEOUT) {
      sendAccumulatedText();
    }
  };
  
  const initializeSession = async () => {
    if (sessionInitialized) return;
    
    try {
      const config = {
        responseModalities: [Modality.AUDIO],
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
        speechConfig: {
          languageCode: currentVoiceConfig.languageCode,
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: currentVoiceConfig.voiceName
            }
          }
        }
      };

      console.log('🔧 Session config:', JSON.stringify(config, null, 2));

      session = await ai.live.connect({
        model,
        config,
        callbacks: {
          onopen: () => {
            console.log('🔓 Gemini session opened');
            sessionInitialized = true;
          },
          onmessage: (message) => {
            console.log('📨 Received message from Gemini:', JSON.stringify(message, null, 2));
            
            // Forward setup completion to frontend
            if (message.setupComplete) {
              console.log('🚀 Setup complete - forwarding to frontend');
              ws.send(JSON.stringify({ setupComplete: true }));
              return;
            }
            
            if (message.serverContent?.modelTurn?.parts) {
              const parts = message.serverContent.modelTurn.parts;
              console.log(`📦 Processing ${parts.length} parts from model turn`);
              
              for (const part of parts) {
                if (part?.inlineData?.data) {
                  console.log('🎵 Sending audio chunk, size:', part.inlineData.data.length);
                  ws.send(JSON.stringify({ type: 'audio_chunk', data: part.inlineData.data }));
                }
                if (part?.text) {
                  console.log('📝 Sending text response:', part.text);
                  ws.send(JSON.stringify({ type: 'text_response', data: part.text }));
                }
              }
            }
            
            if (message.serverContent?.turnComplete) {
              console.log('✅ Turn complete - sending audio_end');
              ws.send(JSON.stringify({ type: 'audio_end' }));
            }
          },
          onerror: (e) => {
            console.error('❌ Gemini Session Error:', e);
            ws.send(JSON.stringify({ type: 'error', data: 'An error occurred with the AI session.' }));
          },
          onclose: (e) => {
            console.log('🔒 Gemini Session Closed:', e);
          },
        },
      });

      console.log('✅ Gemini live session initialized with voice:', currentVoiceConfig.voiceName);
    } catch (error) {
      console.error('❌ Failed to initialize Gemini live session:', error);
      ws.send(JSON.stringify({ type: 'error', data: 'Failed to initialize AI model.' }));
      ws.close();
    }
  };

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received client message:', data);
      
      // Handle start_interview message
      if (data.type === 'start_interview') {
        console.log('🎯 Starting interview with:', {
          interviewer: data.interviewer,
          questionsCount: data.questions?.length || 0,
          sessionId: data.sessionId
        });
        
        // Store questions in the WebSocket session for tracking
        ws.interviewQuestions = data.questions || [];
        ws.currentQuestionIndex = 0;
        
        // Initialize session if not already done
        if (!sessionInitialized) {
          await initializeSession();
        }
        
        if (session) {
          // Generate initial greeting with first question
          const firstQuestion = data.questions?.[0]?.text || 'Tell me about yourself.';
          const greeting = `Hello! I'm ${data.interviewer}, and I'll be conducting your interview today. We have ${data.questions?.length || 0} questions prepared. Let's begin with the first question: ${firstQuestion}`;
          
          console.log('🎤 Sending initial greeting:', greeting);
          
          // Send the greeting to Gemini
          session.sendClientContent({
            turns: [{ parts: [{ text: greeting }] }]
          });
          
          // Send a start_interview_response to the frontend with question context
          ws.send(JSON.stringify({ 
            type: 'start_interview_response', 
            data: greeting,
            questionIndex: 0,
            question: firstQuestion
          }));
        }
        return;
      }
      
      // Handle voice configuration
      if (data.type === 'voice_config' && data.voiceConfig) {
        console.log('🎵 Received voice config:', data.voiceConfig);
        currentVoiceConfig = {
          languageCode: data.voiceConfig.languageCode || 'en-US',
          voiceName: data.voiceConfig.voiceName || 'Puck'
        };
        console.log('🎵 Updated voice config:', currentVoiceConfig);
        
        // Initialize session with new voice config
        await initializeSession();
        return;
      }
      
      // Handle text messages
      if (data.text) {
        // Initialize session if not already done (fallback)
        if (!sessionInitialized) {
          await initializeSession();
        }
        
        if (session) {
          console.log('💬 Sending user message to Gemini:', data.text);
          
          // Check if this user response should trigger the next question
          if (ws.interviewQuestions && ws.currentQuestionIndex !== undefined) {
            // Increment question index for next AI response
            ws.currentQuestionIndex++;
            
            // If we have more questions, prepare the next one
            if (ws.currentQuestionIndex < ws.interviewQuestions.length) {
              const nextQuestion = ws.interviewQuestions[ws.currentQuestionIndex];
              console.log(`🎯 Preparing next question (${ws.currentQuestionIndex + 1}/${ws.interviewQuestions.length}):`, nextQuestion.text);
              
              // Send question context to frontend
              ws.send(JSON.stringify({
                type: 'next_question',
                questionIndex: ws.currentQuestionIndex,
                question: nextQuestion.text,
                totalQuestions: ws.interviewQuestions.length
              }));
            }
          }
          
          // Send the user's text to the live session
          session.sendClientContent({
            turns: [{ parts: [{ text: data.text }] }]
          });
        }
      }
    } catch (error) {
      console.error('❌ Error processing client message:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 Client disconnected. Closing Gemini session.');
    if (session) {
      session.close();
    }
  });
});

console.log('✅ Real-Time Conversational AI Server is ready.');
