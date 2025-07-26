"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeftIcon,
  MicrophoneIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
  SpeakerWaveIcon,
  CheckIcon,
  XMarkIcon,
  PhoneIcon,
  ShareIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { toast } from "@/components/ui/use-toast";
import SharePracticePopup from "@/components/practice/sharePracticePopup";
import VoiceAgentSelector from "@/components/practice/VoiceAgentSelector";

export const dynamic = 'force-dynamic';

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  category: string;
}

interface VoiceAgent {
  agent_id: string;
  name: string;
  description: string;
  voice_id: string;
  category: string;
  difficulty: string;
  specialties: string[];
}

interface PracticeSession {
  id: string;
  questions: Question[];
  agent_id: string;
  agent_name: string;
  selectedAgent?: VoiceAgent;
  call_id?: string;
  access_token?: string;
  status: 'preparing' | 'active' | 'completed' | 'error';
}

export default function PracticeInterviewPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [activeTurn, setActiveTurn] = useState<'user' | 'agent'>('user');
  const [lastAgentResponse, setLastAgentResponse] = useState('');
  const [lastUserResponse, setLastUserResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // User is already authenticated, no need to collect email/name
  const [isOldUser, setIsOldUser] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<VoiceAgent | null>(null);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const [isReuseSession, setIsReuseSession] = useState(false);
  const [jobDescription, setJobDescription] = useState<string>('');
  
  const webClientRef = useRef<any>(null);

  // Load generated questions from localStorage on component mount
  useEffect(() => {
    try {
      const storedQuestions = localStorage.getItem('generatedQuestions');
      if (storedQuestions) {
        const parsedQuestions = JSON.parse(storedQuestions);
        setMockQuestions(parsedQuestions);
      }
    } catch (error) {
      console.error('Error loading questions from localStorage:', error);
    }
  }, []);

  // Load questions from localStorage or use defaults
  const [mockQuestions, setMockQuestions] = useState<Question[]>([
    {
      id: '1',
      text: 'Tell me about a challenging technical problem you solved recently. What was your approach and what did you learn?',
      type: 'behavioral',
      difficulty: 'medium',
      category: 'Problem Solving'
    },
    {
      id: '2',
      text: 'How would you design a scalable web application that can handle millions of users?',
      type: 'system-design',
      difficulty: 'hard',
      category: 'System Design'
    },
    {
      id: '3',
      text: 'Describe a time when you had to work with a difficult team member. How did you handle the situation?',
      type: 'behavioral',
      difficulty: 'easy',
      category: 'Teamwork'
    }
  ]);



  const handleAgentSelect = (agent: VoiceAgent) => {
    setSelectedAgent(agent);
    setShowAgentSelector(false);
    toast({
      title: "Interviewer Selected",
      description: `You've selected ${agent.name} for your practice interview.`,
    });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    // Check if this is a reuse session
    const urlParams = new URLSearchParams(window.location.search);
    const isReuse = urlParams.get('reuse') === 'true';

    if (isReuse) {
      // Load existing questions and job description for reuse
      loadReuseData();
    }

    // Check for selected agent from interviewers page
    const storedAgent = localStorage.getItem('selectedPracticeAgent');
    if (storedAgent) {
      try {
        const agent = JSON.parse(storedAgent);
        setSelectedAgent(agent);
        // Clear the stored agent after using it
        localStorage.removeItem('selectedPracticeAgent');
      } catch (error) {
        console.error('Error parsing stored agent:', error);
      }
    }
  }, [isAuthenticated, router]);

  const loadReuseData = () => {
    try {
      // Load existing questions
      const storedQuestions = localStorage.getItem('generatedQuestions');
      if (storedQuestions) {
        const parsedQuestions = JSON.parse(storedQuestions);
        setMockQuestions(parsedQuestions);
      }

      // Load job description for display
      const storedJobDescription = localStorage.getItem('reuseJobDescription') || localStorage.getItem('jobDescription');
      if (storedJobDescription) {
        setJobDescription(storedJobDescription);
      }

      // Mark as reuse session
      setIsReuseSession(true);
    } catch (error) {
      console.error('Error loading reuse data:', error);
    }
  };

  // Separate useEffect for initializing practice session after agent is selected
  useEffect(() => {
    if (isAuthenticated && selectedAgent) {
      initializePracticeSession();
    }
  }, [isAuthenticated, selectedAgent]);

  const initializePracticeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Create a practice session with mock data
      const practiceSession: PracticeSession = {
        id: `session-${Date.now()}`,
        questions: mockQuestions,
        agent_id: selectedAgent?.agent_id || 'mock-agent-id',
        agent_name: selectedAgent?.name || 'Practice Interviewer',
        selectedAgent: selectedAgent,
        status: 'preparing'
      };

      // Save practice session to database
      try {
        const sessionResponse = await fetch('/api/practice-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_name: `Practice with ${selectedAgent?.name || 'Interviewer'}`,
            agent_id: selectedAgent?.agent_id,
            agent_name: selectedAgent?.name,
            questions: mockQuestions,
            user_name: process.env.NODE_ENV === 'development' ? 'Peter Lee' : (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'),
            call_id: retellResponse.call_id
          }),
        });

        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          console.log('Practice session saved to database:', sessionData);
          
          // Update session with database ID
          practiceSession.id = sessionData.session.id;
        } else {
          console.warn('Failed to save practice session to database, using local session');
        }
      } catch (dbError) {
        console.warn('Database error, using local session:', dbError);
      }

      setSession(practiceSession);

      // Initialize Retell Web Client
      await initializeRetellClient(practiceSession);

    } catch (error) {
      console.error('Error initializing practice session:', error);
      setError('Failed to initialize practice session');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeRetellClient = async (practiceSession: PracticeSession) => {
    try {
      // Call API to register a call with Retell
      const response = await fetch('/api/register-practice-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: practiceSession.questions,
          candidate_name: process.env.NODE_ENV === 'development' ? 'Peter Lee' : (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Candidate'),
          interview_type: 'practice',
          focus_areas: selectedAgent?.specialties?.join(', ') || 'general interview skills',
          duration: '15-20 minutes',
          agent_id: selectedAgent?.agent_id || process.env.PRACTICE_AGENT_ID
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to register practice call: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Practice call registered:', data);

      // Update session with call details
      setSession(prev => prev ? {
        ...prev,
        call_id: data.registerCallResponse.call_id,
        access_token: data.registerCallResponse.access_token,
        status: 'active'
      } : null);

      // Check if we're in development mode with mock data
      if (data.note && data.note.includes('Mock response')) {
        console.log('Development mode: Using mock voice interview simulation');
        // Don't initialize real Retell client in development
        return;
      }

      // Initialize the Retell Web Client only for production
      const { RetellWebClient } = await import('retell-client-js-sdk');
      const webClient = new RetellWebClient();
      webClientRef.current = webClient;
      
      // Set up event handlers
      setupRetellEventHandlers(webClient);

      console.log('Practice session ready for voice interview');

    } catch (error) {
      console.error('Error initializing Retell client:', error);
      setError('Failed to initialize voice interview');
    }
  };

  const setupRetellEventHandlers = (webClient: any) => {
    webClient.on("call_started", () => {
      console.log("Practice interview started");
      setIsCalling(true);
      setIsCallStarted(true);
      toast({
        title: "Interview Started",
        description: "Your practice interview is now active. The AI interviewer will begin speaking shortly.",
      });
    });

    webClient.on("call_ended", () => {
      console.log("Practice interview ended");
      setIsCalling(false);
      setIsVoiceEnabled(false);
      setIsCallStarted(false);
      toast({
        title: "Interview Ended",
        description: "Your practice interview has concluded. You can review your performance in the analytics section.",
      });
    });

    webClient.on("agent_start_talking", () => {
      setActiveTurn("agent");
      console.log("Agent started talking");
    });

    webClient.on("agent_stop_talking", () => {
      setActiveTurn("user");
      console.log("Agent stopped talking");
    });

    webClient.on("error", (error: any) => {
      console.error("Retell Web Client error:", error);
      setIsCalling(false);
      setIsVoiceEnabled(false);
      setIsCallStarted(false);
      setError("Voice interview error: " + (error.message || "Unknown error"));
      toast({
        title: "Interview Error",
        description: "There was an error with the voice interview. Please try again.",
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

  const startVoiceInterview = async () => {
    try {
      if (!session) {
        throw new Error('Practice session not ready');
      }

      setIsLoading(true);
      setError(null);

      // Check if user has already taken this practice session
      // In a real implementation, you would check against a database
      const existingEmails = localStorage.getItem(`practice-session-${session.id}-emails`);
      const emails = existingEmails ? JSON.parse(existingEmails) : [];
      const userEmail = user?.email || '';
      
      if (emails.includes(userEmail)) {
        setIsOldUser(true);
        toast({
          title: "Already Completed",
          description: "You have already completed this practice session.",
          variant: "destructive",
        });
        return;
      }

      // Check if we're in development mode (no real Retell client)
      if (!webClientRef.current) {
        console.log('Development mode: Starting mock voice interview simulation');
        
        // Store email for duplicate prevention
        emails.push(userEmail);
        localStorage.setItem(`practice-session-${session.id}-emails`, JSON.stringify(emails));
        
        // Simulate the interview start
        setTimeout(() => {
          setIsCalling(true);
          setIsCallStarted(true);
          setIsVoiceEnabled(true);
          setActiveTurn('agent');
          
          // Simulate AI response
          setTimeout(() => {
            setLastAgentResponse("Hello! I'm your AI interviewer. Let's begin the practice interview. The first question is: " + session.questions[0]?.text);
            setActiveTurn('user');
          }, 2000);
        }, 1000);

        return;
      }

      // Start the real Retell call with access token
      await webClientRef.current.startCall({
        accessToken: session.access_token
      });

      // Store email for duplicate prevention
      emails.push(userEmail);
      localStorage.setItem(`practice-session-${session.id}-emails`, JSON.stringify(emails));

      console.log('Starting voice interview...');
      setIsCalling(true);
      setIsCallStarted(true);
      setIsVoiceEnabled(true);

      toast({
        title: "Interview Starting",
        description: "Connecting to your AI interviewer...",
      });

    } catch (error) {
      console.error('Error starting voice interview:', error);
      setError('Failed to start voice interview');
      toast({
        title: "Connection Error",
        description: "Failed to connect to the AI interviewer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endVoiceInterview = async () => {
    try {
      if (webClientRef.current && isCalling) {
        // End the Retell call
        await webClientRef.current.stopCall();
      }
      
      console.log('Ending voice interview...');
      setIsCalling(false);
      setIsCallStarted(false);
      setIsVoiceEnabled(false);

      // Update practice session status to completed
      if (session?.id) {
        try {
          await fetch('/api/practice-sessions', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId: session.id,
              status: 'completed',
              end_time: new Date().toISOString()
            }),
          });
        } catch (error) {
          console.error('Error updating session status:', error);
        }
      }
      
      // Store call ID for results page
      if (session?.call_id) {
        localStorage.setItem('lastCallId', session.call_id);
      }

      toast({
        title: "Interview Ended",
        description: "Your practice interview has been completed.",
      });

      // Navigate to results page
      setTimeout(() => {
        router.push('/practice/complete');
      }, 2000);
    } catch (error) {
      console.error('Error ending voice interview:', error);
      setError('Failed to end voice interview');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openSharePopup = () => {
    setIsSharePopupOpen(true);
  };

  const closeSharePopup = () => {
    setIsSharePopupOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading && !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing your practice interview...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XMarkIcon className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Setup Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isOldUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Already Completed</h2>
          <p className="text-gray-600 mb-6">
            You have already completed this practice interview session. 
            Each email can only take the practice interview once.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Practice Interview</h1>
            <p className="text-sm text-gray-500">
              {session?.agent_name || 'AI Interviewer'}
            </p>
          </div>
          <button
            onClick={openSharePopup}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ShareIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Reuse Session Indicator */}
        {isReuseSession && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowPathIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">Reusing Previous Questions</h3>
                <p className="text-sm text-blue-700">
                  You're practicing with the same interview questions from your previous session.
                </p>
                {jobDescription && (
                  <p className="text-xs text-blue-600 mt-1">
                    Based on: {jobDescription.substring(0, 100)}...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Interview Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-center space-y-4">
            {!isCallStarted ? (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <PhoneIcon className="w-10 h-10 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                         Ready to Practice, {process.env.NODE_ENV === 'development' ? 'Peter' : (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there')}?
                  </h2>
                  <p className="text-gray-600 mb-4">
                    You'll be interviewed by an AI agent using the questions generated from your document.
                    This is a voice-based interview - just like a real phone interview!
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 text-left">
                  <h3 className="font-medium text-blue-900 mb-2">What to expect:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Voice-based conversation with AI interviewer</li>
                    <li>• Questions based on your uploaded document</li>
                    <li>• Real-time feedback and follow-up questions</li>
                    <li>• Professional interview experience</li>
                  </ul>
                </div>

                {/* Agent Selection */}
                <div className="space-y-3">
                  {selectedAgent ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-lg font-semibold text-blue-600">
                              {selectedAgent.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-green-900">Selected Interviewer</h3>
                            <p className="text-sm text-green-800">{selectedAgent.name}</p>
                            <p className="text-xs text-green-700">{selectedAgent.description}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                {selectedAgent.category}
                              </span>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                {selectedAgent.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowAgentSelector(true)}
                          className="text-sm text-green-700 hover:text-green-800 underline"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAgentSelector(true)}
                      className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
                    >
                      Choose Your Interviewer
                    </motion.button>
                  )}
                </div>



                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={startVoiceInterview}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    'Start Voice Interview'
                  )}
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${isCalling ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-lg font-semibold text-gray-900">
                    {isCalling ? 'Interview Active' : 'Interview Paused'}
                  </span>
                  {!webClientRef.current && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Mock Mode
                    </span>
                  )}
                </div>

                {/* Conversation Display */}
                <div className="bg-gray-50 rounded-lg p-4 min-h-[200px] max-h-[300px] overflow-y-auto">
                  <div className="space-y-3">
                    {lastAgentResponse && (
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">AI</span>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm flex-1">
                          <p className="text-gray-900 text-sm">{lastAgentResponse}</p>
                          <p className="text-xs text-gray-500 mt-1">AI Interviewer</p>
                        </div>
                      </div>
                    )}
                    
                    {lastUserResponse && (
                      <div className="flex items-start space-x-3 justify-end">
                        <div className="bg-blue-600 rounded-lg p-3 shadow-sm flex-1">
                          <p className="text-white text-sm">{lastUserResponse}</p>
                          <p className="text-xs text-blue-200 mt-1">
                            {process.env.NODE_ENV === 'development' ? 'Peter Lee' : (user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You')}
                          </p>
                        </div>
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">
                            {process.env.NODE_ENV === 'development' ? 'P' : (user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Voice Controls */}
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      activeTurn === 'agent' ? 'bg-blue-600' : 'bg-gray-200'
                    }`}>
                      <SpeakerWaveIcon className={`w-6 h-6 ${
                        activeTurn === 'agent' ? 'text-white' : 'text-gray-500'
                      }`} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">AI Speaking</p>
                  </div>
                  
                  <div className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      activeTurn === 'user' ? 'bg-green-600' : 'bg-gray-200'
                    }`}>
                      <MicrophoneIcon className={`w-6 h-6 ${
                        activeTurn === 'user' ? 'text-white' : 'text-gray-500'
                      }`} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Your Turn</p>
                  </div>
                </div>

                {/* End Interview Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={endVoiceInterview}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:bg-red-700"
                >
                  End Interview
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Questions Preview */}
        {session && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Interview Questions</h3>
            <div className="space-y-3">
              {session.questions.map((question, index) => (
                <div key={question.id} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-medium">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm leading-relaxed">{question.text}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {question.type.replace('-', ' ')}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        {question.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Share Practice Interview Popup */}
      {/* Agent Selector Modal */}
      {showAgentSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Choose Your Interviewer</h2>
                <button
                  onClick={() => setShowAgentSelector(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <VoiceAgentSelector
                onAgentSelect={handleAgentSelect}
                selectedAgentId={selectedAgent?.agent_id}
              />
            </div>
          </div>
        </div>
      )}

      {isSharePopupOpen && session && (
        <SharePracticePopup
          open={isSharePopupOpen}
          practiceSessionId={session.id}
          questions={session.questions}
          onClose={closeSharePopup}
        />
      )}
    </div>
  );
} 
