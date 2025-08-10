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
  PencilIcon,
  SparklesIcon
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
  const [isCalling, setIsCalling] = useState(false);
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [activeTurn, setActiveTurn] = useState<'user' | 'agent'>('user');
  const [lastAgentResponse, setLastAgentResponse] = useState('');
  const [lastUserResponse, setLastUserResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [isRegeneratingQuestion, setIsRegeneratingQuestion] = useState<string | null>(null);
  
  const webClientRef = useRef<any>(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const handlersBoundRef = useRef(false);
  const lastTurnRef = useRef<'user' | 'agent'>('user');
  const lastCompletionAtRef = useRef<number>(0);
  const lastComputedFromTranscriptRef = useRef<number>(0);

  // Mock session data - in real app, this would be fetched from database
  const mockSession: PracticeSession = {
    id: params.sessionId,
    title: 'Software Engineer Interview',
    type: 'Technical',
    score: 0,
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
    duration: 900, // 15 minutes so far
    status: 'in-progress',
    email: 'john@example.com',
    name: 'John Doe',
    currentQuestionIndex: 1, // Resume from question 2
    responses: [
      {
        questionId: '1',
        response: 'I recently solved a performance issue in our database...',
        timestamp: Date.now() - 900000 // 15 minutes ago
      }
    ]
  };

  const loadPracticeSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch real session data from API
      const response = await fetch(`/api/practice-sessions/${params.sessionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch session: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.session) {
        throw new Error('Session not found');
      }

      // Use questions tied to this specific session only to avoid cross-session reuse
      const sessionWithQuestions = data.session;
      setSession(sessionWithQuestions);
      setCurrentQuestionIndex(sessionWithQuestions.currentQuestionIndex || 0);

      // Initialize Retell Web Client for continuation
      await initializeRetellClient(sessionWithQuestions);

    } catch (error) {
      console.error('Error loading practice session:', error);
      setError('Failed to load practice session');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
      
return;
    }
    // Load the practice session
    loadPracticeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, router]);

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
          agent_id: (practiceSession as any).agent_id, // Use the agent from the session
          resume_from_question: currentQuestionIndex
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to register practice call: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Practice call registered for continuation successfully');

      // Update session with call details
      setSession(prev => prev ? ({
        ...prev,
        call_id: data.registerCallResponse.call_id,
        access_token: data.registerCallResponse.access_token,
        status: 'in-progress' as const
      }) : null);

      // Check if we're in development mode with mock data
      if (data.note && data.note.includes('Mock response')) {
        console.log('Development mode: Using mock voice interview simulation');
        setIsMockMode(true);
        // Ensure no stale client exists
        webClientRef.current = null;
        
return; // Skip real client init
      }

      // Initialize the Retell Web Client only for production
      const { RetellWebClient } = await import('retell-client-js-sdk');
      const webClient = new RetellWebClient();
      webClientRef.current = webClient;
      
      // Set up event handlers
      setupRetellEventHandlers(webClient);

      console.log('Practice session ready for continuation');

    } catch (error) {
      console.error('Error initializing Retell client:', error);
      setError('Failed to initialize voice interview');
    }
  };

  const setupRetellEventHandlers = (webClient: any) => {
    if (handlersBoundRef.current) {
      return;
    }
    handlersBoundRef.current = true;

    webClient.on('call_started', () => {
      console.log('Call started');
      setIsCallStarted(true);
      setActiveTurn('agent');
      lastTurnRef.current = 'agent';
      toast({
        title: "Interview Resumed",
        description: "Your practice interview has been resumed!",
      });
    });

    webClient.on('call_ended', () => {
      console.log('Call ended');
      setIsCallStarted(false);
      setIsCalling(false);
      setActiveTurn('user');
      if (session?.id) {
        fetch(`/api/practice-sessions/${session.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'completed', end_time: new Date().toISOString(), finished_all_questions: true })
        }).catch(() => undefined);
      }
      toast({
        title: "Interview Ended",
        description: "Your practice interview has been completed.",
      });
    });

    webClient.on('agent_start_talking', () => {
      console.log('Agent started talking');
      // If user just finished speaking, count that as completing the current question
      if (lastTurnRef.current === 'user') {
        const now = Date.now();
        if (now - lastCompletionAtRef.current > 2000) {
          lastCompletionAtRef.current = now;
          void markQuestionCompleted();
        }
      }
      setActiveTurn('agent');
      lastTurnRef.current = 'agent';
    });

    webClient.on('agent_stop_talking', () => {
      console.log('Agent stopped talking');
      setActiveTurn('user');
      lastTurnRef.current = 'user';
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
      // Process only latest transcript entry
      const transcript = update?.transcript;
      if (Array.isArray(transcript) && transcript.length > 0) {
        const last = transcript[transcript.length - 1];
        if (last?.speaker === 'agent' && last?.content) {
          setLastAgentResponse(last.content);
        } else if (last?.speaker === 'user' && last?.content) {
          setLastUserResponse(last.content);
        }
        // Compute progress: number of user turns following agent turns
        try {
          let completed = 0;
          for (let i = 1; i < transcript.length; i++) {
            const prev = transcript[i - 1];
            const cur = transcript[i];
            if (prev?.speaker === 'agent' && cur?.speaker === 'user') {
              completed += 1;
            }
          }
          if (completed > (lastComputedFromTranscriptRef.current || 0)) {
            lastComputedFromTranscriptRef.current = completed;
            // Update UI if ahead of current state
            setCurrentQuestionIndex(prev => Math.max(prev || 0, completed));
            // Persist
            if (session?.id) {
              const total = session?.questions?.length || 0;
              fetch(`/api/practice-sessions/${session.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  current_question_index: Math.min(completed, total),
                  finished_all_questions: completed >= total
                })
              }).catch(() => undefined);
            }
          }
        } catch {}
      }
    });
  };

  // Increment question progress and persist
  const markQuestionCompleted = async () => {
    try {
      if (!session) {return;}
      setCurrentQuestionIndex(prev => {
        const total = session?.questions?.length || 0;
        const next = Math.min(total, (prev || 0) + 1);
        fetch(`/api/practice-sessions/${session.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ current_question_index: next, finished_all_questions: next >= total })
        }).catch(() => undefined);
        
return next;
      });
    } catch (e) {
      console.warn('Failed to persist question progress', e);
    }
  };

  const resumeVoiceInterview = async () => {
    try {
      if (!session) {
        throw new Error('Practice session not ready');
      }

      setIsLoading(true);
      setError(null);

      // Check if we're in development mode (no real Retell client)
      if (!webClientRef.current || isMockMode) {
        console.log('Development mode: Starting mock voice interview simulation');
        
        // Simulate the interview resume
        setTimeout(() => {
          setIsCalling(true);
          setIsCallStarted(true);
          setIsVoiceEnabled(true);
          setActiveTurn('agent');
          
          // Simulate AI response for the current question
          setTimeout(() => {
            const currentQuestion = session.questions[currentQuestionIndex];
            setLastAgentResponse(`Let's continue from where we left off. The next question is: ${currentQuestion?.text}`);
            setActiveTurn('user');
          }, 2000);
        }, 1000);

        return;
      }

      // Handlers are already bound in setupRetellEventHandlers during initialization

      // Start the real Retell call with access token
      await webClientRef.current.startCall({
        accessToken: session.access_token
      });

      console.log('Resuming voice interview...');
      setIsCalling(true);
      setIsCallStarted(true);
      setIsVoiceEnabled(true);

    } catch (error) {
      console.error('Error resuming voice interview:', error);
      setError('Failed to resume voice interview');
      toast({
        title: "Error",
        description: "Failed to resume the voice interview.",
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
        description: "Your practice interview has been completed.",
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

  const handleEditQuestion = (questionId: string) => {
    setEditingQuestion(questionId);
  };

  const handleSaveQuestion = async (questionId: string, newText: string) => {
    if (!session) {return;}
    
    try {
      // Update the question in the database
      const response = await fetch(`/api/practice-sessions/${session.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questions: session.questions.map(q => 
            q.id === questionId ? { ...q, text: newText } : q
          )
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update question');
      }

      // Update local state
      setSession(prev => prev ? {
        ...prev,
        questions: prev.questions.map(q => 
          q.id === questionId ? { ...q, text: newText } : q
        )
      } : null);
      setEditingQuestion(null);
      
      toast({
        title: "Question Updated",
        description: "The question has been modified successfully.",
      });
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update the question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerateQuestion = async (questionId: string) => {
    if (!session) {return;}
    
    try {
      setIsRegeneratingQuestion(questionId);
      
      // Get the job description from localStorage
      const jobDescription = localStorage.getItem('jobDescription');
      
      if (!jobDescription) {
        toast({
          title: "Error",
          description: "No job description found. Please upload a job description first.",
          variant: "destructive",
        });
        
return;
      }

      // Call the AI question generation API for a single question
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: jobDescription,
          questionCount: 1,
          interviewType: session.type.toLowerCase(),
          difficulty: session.questions.find(q => q.id === questionId)?.difficulty || 'medium',
          focusAreas: ['programming', 'problem-solving', 'system-design']
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate question');
      }

      const data = await response.json();
      
      if (data.questions && data.questions.length > 0) {
        const newQuestion = data.questions[0];
        
        // Update the question in the database
        const updatedQuestions = session.questions.map(q => 
          q.id === questionId ? { 
            ...q, 
            text: newQuestion.text,
            category: newQuestion.category || q.category
          } : q
        );

        const updateResponse = await fetch(`/api/practice-sessions/${session.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questions: updatedQuestions
          }),
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to save regenerated question');
        }

        // Update local state
        setSession(prev => prev ? {
          ...prev,
          questions: updatedQuestions
        } : null);
        
        toast({
          title: "Question Regenerated",
          description: "The question has been regenerated and saved.",
        });
      }
      
    } catch (error) {
      console.error('Error regenerating question:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate the question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegeneratingQuestion(null);
    }
  };



  if (isLoading && !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
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
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            onClick={() => router.push('/practice/history')}
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
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
            aria-label="Go back"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Continue Practice</h1>
            <p className="text-sm text-gray-500">
              {session?.title || 'Practice Interview'}
            </p>
          </div>
          <div className="w-9" /> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-6 pt-24 sm:pt-20">
        {/* Session Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Session Progress</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <ClockIcon className="w-4 h-4" />
              <span>{session?.duration ? formatTime(session.duration) : '0:00'}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Questions Completed</span>
              <span className="text-sm font-medium text-gray-900">
                {currentQuestionIndex} of {session?.questions?.length || 0}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentQuestionIndex / (session?.questions?.length || 1)) * 100}%` }}
               />
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Started {new Date(session?.date || '').toLocaleDateString()}</span>
              <span>{Math.round((currentQuestionIndex / (session?.questions?.length || 1)) * 100)}% Complete</span>
            </div>
          </div>
        </div>

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
                    Resume Practice Interview
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Continue your practice interview from where you left off. 
                    You&apos;ve completed {currentQuestionIndex} of {session?.questions?.length || 0} questions.
                  </p>
                </div>
                
            <div className="bg-blue-50 rounded-lg p-4 text-left">
                  <h3 className="font-medium text-blue-900 mb-2">Next Question:</h3>
                  <p className="text-sm text-blue-800">
                    {session?.questions && session.questions.length > 0 
                      ? (session.questions[currentQuestionIndex]?.text || 'No more questions available.')
                      : 'No questions found for this session.'}
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={resumeVoiceInterview}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      <span>Resuming...</span>
                    </div>
                  ) : (
                    'Resume Interview'
                  )}
                </motion.button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${isCalling ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
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
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:bg-red-700"
                  onClick={endVoiceInterview}
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
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    index < currentQuestionIndex ? 'bg-green-100' :
                    index === currentQuestionIndex ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                     <span className={`text-xs font-medium ${
                      index < currentQuestionIndex ? 'text-green-600' :
                      index === currentQuestionIndex ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {index < currentQuestionIndex ? '✓' : index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    {editingQuestion === question.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={question.text}
                          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                          onChange={(e) => {
                            setSession(prev => prev ? {
                              ...prev,
                              questions: prev.questions.map(q => 
                                q.id === question.id ? { ...q, text: e.target.value } : q
                              )
                            } : null);
                          }}
                        />
                        <div className="flex space-x-2">
                          <button
                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
                            onClick={() => handleSaveQuestion(question.id, question.text)}
                          >
                            Save
                          </button>
                          <button
                            className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium"
                            onClick={() => setEditingQuestion(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={`text-sm leading-relaxed ${
                          index < currentQuestionIndex ? 'text-gray-500 line-through' :
                          index === currentQuestionIndex ? 'text-gray-900 font-medium' : 'text-gray-600'
                        }`}>
                          {question.text}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {question.type.replace('-', ' ')}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              {question.difficulty}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Edit Question"
                              onClick={() => handleEditQuestion(question.id)}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              disabled={isRegeneratingQuestion === question.id}
                              className={`p-1 ${
                                isRegeneratingQuestion === question.id 
                                  ? 'text-gray-300 cursor-not-allowed' 
                                  : 'text-gray-400 hover:text-blue-600'
                              }`}
                              title="Regenerate with AI"
                              onClick={() => handleRegenerateQuestion(question.id)}
                            >
                              {isRegeneratingQuestion === question.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                              ) : (
                                <SparklesIcon className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </>
                    )}
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
