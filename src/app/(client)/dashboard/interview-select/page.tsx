"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth.context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, Mic, Crown, Play, Info, ArrowRight, Lock, AlertCircle, RefreshCw, User, Star } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  agent_type: 'gemini' | 'retell' | 'openai';
  subscription_required: 'free' | 'pro' | 'premium';
  gemini_config?: {
    model: string;
    voice: string;
    personality: string;
    interview_style: string;
  };
  image?: string;
  is_available?: boolean;
}

// Default Gemini agents available to free users
const FREE_GEMINI_AGENTS: Agent[] = [
  {
    id: 'gemini-sarah-chen',
    name: 'Sarah Chen',
    description: 'A friendly and encouraging interviewer who specializes in behavioral questions and helps candidates feel comfortable while assessing their soft skills.',
    agent_type: 'gemini',
    subscription_required: 'free',
    gemini_config: {
      model: 'gemini-2.0-flash-exp',
      voice: 'default',
      personality: 'Friendly and encouraging',
      interview_style: 'Conversational and supportive'
    },
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    is_available: true
  },
  {
    id: 'gemini-marcus-rodriguez',
    name: 'Marcus Rodriguez',
    description: 'A technical interviewer with expertise in software engineering who asks challenging questions while maintaining a professional and respectful tone.',
    agent_type: 'gemini',
    subscription_required: 'free',
    gemini_config: {
      model: 'gemini-2.0-flash-exp',
      voice: 'default',
      personality: 'Professional and analytical',
      interview_style: 'Structured and thorough'
    },
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    is_available: true
  }
];

// Pro Gemini agents (more advanced)
const PRO_GEMINI_AGENTS: Agent[] = [
  {
    id: 'gemini-lisa-thompson',
    name: 'Lisa Thompson',
    description: 'A senior-level interviewer who conducts executive-style interviews, focusing on leadership, strategy, and high-level problem-solving skills.',
    agent_type: 'gemini',
    subscription_required: 'pro',
    gemini_config: {
      model: 'gemini-2.0-flash-exp',
      voice: 'default',
      personality: 'Executive and strategic',
      interview_style: 'High-level and insightful'
    },
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    is_available: true
  },
  {
    id: 'gemini-dr-emily-watson',
    name: 'Dr. Emily Watson',
    description: 'A PhD-level technical interviewer specializing in advanced algorithms, system design, and research-oriented questions.',
    agent_type: 'gemini',
    subscription_required: 'pro',
    gemini_config: {
      model: 'gemini-2.0-flash-exp',
      voice: 'default',
      personality: 'Academic and rigorous',
      interview_style: 'Research-focused and analytical'
    },
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    is_available: true
  }
];

// Demo agents for unauthenticated users (limited access)
const DEMO_AGENTS: Agent[] = [
  {
    id: 'demo-sarah-chen',
    name: 'Sarah Chen (Demo)',
    description: 'A friendly and encouraging interviewer who specializes in behavioral questions. Sign in for full access.',
    agent_type: 'gemini',
    subscription_required: 'free',
    gemini_config: {
      model: 'gemini-2.0-flash-exp',
      voice: 'default',
      personality: 'Friendly and encouraging',
      interview_style: 'Conversational and supportive'
    },
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    is_available: false
  }
];

export default function InterviewSelectPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>(DEMO_AGENTS);
  const [userSubscription, setUserSubscription] = useState<'free' | 'pro' | 'premium'>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!isAuthenticated) {
          // Unauthenticated users see demo agents only
          console.log('Setting demo agents for unauthenticated user');
          setAgents(DEMO_AGENTS);
          setUserSubscription('free');
        } else {
          // Authenticated users - start with free agents
          console.log('Setting free agents for authenticated user');
          let availableAgents = [...FREE_GEMINI_AGENTS];
          setUserSubscription('free');
          
          // Try to fetch user's actual subscription and additional agents
          try {
            const response = await fetch('/api/get-gemini-agents');
            
            if (response.ok) {
              const data = await response.json();
              if (data.user_subscription && data.user_subscription !== 'free') {
                setUserSubscription(data.user_subscription);
                // Pro users get access to pro agents
                if (data.user_subscription === 'pro' || data.user_subscription === 'premium') {
                  availableAgents = [...FREE_GEMINI_AGENTS, ...PRO_GEMINI_AGENTS];
                }
              }
              
              // Add any additional agents from API
              if (data.agents && data.agents.length > 0) {
                data.agents.forEach((apiAgent: Agent) => {
                  const exists = availableAgents.find(agent => agent.id === apiAgent.id);
                  if (!exists) {
                    availableAgents.push(apiAgent);
                  }
                });
              }
            }
          } catch (apiError) {
            console.log('API error, using default agents');
          }
          
          setAgents(availableAgents);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching agents:', error);
        setError('Failed to load interviewers. Using default agents.');
        setAgents(isAuthenticated ? FREE_GEMINI_AGENTS : DEMO_AGENTS);
        setUserSubscription('free');
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, [isAuthenticated]);

  const startInterview = (agent: Agent) => {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }
    
    if (agent.agent_type === 'gemini') {
      router.push(`/interview/gemini-live?agent=${encodeURIComponent(agent.name)}&id=${agent.id}`);
    } else if (agent.agent_type === 'retell') {
      router.push(`/interview/retell-live?agent=${encodeURIComponent(agent.name)}&id=${agent.id}`);
    }
  };

  const retryFetch = () => {
    setError(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading interviewers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Interviewer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select from our AI-powered interviewers to practice with.
            {isAuthenticated && (
              <span className="text-indigo-600 font-semibold">
                {userSubscription === 'free' ? ' You have access to free Gemini agents!' : ' You have Pro access to all agents!'}
              </span>
            )}
          </p>
        </div>

        {/* User Status Banner */}
        {isAuthenticated && (
          <div className="mb-8 bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-indigo-600" />
                <span className="text-gray-700">
                  Signed in as: <span className="font-semibold">{user?.email}</span>
                </span>
              </div>
              <Badge 
                variant={userSubscription === 'free' ? 'secondary' : 'default'}
                className={userSubscription === 'free' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}
              >
                {userSubscription === 'free' ? (
                  <>
                    <User className="h-3 w-3 mr-1" />
                    Free User
                  </>
                ) : (
                  <>
                    <Star className="h-3 w-3 mr-1" />
                    Pro User
                  </>
                )}
              </Badge>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
              <span className="text-yellow-800">{error}</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto" 
                onClick={retryFetch}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Free Gemini Agents Section */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Sparkles className="h-6 w-6 text-indigo-600 mr-2" />
            <h2 className="text-2xl font-semibold text-gray-900">
              {!isAuthenticated ? 'Demo Interviewer' : 'Free Gemini Interviewers'}
            </h2>
            <Badge variant="secondary" className="ml-3 bg-green-100 text-green-800">
              {!isAuthenticated ? 'Demo Access' : 'Available to All Users'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents
              .filter(agent => agent.subscription_required === 'free')
              .map((agent) => (
                <Card key={agent.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={agent.image} alt={agent.name} />
                        <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Gemini
                          </Badge>
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            {!isAuthenticated ? 'Demo' : 'Free'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <CardDescription className="text-sm text-gray-600 mb-4">
                      {agent.description}
                    </CardDescription>
                    
                    {agent.gemini_config && (
                      <div className="mb-4 space-y-2">
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Personality:</span> {agent.gemini_config.personality}
                        </div>
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Style:</span> {agent.gemini_config.interview_style}
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                      disabled={!isAuthenticated}
                      onClick={() => startInterview(agent)}
                    >
                      {!isAuthenticated ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Sign In Required
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Interview
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Pro Gemini Agents Section - Only for Pro Users */}
        {isAuthenticated && userSubscription !== 'free' && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <Star className="h-6 w-6 text-purple-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-900">Pro Gemini Interviewers</h2>
              <Badge variant="secondary" className="ml-3 bg-purple-100 text-purple-800">
                Pro Users Only
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents
                .filter(agent => agent.subscription_required === 'pro')
                .map((agent) => (
                  <Card key={agent.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={agent.image} alt={agent.name} />
                          <AvatarFallback>{agent.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Pro
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                              Pro
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <CardDescription className="text-sm text-gray-600 mb-4">
                        {agent.description}
                      </CardDescription>
                      
                      {agent.gemini_config && (
                        <div className="mb-4 space-y-2">
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Personality:</span> {agent.gemini_config.personality}
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Style:</span> {agent.gemini_config.interview_style}
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={() => startInterview(agent)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Pro Interview
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* Call to Action for Unauthenticated Users */}
        {!isAuthenticated && (
          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Start Practicing?
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Sign in to access all Gemini interviewers and start practicing with AI-powered mock interviews.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => router.push('/sign-in')}
                  >
                    Sign In to Start
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                    onClick={() => router.push('/sign-up')}
                  >
                    Create Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Call to Action for Free Users */}
        {isAuthenticated && userSubscription === 'free' && (
          <div className="mt-12 text-center">
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Ready to Upgrade Your Interview Experience?
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Get access to advanced Gemini interviewers, voice-enabled interviewers, and unlimited practice sessions with our Pro plan.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => router.push('/pricing')}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    View Pro Plans
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            {!isAuthenticated 
              ? "Sign in to access all Gemini interviewers and start practicing."
              : userSubscription === 'free'
                ? "You have access to free Gemini interviewers. Upgrade to Pro for advanced agents and voice interviews."
                : "You have Pro access to all interviewers including advanced Gemini agents and voice capabilities."
            }
          </p>
        </div>
      </div>
    </div>
  );
}
