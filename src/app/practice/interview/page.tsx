"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff, Play, Pause, Square, Loader2, X, Speaker, Mic as MicrophoneIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/use-toast';
// Removed InterviewTimer import - using built-in timer display
import { useAuth } from '@/contexts/auth.context';

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  category: string;
}

interface PracticeSession {
  id: string;
  interviewer: {
    name: string;
    description: string;
    avatar?: string;
  };
  questions: Question[];
}

interface InterviewResults {
  sessionId: string;
  duration: number;
  questionsAnswered: number;
  totalQuestions: number;
  interviewer: string;
  completedAt: string;
}

export default function PracticeInterviewPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string>('');
  const [enhancedSpeechInstructions, setEnhancedSpeechInstructions] = useState<any>(null);
  const [currentAudio] = useState<HTMLAudioElement | null>(null);
  const [geminiResponse, setGeminiResponse] = useState<string>('');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [retellSessionTime, setRetellSessionTime] = useState<number>(180); // 3 minutes in seconds
  const [isRetellActive, setIsRetellActive] = useState(false);
  const [userAudioStream, setUserAudioStream] = useState<MediaStream | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [userInput, setUserInput] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  
  // Retell Web Client for real-time voice conversations
  const webClientRef = useRef<any>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [activeTurn, setActiveTurn] = useState<'user' | 'agent'>('user');
  const [lastAgentResponse, setLastAgentResponse] = useState('');
  const [lastUserResponse, setLastUserResponse] = useState('');
  const [zephyrMode, setZephyrMode] = useState<boolean>(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // Timer state for tracking interview duration
  const [elapsedTime, setElapsedTime] = useState<number>(0); // Time used (counting UP)
  const [maxInterviewTime, setMaxInterviewTime] = useState<number>(180); // 3 minutes max
  const [totalInterviewTime, setTotalInterviewTime] = useState<number>(0); // Total time spent in interview
  const [lastCreditDeduction, setLastCreditDeduction] = useState<number>(0); // Last time credits were deducted
  
  // Subscription state for credit display
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  
  // Modal state for pause confirmation
  const [showPauseModal, setShowPauseModal] = useState(false);

  // Fetch subscription data for credit display
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setSubscriptionLoading(true);
        const response = await fetch('/api/user-subscription');
        
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  useEffect(() => {
    // Get session data from localStorage
    const storedSession = localStorage.getItem('currentPracticeSession');
    console.log('🔍 Interview page - storedSession from localStorage:', storedSession);
    
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        console.log('🔍 Interview page - parsed session:', parsedSession);
        setSession(parsedSession);
        
        // Check if timer was already started from setup page
        if (parsedSession.interviewStarted && parsedSession.timerStartTime) {
          console.log('🔍 Interview page - Timer was already started, continuing...');
          setInterviewStarted(true);
          setIsConnected(true);
          
          // Calculate how much time has passed since timer started
          const now = Date.now();
          const elapsedSinceStart = Math.floor((now - parsedSession.timerStartTime) / 1000);
          console.log('🔍 Interview page - Elapsed time since start:', elapsedSinceStart, 'seconds');
          
          // Update timer state to reflect elapsed time
          if (elapsedSinceStart > 0) {
            setElapsedTime(elapsedSinceStart);
            setTotalInterviewTime(elapsedSinceStart);
            setMaxInterviewTime(parsedSession.maxInterviewTime || 180);
          }
        }
      } catch (error) {
        console.error('Error parsing session:', error);
      }
    } else {
      console.log('❌ Interview page - No session found in localStorage');
    }
    setLoading(false);

    // Initialize speech synthesis and load available voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
      console.log('🎤 Speech synthesis available');
      
      // Load voices when they become available
      const loadVoices = () => {
        const voices = speechSynthesisRef.current?.getVoices() || [];
        console.log('🔊 Loaded voices:', voices.map(v => `${v.name} (${v.lang})`));
        setAvailableVoices(voices);
        
        // Prioritize voices that sound more like Zephyr (natural, warm, conversational)
        const zephyrLikeVoices = [
          'Samantha',        // macOS - natural, warm female voice
          'Victoria',        // macOS - clear, friendly female voice
          'Alex',            // macOS - natural male voice
          'Google UK English Female', // Chrome - British accent, warm
          'Google US English Female', // Chrome - natural American female
          'Microsoft Zira',  // Windows - natural female voice
          'Microsoft David', // Windows - natural male voice
          'Karen',           // Various systems - warm female voice
          'Daniel',          // Various systems - natural male voice
        ];
        
        // Find the best Zephyr-like voice
        const defaultVoice = voices.find(voice => 
          zephyrLikeVoices.includes(voice.name)
        ) || voices.find(voice => 
          voice.name.toLowerCase().includes('female') && 
          (voice.name.toLowerCase().includes('natural') || 
           voice.name.toLowerCase().includes('warm') ||
           voice.name.toLowerCase().includes('friendly'))
        ) || voices.find(voice => 
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('victoria') ||
          voice.name.toLowerCase().includes('alex')
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        
        if (defaultVoice) {
          setSelectedVoice(defaultVoice.name);
          console.log(`🎭 Zephyr-like voice selected: ${defaultVoice.name} (${defaultVoice.lang})`);
        } else {
          console.log('⚠️ No suitable voice found');
        }
      };

      // Load voices immediately if available
      loadVoices();
      
      // Also listen for voices loaded event
      speechSynthesisRef.current.addEventListener('voiceschanged', loadVoices);
      
      // Force load voices if they're not available yet
      if (speechSynthesisRef.current.getVoices().length === 0) {
        console.log('🔄 No voices loaded yet, waiting for voiceschanged event...');
        // Some browsers need a small delay
        setTimeout(loadVoices, 100);
      }
      
      return () => {
        speechSynthesisRef.current?.removeEventListener('voiceschanged', loadVoices);
      };
    } else {
      console.log('❌ Speech synthesis not available in this browser');
    }
  }, []);

  // Removed handleTimeUpdate - now handled by main timer useEffect

  // Main timer useEffect - consolidates all timer logic
  useEffect(() => {
    if (interviewStarted && isConnected) {
      console.log('🚀 Starting main interview timer');
      
      const timer = setInterval(() => {
        setTotalInterviewTime(prev => {
          const newTime = prev + 1;
          setElapsedTime(newTime);
          
          // Debug: Log every 10 seconds
          if (newTime % 10 === 0) {
            console.log(`⏰ Main timer update: ${newTime}s`);
          }
          
          // Check if we've reached max interview time
          if (newTime >= maxInterviewTime) {
            console.log('⏰ Max interview time reached, ending interview');
            handleEndInterview();
          }
          
          return newTime;
        });
      }, 1000);

      return () => {
        console.log('🛑 Clearing main interview timer');
        clearInterval(timer);
      };
    } else {
      console.log('⏸️ Timer not started - interviewStarted:', interviewStarted, 'isConnected:', isConnected);
    }
  }, [interviewStarted, isConnected, maxInterviewTime]);

  // Function to deduct credits with smart logic
  const deductCredits = async (totalSeconds: number) => {
    try {
      console.log(`🔍 Smart credit deduction called with ${totalSeconds} seconds`);
      console.log(`🔍 User: ${user?.email}, Authenticated: ${isAuthenticated}`);
      
      // Only deduct credits for authenticated users
      if (!user || !isAuthenticated) {
        console.log('⚠️ Skipping credit deduction - user not authenticated');
        return;
      }
      
      console.log(`💰 Attempting to deduct credits for ${totalSeconds} seconds...`);
      
      const response = await fetch('/api/deduct-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ totalSeconds }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Successfully deducted ${data.deductedMinutes} minute(s). Remaining: ${data.remainingCredits} minutes. Leftover: ${data.leftoverSeconds}s`);
        
        // Update last credit deduction time
        setLastCreditDeduction(totalInterviewTime);
        
        // Show toast notification
        toast({
          title: "Credits Updated",
          description: `Used ${data.deductedMinutes} minute(s). ${data.remainingCredits} minutes remaining.`,
        });
        
        // Dispatch event to refresh dashboard subscription data
        window.dispatchEvent(new CustomEvent('credits-updated', {
          detail: { remainingCredits: data.remainingCredits }
        }));
      } else {
        const errorData = await response.json();
        console.error('Failed to deduct credits:', errorData.error);
        
        if (errorData.error === 'Insufficient credits') {
          toast({
            title: "Insufficient Credits",
            description: "You've run out of interview time. Please purchase more credits to continue.",
            variant: "destructive",
          });
          // End the interview if no credits left
          handleEndInterview();
        } else {
          toast({
            title: "Credit Deduction Failed",
            description: errorData.error || "Failed to deduct credits. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error deducting credits:', error);
      toast({
        title: "Credit Deduction Error",
        description: "Failed to deduct credits. Please check your connection and try again.",
        variant: "destructive",
      });
    }
  };

  // Removed old conflicting timer - now using consolidated main timer above

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      // Stop any active recording
      if (userAudioStream) {
        userAudioStream.getTracks().forEach(track => track.stop());
      }
      // Clean up Retell client
      if (webClientRef.current) {
        webClientRef.current.removeAllListeners();
      }
    };
  }, [userAudioStream]);

  // Initialize Retell Web Client for free users
  const initializeRetellClient = async () => {
    try {
      console.log('🎤 Initializing Retell Web Client for free users...');
      
      // Import Retell Web Client SDK
      const { RetellWebClient } = await import('retell-client-js-sdk');
      const webClient = new RetellWebClient();
      webClientRef.current = webClient;
      
      // Set up event handlers
      setupRetellEventHandlers(webClient);
      
      console.log('✅ Retell Web Client initialized successfully');
      
return true;
      
    } catch (error) {
      console.error('❌ Error initializing Retell client:', error);
      toast({
        title: "Voice Client Error",
        description: "Failed to initialize voice client. Using browser speech as fallback.",
        variant: "destructive"
      });
      
return false;
    }
  };

  const setupRetellEventHandlers = (webClient: any) => {
    webClient.on("call_started", () => {
      console.log("Free practice interview started");
      setIsCalling(true);
      setIsCallStarted(true);
      setIsVoiceEnabled(true);
      setActiveTurn('agent');
      
      toast({
        title: "Interview Started",
        description: "Your free practice interview is now active! Lisa will begin speaking shortly.",
      });
    });

    webClient.on("call_ended", () => {
      console.log("Free practice interview ended");
      setIsCalling(false);
      setIsVoiceEnabled(false);
      setIsCallStarted(false);
      setActiveTurn('user');
      
      toast({
        title: "Interview Ended",
        description: "Your free practice interview has concluded. You can continue with browser voice or upgrade for unlimited access.",
      });
    });

    webClient.on("agent_start_talking", () => {
      setActiveTurn("agent");
      console.log("Lisa started talking");
    });

    webClient.on("agent_stop_talking", () => {
      setActiveTurn("user");
      console.log("Lisa stopped talking, your turn");
    });

    webClient.on("error", (error: any) => {
      console.error("Retell Web Client error:", error);
      setIsCalling(false);
      setIsVoiceEnabled(false);
      setIsCallStarted(false);
      setError("Voice interview error: " + (error.message || "Unknown error"));
      
      toast({
        title: "Interview Error",
        description: "There was an error with the voice interview. Falling back to browser speech.",
        variant: "destructive",
      });
    });

    webClient.on("update", (update: any) => {
      if (update.transcript) {
        const transcripts = update.transcript;
        const roleContents: { [key: string]: string } = {};

        transcripts.forEach((transcript: any) => {
          roleContents[transcript?.role] = transcript?.content;
        });

        setLastAgentResponse(roleContents["agent"] || '');
        setLastUserResponse(roleContents["user"] || '');
      }
    });
  };

  // Real-time voice conversation functions
  const startVoiceConversation = async () => {
    try {
      console.log('🎤 Starting real-time voice conversation...');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      setUserAudioStream(stream);
      setIsRecording(true);
      setIsListening(true);
      
      console.log('✅ Microphone access granted, starting conversation...');
      
      // Start listening for user input
      startListeningForUserInput(stream);
      
    } catch (error) {
      console.error('❌ Error starting voice conversation:', error);
      toast({
        title: "Microphone Access Error",
        description: "Please allow microphone access to start the voice conversation.",
        variant: "destructive"
      });
    }
  };

  const startListeningForUserInput = (stream: MediaStream) => {
    // This would integrate with a real-time speech-to-text service
    // For now, we'll simulate the conversation flow
    console.log('👂 Listening for user input...');
    
    // Simulate user speaking and AI responding
    setTimeout(() => {
      handleUserSpeaks("Hello, I'm ready to start the interview.");
    }, 2000);
  };

  const handleUserSpeaks = async (userMessage: string) => {
    try {
      setIsProcessing(true);
      
      // Add user message to conversation
      const userEntry = {
        role: 'user' as const,
        content: userMessage,
        timestamp: new Date()
      };
      
      setConversationHistory(prev => [...prev, userEntry]);
      setUserInput('');
      
      console.log('👤 User said:', userMessage);
      
      // Simulate AI processing and response
      setTimeout(async () => {
        await generateAIResponse(userMessage);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error handling user input:', error);
      setIsProcessing(false);
    }
  };

  const generateAIResponse = async (userMessage: string) => {
    try {
      console.log('🤖 Generating AI response...');
      
      // Call the free interview API to get AI response
      const response = await fetch('/api/free-interview-live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `User said: "${userMessage}". Continue the interview naturally.`,
          voice: 'Zephyr',
          model: 'gpt-4o-mini',
          maxDuration: 3
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Add AI response to conversation
      const aiEntry = {
        role: 'assistant' as const,
        content: data.text,
        timestamp: new Date()
      };
      
      setConversationHistory(prev => [...prev, aiEntry]);
      
      // Speak the AI response
      if (data.metadata?.voice_system === 'retell_agent') {
        console.log('🎤 Retell agent responding...');
        // In a real implementation, this would stream the Retell agent's voice
        speakText(data.text, 'Zephyr');
      } else {
        speakText(data.text, 'Zephyr');
      }
      
      setIsProcessing(false);
      
    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      setIsProcessing(false);
      
      // Fallback response
      const fallbackEntry = {
        role: 'assistant' as const,
        content: "I'm sorry, I'm having trouble processing that. Could you please repeat your answer?",
        timestamp: new Date()
      };
      
      setConversationHistory(prev => [...prev, fallbackEntry]);
      speakText(fallbackEntry.content, 'Zephyr');
    }
  };

  const stopVoiceConversation = () => {
    if (userAudioStream) {
      userAudioStream.getTracks().forEach(track => track.stop());
      setUserAudioStream(null);
    }
    setIsRecording(false);
    setIsListening(false);
    console.log('🛑 Voice conversation stopped');
  };

  // Function to finish practice session permanently
  const handleFinishPractice = () => {
    console.log('🛑 Finishing practice session - stopping all activities');
    
    // Stop voice conversation
    stopVoiceConversation();
    
    // End Retell call if active
    if (webClientRef.current && isCalling) {
      try {
        webClientRef.current.stopCall();
        console.log('🎤 Retell call ended');
      } catch (error) {
        console.error('❌ Error ending Retell call:', error);
      }
    }
    
    // Clear all timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Stop any ongoing speech synthesis
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      console.log('🔇 Speech synthesis cancelled');
    }
    
    // Stop any ongoing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      console.log('🔇 Audio playback stopped');
    }
    
    // Reset all interview states
    setIsRetellActive(false);
    setIsCalling(false);
    setIsCallStarted(false);
    setIsVoiceEnabled(false);
    setIsConnected(false);
    setInterviewStarted(false);
    setCurrentAudioUrl('');
    setConversationHistory([]);
    setLastAgentResponse('');
    setLastUserResponse('');
    setActiveTurn('user');
    setElapsedTime(0);
    setTotalInterviewTime(0);
    
    toast({
      title: "Practice Session Finished",
      description: "Your practice interview has been completed. Processing credits immediately...",
    });

    // Process credits immediately and mark as completed
    setTimeout(async () => {
      try {
        console.log(`🔍 Processing interview completion immediately...`);
        console.log(`🔍 totalInterviewTime: ${totalInterviewTime} seconds`);
        console.log(`🔍 isAuthenticated: ${isAuthenticated}, user: ${user?.email}`);
        
        // Process smart credit deduction
        if (isAuthenticated && user) {
          console.log(`💰 Calling deductCredits with ${totalInterviewTime} seconds`);
          await deductCredits(totalInterviewTime);
        } else {
          console.log('⚠️ Skipping credit deduction - not authenticated');
        }

        // Mark session as completed immediately
        if (session?.id) {
          try {
            await fetch('/api/practice-sessions', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: session.id,
                status: 'completed',
                end_time: new Date().toISOString(),
                duration: totalInterviewTime
              }),
            });
            console.log('✅ Session marked as completed');
          } catch (error) {
            console.error('Error updating session status:', error);
          }
        }

        // Redirect to feedback page
        const sessionId = session?.id || 'unknown';
        console.log(`🔄 Redirecting to feedback page with sessionId: ${sessionId}, duration: ${totalInterviewTime}`);
        router.push(`/feedback?sessionId=${sessionId}&duration=${totalInterviewTime}`);
        
      } catch (error) {
        console.error('Error processing interview completion:', error);
        router.push('/dashboard');
      }
    }, 1000); // Immediate processing
  };

  // Function to pause and resume later
  const handlePauseAndResume = () => {
    console.log('⏸️ Pausing practice session - stopping all activities');
    
    // Stop voice conversation
    stopVoiceConversation();
    
    // End Retell call if active
    if (webClientRef.current && isCalling) {
      try {
        webClientRef.current.stopCall();
        console.log('🎤 Retell call paused');
      } catch (error) {
        console.error('❌ Error pausing Retell call:', error);
      }
    }
    
    // Clear all timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Stop any ongoing speech synthesis
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      console.log('🔇 Speech synthesis cancelled');
    }
    
    // Stop any ongoing audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      console.log('🔇 Audio playback stopped');
    }
    
    // Reset states but keep session data
    setIsRetellActive(false);
    setIsCalling(false);
    setIsCallStarted(false);
    setIsVoiceEnabled(false);
    setIsConnected(false);
    setInterviewStarted(false);
    setCurrentAudioUrl('');
    setActiveTurn('user');
    
    // Store current progress in localStorage for resume
    if (session?.id) {
      const resumeData = {
        sessionId: session.id,
        currentQuestionIndex,
        elapsedTime,
        totalInterviewTime,
        conversationHistory,
        timestamp: Date.now()
      };
      localStorage.setItem(`resumeSession_${session.id}`, JSON.stringify(resumeData));
      console.log('💾 Session progress saved for resume');
    }
    
    // Show pause confirmation modal
    setShowPauseModal(true);
  };

  const handleEndInterview = () => {
    // Stop voice conversation
    stopVoiceConversation();
    
    // End Retell call if active
    if (webClientRef.current && isCalling) {
      try {
        webClientRef.current.stopCall();
        console.log('🎤 Retell call ended');
      } catch (error) {
        console.error('❌ Error ending Retell call:', error);
      }
    }
    
    // Clear timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Reset states
    setIsRetellActive(false);
    setIsCalling(false);
    setIsCallStarted(false);
    setIsVoiceEnabled(false);
    setCurrentAudioUrl('');
    setConversationHistory([]);
    setLastAgentResponse('');
    setLastUserResponse('');
    setActiveTurn('user');
    
    toast({
      title: "Interview Ended",
      description: "Your practice interview session has been paused. Processing credits in 5 seconds...",
    });

    // Wait 5 seconds, then process credits for paused session
    setTimeout(async () => {
      try {
        console.log(`🔍 Processing paused interview credits after 5 seconds...`);
        console.log(`🔍 totalInterviewTime: ${totalInterviewTime} seconds`);
        console.log(`🔍 isAuthenticated: ${isAuthenticated}, user: ${user?.email}`);
        
        // Process smart credit deduction
        if (isAuthenticated && user) {
          console.log(`💰 Calling deductCredits with ${totalInterviewTime} seconds`);
          await deductCredits(totalInterviewTime);
        } else {
          console.log('⚠️ Skipping credit deduction - not authenticated');
        }

        // Keep session as in-progress for resume (don't mark as completed)
        console.log(`⏸️ Session kept as in-progress for resume`);
        
        // Redirect to dashboard
        router.push('/dashboard');
        
      } catch (error) {
        console.error('Error processing paused interview:', error);
        router.push('/dashboard');
      }
    }, 5000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartInterview = async () => {
    if (!session) {
      alert('No session data available');
      
return;
    }

    try {
      setInterviewStarted(true);
      setIsConnected(true);
      
      // Start the interview with Gemini Live
      await startOpenAIInterview();
      
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview. Please try again.');
    }
  };

  const startOpenAIInterview = async () => {
    try {
      setIsGeminiLoading(true);
      setError(null);

      console.log('🎤 Starting free practice interview with Retell API...');

      // Initialize Retell Web Client first
      const retellInitialized = await initializeRetellClient();
      
      if (!retellInitialized) {
        console.log('🔄 Retell client failed to initialize, using browser speech fallback...');
        // Generate a response using browser speech
        const fallbackResponse = `Hello! I'm ${session?.interviewer?.name || 'your AI interviewer'}, your AI interviewer. Let's begin the practice interview. The first question is: ${session?.questions[0]?.text || 'Tell me about yourself.'}`;
        setGeminiResponse(fallbackResponse);
        speakText(fallbackResponse, 'Zephyr');
        
return;
      }

      // Call the free interview API to get initial response and Retell agent connection
      const response = await fetch('/api/free-interview-live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Start a practice interview with the user. Ask the first question: ${session?.questions[0]?.text || 'Tell me about yourself.'}`,
          voice: 'Zephyr',
          model: 'gpt-4o-mini',
          maxDuration: 3
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Free interview API response:', data);

      // Set the response text
      setGeminiResponse(data.text);

      // Start the interview timer
      setInterviewStarted(true);
      setIsConnected(true);
      console.log('🚀 Interview started - timer should begin');

      // Handle different response types
      if (data.audio) {
        if (data.audio === 'BROWSER_FALLBACK') {
          console.log('🔄 Using browser-based speech synthesis as fallback...');
          speakText(data.text, 'Zephyr');
        } else if (data.audio.startsWith('ENHANCED_BROWSER_SPEECH:')) {
          console.log('🎵 Using enhanced browser speech...');
          const instructions = JSON.parse(data.audio.replace('ENHANCED_BROWSER_SPEECH:', ''));
          setEnhancedSpeechInstructions(instructions);
          speakEnhancedText(instructions.text, instructions.voice, instructions.voiceOptions);
        } else {
          console.log('🎵 Playing OpenAI-generated audio...');
          setCurrentAudioUrl(data.audio);
          playAudio(data.audio);
        }
      } else {
        // Check if this is a Retell agent connection
        if (data.metadata?.voice_system === 'retell_agent') {
          console.log('🎤 Retell agent connection established!');
          setCurrentAudioUrl('retell_agent_connected');
          setGeminiResponse(data.text);
          
          // Start the interview timer for Retell sessions
          setInterviewStarted(true);
          setIsConnected(true);
          console.log('🚀 Retell interview started - timer should begin');
          
          // Start Retell session timer (3 minutes)
          setIsRetellActive(true);
          setRetellSessionTime(180); // Reset to 3 minutes
          
          // Start countdown timer
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          intervalRef.current = setInterval(() => {
            setRetellSessionTime(prev => {
              if (prev <= 1) {
                // Session expired
                clearInterval(intervalRef.current!);
                setIsRetellActive(false);
                setCurrentAudioUrl('retell_session_expired');
                toast({
                  title: "Retell Session Expired",
                  description: "Your 3-minute free Retell session has ended. Upgrade to Pro for unlimited access.",
                });
                
return 0;
              }
              
return prev - 1;
            });
          }, 1000);

          // Start the Retell voice call
          if (webClientRef.current && data.metadata?.connection_id) {
            try {
              console.log('🎤 Starting Retell voice call...');
              await webClientRef.current.startCall({
                accessToken: data.metadata.connection_id
              });
            } catch (callError) {
              console.error('❌ Error starting Retell call:', callError);
              toast({
                title: "Voice Call Error",
                description: "Failed to start voice call. Using browser speech as fallback.",
                variant: "destructive"
              });
            }
          }
          
        } else {
          console.log('⚠️ No audio from OpenAI, falling back to browser speech...');
          speakText(data.text, 'Zephyr');
        }
      }

    } catch (error) {
      console.error('❌ Error starting interview:', error);
      setError(error instanceof Error ? error.message : 'Failed to start interview');
      toast({
        title: "Interview Error",
        description: "Failed to start the interview. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeminiLoading(false);
    }
  };

  const playAudio = (audioUrl: string) => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    
    setCurrentAudioUrl(audio.src || '');
    audio.play().catch(console.error);
  };

  const speakText = (text: string, voiceName: string = 'Zephyr') => {
    console.log('🔊 speakText called with:', text);
    
    // Stop any current speech
    if (currentUtteranceRef.current) {
      speechSynthesisRef.current?.cancel();
    }

    // Initialize speech synthesis
    if (!speechSynthesisRef.current) {
      speechSynthesisRef.current = window.speechSynthesis;
      console.log('🎤 Speech synthesis initialized');
    }

    // Create new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    console.log('📝 Utterance created for text:', text.substring(0, 50) + '...');
    
    // Use selected voice or find a good default
    if (selectedVoice) {
      const voice = availableVoices.find(v => v.name === selectedVoice);
      if (voice) {
        utterance.voice = voice;
        console.log(`🎭 Using selected voice: ${voice.name} (${voice.lang})`);
      } else {
        console.log('⚠️ Selected voice not found, using fallback');
      }
    } else {
      // Fallback to finding a good voice
      const voices = speechSynthesisRef.current.getVoices();
      console.log('🔍 Available voices:', voices.map(v => v.name));
      
      const preferredVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('female') || 
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('victoria')
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log(`🎭 Using fallback voice: ${preferredVoice.name} (${preferredVoice.lang})`);
      } else {
        console.log('❌ No suitable voice found');
      }
    }

    // Configure speech settings for Zephyr-like conversational experience
    if (zephyrMode) {
      // Zephyr Mode: Natural, warm, conversational
      utterance.rate = 0.85;    // Slightly slower for natural conversation
      utterance.pitch = 1.1;     // Slightly higher pitch for warmth
      utterance.volume = 1.0;    // Full volume for clarity
      console.log('🎭 Zephyr mode enabled - rate: 0.85, pitch: 1.1');
    } else {
      // Standard Mode: Clear and professional
      utterance.rate = 0.9;      // Normal rate for clarity
      utterance.pitch = 1.0;     // Normal pitch
      utterance.volume = 1.0;    // Full volume
      console.log('📢 Standard mode - rate: 0.9, pitch: 1.0');
    }

    // Event handlers
    utterance.onstart = () => {
      setIsPlaying(true);
      console.log('🎬 Speech started');
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
      console.log('✅ Speech ended');
    };
    
    utterance.onerror = (event) => {
      setIsPlaying(false);
      console.error('❌ Speech error:', event);
    };

    // Store reference and speak
    currentUtteranceRef.current = utterance;
    
    console.log('🚀 Attempting to speak...');
    try {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.speak(utterance);
        console.log('✅ speak() called successfully');
      }
      
      // Set a timeout to check if speech actually started
      setTimeout(() => {
        if (!isPlaying) {
          console.log('⚠️ Speech may not have started, trying fallback...');
          speakTextFallback(text);
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error calling speak():', error);
      console.log('🔄 Trying fallback method...');
      speakTextFallback(text);
    }
  };

  const speakTextFallback = (text: string) => {
    console.log('🔄 Using fallback speech method...');
    
    try {
      // Try to create a new speech synthesis instance
      const synth = window.speechSynthesis;
      
      // Cancel any ongoing speech
      synth.cancel();
      
      // Create utterance with minimal settings
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Use default voice (should work on Mac)
      const voices = synth.getVoices();
      if (voices.length > 0) {
        utterance.voice = voices[0];
        console.log(`🎭 Using fallback voice: ${voices[0].name}`);
      }
      
      // Simple settings that should work everywhere
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Event handlers
      utterance.onstart = () => {
        setIsPlaying(true);
        console.log('🎬 Fallback speech started');
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        console.log('✅ Fallback speech ended');
      };
      
      utterance.onerror = (event) => {
        setIsPlaying(false);
        console.error('❌ Fallback speech error:', event);
      };
      
      // Speak
      synth.speak(utterance);
      console.log('✅ Fallback speak() called');
      
    } catch (error) {
      console.error('❌ Fallback speech failed:', error);
      // Show user-friendly error
      alert('Voice system not available. Please check your browser settings or try a different browser.');
    }
  };

  const stopSpeech = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsPlaying(false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < (session?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      // Start new question with Gemini
      await startOpenAIInterview();
    }
  };

  const handlePreviousQuestion = async () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      // Start previous question with Gemini
      await startOpenAIInterview();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Here you would integrate with actual voice recording
    // For now, we'll simulate recording
    if (!isRecording) {
      console.log('Started recording candidate response...');
    } else {
      console.log('Stopped recording candidate response...');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (currentAudio) {
      currentAudio.muted = !isMuted;
    }
  };

  const toggleConnection = () => {
    setIsConnected(!isConnected);
    if (!isConnected) {
      // Reconnect and restart interview
      startOpenAIInterview();
    }
  };

  const togglePlayPause = () => {
    if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
      } else {
        currentAudio.play().catch(console.error);
      }
    }
  };

  const testVoice = () => {
    console.log('🧪 Testing voice system...');
    
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      const voices = synth.getVoices();
      console.log('🔊 Available voices:', voices.map(v => v.name));
      
      // Create a simple test utterance
      const testUtterance = new SpeechSynthesisUtterance('Hello! This is a test of the voice system.');
      
      // Try to find any English voice
      const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
      if (englishVoice) {
        testUtterance.voice = englishVoice;
        console.log(`🎭 Using test voice: ${englishVoice.name}`);
      }
      
      testUtterance.onstart = () => console.log('🎬 Test speech started');
      testUtterance.onend = () => console.log('✅ Test speech ended');
      testUtterance.onerror = (e) => console.error('❌ Test speech error:', e);
      
      synth.speak(testUtterance);
      console.log('🚀 Test speak() called');
    } else {
      console.log('❌ Speech synthesis not available');
    }
  };

  const testAudio = () => {
    console.log('🔊 Testing audio system...');
    
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Set audio properties
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A note
      oscillator.type = 'sine';
      
      // Fade in/out
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
      
      // Play audio
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      console.log('✅ Audio test completed');
    } catch (error) {
      console.error('❌ Audio test failed:', error);
    }
  };

  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
      console.log('🔇 Audio stopped');
    }
  };

  const speakEnhancedText = (text: string, voicePreference: string, voiceOptions: any) => {
    if (!speechSynthesisRef.current) {
      console.error('❌ Speech synthesis not available');
      
return;
    }

    // Stop any current speech
    speechSynthesisRef.current.cancel();

    // Wait for voices to load
    const speakWithVoice = () => {
      const voices = speechSynthesisRef.current?.getVoices() || [];
      console.log('🎤 Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));

      // Get the preferred voice based on user preference
      const preferredVoiceName = voiceOptions[voicePreference.toLowerCase()] || 'Google UK English Female';
      let selectedVoice = voices.find(v => v.name === preferredVoiceName);

      // Fallback to any English voice if preferred not found
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('en-')) || voices[0];
        console.warn(`⚠️ Preferred voice "${preferredVoiceName}" not found, using: ${selectedVoice?.name || 'default'}`);
      }

      if (selectedVoice) {
        console.log(`✅ Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = selectedVoice || null;
      utterance.rate = 0.9; // Slightly slower for better clarity
      utterance.pitch = 1.0; // Natural pitch
      utterance.volume = 1.0; // Full volume

      // Add event listeners
      utterance.onstart = () => {
        console.log('🎤 Enhanced speech started');
        setIsPlaying(true);
      };

      utterance.onend = () => {
        console.log('✅ Enhanced speech completed');
        setIsPlaying(false);
      };

      utterance.onerror = (event) => {
        console.error('❌ Enhanced speech error:', event.error);
        setIsPlaying(false);
      };

      // Speak the text
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.speak(utterance);
      }
    };

    // If voices are already loaded, speak immediately
    if (speechSynthesisRef.current && speechSynthesisRef.current.getVoices().length > 0) {
      speakWithVoice();
    } else if (speechSynthesisRef.current) {
      // Wait for voices to load
      speechSynthesisRef.current.onvoiceschanged = speakWithVoice;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading interview session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Interview Session</h2>
          <p className="text-gray-600 mb-4">Please start a practice session first.</p>
          <div className="space-y-4">
            <Button onClick={() => router.push('/sign-up?offer=free-credit')}>
              Start Free Practice
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                const stored = localStorage.getItem('currentPracticeSession');
                console.log('🔍 Manual localStorage check:', stored);
                if (stored) {
                  try {
                    const parsed = JSON.parse(stored);
                    console.log('🔍 Parsed session:', parsed);
                    setSession(parsed);
                  } catch (e) {
                    console.error('Error parsing:', e);
                  }
                }
              }}
            >
              Debug: Check localStorage
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Validate that the session has an interviewer
  if (!session.interviewer || !session.interviewer.name) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Interviewer Not Selected</h2>
          <p className="text-gray-600 mb-4">Please select an interviewer before starting the interview.</p>
          <div className="space-y-4">
            <Button onClick={() => router.push('/practice/setup')}>
              Select Interviewer
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/practice/new')}
            >
              Go to Practice Setup
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Validate that the session has questions
  if (!session.questions || session.questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Questions Available</h2>
          <p className="text-gray-600 mb-4">Please generate questions before starting the interview.</p>
          <div className="space-y-4">
            <Button onClick={() => router.push('/upload')}>
              Generate Questions
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/practice/setup')}
            >
              Go to Practice Setup
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const timeRemaining = retellSessionTime;

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="p-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-semibold">JB</span>
            </div>
            <span className="text-sm text-gray-600">JasTalk AI Beta</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            {/* Credit Display */}
            <div className="text-sm text-gray-600">
              {subscriptionLoading ? (
                <span className="text-gray-400">Loading...</span>
              ) : subscription ? (
                <span className="font-semibold text-blue-600">
                  {subscription.interview_time_remaining || 0} min
                </span>
              ) : (
                <span className="text-gray-400">Credits</span>
              )}
            </div>
            {/* Connection Status */}
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            {/* Timer Display */}
            {interviewStarted && (
              <Badge variant="outline" className="text-orange-600">
                ⏱️ {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')} used
              </Badge>
            )}
            {/* Debug Timer State */}
            <div className="text-xs text-gray-500">
              Timer: {interviewStarted ? 'ON' : 'OFF'} | Connected: {isConnected ? 'YES' : 'NO'}
            </div>
            {/* Interview Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={handleFinishPractice}
              >
                <X className="h-3 w-3 mr-1" />
                Finish
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700"
                onClick={handlePauseAndResume}
              >
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {!interviewStarted ? (
          /* Pre-interview setup */
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mic className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Start Your Interview?
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              You'll be interviewed by {session.interviewer.name} using OpenAI + Retell Agent for real-time voice conversations.
              <span className="font-semibold text-blue-600"> FREE users get 3 minutes of Retell API access!</span>
              Make sure your microphone is working and you're in a quiet environment.
            </p>
            
            <Button
              disabled={isGeminiLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3"
              onClick={startOpenAIInterview}
            >
              {isGeminiLoading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Connecting to Retell Agent...
                </>
              ) : (
                <>
                  <Mic className="h-6 w-6" />
                  Start Free Retell Interview (3 min)
                </>
              )}
            </Button>

            {/* Interviewer Info */}
            <Card className="max-w-md mx-auto p-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={session.interviewer.avatar} alt={session.interviewer.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-semibold">
                    {session.interviewer.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900 text-lg">{session.interviewer.name}</h3>
                  <p className="text-sm text-gray-600">{session.interviewer.description}</p>
                  <p className="text-xs text-blue-600 mt-1">Powered by OpenAI + Retell Agent (FREE for all users)</p>
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                <Badge variant="secondary">Interview</Badge>
                <Badge variant="secondary">Easy</Badge>
                <Badge variant="outline" className="text-blue-600">Gemini Live</Badge>
              </div>
            </Card>
          </div>
        ) : (
          /* Active interview interface */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Interviewer and Controls */}
            <div className="lg:col-span-1">
              <Card className="p-6 mb-6">
                <div className="text-center mb-6">
                  <Avatar className="w-20 h-20 mx-auto mb-4">
                    <AvatarImage src={session.interviewer.avatar} alt={session.interviewer.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl font-semibold">
                      {session.interviewer.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-gray-900 text-lg">{session.interviewer.name}</h3>
                  <p className="text-sm text-gray-600">{session.interviewer.description}</p>
                  <p className="text-xs text-blue-600 mt-1">OpenAI + Retell Agent (FREE - 3 min limit)</p>
                </div>

                {/* Interview Timer Display */}
                {interviewStarted && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-sm text-blue-500">
                        Time Used / {Math.floor(maxInterviewTime / 60)}:{(maxInterviewTime % 60).toString().padStart(2, '0')} Max
                      </div>
                    </div>
                  </div>
                )}

                {/* Interview Controls */}
                <div className="space-y-4">
                  <Button
                    variant={isConnected ? "default" : "outline"}
                    className="w-full"
                    disabled={!interviewStarted}
                    onClick={toggleConnection}
                  >
                    {isConnected ? (
                      <>
                        <PhoneOff className="h-4 w-4 mr-2" />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Connect
                      </>
                    )}
                  </Button>

                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    className="w-full"
                    disabled={!isConnected}
                    onClick={toggleRecording}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>

                  <Button
                    variant={isMuted ? "secondary" : "outline"}
                    className="w-full"
                    disabled={!isConnected}
                    onClick={toggleMute}
                  >
                    {isMuted ? (
                      <>
                        <VolumeX className="h-4 w-4 mr-2" />
                        Unmute
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        Mute
                      </>
                    )}
                  </Button>

                  {/* Audio Playback Control */}
                  {currentAudio && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={togglePlayPause}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Play
                        </>
                      )}
                    </Button>
                  )}

                  {/* Speech Synthesis Control */}
                  {geminiResponse && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={isPlaying ? stopSpeech : () => speakText(geminiResponse, 'Zephyr')}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Stop Speaking
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Speak Again
                        </>
                      )}
                    </Button>
                  )}

                  {/* Test Voice Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={testVoice}
                  >
                    🎤 Test Voice System
                  </Button>

                  {/* Test Audio Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={testAudio}
                  >
                    🔊 Test Audio System
                  </Button>

                  {/* Test Fallback Speech Button */}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => speakTextFallback('Hello! This is a test of the fallback voice system.')}
                  >
                    🎭 Test Fallback Voice
                  </Button>

                  {/* Voice Selection */}
                  {availableVoices.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Choose Voice:
                      </label>
                      <select
                        value={selectedVoice}
                        className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 bg-white"
                        onChange={(e) => setSelectedVoice(e.target.value)}
                      >
                        {availableVoices.map((voice) => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                      </select>
                      
                      {/* Zephyr Mode Toggle */}
                      <div className="mt-3 flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700">
                          🎭 Zephyr Mode
                        </label>
                        <button
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            zephyrMode ? 'bg-blue-600' : 'bg-gray-300'
                          }`}
                          onClick={() => setZephyrMode(!zephyrMode)}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              zephyrMode ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {zephyrMode ? 'Natural, warm, conversational voice' : 'Standard professional voice'}
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Progress */}
              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Interview Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Questions Completed</span>
                    <span>{currentQuestionIndex + 1} / {session.questions.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / session.questions.length) * 100}%` }}
                     />
                  </div>
                  <div className="text-xs text-gray-500 text-center mt-2">
                    Time: {formatTime(retellSessionTime)} / {formatTime(180)}
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Current Question and Gemini Response */}
            <div className="lg:col-span-2">
              <Card className="p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Current Question</h2>
                  <Badge variant="secondary">
                    Q{currentQuestionIndex + 1} of {session.questions.length}
                  </Badge>
                </div>
                
                <div className="mb-6">
                  <p className="text-lg text-gray-800 mb-4">{currentQuestion.text}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{currentQuestion.type}</Badge>
                    <Badge variant="outline">{currentQuestion.difficulty}</Badge>
                    <Badge variant="outline">{currentQuestion.category}</Badge>
                  </div>
                </div>

                {/* OpenAI + Retell Agent Response */}
                {geminiResponse && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      🎤 {session.interviewer.name} (OpenAI + Retell Agent)
                      {isPlaying && (
                        <span className="text-xs text-blue-600 animate-pulse">
                          🔊 Connected to Retell Agent...
                        </span>
                      )}
                    </h4>
                    <p className="text-blue-800">{geminiResponse}</p>
                    
                    {/* Agent Connection Status */}
                    {currentAudioUrl && currentAudioUrl === 'retell_agent_connected' ? (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 text-blue-800">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">🎤 Retell Lisa Agent Connected!</span>
                        </div>
                        <p className="text-xs text-blue-600 mt-1">
                          <span className="font-semibold">FREE Retell API access active!</span> You're now connected to the Lisa agent.
                          <span className="font-semibold text-blue-700"> 3-minute limit applies.</span>
                        </p>
                        
                        {/* Retell Session Timer */}
                        <div className="mt-3 p-2 bg-blue-100 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-blue-800">Session Time Remaining:</span>
                            <span className={`text-sm font-bold ${
                              retellSessionTime > 60 ? 'text-blue-600' : 
                              retellSessionTime > 30 ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {Math.floor(retellSessionTime / 60)}:{(retellSessionTime % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                          <div className="mt-1 w-full bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${(retellSessionTime / 180) * 100}%` }}
                             />
                          </div>
                        </div>
                        
                        {/* Interview Status */}
                        <div className="mt-4 flex items-center justify-center space-x-2">
                          <div className={`w-4 h-4 rounded-full ${isCalling ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                          <span className="text-lg font-semibold text-gray-900">
                            {isCalling ? 'Interview Active' : 'Interview Paused'}
                          </span>
                        </div>

                        {/* Conversation Display */}
                        <div className="mt-4 bg-gray-50 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                          <div className="space-y-3">
                            {lastAgentResponse && (
                              <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-sm font-medium">AI</span>
                                </div>
                                <div className="bg-white rounded-lg p-3 shadow-sm flex-1">
                                  <p className="text-gray-900 text-sm">{lastAgentResponse}</p>
                                  <p className="text-xs text-gray-500 mt-1">{session?.interviewer?.name || 'AI Interviewer'}</p>
                                </div>
                              </div>
                            )}
                            
                            {lastUserResponse && (
                              <div className="flex items-start space-x-3 justify-end">
                                <div className="bg-blue-600 rounded-lg p-3 shadow-sm flex-1">
                                  <p className="text-white text-sm">{lastUserResponse}</p>
                                  <p className="text-xs text-blue-200 mt-1">You</p>
                                </div>
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-white text-sm font-medium">You</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Voice Controls */}
                        <div className="mt-4 flex items-center justify-center space-x-4">
                          <div className="text-center">
                            <div 
                              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                activeTurn === 'agent' ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                            >
                              <Speaker className="w-6 h-6" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {activeTurn === 'agent' ? `${session?.interviewer?.name || 'AI'} Speaking` : `${session?.interviewer?.name || 'AI'} Speaking (inactive)`}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <div 
                              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                activeTurn === 'user' ? 'bg-green-600' : 'bg-gray-200'
                              }`}
                            >
                              <MicrophoneIcon className="w-6 h-6" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {activeTurn === 'user' ? 'Your Turn' : 'Your Turn (inactive)'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Interview Action Buttons */}
                        <div className="flex gap-4 mt-4">
                          <Button
                            variant="destructive"
                            className="flex-1"
                            onClick={handleFinishPractice}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Finish Practice
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={handlePauseAndResume}
                          >
                            <Pause className="h-4 w-4 mr-2" />
                            Pause & Resume Later
                          </Button>
                        </div>
                        
                        <div className="mt-2 text-xs text-gray-600">
                          <p>Agent ID: {geminiResponse ? 'Connected' : 'Connecting...'}</p>
                          <p>Status: Active</p>
                          <p>Access Level: Free User</p>
                        </div>
                      </div>
                    ) : currentAudioUrl && currentAudioUrl === 'retell_session_expired' ? (
                       <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                         <div className="flex items-center gap-2 text-orange-800">
                           <div className="w-2 h-2 bg-orange-500 rounded-full" />
                           <span className="text-sm font-medium">⏰ Retell Session Expired</span>
                         </div>
                         <p className="text-xs text-orange-600 mt-1">
                           Your 3-minute free Retell session has ended. 
                           <span className="font-semibold"> Upgrade to Pro for unlimited Retell access!</span>
                         </p>
                         <div className="mt-2 flex gap-2">
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => window.open('/premium', '_blank')}
                           >
                             Upgrade to Pro
                           </Button>
                           <Button
                             size="sm"
                             variant="ghost"
                             onClick={() => setCurrentAudioUrl('')}
                           >
                             Continue with Browser Voice
                           </Button>
                         </div>
                       </div>
                     ) : currentAudioUrl && currentAudioUrl.includes('ENHANCED_BROWSER_SPEECH') ? (
                      <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 text-green-800">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">Enhanced Browser Speech Active</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Using high-quality browser voice synthesis. Click "Start Voice Interview" to begin.
                        </p>
                        {enhancedSpeechInstructions && (
                          <div className="mt-2 text-xs text-gray-600">
                            <p>Voice: {enhancedSpeechInstructions.voiceOptions[enhancedSpeechInstructions.voice.toLowerCase()] || 'Default'}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Connecting to Retell agent...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Question Navigation */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    disabled={currentQuestionIndex === 0 || isGeminiLoading}
                    onClick={handlePreviousQuestion}
                  >
                    Previous Question
                  </Button>
                  <Button
                    variant="outline"
                    disabled={currentQuestionIndex === session.questions.length - 1 || isGeminiLoading}
                    onClick={handleNextQuestion}
                  >
                    Next Question
                  </Button>
                </div>
              </Card>

              {/* All Questions Overview */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Questions</h3>
                <div className="space-y-3">
                  {session.questions.map((question, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        index === currentQuestionIndex 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      <div className="flex items-start gap-3">
                        <Badge variant={index === currentQuestionIndex ? "default" : "secondary"}>
                          Q{index + 1}
                        </Badge>
                        <p className="text-sm text-gray-700 flex-1">
                          {question.text.length > 100 
                            ? question.text.substring(0, 100) + '...' 
                            : question.text
                          }
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
      
      {/* Pause Confirmation Modal */}
      {showPauseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Pause className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Session Paused
              </h3>
              <p className="text-gray-600 mb-6">
                Your practice session has been paused. You can continue later from the Home page by clicking "Continue Practice".
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPauseModal(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowPauseModal(false);
                    router.push('/dashboard');
                  }}
                >
                  Go to Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
