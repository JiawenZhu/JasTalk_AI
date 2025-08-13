"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Home, RefreshCw, Clock, Mic, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InterviewResults {
  sessionId: string;
  duration: number;
  questionsAnswered: number;
  totalQuestions: number;
  interviewer: string;
  completedAt: string;
}

export default function PracticeCompletePage() {
  const router = useRouter();
  const [results, setResults] = useState<InterviewResults | null>(null);

  useEffect(() => {
    // Get interview results from localStorage
    const storedResults = localStorage.getItem('interviewResults');
    if (storedResults) {
      try {
        const parsedResults = JSON.parse(storedResults);
        setResults(parsedResults);
      } catch (error) {
        console.error('Error parsing interview results:', error);
      }
    }
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCompletionRate = () => {
    if (!results) return 0;
    return Math.round((results.questionsAnswered / results.totalQuestions) * 100);
  };

  const getPerformanceScore = () => {
    if (!results) return 0;
    // Simple scoring based on completion rate and time management
    const completionScore = (results.questionsAnswered / results.totalQuestions) * 60;
    const timeScore = Math.min(results.duration / 180, 1) * 40; // 180 seconds = 3 minutes
    return Math.round(completionScore + timeScore);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-6">
      <Card className="p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Practice Session Complete!
          </h1>
          
          <p className="text-lg text-gray-600">
            Great job completing your practice interview with {results?.interviewer || 'AI Interviewer'}! 
            You've taken an important step toward improving your interview skills.
          </p>
        </div>

        {/* Interview Results */}
        {results && (
          <div className="mb-8 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 text-center">Your Interview Summary</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatDuration(results.duration)}
                </div>
                <div className="text-sm text-gray-600">Total Duration</div>
              </Card>

              <Card className="p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mic className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {results.questionsAnswered}/{results.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Questions Answered</div>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {getCompletionRate()}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </Card>

              <Card className="p-4 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {getPerformanceScore()}/100
                </div>
                <div className="text-sm text-gray-600">Performance Score</div>
              </Card>
            </div>

            {/* Performance Insights */}
            <Card className="p-6 bg-blue-50 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3">Performance Insights</h3>
              <div className="space-y-2 text-sm text-blue-800">
                {getCompletionRate() >= 80 ? (
                  <p>🎯 Excellent! You completed most of the interview questions, showing strong engagement.</p>
                ) : (
                  <p>📝 Good effort! Consider practicing to improve your response completion rate.</p>
                )}
                
                {results.duration <= 120 ? (
                  <p>⚡ Great time management! You used your time efficiently during the interview.</p>
                ) : (
                  <p>⏰ You used most of your allocated time. Practice being more concise in your responses.</p>
                )}
                
                <p>💡 Keep practicing to improve your confidence and interview skills!</p>
              </div>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4 mb-8">
          <Button 
            onClick={() => router.push('/sign-up?offer=free-credit')}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Start New Practice
          </Button>
          
          <Button 
            onClick={() => router.push('/')}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>

        {/* Premium Features */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4 text-center">
            Want to unlock more advanced features?
          </p>
          <Button 
            onClick={() => router.push('/premium')}
            variant="outline"
            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Explore Premium Features
          </Button>
        </div>
      </Card>
    </div>
  );
} 
