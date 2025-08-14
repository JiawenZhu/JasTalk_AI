"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mic, CheckCircle, User, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  category: string;
}

interface Interviewer {
  id: string;
  name: string;
  description: string;
  image: string;
  type: string;
  difficulty: string;
}

export default function PracticeSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer | null>(null);
  const [userName, setUserName] = useState('User');
  
  // Credit tracking state
  const [subscription, setSubscription] = useState<any>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Mock interviewer data (in a real app, this would come from an API)
  const availableInterviewers: Interviewer[] = [
    {
      id: 'lisa',
      name: 'Lisa',
      description: 'AI interviewer for practice sessions',
      image: '/interviewers/Lisa.png',
      type: 'general',
      difficulty: 'medium'
    },
    {
      id: 'bob',
      name: 'Bob',
      description: 'AI interviewer for practice sessions',
      image: '/interviewers/Bob.png',
      type: 'general',
      difficulty: 'medium'
    }
  ];

  useEffect(() => {
    // Get questions from URL params or localStorage
    const questionsParam = searchParams.get('questions');
    if (questionsParam) {
      try {
        const parsedQuestions = JSON.parse(decodeURIComponent(questionsParam));
        setQuestions(parsedQuestions);
      } catch (error) {
        console.error('Error parsing questions:', error);
      }
    } else {
      // Fallback to localStorage if no URL params
      const storedQuestions = localStorage.getItem('generatedQuestions');
      if (storedQuestions) {
        try {
          const parsedQuestions = JSON.parse(storedQuestions);
          setQuestions(parsedQuestions);
        } catch (error) {
          console.error('Error parsing stored questions:', error);
        }
      }
    }

    // Set default interviewer
    setSelectedInterviewer(availableInterviewers[0]);

    // Get user name from auth context or localStorage
    const storedUserName = localStorage.getItem('userName') || 'User';
    setUserName(storedUserName);
  }, [searchParams]);

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
        console.error('Error fetching subscription in setup page:', error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  const handleStartInterview = async () => {
    if (!selectedInterviewer || questions.length === 0) {
      alert('Please select an interviewer and ensure questions are available');
      return;
    }

    try {
      // Start the timer immediately when button is clicked
      const interviewStartTime = new Date().toISOString();
      const timerStartTime = Date.now(); // Current timestamp for timer calculations
      
      // Create a practice session with timer information
      const sessionData = {
        interviewer: selectedInterviewer,
        questions: questions,
        startTime: interviewStartTime,
        timerStartTime: timerStartTime, // Store when timer started
        interviewStarted: true, // Mark as started
        isConnected: true, // Mark as connected
        elapsedTime: 0, // Start at 0 seconds (counting UP)
        maxInterviewTime: 180, // 3 minutes max
        totalInterviewTime: 0, // Start at 0
        lastCreditDeduction: 0 // Start at 0
      };

      console.log('🔍 Setup page - Creating session data with timer:', sessionData);

      // Store session data with timer information
      localStorage.setItem('currentPracticeSession', JSON.stringify(sessionData));
      
      // Also store timer state separately for immediate access
      localStorage.setItem('interviewTimerState', JSON.stringify({
        startTime: timerStartTime,
        isRunning: true,
        elapsedTime: 0
      }));
      
      console.log('🔍 Setup page - Session and timer stored in localStorage');

      // Redirect to the practice interview page
      router.push('/practice/interview');
    } catch (error) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview. Please try again.');
    }
  };

  const handleChangeInterviewer = () => {
    // For now, just cycle through available interviewers
    const currentIndex = availableInterviewers.findIndex(i => i.id === selectedInterviewer?.id);
    const nextIndex = (currentIndex + 1) % availableInterviewers.length;
    setSelectedInterviewer(availableInterviewers[nextIndex]);
  };

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Questions Available</h2>
          <p className="text-gray-600 mb-4">Please generate questions first before setting up practice.</p>
          <Button onClick={() => router.push('/sign-up?offer=free-credit')}>
            Start Free Practice
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-semibold">JB</span>
            </div>
            <span className="text-sm text-gray-600">JasTalk AI Beta</span>
          </div>
          <div className="ml-auto">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-semibold">PL</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Main Content */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mic className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Ready to Practice, {userName}?
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            You'll be interviewed by an AI agent using the questions generated from your document. 
            This is a voice-based interview - just like a real phone interview!
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Left Column - What to expect */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What to expect:</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Voice-based conversation with AI interviewer</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Questions based on your uploaded document</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Real-time feedback and follow-up questions</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">Professional interview experience</span>
              </li>
            </ul>
          </div>

          {/* Right Column - Selected Interviewer */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Selected Interviewer</h2>
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-3 mb-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={selectedInterviewer?.image} alt={selectedInterviewer?.name} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg font-semibold">
                    {selectedInterviewer?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedInterviewer?.name}</h3>
                  <p className="text-sm text-gray-600">{selectedInterviewer?.description}</p>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleChangeInterviewer}
                  className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                >
                  Change Interviewer
                </Button>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedInterviewer?.type}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {selectedInterviewer?.difficulty}
                </Badge>
              </div>
            </Card>
          </div>
        </div>

        {/* Start Interview Button */}
        <div className="text-center mb-8">
          {!selectedInterviewer && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Please select an interviewer before starting the interview
              </p>
            </div>
          )}
          
          {/* Credit Balance Display */}
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200 max-w-md mx-auto">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">💳</span>
                </div>
                <span className="text-sm font-semibold text-green-900">Your Credits</span>
              </div>
              
              {subscriptionLoading ? (
                <div className="text-sm text-green-600">Loading credits...</div>
              ) : (
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-700">
                    ${subscription?.interview_time_remaining ? (subscription.interview_time_remaining * 0.12).toFixed(2) : '0.00'}
                  </div>
                  <div className="text-sm text-green-600">
                    {subscription?.interview_time_remaining || 0} minutes remaining
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Timer Preview Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 max-w-md mx-auto">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">⏱️</span>
                </div>
                <span className="text-sm font-semibold text-blue-900">Interview Timer</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-800">3:00</div>
                  <div className="text-xs text-blue-600">Time Limit</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">$0.12</div>
                  <div className="text-xs text-green-600">Per Minute</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">After End</div>
                  <div className="text-xs text-orange-600">Credit Deduction</div>
                </div>
              </div>
              
              <div className="text-xs text-blue-600">
                Credits are deducted once after the interview ends (5 second delay)
              </div>
              
              {/* Auto-start indicator */}
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium">Timer starts immediately when you click "Start Voice Interview"</span>
                </div>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleStartInterview}
            disabled={!selectedInterviewer}
            className={`px-8 py-4 text-lg font-semibold w-full max-w-md ${
              selectedInterviewer 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {selectedInterviewer ? 'Start Voice Interview' : 'Select Interviewer First'}
          </Button>
        </div>

        {/* Interview Questions */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Interview Questions</h2>
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={index} className="p-4 sm:p-5 bg-gray-50 rounded-xl border border-gray-200">
                <div className="space-y-3">
                  {/* Question Header with Number */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 text-base leading-relaxed font-medium">
                        {question.text}
                      </p>
                    </div>
                  </div>
                  
                  {/* Tags Section */}
                  <div className="flex flex-wrap gap-2 ml-11">
                    <Badge 
                      variant="outline" 
                      className="text-xs px-3 py-1.5 bg-blue-50 border-blue-200 text-blue-700 font-medium"
                    >
                      {question.type}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="text-xs px-3 py-1.5 bg-yellow-50 border-yellow-200 text-yellow-700 font-medium"
                    >
                      {question.difficulty}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className="text-xs px-3 py-1.5 bg-green-50 border-green-200 text-green-700 font-medium"
                    >
                      {question.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
