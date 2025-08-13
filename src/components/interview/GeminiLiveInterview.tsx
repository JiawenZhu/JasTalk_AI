"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth.context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, 
  Mic, 
  MicOff, 
  Send, 
  Loader2, 
  Crown,
  Sparkles
} from 'lucide-react';

interface GeminiLiveInterviewProps {
  interviewer: {
    id: string;
    name: string;
    description: string;
    image: string;
    agent_type: 'gemini' | 'retell';
    subscription_required: 'free' | 'pro';
    gemini_config?: {
      model: string;
      voice: string;
      personality: string;
      interview_style: string;
    };
  };
  interviewContext?: {
    job_description?: string;
    interview_type?: string;
    difficulty?: string;
    focus_areas?: string[];
  };
  onSessionEnd?: (sessionData: any) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function GeminiLiveInterview({ 
  interviewer, 
  interviewContext, 
  onSessionEnd 
}: GeminiLiveInterviewProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(`gemini_session_${Date.now()}`);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize interview with first message
  useEffect(() => {
    if (messages.length === 0 && isSessionActive) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Hello! I'm ${interviewer.name}. I'm excited to conduct this interview with you today. 

${interviewContext?.job_description ? 
  `I can see you're interviewing for a ${interviewContext.interview_type || 'technical'} position. ` : 
  'This will be a general interview to assess your skills and experience.'
}

Let's begin! Please tell me about yourself and your background.`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, [interviewer.name, interviewContext, messages.length, isSessionActive]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Check if user is authenticated
      if (!user) {
        throw new Error('Please sign in to use the interview feature');
      }

      const response = await fetch('/api/gemini-live', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewer_id: interviewer.id,
          user_message: inputMessage,
          session_id: sessionId,
          interview_context: interviewContext
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.upgrade_required) {
          throw new Error('Pro subscription required for this interviewer');
        }
        if (response.status === 401) {
          throw new Error('Please sign in to continue');
        }
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: data.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorContent = 'Sorry, I encountered an error. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Pro subscription')) {
          errorContent = 'This interviewer requires a Pro subscription. Please upgrade to continue with voice-enabled interviews.';
        } else if (error.message.includes('sign in')) {
          errorContent = 'Please sign in to use the interview feature.';
        } else if (error.message.includes('API error')) {
          errorContent = 'Service temporarily unavailable. Please try again later.';
        }
      }
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: errorContent,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const endSession = () => {
    setIsSessionActive(false);
    if (onSessionEnd) {
      onSessionEnd({
        sessionId,
        messages,
        duration: Date.now() - new Date(messages[0]?.timestamp || Date.now()).getTime(),
        interviewer: interviewer.name
      });
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={interviewer.image} alt={interviewer.name} />
                <AvatarFallback>{interviewer.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{interviewer.name}</CardTitle>
                <p className="text-sm text-gray-600">{interviewer.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={interviewer.agent_type === 'gemini' ? 'secondary' : 'default'}>
                {interviewer.agent_type === 'gemini' ? (
                  <>
                    <Sparkles className="w-3 h-3 mr-1" />
                    Gemini Live
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 mr-1" />
                    Voice Agent
                  </>
                )}
              </Badge>
              {interviewer.subscription_required === 'pro' && (
                <Badge variant="default" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Pro
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 mb-4 overflow-hidden">
        <CardContent className="p-4 h-full">
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-gray-600">Interviewer is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              disabled={!isSessionActive || isLoading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading || !isSessionActive}
              className="px-6"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
            {isSessionActive && (
              <Button
                onClick={endSession}
                variant="outline"
                className="px-4"
              >
                End Interview
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session Info */}
      <div className="text-center text-xs text-gray-500 mt-2">
        Session ID: {sessionId}
      </div>
    </div>
  );
}
