"use client";

import "../../../globals.css";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeftIcon, 
  PhoneIcon, 
  XMarkIcon, 
  CheckIcon,
  SpeakerWaveIcon,
  MicrophoneIcon,
  ClockIcon,
  PencilIcon,
  SparklesIcon,
  ChevronLeftIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/auth.context";
import { toast } from "@/components/ui/use-toast";
import Navbar from "@/components/navbar";
import { CreditValidation } from '@/components/ui/credit-validation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MinimalTimer from "@/components/MinimalTimer";
import CelebrationPanel from "@/components/interview/CelebrationPanel";
import PausePanel from "@/components/interview/PausePanel";
import PerformanceAnalysis from "@/components/interview/PerformanceAnalysis";
import { useContinuousLogging } from "@/hooks/use-continuous-logging";

export const dynamic = 'force-dynamic';

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  category: string;
}

interface PracticeSession {
  id: string;
  title?: string;
  type?: string;
  score?: number;
  date?: string;
  questionCount?: number;
  total_questions?: number;
  questions: Question[];
  duration?: number;
  status?: 'completed' | 'in-progress' | 'abandoned';
  email?: string;
  name?: string;
  agent_name?: string;
  session_name?: string;
  call_id?: string;
  access_token?: string;
  currentQuestionIndex?: number;
  responses?: Array<{
    questionId: string;
    response: string;
    timestamp: number;
  }>;
}

export default function ContinuePracticePage({ 
  params 
}: { 
  params: { sessionId: string } 
}) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Interview state - mirroring the main interview page
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [activeTurn, setActiveTurn] = useState<'user' | 'ai' | null>(null);
  const [lastAgentResponse, setLastAgentResponse] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [recordingStartTime, setRecordingStartTime] = useState<number>(0);
  const [lastTranscriptEndTime, setLastTranscriptEndTime] = useState<number>(0);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    speaker: 'user' | 'ai';
    text: string;
    timestamp: Date;
    startTime?: number;
    endTime?: number;
    question?: string;
    questionIndex?: number;
  }>>([]);
  
  // WebSocket and interview management
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const interviewStartTimeRef = useRef<Date | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  
  // Performance analysis state
  const [showCelebration, setShowCelebration] = useState(false);
  const [showPausePanel, setShowPausePanel] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [showManualStart, setShowManualStart] = useState(false);
  const [sessionUsage, setSessionUsage] = useState({
    duration: 0,
    inputTokens: 0,
    outputTokens: 0,
    ttsCharacters: 0
  });

  // Continuous logging hook
  const { 
    logUtterance, 
    flushBuffer, 
    isLogging, 
    bufferSize, 
    loggingStats,
    hasPendingLogs 
  } = useContinuousLogging(session?.id || '');

  // Load session data (but don't auto-start interview)
  useEffect(() => {
    const loadSession = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/practice-sessions/${params.sessionId}`);
        if (!response.ok) {
          throw new Error('Session not found');
        }
        const responseData = await response.json();
        console.log('🔍 Raw API response:', responseData);
        
        // Extract session data from the response
        const sessionData = responseData.session || responseData;
        console.log('🔍 Extracted session data:', sessionData);
        console.log('🔍 Session data type:', typeof sessionData);
        console.log('🔍 Session data keys:', Object.keys(sessionData || {}));
        
        console.log('🔍 Session properties:', {
          id: sessionData.id,
          agent_name: sessionData.agent_name,
          total_questions: sessionData.total_questions,
          questions: sessionData.questions?.length,
          name: sessionData.name,
          session_name: sessionData.session_name,
          title: sessionData.title,
          type: sessionData.type
        });
        
        // Log the full session object structure
        console.log('🔍 Full session object:', JSON.stringify(sessionData, null, 2));
        
        // Check if we need to extract interviewer name from title
        if (sessionData.title && sessionData.title.includes('Practice with')) {
          const interviewerName = sessionData.title.replace('Practice with ', '').split(' —')[0];
          console.log('🔍 Extracted interviewer name from title:', interviewerName);
          sessionData.agent_name = interviewerName;
        }
        
        setSession(sessionData);
        console.log('✅ Session loaded:', sessionData);
        
        // Don't auto-start interview - let user see questions first
        
      } catch (error) {
        console.error('Error loading session:', error);
        setError('Failed to load practice session');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.sessionId) {
      loadSession();
    }
  }, [params.sessionId]);
  
  // Debug: Monitor state changes
  useEffect(() => {
    console.log('🔄 State changed:', { 
      isInterviewActive, 
      isLoading, 
      session: !!session, 
      ws: !!ws 
    });
  }, [isInterviewActive, isLoading, session, ws]);
  
  // Debug: Monitor session changes specifically
  useEffect(() => {
    if (session) {
      console.log('📊 Session state updated:', {
        id: session.id,
        agent_name: session.agent_name,
        total_questions: session.total_questions,
        questions_count: session.questions?.length,
        name: session.name,
        session_name: session.session_name
      });
    }
  }, [session]);

  // Start interview immediately
  const startInterview = async (sessionData: PracticeSession) => {
    console.log('🚀 Starting interview with session data:', sessionData);
    
    try {
      console.log('🔧 Setting isInterviewActive to true...');
      setIsInterviewActive(true);
      console.log('🔧 Setting activeTurn to ai...');
      setActiveTurn('ai');
      console.log('🔧 Setting interview start time...');
      interviewStartTimeRef.current = new Date();
      
      console.log('✅ Interview state set to active');
      
      // Set the interviewer from session data
      if (sessionData.agent_name) {
        setSelectedAgent({
          id: sessionData.agent_name,
          displayName: sessionData.agent_name,
          voiceId: 'default'
        });
        console.log('👤 Set interviewer to:', sessionData.agent_name);
      }
      
      // Connect WebSocket
      connectWebSocket();
      
      // WebSocket start message is now sent directly in connectWebSocket
      // after the connection stabilizes
      
      // Auto-start listening after AI speaks
      setTimeout(() => {
        console.log('🎤 Attempting to start speech recognition...');
        if (recognitionRef.current && !isListening) {
          startListening();
        } else {
          console.log('⚠️ Speech recognition not ready:', { 
            hasRecognition: !!recognitionRef.current, 
            isListening 
          });
        }
      }, 5000); // Wait longer for AI to speak first
      
      // Fallback: if WebSocket fails, show manual start option
      setTimeout(() => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          console.log('🔄 WebSocket failed, showing manual start option');
          setShowManualStart(true);
        }
      }, 6000); // Check after 6 seconds
      
    } catch (error) {
      console.error('Error starting interview:', error);
      toast({
        title: "Error",
        description: "Failed to start interview. Please try again.",
        variant: "destructive",
      });
    }
  };

  // WebSocket connection with retry mechanism
  const connectWebSocket = () => {
    console.log('🔌 Attempting WebSocket connection to ws://localhost:3002');
    
    try {
      const newWs = new WebSocket('ws://localhost:3002');
      
      newWs.onopen = () => {
        console.log('✅ WebSocket connected for resume interview');
        console.log('🔌 WebSocket readyState:', newWs.readyState);
        setWs(newWs);
        
        // Wait a moment for connection to stabilize, then send start message
        setTimeout(() => {
          if (newWs.readyState === WebSocket.OPEN && session) {
            console.log('🎯 WebSocket stable, sending start message...');
            const startMessage = {
              type: 'start_interview',
              interviewer: session.agent_name || 'AI Interviewer',
              questions: session.questions,
              sessionId: session.id
            };
            console.log('📤 WebSocket start message:', startMessage);
            newWs.send(JSON.stringify(startMessage));
          }
        }, 1000);
      };

      newWs.onmessage = (event) => {
        console.log('📨 Raw WebSocket message received:', event.data);
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (parseError) {
          console.error('❌ Failed to parse WebSocket message:', parseError);
          console.log('📨 Raw message was:', event.data);
        }
      };

      newWs.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        console.log('🔌 WebSocket error details:', {
          readyState: newWs.readyState,
          url: newWs.url,
          protocol: newWs.protocol
        });
        // Don't immediately set ws to null on error - let it try to reconnect
        console.log('🔄 WebSocket error occurred, will attempt to continue');
      };

      newWs.onclose = (event) => {
        console.log('🔌 WebSocket closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
        
        // Only set ws to null if it's not a clean close
        if (!event.wasClean) {
          console.log('🔄 WebSocket closed unexpectedly, setting to null');
          setWs(null);
        }
      };
      
      // Timeout for WebSocket connection
      setTimeout(() => {
        if (newWs.readyState !== WebSocket.OPEN) {
          console.log('⏰ WebSocket connection timeout, proceeding without it');
          console.log('🔌 Final WebSocket state:', newWs.readyState);
          setWs(null);
        }
      }, 5000); // Increased timeout to 5 seconds
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setWs(null);
    }
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    console.log('📨 WebSocket message received:', message);
    
    switch (message.type) {
      case 'text_response':
        console.log('📝 AI text response received:', message.data);
        setLastAgentResponse(message.data);
        setIsAiSpeaking(true);
        
        // Log AI utterance for continuous logging
        if (session?.id && message.data) {
          const now = performance.now();
          logUtterance({
            speaker: 'AGENT',
            text: message.data,
            timestamp: new Date().toISOString(),
            startTime: now,
            endTime: now,
            question: currentQuestion,
            questionIndex: currentQuestionIndex
          });
        }
        
        // Add to conversation history with question context
        setConversationHistory(prev => [...prev, {
          speaker: 'ai',
          text: message.data,
          timestamp: new Date(),
          startTime: performance.now(),
          endTime: performance.now(),
          question: currentQuestion,
          questionIndex: currentQuestionIndex
        }]);
        break;
      case 'audio_end':
        console.log('🔇 AI audio ended, switching to user turn');
        setActiveTurn('user');
        setIsAiSpeaking(false);
        // Auto-start listening
        if (recognitionRef.current && !isListening) {
          startListening();
        }
        break;
      case 'start_interview_response':
        console.log('🎯 Interview start response received:', message.data);
        setLastAgentResponse(message.data);
        setIsAiSpeaking(true);
        
        // Extract question context
        if (message.question) {
          setCurrentQuestion(message.question);
          setCurrentQuestionIndex(message.questionIndex || 0);
          console.log('📋 Current question set:', message.question);
        }
        
        // Log AI utterance for continuous logging
        if (session?.id && message.data) {
          const now = performance.now();
          logUtterance({
            speaker: 'AGENT',
            text: message.data,
            timestamp: new Date().toISOString(),
            startTime: now,
            endTime: now,
            question: currentQuestion,
            questionIndex: currentQuestionIndex
          });
        }
        
        // Add to conversation history with question context
        setConversationHistory(prev => [...prev, {
          speaker: 'ai',
          text: message.data,
          timestamp: new Date(),
          startTime: performance.now(),
          endTime: performance.now(),
          question: currentQuestion,
          questionIndex: currentQuestionIndex
        }]);
        break;
      case 'next_question':
        console.log('📋 Next question received:', message.question);
        setCurrentQuestion(message.question);
        setCurrentQuestionIndex(message.questionIndex || 0);
        break;
      case 'error':
        console.error('❌ WebSocket error:', message.error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to interview service. Please refresh the page.",
          variant: "destructive",
        });
        break;
      default:
        console.log('⚠️ Unknown WebSocket message type:', message.type);
    }
  };

  // Enhanced speech recognition setup with continuous listening
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        title: "Error",
        description: "Speech recognition not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    // Initialize recording timing
    if (recordingStartTime === 0) {
      setRecordingStartTime(performance.now());
      setLastTranscriptEndTime(0);
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      
      // Show interim results for real-time feedback (like the HTML app)
      if (interimTranscript) {
        setInterimTranscript(interimTranscript);
        // Update the main transcript with interim results
        setTranscript(prev => {
          const base = prev.replace(/\[interim\].*$/, ''); // Remove previous interim
          return base + (base ? ' ' : '') + `[interim] ${interimTranscript}`;
        });
      }
      
      // Process final results with precise timing
      if (finalTranscript) {
        const cleanTranscript = finalTranscript.trim();
        if (cleanTranscript) {
          const now = performance.now();
          const startTime = lastTranscriptEndTime;
          const endTime = now;
          
          console.log('📝 Final transcript received:', {
            text: cleanTranscript,
            startTime,
            endTime,
            duration: endTime - startTime
          });
          
          // Update transcript display
          setTranscript(prev => {
            const base = prev.replace(/\[interim\].*$/, ''); // Remove interim
            return base + (base ? ' ' : '') + cleanTranscript;
          });
          
          // Update transcriptRef for legacy compatibility
          transcriptRef.current = transcriptRef.current.replace(/\[interim\].*$/, '') + cleanTranscript;
          
          // Log utterance immediately for continuous logging with timing
          if (session?.id) {
            logUtterance({
              speaker: 'USER',
              text: cleanTranscript,
              timestamp: new Date().toISOString(),
              startTime,
              endTime,
              question: currentQuestion,
              questionIndex: currentQuestionIndex
            });
          }
          
          // Add to conversation history with complete context
          setConversationHistory(prev => [...prev, {
            speaker: 'user',
            text: cleanTranscript,
            timestamp: new Date(),
            startTime,
            endTime,
            question: currentQuestion,
            questionIndex: currentQuestionIndex
          }]);
          
          // Update timing for next segment
          setLastTranscriptEndTime(endTime);
        }
      }
    };

    recognition.onstart = () => {
      setIsListening(true);
      console.log('✅ Enhanced speech recognition started');
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      // Don't stop listening on error - let it try to recover
      console.log('🔄 Speech recognition error occurred, attempting to continue...');
      
      // Only set listening to false for critical errors
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      console.log('🔇 Speech recognition ended');
      
      // Clear interim transcript when recognition ends
      setInterimTranscript('');
      
      // Smart recovery: restart if we're still in user turn
      if (isInterviewActive && activeTurn === 'user') {
        console.log('🔄 Speech recognition ended during user turn, restarting...');
        setTimeout(() => {
          if (isInterviewActive && activeTurn === 'user') {
            console.log('🔄 Restarting speech recognition...');
            startListening();
          }
        }, 100); // Small delay to prevent rapid restart loops
      } else {
        setIsListening(false);
        // Only auto-submit if we're not in active interview
        if (transcriptRef.current.trim() && !isInterviewActive) {
          handleUserResponse();
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  // Stop enhanced speech recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      console.log('🛑 Stopping enhanced speech recognition');
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  // Handle user response
  const handleUserResponse = () => {
    if (!transcript.trim()) {
      return;
    }
    
    const userText = transcript.trim();
    
    // Add to conversation history
    setConversationHistory(prev => [...prev, {
      speaker: 'user',
      text: userText,
      timestamp: new Date()
    }]);

    // Send to WebSocket if available
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ text: userText }));
    } else {
      console.log('⚠️ WebSocket not available, storing response locally');
    }
    
    // Clear transcript and switch turn
    setTranscript('');
    transcriptRef.current = '';
    setActiveTurn('ai');
    
    // Stop listening when switching to AI turn
    stopListening();
    
    // Force flush of any pending utterances
    if (hasPendingLogs) {
      flushBuffer();
    }
  };

  // End interview
  const endInterview = async () => {
    setIsInterviewActive(false);
    setActiveTurn(null);
    
    // Final flush of any pending utterances
    if (hasPendingLogs) {
      console.log('🏁 Final flush of pending utterances before ending interview...');
      await flushBuffer();
    }
    
    // Show celebration
    setShowCelebration(true);
    
    // Generate analysis after celebration
    setTimeout(async () => {
      setShowCelebration(false);
      await generatePerformanceAnalysis();
    }, 12000); // 12 seconds to match celebration duration
  };

  // Pause interview
  const pauseInterview = async () => {
    setIsInterviewActive(false);
    setActiveTurn(null);
    
    // Final flush of any pending utterances
    if (hasPendingLogs) {
      console.log('⏸️ Final flush of pending utterances before pausing...');
      await flushBuffer();
    }
    
    // Show pause panel
    setShowPausePanel(true);
    
    // Redirect after pause panel animation
    setTimeout(() => {
      setShowPausePanel(false);
      router.push('/dashboard');
    }, 10000);
  };

  // Generate performance analysis
  const generatePerformanceAnalysis = async () => {
    try {
      // Create a simple analysis based on conversation history
      const analysis = {
        summary: `Interview completed successfully. You answered ${conversationHistory.filter(h => h.speaker === 'user').length} questions with thoughtful responses.`,
        metrics: [
          { category: "Communication Skills", score: 7.5, notes: "Good engagement and clear responses" },
          { category: "Technical Knowledge", score: 7.0, notes: "Demonstrated understanding of concepts" },
          { category: "Problem Solving", score: 7.5, notes: "Showed analytical thinking" },
          { category: "Confidence", score: 8.0, notes: "Maintained composure throughout" }
        ]
      };
      
      setAnalysisData(analysis);
      setShowAnalysis(true);
      
    } catch (error) {
      console.error('Error generating analysis:', error);
    }
  };

  // Handle celebration completion
  const handleCelebrationComplete = async () => {
    setShowCelebration(false);
    await generatePerformanceAnalysis();
  };

  // Loading state
  if (isLoading && !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Resuming your interview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XMarkIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            onClick={() => router.push('/dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
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
        totalQuestions={session?.questions?.length || 10}
        duration={interviewStartTimeRef.current ? Math.floor((Date.now() - interviewStartTimeRef.current.getTime()) / 1000) : 0}
        onClose={() => setShowPausePanel(false)}
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
          onNewInterview={() => router.push('/practice/new')}
          onGoHome={() => router.push('/dashboard')}
          onShareResults={() => {
            toast({
              title: "Sharing",
              description: "Sharing functionality coming soon!",
            });
          }}
          onAskQuestions={() => {
            toast({
              title: "Questions",
              description: "Question functionality coming soon!",
            });
          }}
        />
      )}
      
              {/* Debug Info */}
        <div className="fixed top-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
          <div>isInterviewActive: {isInterviewActive.toString()}</div>
          <div>isLoading: {isLoading.toString()}</div>
          <div>session: {session ? 'loaded' : 'null'}</div>
          <div>ws: {ws ? 'connected' : 'disconnected'}</div>
          <div>wsState: {ws?.readyState === WebSocket.OPEN ? 'OPEN' : ws?.readyState === WebSocket.CONNECTING ? 'CONNECTING' : ws?.readyState === WebSocket.CLOSED ? 'CLOSED' : 'UNKNOWN'}</div>
          <div>manualStart: {showManualStart ? 'true' : 'false'}</div>
          <div>logging: {isLogging ? 'active' : 'idle'}</div>
          <div>buffer: {bufferSize}</div>
          <div>stats: {loggingStats.successfulLogs}/{loggingStats.totalUtterances}</div>
          <div>question: {currentQuestionIndex + 1}/{session?.questions?.length || 0}</div>
          <div>currentQ: {currentQuestion ? currentQuestion.substring(0, 30) + '...' : 'none'}</div>
          <div>recording: {recordingStartTime > 0 ? 'active' : 'inactive'}</div>
          <div>interim: {interimTranscript ? interimTranscript.substring(0, 20) + '...' : 'none'}</div>
          <div>timing: {lastTranscriptEndTime > 0 ? Math.round(lastTranscriptEndTime / 1000) + 's' : '0s'}</div>
        </div>
      
      {!showAnalysis && (
        <AnimatePresence>
          {!session ? (
            // Loading state - no session yet
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading your interview session...</p>
              </div>
            </motion.div>
          ) : !isInterviewActive ? (
            // Session loaded but interview not started - show questions and start button
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Welcome Back to Your Interview!
                </h2>
                
                {/* Session Info */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {session.agent_name?.charAt(0) || 'A'}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {session.agent_name || 'AI Interviewer'}
                  </h3>
                  
                  <p className="text-gray-600 mb-4">
                    You have {session.total_questions || session.questions?.length || 0} questions prepared for this interview.
                    <br />
                    <span className="text-xs text-gray-400">
                      Debug: total_questions={session.total_questions}, questions.length={session.questions?.length}
                    </span>
                  </p>
                  
                  {/* Questions Preview */}
                  <div className="text-left">
                    <h4 className="font-medium text-gray-700 mb-3">📋 Questions Preview:</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {session.questions?.slice(0, 3).map((question, index) => (
                        <div key={question.id} className="text-sm text-gray-600 p-2 bg-gray-50 rounded border">
                          <span className="font-medium text-blue-600">Q{index + 1}:</span> {question.text.substring(0, 80)}...
                        </div>
                      ))}
                      {session.questions && session.questions.length > 3 && (
                        <div className="text-xs text-gray-500 text-center italic">
                          ... and {session.questions.length - 3} more questions
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Start Interview Button */}
                                        <Button 
                          onClick={() => {
                            console.log('🚀 Start Interview clicked');
                            if (session) {
                              startInterview(session);
                            }
                          }}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
                          size="lg"
                        >
                          🚀 Start Interview
                        </Button>
                        
                        {/* Fallback: Manual start if WebSocket fails */}
                        {ws === null && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                              ⚠️ WebSocket connection failed. Click "Start Interview" to begin with manual mode.
                            </p>
                          </div>
                        )}
                
                <p className="text-sm text-gray-500 mt-3">
                  Click to begin your interview with {session.agent_name || 'the AI interviewer'}
                </p>
                
                {/* Debug Info */}
                <div className="mt-6 text-xs text-gray-400">
                  <div>Session ID: {session.id}</div>
                  <div>Questions: {session.questions?.length || 0}</div>
                  <div>Total Questions: {session.total_questions || 'undefined'}</div>
                  <div>Agent Name: {session.agent_name || 'undefined'}</div>
                  <div>Name: {session.name || 'undefined'}</div>
                  <div>Status: {session.status || 'undefined'}</div>
                  <div>Session Name: {session.session_name || 'undefined'}</div>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Minimal Timer - Fixed Position */}
              <MinimalTimer isRunning={isInterviewActive} />
              
                             {/* Back Button */}
               <Button variant="ghost" className="mb-4" onClick={() => router.push('/dashboard')}>
                 <ChevronLeftIcon className="mr-2 h-4 w-4" /> Back to Dashboard
               </Button>
               
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
                 className="space-y-6"
               >
                {/* Interviewer Section */}
                <Card>
                  <CardContent className="pt-6 text-center">
                                         <div className="flex flex-col items-center mb-4">
                       <div className="w-32 h-32 rounded-full mb-2 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                         <span className="text-6xl font-semibold text-blue-600">
                           {session?.agent_name?.charAt(0) || session?.name?.charAt(0) || 'A'}
                         </span>
                       </div>
                       <h3 className="font-semibold text-xl mb-2">
                         {session?.agent_name || session?.name || 'AI Interviewer'} (Resumed Session)
                       </h3>
                     </div>

                    <div className="mb-4">
                      {activeTurn === 'ai' && !lastAgentResponse ? (
                        <p className="text-gray-500 italic">Interviewer is thinking...</p>
                      ) : (
                        <p className="text-gray-500 italic">Your turn to respond</p>
                      )}
                    </div>

                    {/* Turn Indicator */}
                    <div className="flex justify-center items-center mb-6">
                      <div className="flex items-center space-x-4 bg-gray-50 dark:bg-gray-800 rounded-full px-6 py-3">
                        <div className={`w-3 h-3 rounded-full ${isAiSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                        <span className="text-sm">
                          {isAiSpeaking ? '🎤 Interviewer is speaking...' : '👂 Your turn to respond'}
                        </span>
                        {!isAiSpeaking && (
                          <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        )}
                      </div>
                    </div>
                    
                                          {/* Audio Status */}
                      {isAiSpeaking && (
                        <div className="text-center mb-4">
                          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span>🔊 AI is speaking - Please listen</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Manual Start Option */}
                      {showManualStart && (
                        <div className="text-center mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800 mb-3">
                            ⚠️ WebSocket connection failed. Click below to manually start the interview.
                          </p>
                          <Button 
                            onClick={() => {
                              console.log('🎯 Manual interview start triggered');
                              setActiveTurn('user');
                              setIsAiSpeaking(false);
                              setShowManualStart(false);
                              // Start speech recognition immediately
                              if (recognitionRef.current && !isListening) {
                                startListening();
                              }
                            }}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            size="sm"
                          >
                            🎤 Start Speaking
                          </Button>
                        </div>
                      )}
                      
                      {/* Current Question Display */}
                      {currentQuestion && (
                        <div className="text-center mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="text-xs text-blue-600 font-medium mb-1">
                            Question {currentQuestionIndex + 1} of {session?.questions?.length || 0}
                          </div>
                          <p className="text-sm text-blue-800 font-medium">
                            {currentQuestion}
                          </p>
                        </div>
                      )}
                      
                      {/* Enhanced Speech Recognition Status */}
                      <div className="text-center mb-4">
                        <div className="inline-flex items-center space-x-3 text-sm">
                          {/* Recognition Status */}
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                            <span className="text-gray-600">
                              {isListening ? 'Listening...' : 'Not listening'}
                            </span>
                          </div>
                          
                          {/* Interim Results Indicator */}
                          {interimTranscript && (
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                              <span className="text-yellow-700 font-medium">
                                Live: "{interimTranscript.substring(0, 30)}..."
                              </span>
                            </div>
                          )}
                          
                          {/* Recognition Health */}
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span className="text-blue-600 text-xs">
                              Enhanced Mode
                            </span>
                          </div>
                        </div>
                      </div>
                      
                                              {/* Logging Status Indicator */}
                        <div className="text-center mb-4">
                          <div className="inline-flex items-center space-x-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${isLogging ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
                            <span className="text-gray-600">
                              {isLogging ? 'Saving conversation...' : 'Conversation saved'}
                            </span>
                            {bufferSize > 0 && (
                              <span className="text-blue-600 font-medium">
                                ({bufferSize} pending)
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Conversation History with Timing */}
                        {conversationHistory.length > 0 && (
                          <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Conversation History</h4>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {conversationHistory.slice(-5).map((entry, index) => (
                                <div key={index} className="text-xs p-2 bg-white rounded border">
                                  <div className="flex justify-between items-start">
                                    <span className={`font-medium ${entry.speaker === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
                                      {entry.speaker === 'user' ? 'You' : 'AI'}
                                    </span>
                                    <span className="text-gray-500">
                                      {entry.startTime && entry.endTime 
                                        ? `${Math.round((entry.endTime - entry.startTime) / 1000)}s`
                                        : '0s'
                                      }
                                    </span>
                                  </div>
                                  <p className="text-gray-700 mt-1">{entry.text.substring(0, 60)}...</p>
                                  {entry.question && entry.questionIndex !== undefined && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Q{entry.questionIndex + 1}: {entry.question.substring(0, 40)}...
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}



                    {/* AI Response Display */}
                    {lastAgentResponse && (
                      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-blue-700">Interviewer is speaking...</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Interviewer says:</p>
                        <p className="text-lg text-gray-900 font-medium">{lastAgentResponse}</p>
                        <p className="text-xs text-gray-500 mt-2 italic">Wait for the interviewer to finish...</p>
                      </div>
                    )}

                    {/* Start Interview Button */}
                    {!lastAgentResponse && (
                      <div className="text-center mb-6">
                        <Button 
                          onClick={() => {
                            if (session) {
                              startInterview(session);
                            }
                          }}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold"
                          size="lg"
                        >
                          🚀 Start Interview
                        </Button>
                        <p className="text-xs text-gray-500 mt-2">
                          Click to begin your interview with {session?.agent_name || 'the AI interviewer'}
                        </p>
                      </div>
                    )}

                    {/* User Input Section */}
                    {activeTurn === 'user' && (
                      <div className="space-y-4">
                        {transcript && (
                          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-gray-600 mb-2">You're saying:</p>
                            <p className="text-lg text-gray-900">{transcript}</p>
                          </div>
                        )}
                        
                        {!isListening && (
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            onClick={startListening}
                          >
                            🎤 Start Speaking
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
                    )}
                  </CardContent>
                </Card>

                {/* Interview Controls */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="flex-1 sm:flex-none cursor-pointer hover:bg-gray-50" 
                    disabled={!isInterviewActive}
                    onClick={pauseInterview}
                  >
                    ⏸️ Pause & Resume Later
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    size="lg" 
                    className="flex-1 sm:flex-none cursor-pointer" 
                    disabled={!isInterviewActive}
                    onClick={endInterview}
                  >
                    🏁 Finish Interview
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
