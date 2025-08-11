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
  MicrophoneIcon,
  ClockIcon,
  StarIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/auth.context";
import { toast } from "@/components/ui/use-toast";
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
  title: string;
  type: string;
  score: number;
  date: string;
  questionCount: number;
  questions: Question[];
  duration?: number;
  status: 'completed' | 'in-progress' | 'abandoned';
  email?: string;
  name?: string;
  call_id?: string;
  access_token?: string;
  previousScore?: number;
  previousDuration?: number;
}

export default function RetakePracticePage({ 
  params 
}: { 
  params: { sessionId: string } 
}) {
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
  
  const webClientRef = useRef<any>(null);

  // Mock session data - in real app, this would be fetched from database
  const mockSession: PracticeSession = {
    id: params.sessionId,
    title: 'Software Engineer Interview',
    type: 'Technical',
    score: 85,
    date: '2024-01-15T10:30:00Z',
    questionCount: 5,
    questions: [
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
    ],
    duration: 1800, // 30 minutes
    status: 'completed',
    email: 'john@example.com',
    name: 'John Doe',
    previousScore: 85,
    previousDuration: 1800
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    // Load the practice session
    loadPracticeSession();
  }, [isAuthenticated, router]);

  const loadPracticeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // In a real app, this would fetch from API
      // const response = await fetch(`/api/practice-sessions/${params.sessionId}`);
      // const data = await response.json();
      
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSession(mockSession);

      // Initialize Retell Web Client for retake
      await initializeRetellClient(mockSession);

    } catch (error) {
      console.error('Error loading practice session:', error);
      setError('Failed to load practice session');
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
          focus_areas: 'general interview skills',
          duration: '15-20 minutes',
          is_retake: true
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to register practice call: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Practice call registered for retake successfully');

      // Update session with call details (keep status union type)
      setSession(prev => prev ? {
        ...prev,
        call_id: data.registerCallResponse.call_id,
        access_token: data.registerCallResponse.access_token,
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

      console.log('Practice session ready for retake');

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
        description: "Your practice interview retake has begun!",
      });
    });

    webClient.on('call_ended', () => {
      console.log('Call ended');
      setIsCallStarted(false);
      setIsCalling(false);
      setActiveTurn('user');
      toast({
        title: "Interview Completed",
        description: "Your practice interview retake has been completed.",
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

  const startRetakeInterview = async () => {
    try {
      if (!session) {
        throw new Error('Practice session not ready');
      }

      setIsLoading(true);
      setError(null);

      // Check if we're in development mode (no real Retell client)
      if (!webClientRef.current) {
        console.log('Development mode: Starting mock voice interview simulation');
        
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

      console.log('Starting retake interview...');
      setIsCalling(true);
      setIsCallStarted(true);
      setIsVoiceEnabled(true);

    } catch (error) {
      console.error('Error starting retake interview:', error);
      setError('Failed to start retake interview');
      toast({
        title: "Error",
        description: "Failed to start the retake interview.",
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
        title: "Interview Completed",
        description: "Your practice interview retake has been completed.",
      });
      
      // Redirect to history page
      setTimeout(() => {
        router.push('/practice/history');
      }, 2000);
    } catch (error) {
      console.error('Error ending voice interview:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  if (isLoading && !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading practice session...</p>
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
            onClick={() => router.push('/practice/history')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Back to History
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
            onClick={() => router.push('/practice/history')}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Retake Practice</h1>
            <p className="text-sm text-gray-500">
              {session?.title || 'Practice Interview'}
            </p>
          </div>
          <div className="w-9"></div> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-6 pt-24 sm:pt-20">
        {/* Previous Performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <StarIcon className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">Previous Performance</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className={`text-2xl font-bold ${getScoreColor(session?.previousScore || 0)}`}>
                {session?.previousScore || 0}%
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mx-auto mt-2 ${
                (session?.previousScore || 0) >= 80 ? 'bg-green-100 text-green-600' :
                (session?.previousScore || 0) >= 60 ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}>
                {getScoreGrade(session?.previousScore || 0)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Score</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {session?.previousDuration ? formatTime(session.previousDuration) : '0:00'}
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mt-2">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 mt-1">Duration</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Goal:</strong> Try to improve your score and complete the interview faster this time!
            </p>
          </div>
        </div>

        {/* Interview Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="text-center space-y-4">
            {!isCallStarted ? (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                  <PhoneIcon className="w-10 h-10 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Retake Practice Interview
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Practice the same questions again to improve your performance. 
                    Your previous score was {session?.previousScore}% - can you do better?
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 text-left">
                  <h3 className="font-medium text-purple-900 mb-2">Interview Details:</h3>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• {session?.questionCount} questions</li>
                    <li>• Voice-based AI interviewer</li>
                    <li>• Real-time feedback</li>
                    <li>• Compare with previous attempt</li>
                  </ul>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={startRetakeInterview}
                  disabled={isLoading}
                  className="w-full bg-purple-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Starting...</span>
                    </div>
                  ) : (
                    'Start Retake Interview'
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
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-sm font-medium">AI</span>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm flex-1">
                          <p className="text-gray-900 text-sm">{lastAgentResponse}</p>
                        </div>
                      </div>
                    )}
                    
                    {lastUserResponse && (
                      <div className="flex items-start space-x-3 justify-end">
                        <div className="bg-purple-600 rounded-lg p-3 shadow-sm flex-1">
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
                      activeTurn === 'agent' ? 'bg-purple-600' : 'bg-gray-200'
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
                  Complete Interview
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Questions Overview */}
        {session && (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Interview Questions</h3>
            <div className="space-y-3">
              {session.questions.map((question, index) => (
                <div key={question.id} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 text-xs font-medium">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed text-gray-900">{question.text}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
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
    </div>
  );
} 
