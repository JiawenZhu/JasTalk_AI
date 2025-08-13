"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth.context';
import GeminiLiveInterview from '@/components/interview/GeminiLiveInterview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Share2, ArrowLeft, Clock, AlertCircle } from 'lucide-react';

interface InterviewSession {
  id: string;
  agent: string;
  startTime: Date;
  endTime?: Date;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

export default function GeminiLiveInterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const agent = searchParams.get('agent');
  const agentId = searchParams.get('id');
  const isDemo = searchParams.get('demo') === 'true';
  const demoTime = parseInt(searchParams.get('time') || '120');
  
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [demoTimeLeft, setDemoTimeLeft] = useState(demoTime);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  useEffect(() => {
    if (!agent || !agentId) {
      router.push('/interview/select');
      return;
    }

    // Check authentication for non-demo interviews
    if (!isDemo && !isAuthenticated) {
      setShowSignInPrompt(true);
      return;
    }

    // Initialize session
    const newSession: InterviewSession = {
      id: `session-${Date.now()}`,
      agent: agent,
      startTime: new Date(),
      messages: []
    };
    setSession(newSession);
  }, [agent, agentId, isDemo, isAuthenticated, router]);

  // Demo timer effect
  useEffect(() => {
    if (!isDemo || !session) return;

    const timer = setInterval(() => {
      setDemoTimeLeft(prev => {
        if (prev <= 1) {
          endSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isDemo, session]);

  const endSession = () => {
    if (session) {
      setSession(prev => prev ? { ...prev, endTime: new Date() } : null);
      setIsSessionEnded(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadTranscript = () => {
    if (!session) return;

    const transcript = session.messages
      .map(msg => `${msg.role === 'user' ? 'You' : session.agent}: ${msg.content}`)
      .join('\n\n');

    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${session.agent}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareResults = () => {
    if (navigator.share) {
      navigator.share({
        title: `Interview with ${session?.agent}`,
        text: `I just completed an AI interview practice session with ${session?.agent} on JasTalk AI!`,
        url: window.location.origin
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `I just completed an AI interview practice session with ${session?.agent} on JasTalk AI! Check it out at ${window.location.origin}`
      );
      alert('Share message copied to clipboard!');
    }
  };

  if (showSignInPrompt) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Sign In Required</CardTitle>
            <CardDescription>
              To start your AI interview practice session, please sign in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push('/sign-in')}
              className="w-full"
            >
              Sign In
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.push('/interview/select')}
              className="w-full"
            >
              Back to Interviewers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Setting up your interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/interview/select')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Interview with {session.agent}
              </h1>
              {isDemo && (
                <div className="flex items-center text-sm text-indigo-600">
                  <Clock className="h-3 w-3 mr-1" />
                  Demo Mode: {formatTime(demoTimeLeft)} remaining
                </div>
              )}
            </div>
          </div>
          
          {isDemo && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={endSession}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                End Demo
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Interview Area */}
      <div className="max-w-4xl mx-auto p-4">
        {!isSessionEnded ? (
          <GeminiLiveInterview
            interviewer={{
              id: agentId!,
              name: session.agent,
              description: `AI Interviewer: ${session.agent}`,
              image: '',
              agent_type: 'gemini',
              subscription_required: 'free'
            }}
            onSessionEnd={endSession}
          />
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-green-600">
                Interview Session Complete!
              </CardTitle>
              <CardDescription>
                Great job completing your interview practice session with {session.agent}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Session Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Session Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <span className="ml-2 font-medium">
                      {session.startTime && session.endTime
                        ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 1000 / 60)
                        : 0} minutes
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Messages:</span>
                    <span className="ml-2 font-medium">{session.messages.length}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={downloadTranscript}
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Transcript
                </Button>
                <Button
                  onClick={shareResults}
                  variant="outline"
                  className="flex-1"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Results
                </Button>
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push('/interview/select')}
                  className="flex-1"
                >
                  Practice with Another Interviewer
                </Button>
                <Button
                  onClick={() => router.push('/dashboard')}
                  variant="outline"
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
              </div>

              {/* Demo Upgrade CTA */}
              {isDemo && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 text-center">
                  <h4 className="font-semibold text-indigo-900 mb-2">
                    Ready for Unlimited Practice?
                  </h4>
                  <p className="text-sm text-indigo-700 mb-3">
                    Sign up for a free account to access unlimited interview practice sessions and track your progress.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button
                      onClick={() => router.push('/sign-up')}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Create Free Account
                    </Button>
                    <Button
                      onClick={() => router.push('/sign-in')}
                      variant="outline"
                      size="sm"
                      className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    >
                      Sign In
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
