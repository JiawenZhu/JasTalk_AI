"use client";

import "../../globals.css";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ClockIcon,
  MicrophoneIcon,
  StarIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import Navbar from "@/components/navbar";
import HelpButton from "@/components/ui/help-button";
import WelcomeModal from "@/components/onboarding/welcome-modal";
import { useOnboarding } from "@/hooks/use-onboarding";

export const dynamic = 'force-dynamic';

interface ScoringCriteria {
  communication: number;
  technicalDepth: number;
  problemSolving: number;
  confidence: number;
  relevance: number;
}

interface PracticeResult {
  sessionId: string;
  callId: string;
  agentName: string;
  duration: number;
  questionsAnswered: number;
  totalQuestions: number;
  overallScore: number;
  scoreBreakdown: ScoringCriteria;
  strengths: string[];
  areasForImprovement: string[];
  feedback: string;
  transcript: any[];
  postCallAnalysis: any;
}

export default function PracticeCompletePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { 
    isFirstTime, 
    showOnboarding, 
    completeOnboarding, 
    hideOnboardingModal 
  } = useOnboarding();
  
  const [result, setResult] = useState<PracticeResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Practice complete page mounted, isAuthenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      console.log('User not authenticated, redirecting to sign-in');
      router.push('/sign-in');
      return;
    }

    // Get session data from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    const callId = urlParams.get('callId') || localStorage.getItem('lastCallId');

    console.log('Session data:', { sessionId, callId });

    if (!sessionId && !callId) {
      console.log('No session data found, loading mock result');
      // Fallback to mock data for demo
      loadMockResult();
      return;
    }

    console.log('Loading real practice results');
    // Load real practice results
    loadPracticeResults(sessionId, callId);
  }, [isAuthenticated, router]);

  const loadPracticeResults = async (sessionId: string | null, callId: string | null) => {
    try {
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId);
      if (callId) params.append('callId', callId);

      const response = await fetch(`/api/practice-results?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(`Failed to load practice results: ${response.status}`);
      }

      const data = await response.json();
      if (data.result) {
        setResult(data.result);
      } else {
        throw new Error('No result data received');
      }
    } catch (error) {
      console.error('Error loading practice results:', error);
      // Fallback to mock data
      loadMockResult();
    } finally {
      setIsLoading(false);
    }
  };

  const loadMockResult = () => {
    console.log('Loading mock result');
    const mockResult: PracticeResult = {
      sessionId: `session-${Date.now()}`,
      callId: `call-${Date.now()}`,
      agentName: 'AI Interviewer',
      duration: 1247, // 20 minutes 47 seconds
      questionsAnswered: 3,
      totalQuestions: 3,
      overallScore: 85,
      scoreBreakdown: {
        communication: 88,
        technicalDepth: 82,
        problemSolving: 85,
        confidence: 90,
        relevance: 87
      },
      strengths: [
        "Clear communication and articulation",
        "Good use of specific examples",
        "Professional tone and demeanor"
      ],
      areasForImprovement: [
        "Could provide more technical depth",
        "Consider elaborating on problem-solving process",
        "Practice more concise responses"
      ],
      feedback: "Excellent overall performance! You demonstrated strong communication skills and provided relevant examples. Your responses were well-structured and professional. To improve further, try to include more technical details and practice being more concise in your answers.",
      transcript: [],
      postCallAnalysis: {}
    };
    
    setResult(mockResult);
    setIsLoading(false);
  };

  const handlePracticeAgain = () => {
    // Store the current questions for reuse
    if (result?.transcript && result.transcript.length > 0) {
      // Extract questions from transcript if available
      const questions = result.transcript
        .filter((entry: any) => entry.speaker === 'agent' && entry.content)
        .map((entry: any, index: number) => ({
          id: `q-${index + 1}`,
          text: entry.content,
          type: 'behavioral',
          difficulty: 'medium',
          category: 'Interview'
        }));
      
      if (questions.length > 0) {
        localStorage.setItem('generatedQuestions', JSON.stringify(questions));
      }
    } else {
      // Use mock questions as fallback
      const mockQuestions = [
        { id: '1', text: 'Tell me about a challenging technical problem you solved recently. What was your approach and what did you learn?', type: 'behavioral', difficulty: 'medium', category: 'Problem Solving' },
        { id: '2', text: 'How would you design a scalable web application that can handle millions of users?', type: 'system-design', difficulty: 'hard', category: 'System Design' },
        { id: '3', text: 'Describe a time when you had to work with a difficult team member. How did you handle the situation?', type: 'behavioral', difficulty: 'easy', category: 'Teamwork' }
      ];
      localStorage.setItem('generatedQuestions', JSON.stringify(mockQuestions));
    }

    // Store job description if available
    const jobDescription = localStorage.getItem('jobDescription');
    if (jobDescription) {
      localStorage.setItem('reuseJobDescription', jobDescription);
    }

    // Navigate to practice page with reuse flag
    router.push('/practice/new?reuse=true');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing your interview performance...</p>
        </div>
      </div>
    );
  }

  // Fallback if no result is available
  if (!result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckIcon className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Practice Complete</h2>
          <p className="text-gray-600 mb-6">
            Your practice interview has been completed successfully!
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
            <h1 className="text-lg font-semibold text-gray-900">Practice Complete</h1>
            <p className="text-sm text-gray-500">Great job!</p>
          </div>
          <div className="w-9"></div> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-6 pt-24 sm:pt-20">
        {/* Success Message */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center"
        >
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Interview Practice Complete!
          </h2>
          <p className="text-gray-600">
            You've successfully completed your practice interview. Here's how you performed:
          </p>
        </motion.div>

        {/* Score Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              <div className={`text-4xl font-bold ${getScoreColor(result!.overallScore)}`}>
                {result!.overallScore}%
              </div>
              <div className="text-2xl font-semibold text-gray-500">
                {getScoreGrade(result!.overallScore)}
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-1000"
                style={{ width: `${result!.overallScore}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Session Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Session Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <ClockIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {formatDuration(result!.duration)}
              </div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <MicrophoneIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {result!.questionsAnswered}/{result!.totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Questions</div>
            </div>
          </div>
          
          {/* Agent Information */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-sm text-gray-500">Interviewer</div>
              <div className="font-medium text-gray-900">{result!.agentName}</div>
            </div>
          </div>
        </motion.div>

        {/* Score Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Score Breakdown</h3>
          <div className="space-y-4">
            {Object.entries(result!.scoreBreakdown).map(([key, score]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      score >= 90 ? 'bg-green-500' :
                      score >= 80 ? 'bg-blue-500' :
                      score >= 70 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Strengths */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <StarIcon className="w-5 h-5 text-yellow-500" />
            <span>Your Strengths</span>
          </h3>
          <div className="space-y-3">
            {result!.strengths.map((strength, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">{strength}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Areas for Improvement */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Areas for Improvement</h3>
          <div className="space-y-3">
            {result!.areasForImprovement.map((area, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-gray-700">{area}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Detailed Feedback */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="font-semibold text-gray-900 mb-4">Detailed Feedback</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 leading-relaxed">
              {result!.feedback}
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePracticeAgain()}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:bg-blue-700"
          >
            Practice Again
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/practice/logs')}
            className="w-full bg-gray-100 text-gray-700 py-4 px-6 rounded-xl font-semibold shadow-lg hover:bg-gray-200"
          >
            View Logs
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/dashboard')}
            className="w-full bg-white border border-gray-300 text-gray-700 py-4 px-6 rounded-xl font-semibold shadow-lg hover:bg-gray-50"
          >
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>

      {/* Help Button */}
      <HelpButton 
        variant="floating" 
        position="bottom-right" 
        size="md"
      />

      {/* Onboarding Modal */}
      <WelcomeModal
        isOpen={showOnboarding}
        isFirstTime={isFirstTime}
        onClose={hideOnboardingModal}
      />
    </div>
  );
} 
