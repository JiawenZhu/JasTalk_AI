"use client";

import "../../../globals.css";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeftIcon, 
  PhoneIcon, 
  XMarkIcon, 
  CheckIcon,
  SpeakerWaveIcon,
  MicrophoneIcon
} from "@heroicons/react/24/outline";
import { Share2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import SharePracticePopup from "@/components/practice/sharePracticePopup";
import Navbar from "@/components/navbar";

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
  questions: Question[];
  agent_id: string;
  agent_name: string;
  call_id?: string;
  access_token?: string;
  status: 'preparing' | 'active' | 'completed' | 'error';
}

export default function SharedPracticeInterviewPage({ 
  params 
}: { 
  params: { sessionId: string } 
}) {
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
  
  // Email and name collection for shared practice interviews
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(false);
  const [isOldUser, setIsOldUser] = useState(false);
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  
  const webClientRef = useRef<any>(null);

  // Mock questions - in a real app, these would be fetched from the session ID
  const mockQuestions: Question[] = [
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
  ];

  // Email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidEmail(emailRegex.test(email));
  }, [email]);

  useEffect(() => {
    // Initialize shared practice session
    initializeSharedPracticeSession();
  }, []);

  const initializeSharedPracticeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // In a real app, you would fetch the session data from the database using sessionId
      // For now, we'll create a mock session
      const practiceSession: PracticeSession = {
        id: params.sessionId,
        questions: mockQuestions,
        agent_id: 'mock-agent-id',
        agent_name: 'Practice Interviewer',
        status: 'preparing'
      };

      setSession(practiceSession);

      // Initialize Retell Web Client
      await initializeRetellClient(practiceSession);

    } catch (error) {
      console.error('Error initializing shared practice session:', error);
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
          candidate_name: name || 'Candidate',
          interview_type: 'practice',
          focus_areas: 'general interview skills',
          duration: '15-20 minutes'
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to register practice call: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Practice call registered successfully');

      // Update session with call details
      setSession(prev => prev ? {
        ...prev,
        call_id: data.registerCallResponse.call_id,
        access_token: data.registerCallResponse.access_token,
        status: 'active'
      } : null);

      // Initialize the Retell Web Client
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
    webClient.on('call_started', () => {
      console.log('Call started');
      setIsCallStarted(true);
      setActiveTurn('agent');
      toast({
        title: "Interview Started",
        description: "Your practice interview has begun!",
      });
    });

    webClient.on('call_ended', () => {
      console.log('Call ended');
      setIsCallStarted(false);
      setIsCalling(false);
      setActiveTurn('user');
      toast({
        title: "Interview Ended",
        description: "Your practice interview has ended.",
      });
    });

    webClient.on('agent_start_talking', () => {
      console.log('Agent started talking');
      setActiveTurn('agent');
    });

    webClient.on('agent_stop_talking', () => {
      console.log('Agent stopped talking');
      setActiveTurn('user');
    });

    webClient.on('error', (error: any) => {
      console.error('Retell error:', error);
      setError('Voice interview error occurred');
      toast({
        title: "Error",
        description: "An error occurred during the interview.",
        variant: "destructive",
      });
    });

    webClient.on('update', (update: any) => {
      console.log('Retell update:', update);
      if (update.transcript) {
        setLastAgentResponse(update.transcript);
      }
    });
  };

  const startVoiceInterview = async () => {
    try {
      if (!session || !webClientRef.current) {
        throw new Error('Practice session not ready');
      }

      // Validate email and name
      if (!isValidEmail || !name.trim()) {
        toast({
          title: "Missing Information",
          description: "Please provide a valid email address and your name.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      setError(null);

      // Check if user has already taken this practice session
      const existingEmails = localStorage.getItem(`practice-session-${session.id}-emails`);
      const emails = existingEmails ? JSON.parse(existingEmails) : [];
      
      if (emails.includes(email)) {
        setIsOldUser(true);
        toast({
          title: "Already Completed",
          description: "You have already completed this practice session.",
          variant: "destructive",
        });
        return;
      }

      // Start the Retell call with access token
      await webClientRef.current.startCall({
        accessToken: session.access_token
      });

      // Store email for duplicate prevention
      emails.push(email);
      localStorage.setItem(`practice-session-${session.id}-emails`, JSON.stringify(emails));

      console.log('Starting voice interview...');
      setIsCalling(true);
      setIsCallStarted(true);
      setIsVoiceEnabled(true);

    } catch (error) {
      console.error('Error starting voice interview:', error);
      setError('Failed to start voice interview');
      toast({
        title: "Error",
        description: "Failed to start the voice interview.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endVoiceInterview = async () => {
    try {
      if (webClientRef.current) {
        await webClientRef.current.stopCall();
      }
      setIsCalling(false);
      setIsCallStarted(false);
      setIsVoiceEnabled(false);
      
      toast({
        title: "Interview Ended",
        description: "Your practice interview has been completed.",
      });
    } catch (error) {
      console.error('Error ending voice interview:', error);
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

  if (isLoading && !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading practice interview...</p>
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
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
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
      {/* Navigation Bar */}
      <Navbar />
      
      {/* Page Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Shared Practice Interview</h1>
            <p className="text-sm text-gray-500">
              {session?.agent_name || 'AI Interviewer'}
            </p>
          </div>
          <button
            onClick={openSharePopup}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6 pt-24 sm:pt-20">
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
                    Shared Practice Interview
                  </h2>
                  <p className="text-gray-600 mb-4">
                    You've been invited to take a practice interview! 
                    This is a voice-based interview with an AI agent.
                  </p>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4 text-left">
                  <h3 className="font-medium text-blue-900 mb-2">What to expect:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Voice-based conversation with AI interviewer</li>
                    <li>• Professional interview questions</li>
                    <li>• Real-time feedback and follow-up questions</li>
                    <li>• One attempt per email address</li>
                  </ul>
                </div>

                {/* Email and Name Collection */}
                <div className="space-y-3">
                  <div>
                    <input
                      value={email}
                      className="w-full py-3 px-4 border-2 rounded-lg border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                      placeholder="Enter your email address"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      value={name}
                      className="w-full py-3 px-4 border-2 rounded-lg border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                      placeholder="Enter your first name"
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={startVoiceInterview}
                  disabled={isLoading || !isValidEmail || !name.trim()}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Connecting...</span>
                    </div>
                  ) : (
                    'Start Practice Interview'
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
                        </div>
                      </div>
                    )}
                    
                    {lastUserResponse && (
                      <div className="flex items-start space-x-3 justify-end">
                        <div className="bg-blue-600 rounded-lg p-3 shadow-sm flex-1">
                          <p className="text-white text-sm">{lastUserResponse}</p>
                        </div>
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">You</span>
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
