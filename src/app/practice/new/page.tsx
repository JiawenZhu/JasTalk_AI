'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import { RootState, AppDispatch } from '@/store';
import { setSelectedInterviewer, VoiceAgent } from '@/store/interviewerSlice'; // Corrected import
import VoiceAgentSelector from '@/components/practice/VoiceAgentSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronLeft, Mic, Volume2, MicOff } from 'lucide-react';
import InterviewTimer from '@/components/InterviewTimer';
import MinimalTimer from '@/components/MinimalTimer';
import { useAuth } from '@/contexts/auth.context';
import { useCredits } from '@/contexts/credits-context';
import { toast as sonnerToast } from 'sonner';
import { Buffer } from 'buffer';
import PerformanceAnalysis from '@/components/interview/PerformanceAnalysis';
import CelebrationPanel from '@/components/interview/CelebrationPanel';
import PausePanel from '@/components/interview/PausePanel';
import PostInterviewQuestions from '@/components/interview/PostInterviewQuestions';
import MovableQuestionsPanel from '@/components/interview/MovableQuestionsPanel';
import MovableNotesTaker from '@/components/interview/MovableNotesTaker';
import PanelToggle from '@/components/interview/PanelToggle';
import StartSpeakingButton from '@/components/StartSpeakingButton';
import { useInterviewSession } from '@/hooks/use-interview-session';
import { useInterviewPipeline } from '@/hooks/use-interview-pipeline';

import { mapVoiceIdToGeminiVoice, getVoiceById, getVoiceStats } from '@/lib/voice-config';
import { CreditValidation } from '@/components/ui/credit-validation';

class AudioPlayer {
  private audioContext: AudioContext;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying = false;
  private source: AudioBufferSourceNode | null = null;
  private sampleRate: number;

  constructor(sampleRate = 24000) {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.sampleRate = sampleRate;
     const resumeContext = () => {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(e => console.error("Error resuming AudioContext:", e));
        }
        document.removeEventListener('click', resumeContext);
        document.removeEventListener('keydown', resumeContext);
    };
    document.addEventListener('click', resumeContext);
    document.addEventListener('keydown', resumeContext);
  }

  public addChunk(chunk: ArrayBuffer) {
    console.log('🔊 AudioPlayer: Adding chunk to queue, size:', chunk.byteLength, 'Queue length:', this.audioQueue.length);
    this.audioQueue.push(chunk);
    if (!this.isPlaying) {
      this.playNextChunk();
    }
  }

  private async playNextChunk() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      console.log('🔊 AudioPlayer: Queue empty, stopping playback');

return;
    }

    this.isPlaying = true;
    const chunk = this.audioQueue.shift()!;
    console.log('🔊 AudioPlayer: Playing chunk, size:', chunk.byteLength, 'Remaining in queue:', this.audioQueue.length);
    
    try {
      const audioBuffer = await this.decodeChunk(chunk);
      console.log('🔊 AudioPlayer: Decoded buffer, duration:', audioBuffer.duration, 'seconds');
      this.source = this.audioContext.createBufferSource();
      this.source.buffer = audioBuffer;
      this.source.connect(this.audioContext.destination);
      this.source.start();
      this.source.onended = () => this.playNextChunk();
      } catch (error) {
      console.error('🔊 AudioPlayer: Error playing audio chunk:', error);
      this.playNextChunk();
    }
  }
  
  private async decodeChunk(chunk: ArrayBuffer): Promise<AudioBuffer> {
    const float32Array = new Float32Array(chunk.byteLength / 2);
    const dataView = new DataView(chunk);
    for (let i = 0; i < float32Array.length; i++) {
        float32Array[i] = dataView.getInt16(i * 2, true) / 32768.0;
    }
    
    const audioBuffer = this.audioContext.createBuffer(1, float32Array.length, this.sampleRate);
    audioBuffer.copyToChannel(float32Array, 0);
    
return audioBuffer;
  }

  public stop() {
    if (this.source) {
      try {
        this.source.stop();
      } catch (e) {
         console.warn("Audio source couldn't be stopped, it might have already finished.");
      }
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }
}

function NewPracticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading: userLoading } = useAuth();
  const { startInterviewTracking, stopInterviewTracking, hasCredits } = useCredits();
  const { selectedInterviewer: selectedAgent } = useSelector((state: RootState) => state.interviewer);
  
  const [isInterviewActive, setIsInterviewActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [lastAgentResponse, setLastAgentResponse] = useState<string>('');
  const [activeTurn, setActiveTurn] = useState<'user' | 'ai' | 'waiting' | null>(null);
  
  // WebSocket state
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const [isWebSocketConnecting, setIsWebSocketConnecting] = useState(false);
  
  const audioPlayerRef = useRef<AudioPlayer | null>(null);

  const [isListening, setIsListening] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const transcriptRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{speaker: 'user' | 'ai', text: string, timestamp: Date}>>([]);
  
  // AI response accumulation for complete logging
  const [currentAiResponse, setCurrentAiResponse] = useState<string>('');
  const [aiResponseStartTime, setAiResponseStartTime] = useState<Date | null>(null);
  
  // Performance Analysis States
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [showPausePanel, setShowPausePanel] = useState<boolean>(false);
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [sessionUsage, setSessionUsage] = useState({ inputTokens: 0, outputTokens: 0, ttsCharacters: 0, duration: 0 });
  const [showQuestionsModal, setShowQuestionsModal] = useState(false);
  const interviewStartTimeRef = useRef<Date | null>(null);
  
  // Panel visibility state for Questions and Notes
  const [showQuestionsPanel, setShowQuestionsPanel] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [interviewNotes, setInterviewNotes] = useState('');
  
  // Question tracking state
  const [currentOfficialQuestion, setCurrentOfficialQuestion] = useState(0);
  const [followUpQuestionsCount, setFollowUpQuestionsCount] = useState(0);
  const [questionState, setQuestionState] = useState<'waiting' | 'asking' | 'followup' | 'completed'>('waiting');
  
  // WebSocket setup tracking
  const [initialPromptSent, setInitialPromptSent] = useState(false);
  const [hasSetupCompleted, setHasSetupCompleted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  
  // Ensure state variables are always defined
  const safeFollowUpQuestionsCount = followUpQuestionsCount || 0;
  const safeCurrentOfficialQuestion = currentOfficialQuestion || 0;
  
  // Silence detection state for Click To Speak button
  const [showStartSpeakingButton, setShowStartSpeakingButton] = useState(false);
  const [lastUserActivity, setLastUserActivity] = useState<number>(Date.now());
  const SILENCE_THRESHOLD = 10000; // 10 seconds of silence
  
  // Interview session management
  const { 
    currentSession, 
    createSession, 
    loadSession, 
    updateSession, 
    autoSaveSession,
    completeSession,
    pauseSession 
  } = useInterviewSession();

  // New conversation pipeline
  const {
    currentInterview,
    createInterview,
    logUtterance,
    completeInterview,
    isLoading: pipelineLoading,
    error: pipelineError
  } = useInterviewPipeline();



  // Helper function to log any pending AI response (defined after hooks)
  const logPendingAiResponse = useCallback(() => {
    if (currentAiResponse.trim().length > 0 && aiResponseStartTime && currentInterview) {
      console.log(`📝 Logging pending AI response: "${currentAiResponse.trim()}"`);
      logUtterance(currentInterview.id, {
        speaker: 'AGENT',
        text: currentAiResponse.trim(),
        timestamp: aiResponseStartTime.toISOString()
      }).catch(err => console.warn('Failed to log pending AI utterance:', err));
      
      // Add to conversation history if not already there
      setConversationHistory(prev => {
        const lastEntry = prev[prev.length - 1];
        if (lastEntry?.speaker !== 'ai' || lastEntry?.text !== currentAiResponse.trim()) {
          return [...prev, { 
            speaker: 'ai' as const, 
            text: currentAiResponse.trim(), 
            timestamp: aiResponseStartTime 
          }];
        }
        
return prev;
      });
      
      // Reset accumulation
      setCurrentAiResponse('');
      setAiResponseStartTime(null);
    }
  }, [currentAiResponse, aiResponseStartTime, currentInterview, logUtterance]);
  
  // Resume functionality
  const resumeSessionKey = searchParams.get('resume');
  const resumeFromLog = searchParams.get('resumeFromLog');
  const resumeAgentId = searchParams.get('agentId');
  const resumeQuestionsAnswered = searchParams.get('questionsAnswered');
  const resumeNextQuestion = searchParams.get('nextQuestion');
  const [isResuming, setIsResuming] = useState(false);
  
  // Auto-save session progress when conversation changes
  useEffect(() => {
    if (currentSession && conversationHistory.length > 0 && isInterviewActive) {
      const timeSpent = interviewStartTimeRef.current 
        ? Math.floor((Date.now() - interviewStartTimeRef.current.getTime()) / 1000)
        : 0;
      
      // Calculate current question index and completed questions
      // Assuming every pair of user+ai responses represents one completed question
      const questionsCompleted = Math.floor(conversationHistory.filter(h => h.speaker === 'user').length);
      const currentQuestionIndex = Math.min(questionsCompleted, (currentSession.totalQuestions || 0) - 1);
      
      autoSaveSession(currentSession.sessionKey, {
        conversationHistory,
        questionsCompleted,
        currentQuestionIndex,
        timeSpent,
        lastAiResponse: conversationHistory.filter(h => h.speaker === 'ai').pop()?.text,
        lastUserResponse: conversationHistory.filter(h => h.speaker === 'user').pop()?.text,
        currentTurn: activeTurn === 'ai' ? 'ai' : activeTurn === 'user' ? 'user' : 'waiting',
        snapshotType: 'question_complete'
      });
    }
  }, [conversationHistory, currentSession, isInterviewActive, activeTurn, autoSaveSession]);

  // Handle session resumption (new conversation log method)
  useEffect(() => {
    if (resumeFromLog && !isResuming) {
      setIsResuming(true);
      handleLogBasedResume();
    } else if (resumeSessionKey && !isResuming && !currentSession) {
      setIsResuming(true);
      handleSessionResume(resumeSessionKey);
    }
  }, [resumeFromLog, resumeSessionKey, isResuming, currentSession]);

  // Cleanup effect to stop credit tracking when component unmounts
  useEffect(() => {
    return () => {
      // Stop credit tracking when component unmounts
      stopInterviewTracking();
      console.log('💰 Stopped real-time credit tracking - component unmounted');
    };
  }, [stopInterviewTracking]);

  // Silence detection effect for Start Speaking button
  useEffect(() => {
    if (!isInterviewActive) {
      return;
    }

    const checkSilence = () => {
      const timeSinceLastActivity = Date.now() - lastUserActivity;
      setShowStartSpeakingButton(timeSinceLastActivity > SILENCE_THRESHOLD && activeTurn === 'user' && !isListening);
    };

    const interval = setInterval(checkSilence, 1000);
    
return () => clearInterval(interval);
  }, [isInterviewActive, lastUserActivity, activeTurn, isListening]);

  const handleLogBasedResume = async () => {
    try {
      console.log('🔄 Resuming from conversation log:', {
        logId: resumeFromLog,
        agentId: resumeAgentId,
        questionsAnswered: resumeQuestionsAnswered,
        nextQuestion: resumeNextQuestion
      });
      
      setIsLoading(true);
      
      // Load the conversation log
      const response = await fetch(`/api/get-conversation-logs?logId=${resumeFromLog}`);
      if (!response.ok) {
        throw new Error('Failed to load conversation log');
      }
      
      const logData = await response.json();
      if (!logData || !logData.transcript) {
        throw new Error('No conversation data found');
      }
      
      // Get stored questions from localStorage (generated when starting interview)
      const storedQuestions = localStorage.getItem('generatedQuestions');
      const questions = storedQuestions ? JSON.parse(storedQuestions) : [];
      
      if (questions.length === 0) {
        throw new Error('No questions found. Please start a new interview.');
      }
      
      // Find the agent by ID
      const agentsResponse = await fetch('/api/voice-agents');
      if (agentsResponse.ok) {
        const agents = await agentsResponse.json();
        const agent = agents.find((a: any) => a.agent_id === resumeAgentId);
        
        if (agent) {
          dispatch(setSelectedInterviewer({
            id: agent.agent_id,
            displayName: agent.name,
            voiceId: agent.voice_id || 'default',
            languageCode: agent.language_code || 'en-US'
          } as VoiceAgent));
        }
      }
      
      // Restore conversation history from the log
      const restoredHistory = logData.transcript.map((entry: any) => ({
        speaker: entry.role === 'user' ? 'user' as const : 'ai' as const,
        text: entry.text,
        timestamp: new Date(entry.timestamp)
      }));
      
      setConversationHistory(restoredHistory);
      
      // Start the interview in resumed state
      setIsInterviewActive(true);
      
      // Restart real-time credit tracking for resumed interview
      startInterviewTracking();
      console.log('💰 Restarted real-time credit tracking - interview resumed');
      
      // Initialize WebSocket connection
      const currentAgent = selectedAgent || {
        id: resumeAgentId,
        displayName: logData.agent_name,
        voiceId: 'default',
        languageCode: 'en-US'
      };
      
      if (currentAgent && questions) {
        const voiceConfig = {
          languageCode: currentAgent.languageCode || 'en-US',
          voiceName: mapVoiceIdToGeminiVoice(currentAgent.voiceId, currentAgent.languageCode, currentAgent.displayName)
        };
        
        connectWebSocket(questions, voiceConfig);
      }
      
      sonnerToast.success(`Interview resumed! Continuing from question ${resumeNextQuestion} of ${questions.length}`);
      
      console.log('✅ Interview resumed from conversation log', {
        agent: logData.agent_name,
        questionsAnswered: resumeQuestionsAnswered,
        nextQuestion: resumeNextQuestion,
        totalQuestions: questions.length,
        conversationHistoryLength: restoredHistory.length
      });
      
    } catch (error) {
      console.error('❌ Error resuming from conversation log:', error);
      sonnerToast.error('Failed to resume interview. Starting fresh interview.');
      
      // Clear resume parameters and start fresh
      router.replace('/practice/new');
    } finally {
      setIsLoading(false);
      setIsResuming(false);
    }
  };

  const handleSessionResume = async (sessionKey: string) => {
    try {
      console.log('🔄 Resuming session:', sessionKey);
      setIsLoading(true);
      
      const session = await loadSession(sessionKey);
      if (session) {
        // Restore session state
        const {
          agentId,
          agentName,
          agentVoice,
          questions,
          currentQuestionIndex,
          questionsCompleted,
          conversationHistory,
          lastAiResponse,
          lastUserResponse,
          currentTurn
        } = session;

        // Find and set the agent
        // Note: You might need to fetch agents here if they're not already loaded
        const agent = {
          id: agentId,
          displayName: agentName,
          voiceId: agentVoice || 'default',
          languageCode: 'en-US'
        };
        dispatch(setSelectedInterviewer(agent as VoiceAgent));

        // Restore questions to localStorage for compatibility
        localStorage.setItem('generatedQuestions', JSON.stringify(questions));

        // Restore conversation history
        if (conversationHistory && conversationHistory.length > 0) {
          setConversationHistory(conversationHistory);
        }

        // Restore other state
        if (lastAiResponse) {setLastAgentResponse(lastAiResponse);}
        if (currentTurn) {
          // Convert session turn type to component turn type
          const convertedTurn: 'user' | 'ai' | 'waiting' | null = 
            currentTurn === 'ai' ? 'ai' : 
            currentTurn === 'user' ? 'user' :
            currentTurn === 'waiting' ? 'waiting' : null;
          setActiveTurn(convertedTurn);
        }

        // Start the interview in resumed state
        setIsInterviewActive(true);
        
        // Restart real-time credit tracking for resumed interview
        startInterviewTracking();
        console.log('💰 Restarted real-time credit tracking - session resumed');
        
        // Initialize WebSocket connection for resumed interview
        if (selectedAgent && questions) {
          // Prepare voice configuration for resumed session
          const voiceConfig = {
            languageCode: selectedAgent.languageCode || 'en-US',
            voiceName: mapVoiceIdToGeminiVoice(selectedAgent.voiceId, selectedAgent.languageCode, selectedAgent.displayName)
          };
          
          connectWebSocket(questions, voiceConfig);
        }

        sonnerToast.success(`Session resumed! Continuing from question ${currentQuestionIndex + 1} of ${questions?.length || 0}`);

        console.log('✅ Session resumed successfully', {
          agent: agentName,
          currentQuestion: currentQuestionIndex + 1,
          totalQuestions: questions?.length || 0,
          questionsCompleted,
          agentId,
          sessionKey: session.sessionKey,
          conversationHistoryLength: conversationHistory?.length || 0
        });
      } else {
        throw new Error('Session not found');
      }
    } catch (error) {
      console.error('❌ Error resuming session:', error);
      sonnerToast.error('Failed to resume session. Starting fresh interview.');
      
      // Clear resume parameter and start fresh
      router.replace('/practice/new');
    } finally {
      setIsLoading(false);
      setIsResuming(false);
    }
  };

  useEffect(() => {
    audioPlayerRef.current = new AudioPlayer();
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      console.log('🎤 Speech recognition available, initializing...');
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      // Settings optimized for natural conversation
      recognitionInstance.maxAlternatives = 1;
      
      // Try to set more responsive speech detection (if supported)
      if ('webkitSpeechRecognition' in window) {
        try {
          recognitionInstance.serviceURI = 'wss://www.google.com/speech-api/full-duplex/v1/up';
        } catch (e) {
          // Ignore if not supported
        }
      }
      
      console.log('🎤 Speech recognition configured successfully');
      
      // Request microphone permission upfront
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            console.log('✅ Microphone permission granted');
            // Stop the stream as we're using speech recognition, not direct audio
            stream.getTracks().forEach(track => track.stop());
          })
          .catch(error => {
            console.error('❌ Microphone permission denied:', error);
            sonnerToast.error('Microphone access is required for voice interviews. Please allow microphone permissions.');
          });
      }

      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        const newTranscript = finalTranscript + interimTranscript;
        console.log('🎤 Speech detected:', newTranscript);
        setTranscript(newTranscript);
        transcriptRef.current = newTranscript;
      };

      recognitionInstance.onstart = () => {
        console.log('🎤 Speech recognition started');
        setIsListening(true);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error('🎤 Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          sonnerToast.error('Microphone permission denied. Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          console.log('🎤 No speech detected, continuing to listen...');
          // Don't show error for no-speech, it's normal
        } else {
          sonnerToast.error(`Speech recognition error: ${event.error}`);
        }
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        // Natural conversation flow - auto-submit after natural pause
        setTimeout(() => {
          const userText = transcriptRef.current.trim();
          
          console.log(`🎤 Recognition ended. UserText: "${userText}", WS connected: ${!!ws}, ActiveTurn: ${activeTurn}`);
          
          if (userText && ws) {
            // Auto-submit any response after natural pause (like ChatGPT voice)
            console.log(`🎤 Natural pause detected - submitting response:`, userText.substring(0, 100) + '...');
            
            setConversationHistory(prev => {
              const newHistory = [...prev, { speaker: 'user' as const, text: userText, timestamp: new Date() }];
              console.log(`📝 Updated conversation history: ${newHistory.length} entries (User response added)`);
              
              // 🔥 NEW PIPELINE: Log user utterance
              if (currentInterview) {
                logUtterance(currentInterview.id, {
                  speaker: 'USER',
                  text: userText,
                  timestamp: new Date().toISOString()
                }).catch(err => console.warn('Failed to log user utterance:', err));
              }
              
              return newHistory;
            });
            
            ws.send(JSON.stringify({
              text: userText
            }));
            setTranscript('');
            transcriptRef.current = '';
            setActiveTurn('ai');
          }
        }, 100); // Small delay to ensure transcript is captured
      };
      recognitionRef.current = recognitionInstance;
    } else {
      console.error('❌ Speech recognition not supported in this browser');
      sonnerToast.error('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
    
    return () => {
      ws?.close();
      audioPlayerRef.current?.stop();
    };
  }, [ws]);

  const handleAgentSelect = useCallback((agent: VoiceAgent) => {
    dispatch(setSelectedInterviewer(agent)); // Corrected action
  }, [dispatch]);

  const connectWebSocket = useCallback((questions: any[], voiceConfig?: any) => {
    console.log('🔌 Attempting WebSocket connection to ws://localhost:3002...');
    const newWs = new WebSocket('ws://localhost:3002');
    
    // Add error handling
    newWs.onerror = (error) => {
      console.error('❌ WebSocket connection error:', error);
      setIsLoading(false);
      setError('Failed to connect to interview server. Please try again.');
    };
    
    newWs.onclose = (event) => {
      console.log('🔌 WebSocket closed:', event.code, event.reason);
      if (!event.wasClean) {
        setIsLoading(false);
        setError('Connection lost. Please try again.');
      }
    };

        let hasSetupCompleted = false;
    let initialPromptSent = false;

    newWs.onopen = () => {
      console.log('✅ WebSocket connected');
      setIsLoading(false);
      setIsInterviewActive(true);
      setActiveTurn('ai');
      
      // Start real-time credit tracking - this will deduct credits every second
      startInterviewTracking();
      console.log('💰 Started real-time credit tracking - credits will be deducted every second');
      
      // Send voice configuration if provided
      if (voiceConfig) {
        console.log('🎵 Sending voice config:', voiceConfig);
        newWs.send(JSON.stringify({
          type: 'voice_config',
          voiceConfig
        }));
      }
    };

    newWs.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('📥 Frontend received message:', message);
        
        // Handle setup completion - this is when we can send the initial prompt
        if (message.setupComplete && !initialPromptSent) {
          hasSetupCompleted = true;
          console.log('🚀 Setup completed, sending initial prompt...');
          
          const questionText = questions.map((q: any) => `- ${q.text}`).join('\n');
          const initialPrompt = `You are an expert AI interviewer. Your name is ${selectedAgent?.displayName}. 

IMPORTANT INSTRUCTIONS:
- Start by introducing yourself and then ask the first question
- After each user response, ALWAYS encourage them to elaborate with follow-up prompts like:
  * "That's interesting! Can you tell me more about that specific experience?"
  * "Can you walk me through the details of how you approached that?"
  * "What challenges did you face and how did you overcome them?"
  * "Can you give me a specific example with more details?"
- Encourage users to give comprehensive, detailed answers (aim for 3-5 sentences minimum)
- If a user gives a short answer, politely ask them to expand before moving to the next question
- Make the conversation feel natural and engaging
- Only move to the next question after getting a substantial response

Here are the questions you must ask:\n\n${questionText}`;

          console.log('📤 Sending initial prompt:', initialPrompt.substring(0, 200) + '...');
          newWs.send(JSON.stringify({
            text: initialPrompt
          }));
          initialPromptSent = true;
          
return;
        }
        
        switch (message.type) {
          case 'text_response':
            setLastAgentResponse(message.data);
            
            // Analyze AI response to detect question transitions
            if (message.data && message.data.trim().length > 0) {
              const aiText = message.data.trim();
              
              // Check if this is a new official question (not a follow-up)
              const isNewOfficialQuestion = detectNewOfficialQuestion(aiText, currentOfficialQuestion);
              
              if (isNewOfficialQuestion) {
                console.log(`🎯 AI moved to new official question: ${currentOfficialQuestion + 1}`);
                setCurrentOfficialQuestion(prev => prev + 1);
                setQuestionState('asking');
              } else {
                // This is a follow-up question
                console.log(`🔄 AI asking follow-up question`);
                setFollowUpQuestionsCount(prev => prev + 1);
                setQuestionState('followup');
              }
              
              // Accumulate AI response parts for complete logging
              setCurrentAiResponse(prev => {
                const accumulated = prev + aiText;
                console.log(`📝 Accumulating AI response part: "${aiText}" (Total length: ${accumulated.length})`);
                
                // 🔒 PHASE 2: Log AI response immediately if it reaches substantial length
                if (accumulated.length >= 100 && currentInterview && !aiResponseStartTime) {
                  console.log(`📝 Logging substantial AI response immediately: "${accumulated.substring(0, 50)}..."`);
                  logUtterance(currentInterview.id, {
                    speaker: 'AGENT',
                    text: accumulated,
                    timestamp: new Date().toISOString()
                  }).then(success => {
                    if (success) {
                      console.log('✅ Immediate AI response logging successful');
                    } else {
                      console.error('❌ Immediate AI response logging failed');
                    }
                  }).catch(err => {
                    console.error('❌ Exception in immediate AI response logging:', err);
                  });
                }
                
                return accumulated;
              });
              
              // Set start time for the first part
              setAiResponseStartTime(prev => prev || new Date());
              
              // 🔒 PHASE 2: Set timeout to log AI response if audio_end doesn't arrive
              if (!aiResponseStartTime) {
                const timeoutStartTime = new Date();
                setTimeout(() => {
                  if (currentAiResponse.trim().length > 0 && currentInterview) {
                    console.log(`⏰ Timeout triggered - logging AI response: "${currentAiResponse.trim().substring(0, 50)}..."`);
                    logUtterance(currentInterview.id, {
                      speaker: 'AGENT',
                      text: currentAiResponse.trim(),
                      timestamp: timeoutStartTime.toISOString()
                    }).then(success => {
                      if (success) {
                        console.log('✅ Timeout-triggered AI response logged successfully');
                      } else {
                        console.error('❌ Timeout-triggered AI response logging failed');
                      }
                    }).catch(err => {
                      console.error('❌ Exception in timeout-triggered AI response logging:', err);
                    });
                  }
                }, 10000); // 10 second timeout
              }
            }
            setIsAiSpeaking(true);
            break;
          case 'audio_chunk':
            console.log('🎵 Frontend received audio chunk, size:', message.data?.length);
            const audioChunk = Buffer.from(message.data, 'base64');
            console.log('🎵 Decoded audio chunk size:', audioChunk.buffer.byteLength);
            audioPlayerRef.current?.addChunk(audioChunk.buffer);
            setIsAiSpeaking(true);
            break;
          case 'audio_end':
            // Log the complete accumulated AI response
            if (currentAiResponse.trim().length > 0 && aiResponseStartTime) {
              setConversationHistory(prev => {
                const newHistory = [...prev, { 
                  speaker: 'ai' as const, 
                  text: currentAiResponse.trim(), 
                  timestamp: aiResponseStartTime 
                }];
                console.log(`📝 Added complete AI response to history: "${currentAiResponse.trim()}" (${newHistory.length} total entries)`);
                
                // 🔥 NEW PIPELINE: Log complete AI utterance
                if (currentInterview) {
                  logUtterance(currentInterview.id, {
                    speaker: 'AGENT',
                    text: currentAiResponse.trim(),
                    timestamp: aiResponseStartTime.toISOString()
                  }).then(success => {
                    if (success) {
                      console.log(`✅ Successfully logged AI utterance: "${currentAiResponse.trim().substring(0, 50)}..."`);
                    } else {
                      console.error(`❌ Failed to log AI utterance: "${currentAiResponse.trim().substring(0, 50)}..."`);
                      // Store in localStorage as backup
                      const backupKey = `ai_response_backup_${currentInterview.id}_${Date.now()}`;
                      localStorage.setItem(backupKey, JSON.stringify({
                        speaker: 'AGENT',
                        text: currentAiResponse.trim(),
                        timestamp: aiResponseStartTime.toISOString()
                      }));
                      console.log(`💾 Stored AI response backup in localStorage: ${backupKey}`);
                    }
                  }).catch(err => {
                    console.error('❌ Exception logging AI utterance:', err);
                    // Store in localStorage as backup
                    const backupKey = `ai_response_backup_${currentInterview.id}_${Date.now()}`;
                    localStorage.setItem(backupKey, JSON.stringify({
                      speaker: 'AGENT',
                      text: currentAiResponse.trim(),
                      timestamp: aiResponseStartTime.toISOString()
                    }));
                    console.log(`💾 Stored AI response backup in localStorage: ${backupKey}`);
                  });
                }
                
                return newHistory;
              });
              
              // Reset accumulation for next response
              setCurrentAiResponse('');
              setAiResponseStartTime(null);
            }
            
                        setActiveTurn('user');
            setIsAiSpeaking(false);
                        // Automatically start listening when AI finishes speaking (seamless like ChatGPT)
            setTimeout(() => {
              if (recognitionRef.current && !isListening) {
                console.log('🎤 Auto-starting continuous listening after AI finished speaking');
                try {
                  recognitionRef.current.start();
                  setIsListening(true);
                  console.log('✅ Speech recognition auto-started successfully');
                  sonnerToast.success('Your turn! Start speaking now.');
                } catch (e) {
                  console.error('❌ Auto-start recognition failed:', e);
                  sonnerToast.error('Could not start microphone automatically. Please click "Start Speaking".');
                }
              } else {
                console.log(`🎤 Cannot auto-start: recognition available: ${!!recognitionRef.current}, already listening: ${isListening}`);
              }
            }, 500); // Slightly longer delay to ensure AI audio is done
            break;
          case 'error':
            console.error(`WebSocket Error: ${message.data}`);
            setError(message.data);
            sonnerToast.error(`An error occurred: ${message.data}`);
            setIsAiSpeaking(false);
            break;
        }
      } catch (e) {
        console.error("Failed to parse WebSocket message:", e);
      }
    };

    newWs.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsInterviewActive(false);
        
        // Stop real-time credit tracking when interview ends
        stopInterviewTracking();
        console.log('💰 Stopped real-time credit tracking');
    }
    newWs.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        setError('Connection to the interview server failed. Please try again.');
        setIsLoading(false);
        setIsInterviewActive(false);
        
        // Stop real-time credit tracking on error
        stopInterviewTracking();
        console.log('💰 Stopped real-time credit tracking due to error');
    };

    setWs(newWs);
  }, [selectedAgent]);


  const startInterview = async () => {
    // Mark the page as having an active interview
    document.documentElement.setAttribute('data-interview-active', 'true');
    if (!selectedAgent) {
      sonnerToast.error('Please select an interviewer to begin.');
        
return;
      }

    const storedQuestions = localStorage.getItem('generatedQuestions');
    if (!storedQuestions) {
      sonnerToast.error('Could not find interview questions. Please generate them first.');
        
return;
      }

    const questions = JSON.parse(storedQuestions);

      setIsLoading(true);
      setError(null);
    setLastAgentResponse('');
    interviewStartTimeRef.current = new Date();
    setSessionUsage({ inputTokens: 0, outputTokens: 0, ttsCharacters: 0, duration: 0 });
    
    // Prepare voice configuration based on selected agent
    const voiceConfig = {
      languageCode: selectedAgent.languageCode || 'en-US',
      voiceName: mapVoiceIdToGeminiVoice(selectedAgent.voiceId, selectedAgent.languageCode, selectedAgent.displayName)
    };
    
    // Get detailed voice information for debugging
    const selectedVoiceInfo = getVoiceById(voiceConfig.voiceName);
    const voiceStats = getVoiceStats();
    
    console.log('🎵 Voice mapping decision:', {
      agentName: selectedAgent.displayName,
      voiceId: selectedAgent.voiceId,
      languageCode: selectedAgent.languageCode,
      mappedVoice: voiceConfig.voiceName,
      voiceDetails: selectedVoiceInfo ? {
        name: selectedVoiceInfo.name,
        gender: selectedVoiceInfo.gender,
        characteristics: selectedVoiceInfo.characteristics,
        description: selectedVoiceInfo.description
      } : 'Voice not found in configuration',
      systemStats: {
        totalVoices: voiceStats.total,
        activeVoices: voiceStats.active,
        genderDistribution: voiceStats.byGender
      },
      finalConfig: voiceConfig
    });

      // Create NEW conversation pipeline interview
  if (!currentInterview && !resumeSessionKey && !resumeFromLog) {
    try {
      console.log('🔥 Creating NEW conversation pipeline interview...');
      const interview = await createInterview({
        interviewer_name: selectedAgent.displayName,
        job_title: 'Software Engineer', // You can get this from localStorage or user input
        key_skills: 'Programming, Problem Solving', // You can get this from localStorage or user input
        agent_id: selectedAgent.id,
        total_questions: questions.length
      });
      
      if (interview) {
        console.log('✅ NEW conversation pipeline interview created:', interview.id);
        
        // 🔒 PHASE 2: Recover any AI responses stored in localStorage from previous sessions
        const backupKeys = Object.keys(localStorage).filter(key => key.startsWith('ai_response_backup_'));
        if (backupKeys.length > 0) {
          console.log(`🔄 Found ${backupKeys.length} AI response backups in localStorage, attempting recovery...`);
          
          for (const backupKey of backupKeys) {
            try {
              const backupData = JSON.parse(localStorage.getItem(backupKey) || '{}');
              if (backupData.speaker === 'AGENT' && backupData.text && backupData.timestamp) {
                console.log(`🔄 Recovering AI response: "${backupData.text.substring(0, 50)}..."`);
                
                // Try to log the recovered response
                logUtterance(interview.id, {
                  speaker: 'AGENT',
                  text: backupData.text,
                  timestamp: backupData.timestamp
                }).then(success => {
                  if (success) {
                    console.log('✅ Recovered AI response logged successfully');
                    localStorage.removeItem(backupKey); // Clean up after successful recovery
                  } else {
                    console.error('❌ Failed to log recovered AI response');
                  }
                }).catch(err => {
                  console.error('❌ Exception logging recovered AI response:', err);
                });
              }
            } catch (err) {
              console.error('❌ Error processing backup key:', backupKey, err);
              localStorage.removeItem(backupKey); // Clean up corrupted backup
            }
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to create pipeline interview, continuing without new pipeline tracking:', error);
    }
  }
    
    // Create legacy interview session if not resuming
    if (!currentSession && !resumeSessionKey) {
      try {
        console.log('📝 Creating legacy interview session...');
        const session = await createSession({
          agentId: selectedAgent.id,
          agentName: selectedAgent.displayName,
          agentVoice: voiceConfig.voiceName,
          questions: questions,
          estimatedDuration: Math.ceil(questions.length * 2), // Estimate 2 minutes per question
          difficulty: 'standard'
        });
        
        if (session) {
          console.log('✅ Legacy interview session created:', session.sessionKey);
        }
      } catch (error) {
        console.warn('⚠️ Failed to create legacy session, continuing without legacy tracking:', error);
        // Don't block the interview if session creation fails
      }
    }
    
    connectWebSocket(questions, voiceConfig);
    
    // Auto-start listening after a short delay once interview becomes active
    setTimeout(() => {
      if (recognitionRef.current && !isListening) {
        console.log('🎤 Auto-starting speech recognition for new interview...');
        startListening();
      }
    }, 1000);
  };

  const handleUserResponse = () => {
    if (!transcript.trim() || !ws) {return;}
    const userText = transcript.trim();
    
    console.log(`📝 Submitting user response:`, userText.substring(0, 100) + '...');
    
    setConversationHistory(prev => {
      const newHistory = [...prev, { speaker: 'user' as const, text: userText, timestamp: new Date() }];
      console.log(`📝 Updated conversation history: ${newHistory.length} entries (User response)`);
      
      // 🔥 NEW PIPELINE: Log user utterance
      if (currentInterview) {
        logUtterance(currentInterview.id, {
          speaker: 'USER',
          text: userText,
          timestamp: new Date().toISOString()
        }).catch(err => console.warn('Failed to log user utterance:', err));
      }
      
      return newHistory;
    });
    
    stopListening();
    ws.send(JSON.stringify({
      text: userText
    }));
    setTranscript('');
    transcriptRef.current = '';
    setActiveTurn('ai');
  };

  const startListening = () => {
    if (recognitionRef.current) {
      setTranscript('');
      transcriptRef.current = '';
      try {
        console.log('🎤 Starting speech recognition...');
        recognitionRef.current.start();
        setIsListening(true);
        console.log('✅ Speech recognition started successfully');
      } catch (error) {
        console.error('❌ Error starting speech recognition:', error);
        sonnerToast.error('Could not start microphone. Please check permissions.');
      }
    } else {
      console.error('❌ No speech recognition instance available');
      sonnerToast.error('Speech recognition not available in this browser.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };
  
  const generatePerformanceAnalysis = async (retryAttempt: number = 0) => {
    console.log(`🔍 Generating performance analysis... (Attempt ${retryAttempt + 1})`);
    
      // Log any pending AI response before analysis
  logPendingAiResponse();
  
  // 🔒 PHASE 2: Backup logging for any AI responses that weren't logged
  if (currentInterview && currentAiResponse.trim().length > 0 && aiResponseStartTime) {
    console.log(`🔄 Backup logging pending AI response before analysis: "${currentAiResponse.trim().substring(0, 50)}..."`);
    logUtterance(currentInterview.id, {
      speaker: 'AGENT',
      text: currentAiResponse.trim(),
      timestamp: aiResponseStartTime.toISOString()
    }).then(success => {
      if (success) {
        console.log('✅ Backup AI response logged successfully');
      } else {
        console.error('❌ Backup AI response logging failed');
      }
    }).catch(err => {
      console.error('❌ Exception in backup AI response logging:', err);
    });
  }
    
    console.log('📊 Conversation history length:', conversationHistory.length);
    console.log('📝 Sample conversation entries:', conversationHistory.slice(0, 3));
    
    if (conversationHistory.length === 0) {
      console.log('❌ No conversation data available');
      sonnerToast.error('No conversation data to analyze');

return;
      }

    // Ensure we have meaningful conversation (at least 2 exchanges)
    if (conversationHistory.length < 2) {
      console.log('⚠️ Limited conversation data available');
      sonnerToast.warning('Limited conversation data for analysis');
    }

    try {
      const duration = interviewStartTimeRef.current 
        ? Math.round((new Date().getTime() - interviewStartTimeRef.current.getTime()) / 1000 / 60)
        : 0;

      // 🔥 TRY NEW PIPELINE FIRST
      if (currentInterview) {
        try {
          console.log('🔥 Attempting NEW PIPELINE analysis for interview:', currentInterview.id);
          const questionsAnswered = Math.floor(conversationHistory.filter(h => h.speaker === 'user').length);
          
          const { interview: completedInterview, analysis: pipelineAnalysis } = await completeInterview(
            currentInterview.id, 
            questionsAnswered
          );
          
          if (pipelineAnalysis) {
            console.log('✅ NEW PIPELINE analysis successful!');
            
            // Convert new pipeline analysis to legacy format for UI compatibility
            const convertedAnalysis = {
              summary: pipelineAnalysis.detailed_feedback,
              metrics: [
                { category: "Communication Skills", score: pipelineAnalysis.metrics.communication_clarity / 10, notes: `Score: ${pipelineAnalysis.metrics.communication_clarity}/100` },
                { category: "Technical Knowledge", score: pipelineAnalysis.metrics.technical_knowledge / 10, notes: `Score: ${pipelineAnalysis.metrics.technical_knowledge}/100` },
                { category: "Problem Solving", score: pipelineAnalysis.metrics.problem_solving / 10, notes: `Score: ${pipelineAnalysis.metrics.problem_solving}/100` },
                { category: "Cultural Fit", score: pipelineAnalysis.metrics.cultural_fit / 10, notes: `Score: ${pipelineAnalysis.metrics.cultural_fit}/100` },
                { category: "Confidence", score: pipelineAnalysis.metrics.confidence / 10, notes: `Score: ${pipelineAnalysis.metrics.confidence}/100` }
              ],
              strengths: pipelineAnalysis.strengths,
              improvements: pipelineAnalysis.areas_for_improvement,
              recommendations: pipelineAnalysis.recommendations,
              speaking_metrics: pipelineAnalysis.speaking_metrics
            };
            
            setAnalysisData(convertedAnalysis);
            setShowAnalysis(true);
            console.log('✅ NEW PIPELINE analysis state updated');
            
return; // Exit early - we successfully used the new pipeline
          }
        } catch (pipelineError) {
          console.warn('⚠️ NEW PIPELINE analysis failed, falling back to legacy:', pipelineError);
        }
      }

      // FALLBACK TO LEGACY ANALYSIS
      console.log('🔄 Using legacy analysis system...');
      const analysisPayload = {
        conversationHistory: conversationHistory.map(entry => ({
          role: entry.speaker === 'ai' ? 'model' : 'user',
          text: entry.text,
          timestamp: entry.timestamp.toISOString()
        })),
        interviewDuration: duration,
        interviewObjective: 'General technical interview assessment',
        userName: user?.user_metadata?.full_name || 'Candidate'
      };

      const response = await fetch('/api/generate-performance-analysis', {
            method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysisPayload)
      });

      const result = await response.json();
      console.log('📈 Legacy analysis API response:', result);
      
      if (result.success) {
        console.log('✅ Legacy analysis successful, setting state...');
        
        // Check if this is a fallback analysis
        if (result.fallback) {
          console.log('⚠️ Using fallback analysis due to:', result.reason);
          sonnerToast.warning('Analysis completed with basic results due to high system load');
        }
        
        setAnalysisData(result.analysis);
        setSessionUsage(prev => ({
          ...prev,
          duration,
          inputTokens: prev.inputTokens + (result.usage?.promptTokens || 0),
          outputTokens: prev.outputTokens + (result.usage?.outputTokens || 0)
        }));
        setShowAnalysis(true);
        console.log('✅ Analysis state updated');
        
        // Store conversation log in database
        try {
          const logResponse = await fetch('/api/store-conversation-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              conversationHistory: conversationHistory.map(entry => ({
                role: entry.speaker === 'ai' ? 'model' : 'user',
                text: entry.text,
                timestamp: entry.timestamp.toISOString()
              })),
              analysisData: result.analysis,
              sessionUsage: {
                ...sessionUsage,
                duration,
                inputTokens: sessionUsage.inputTokens + (result.usage?.promptTokens || 0),
                outputTokens: sessionUsage.outputTokens + (result.usage?.outputTokens || 0)
              },
              agentId: selectedAgent?.id,
              agentName: selectedAgent?.displayName,
              interviewStatus: 'completed', // Mark as completed for proper analysis
              interviewNote: 'Interview completed successfully with analysis generated'
            })
          });
          
          const logResult = await logResponse.json();
          if (logResult.success) {
            console.log('✅ Conversation log stored successfully');
          } else {
            console.warn('⚠️ Failed to store conversation log:', logResult.error);
          }
        } catch (logError) {
          console.warn('⚠️ Error storing conversation log:', logError);
        }
        
      } else {
        console.error('❌ Analysis API returned error:', result.error);
        
        // If API provided a fallback analysis, use it
        if (result.fallbackAnalysis) {
          console.log('🔄 Using fallback analysis from error response');
          setAnalysisData(result.fallbackAnalysis);
          setShowAnalysis(true);
          sonnerToast.warning('Analysis completed with basic results due to technical issues');
          
return; // Exit function successfully
        }
        
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('❌ Error generating analysis:', error);
      
      // Create emergency fallback analysis
      const emergencyAnalysis = {
        summary: `Interview session completed successfully. We encountered temporary technical difficulties generating your detailed analysis, but your performance data has been saved.`,
        metrics: [
          { category: "Technical Knowledge", score: 7.0, notes: "Your interview responses showed good engagement. Detailed analysis will be available once technical issues are resolved." },
          { category: "Communication Skills", score: 7.0, notes: "You demonstrated clear communication throughout the interview session." },
          { category: "Behavioral & Soft Skills", score: 7.0, notes: "Good participation and professional demeanor observed during the interview." },
          { category: "Time Management", score: 7.0, notes: "You maintained good pacing throughout the interview conversation." },
          { category: "Stress & Adaptability", score: 7.0, notes: "You showed composure and adaptability during the interview process." }
        ]
      };
      
      console.log('🚨 Using emergency fallback analysis');
      setAnalysisData(emergencyAnalysis);
      setShowAnalysis(true);
      sonnerToast.warning('Interview completed! Analysis generated with basic results due to temporary technical issues.');
    }
  };

  const endInterview = async () => {
    ws?.close();
    audioPlayerRef.current?.stop();
    stopListening();
    setIsInterviewActive(false);
    
    // Stop real-time credit tracking when interview ends
    stopInterviewTracking();
    console.log('💰 Stopped real-time credit tracking - interview ended');
    
    // Complete the session if it exists
    if (currentSession) {
      try {
        const timeSpent = interviewStartTimeRef.current 
          ? Math.floor((Date.now() - interviewStartTimeRef.current.getTime()) / 1000)
          : 0;
        
        const questionsCompleted = Math.floor(conversationHistory.filter(h => h.speaker === 'user').length);
        
        await completeSession(currentSession.sessionKey, {
          conversationHistory,
          questionsCompleted,
          currentQuestionIndex: questionsCompleted,
          timeSpent,
          lastAiResponse: conversationHistory.filter(h => h.speaker === 'ai').pop()?.text,
          lastUserResponse: conversationHistory.filter(h => h.speaker === 'user').pop()?.text,
          snapshotType: 'question_complete'
        });
        
        console.log('✅ Interview session completed successfully');
    } catch (error) {
        console.warn('⚠️ Failed to complete session:', error);
      }
    }
    
    // Show celebration with callback for when animation is ready
    setShowCelebration(true);
    
    // The celebration will now handle its own timing and call onAnimationComplete
    // when it's ready to transition to the analysis
  };

  // Handle celebration animation completion
  const handleCelebrationComplete = async () => {
    console.log('🎉 Celebration animation completed, transitioning to analysis...');
    setShowCelebration(false);
    await generatePerformanceAnalysis();
  };

      const pauseInterview = async () => {
    console.log('⏸️ Attempting to pause interview...', { 
      hasCurrentSession: !!currentSession, 
      sessionKey: currentSession?.sessionKey,
      conversationLength: conversationHistory.length,
      isInterviewActive 
    });

    // Log any pending AI response before pausing
    logPendingAiResponse();

    // Close WebSocket connection
    if (ws) {
      ws.close();
      setWs(null);
    }

    // Stop audio and speech recognition
    audioPlayerRef.current?.stop();
    stopListening();

    // Reset interview state
    setIsInterviewActive(false);
    setActiveTurn(null);
    setIsAiSpeaking(false);
    setIsListening(false);

    if (currentSession) {
      try {
        const timeSpent = interviewStartTimeRef.current 
          ? Math.floor((Date.now() - interviewStartTimeRef.current.getTime()) / 1000)
          : 0;
        
        const questionsCompleted = Math.floor(conversationHistory.filter(h => h.speaker === 'user').length);
        
        console.log('💾 Saving session progress...', {
          questionsCompleted,
          timeSpent,
          conversationLength: conversationHistory.length
        });

        await pauseSession(currentSession.sessionKey, {
          conversationHistory,
          questionsCompleted,
          currentQuestionIndex: questionsCompleted,
          timeSpent,
          lastAiResponse: conversationHistory.filter(h => h.speaker === 'ai').pop()?.text,
          lastUserResponse: conversationHistory.filter(h => h.speaker === 'user').pop()?.text,
          currentTurn: activeTurn === 'ai' ? 'ai' : activeTurn === 'user' ? 'user' : 'waiting'
        });
        
        // Save conversation log for resume functionality
        if (conversationHistory.length > 0) {
          try {
            await fetch('/api/store-conversation-log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                conversationHistory: conversationHistory.map(entry => ({
                  role: entry.speaker === 'user' ? 'user' : 'assistant',
                  text: entry.text,
                  timestamp: entry.timestamp.toISOString()
                })),
                analysisData: null, // No analysis for paused interviews
                sessionUsage: sessionUsage,
                agentId: selectedAgent?.id || 'unknown',
                agentName: selectedAgent?.displayName || 'AI Interviewer',
                interviewStatus: 'paused', // Mark as paused for proper analysis
                interviewNote: 'Interview was paused by user - can be resumed later'
              })
            });
            console.log('💾 Conversation log saved for resume');
          } catch (logError) {
            console.warn('⚠️ Failed to save conversation log:', logError);
          }
        }
        
        console.log('⏸️ Interview session paused successfully');
        
        // Stop real-time credit tracking when interview is paused
        stopInterviewTracking();
        console.log('💰 Stopped real-time credit tracking - interview paused');
        
        // Show pause panel with Continue Practice button
        setShowPausePanel(true);
        
        // Don't auto-redirect - let user choose when to continue
        console.log('⏸️ Interview paused - user can continue later');
      } catch (error) {
        console.error('❌ Failed to pause session:', error);
        sonnerToast.error('Failed to save progress. You can try again.');
      }
    } else {
      console.warn('⚠️ No current session to pause');
      sonnerToast.warning('No active session to pause. Showing pause screen.');

      // Do NOT end the interview or trigger celebration/analysis.
      // Show the pause panel for consistency and let user choose when to continue.
      setShowPausePanel(true);
    }
  };

  const resetInterview = () => {
    setLastAgentResponse('');
    setActiveTurn(null);
    setIsAiSpeaking(false);
    setTranscript('');
    transcriptRef.current = '';
    setConversationHistory([]);
    setError(null);
    setShowAnalysis(false);
    setAnalysisData(null);
    setShowQuestionsModal(false);
    dispatch(setSelectedInterviewer(null));
  };

  // Function to detect if AI is asking a new official question vs. follow-up
  const detectNewOfficialQuestion = (aiText: string, currentQuestionIndex: number): boolean => {
    const text = aiText.toLowerCase();
    
    // Get the current official question text for comparison
    const storedQuestions = localStorage.getItem('generatedQuestions');
          if (!storedQuestions) {
        return false;
      }
      
      try {
      const questions = JSON.parse(storedQuestions);
      const currentQuestion = questions[currentQuestionIndex];
      const nextQuestion = questions[currentQuestionIndex + 1];
      
      if (!currentQuestion || !nextQuestion) {
        return false;
      }
      
      // Check if AI is asking the next official question
      const currentQuestionWords = currentQuestion.text.toLowerCase().split(' ').slice(0, 5).join(' ');
      const nextQuestionWords = nextQuestion.text.toLowerCase().split(' ').slice(0, 5).join(' ');
      
      // If AI text contains words from the next question, it's a new official question
      if (nextQuestionWords.split(' ').some((word: string) => text.includes(word))) {
        return true;
      }
      
      // Check for transition phrases that indicate moving to next question
      const transitionPhrases = [
        'next question',
        'moving on',
        'let\'s move to',
        'now let\'s discuss',
        'another question',
        'let me ask you about',
        'speaking of',
        'on that note'
      ];
      
      return transitionPhrases.some(phrase => text.includes(phrase));
      
          } catch (e) {
        console.warn('Failed to parse questions for detection:', e);
        
        return false;
      }
  };

  const handleQuestionsSubmit = (data: any) => {
    console.log('📝 User questions submitted:', data);
    // Questions are automatically stored via API
    // We could add additional local handling here if needed
  };
  
  if (userLoading) {return <div>Loading...</div>;}

    return (
      <CreditValidation action="start-interview">
        <div className="container mx-auto p-4 max-w-4xl">
      {/* Celebration Panel */}
      <CelebrationPanel 
        isVisible={showCelebration} 
        onAnimationComplete={handleCelebrationComplete}
      />
      
      {/* Pause Panel */}
      <PausePanel
        isVisible={showPausePanel}
        questionsAnswered={conversationHistory.filter(h => h.speaker === 'user').length}
        totalQuestions={10} // Default to 10 questions, could be made dynamic
        duration={interviewStartTimeRef.current ? Math.floor((Date.now() - interviewStartTimeRef.current.getTime()) / 1000) : 0}
        onClose={() => {
          setShowPausePanel(false);
          // Reset the page to initial state
          resetInterview();
        }}
      />
      
      {/* Performance Analysis */}
      {showAnalysis && analysisData && (
        <PerformanceAnalysis
          analysisData={analysisData}
          conversationLog={conversationHistory.map(entry => ({
            role: entry.speaker === 'ai' ? 'model' : 'user',
            text: entry.text,
            timestamp: entry.timestamp
          }))}
          sessionUsage={sessionUsage}
          onNewInterview={resetInterview}
          onGoHome={() => router.push('/dashboard')}
          onShareResults={() => {
            sonnerToast.success('Sharing functionality coming soon!');
          }}
          onAskQuestions={() => setShowQuestionsModal(true)}
        />
      )}
      
      {!showAnalysis && (
        <AnimatePresence>
          {!isInterviewActive ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Button variant="ghost" className="mb-4" onClick={() => router.push('/dashboard')}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Button>
            <Card>
              <CardHeader>
                <CardTitle>Start a New Practice Interview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                  <VoiceAgentSelector selectedAgentId={selectedAgent?.id || null} onAgentSelect={handleAgentSelect} />
          </div>
                <Button 
                  disabled={isLoading || !selectedAgent} 
                  className="w-full mt-4 py-3 text-lg font-semibold" 
                  size="lg"
                  onClick={() => {
                    console.log('🔘 Button clicked!');
                    startInterview();
                  }}
                >
                  {isLoading ? 'Connecting...' : 'Start Voice Interview'}
                </Button>
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
              </CardContent>
            </Card>
          </motion.div>
                ) : (
          <>
            {/* Minimal Timer - Fixed Position */}
            <MinimalTimer isRunning={isInterviewActive} />
            
            {/* Panel Toggle Buttons - Now positioned directly in PanelToggle component */}
            <PanelToggle
              showQuestions={showQuestionsPanel}
              showNotes={showNotesPanel}
              onToggleQuestions={() => setShowQuestionsPanel(!showQuestionsPanel)}
              onToggleNotes={() => setShowNotesPanel(!showNotesPanel)}
            />
            
            {/* Main Interview Content with Slide-up Animation */}
            <motion.div 
              initial={{ opacity: 0, y: 100 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: 100 }}
              transition={{ 
                duration: 0.6, 
                ease: "easeOut",
                delay: 0.1 
              }}
              className="pt-24 space-y-6" // Adjusted top padding for repositioned toggle buttons
            >

            {/* Interviewer Section */}
            <Card>
              <CardContent className="pt-6 text-center">
                {selectedAgent && (
                  <div className="flex flex-col items-center mb-4">
                    {selectedAgent.avatarUrl ? (
                      <motion.img 
                        src={selectedAgent.avatarUrl} 
                        alt={selectedAgent.displayName} 
                        className={`w-32 h-32 rounded-full mb-2 object-cover transition-all duration-300 ${isAiSpeaking ? 'ring-4 ring-blue-400 ring-opacity-75' : ''}`}
                        animate={isAiSpeaking ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ repeat: isAiSpeaking ? Infinity : 0, duration: 1.5 }}
                      />
                    ) : (
                      <motion.div 
                        className={`w-32 h-32 rounded-full mb-2 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center transition-all duration-300 ${isAiSpeaking ? 'ring-4 ring-blue-400 ring-opacity-75' : ''}`}
                        animate={isAiSpeaking ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ repeat: isAiSpeaking ? Infinity : 0, duration: 1.5 }}
                      >
                        <span className="text-6xl font-semibold text-blue-600">
                          {selectedAgent.displayName.charAt(0)}
                    </span>
                      </motion.div>
                    )}
                    <h3 className="font-semibold text-xl mb-2">{selectedAgent.displayName} ({selectedAgent.voiceId})</h3>
          </div>
        )}

                <div className="mb-4">
                  {activeTurn === 'ai' && !lastAgentResponse ? (
                    <p className="text-gray-500 italic">Interviewer is thinking...</p>
                  ) : (
                    <p className="text-lg">{lastAgentResponse || 'Hi, nice to meet you. We\'ll keep this to about 15 minutes. May I start with your experience in user research and how you applied insights to improve a past project?'}</p>
                  )}
                </div>

                {/* Question Status Indicator */}
                <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                                          <span className="text-gray-600 dark:text-gray-400">
                        Question {safeCurrentOfficialQuestion + 1} of {(() => {
                          const storedQuestions = localStorage.getItem('generatedQuestions');
                          if (storedQuestions) {
                            try {
                              const questions = JSON.parse(storedQuestions);
                              
                              return questions.length;
                            } catch (e) {
                              return 10; // fallback
                            }
                          }
                          
                          return 10;
                        })()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          questionState === 'asking' ? 'bg-blue-100 text-blue-700' :
                          questionState === 'followup' ? 'bg-yellow-100 text-yellow-700' :
                          questionState === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {questionState === 'asking' ? 'Asking' :
                           questionState === 'followup' ? 'Follow-up' :
                           questionState === 'completed' ? 'Completed' :
                           'Waiting'}
                        </span>
                        {safeFollowUpQuestionsCount > 0 && (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                            +{safeFollowUpQuestionsCount} follow-ups
                          </span>
                        )}
                      </div>
                  </div>
                </div>

                <div className="text-sm text-gray-500">AI Interviewer</div>
              </CardContent>
            </Card>

            {/* Voice Control Section */}
            <Card>
              <CardContent className="pt-6 text-center">
                {/* Simplified conversation status */}
                <div className="flex justify-center items-center mb-6">
                  <div className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-800 rounded-full px-6 py-3">
                    <div className={`w-3 h-3 rounded-full ${isAiSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className="text-sm">
                      {isAiSpeaking ? 'Interviewer is speaking...' : 'Your turn to respond'}
                  </span>
                    {!isAiSpeaking && (
                      <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    )}
              </div>
                </div>

                                {/* Simple Live Transcript */}
                {transcript && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">You're saying:</p>
                    <p className="text-lg text-gray-900 dark:text-gray-100">{transcript}</p>
                      </div>
                    )}
                    
                                {activeTurn === 'user' && (
                  <div className="mt-4 text-center space-y-3">
                    <p className="text-gray-500">
                      {isListening 
                        ? "Just speak naturally - I'm listening..." 
                        : "Ready to listen when you start speaking"}
                    </p>
                    <div className="flex justify-center space-x-3">
                      {!isListening && (
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          onClick={startListening}
                        >
                          🎤 Click To Speak
                        </Button>
                      )}
                      {transcript.trim() && (
                        <Button 
                          variant="default"
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={handleUserResponse}
                        >
                          ✅ Send Response
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {activeTurn !== 'user' && (
                  <p className="text-gray-500 mt-4">Wait for the interviewer to finish...</p>
                )}
              </CardContent>
            </Card>

                                {/* Interview Control Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                variant="outline" 
                size="lg" 
                className={`flex-1 sm:flex-none cursor-pointer hover:bg-gray-50 ${
                  !isInterviewActive ? 'opacity-50 cursor-not-allowed' : ''
                }`} 
                disabled={!isInterviewActive}
                onClick={() => {
                  console.log('🔘 Pause button clicked!', { currentSession: !!currentSession, isInterviewActive });
                  pauseInterview();
                }}
              >
                ⏸️ Pause & Resume Later
                {currentSession && (
                  <span className="ml-2 text-xs text-green-600">●</span>
                )}
              </Button>
              <Button 
                variant="destructive" 
                size="lg" 
                className="flex-1 sm:flex-none cursor-pointer" 
                disabled={!isInterviewActive}
                onClick={() => {
                  console.log('🔘 Finish button clicked!');
                  endInterview();
                }}
              >
                🏁 Finish Interview
              </Button>
                  </div>

            {error && (
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 rounded-md flex items-center">
                <AlertCircle className="mr-2" /> {error}
              </motion.div>
            )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
      )}

      {/* Questions Panel */}
      {isInterviewActive && showQuestionsPanel && (
        <MovableQuestionsPanel
          questions={(() => {
            const storedQuestions = localStorage.getItem('generatedQuestions');
            if (storedQuestions) {
              try {
                const parsedQuestions = JSON.parse(storedQuestions);
                
                return parsedQuestions.map((q: any, index: number) => ({
                  id: `q${index + 1}`,
                  text: q.text || q,
                  type: q.type || 'general',
                  difficulty: q.difficulty || 'medium',
                  category: q.category || 'general'
                }));
              } catch (e) {
                console.warn('Failed to parse stored questions:', e);
                
                return [];
              }
            }
            
            return [];
          })()}
                      currentQuestionIndex={safeCurrentOfficialQuestion}
            totalQuestionsAnswered={conversationHistory.filter(h => h.speaker === 'user').length}
            followUpQuestionsCount={safeFollowUpQuestionsCount}
          isVisible={showQuestionsPanel}
          onQuestionSelect={(index: number) => console.log('Selected question:', index)}
          onToggle={() => setShowQuestionsPanel(false)}
        />
      )}

      {/* Notes Taker Panel */}
      {isInterviewActive && (
        <MovableNotesTaker
          isVisible={showNotesPanel}
          initialNotes={interviewNotes}
          onToggle={() => setShowNotesPanel(false)}
          onNotesChange={setInterviewNotes}
        />
      )}

      {/* Start Speaking Button - appears when user is silent during interview */}
      {isInterviewActive && (
        <StartSpeakingButton
          isVisible={showStartSpeakingButton}
          onStartSpeaking={() => {
            setShowStartSpeakingButton(false);
            setLastUserActivity(Date.now());
            startListening();
          }}
        />
      )}

      {/* Post-Interview Questions Modal */}
      <PostInterviewQuestions
        isOpen={showQuestionsModal}
        interviewId={`interview_${Date.now()}`}
        agentName={selectedAgent?.displayName}
        onClose={() => setShowQuestionsModal(false)}
        onSubmit={handleQuestionsSubmit}
      />
        </div>
      </CreditValidation>
  );
}

export default NewPracticePage;
