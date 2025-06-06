'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CodingProblem } from '@/components/coding/ProblemStatement';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff } from 'lucide-react';
import { RetellWebClient } from "retell-client-js-sdk";
import axios from 'axios';

// Dynamically import CodingEnvironment to prevent SSR issues with Monaco Editor
const CodingEnvironment = dynamic(
  () => import('@/components/coding/CodingEnvironment'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading coding environment...</div>
      </div>
    )
  }
);

interface VoiceAgent {
  id: number;
  agent_id: string;
  name: string;
  description: string;
  image: string;
  empathy: number;
  exploration: number;
  rapport: number;
  speed: number;
}

// Sample coding problems for demo
const DEMO_PROBLEMS: Record<string, CodingProblem> = {
  'two-sum': {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].'
      }
    ],
    constraints: [
      '2 ≤ nums.length ≤ 10⁴',
      '-10⁹ ≤ nums[i] ≤ 10⁹',
      '-10⁹ ≤ target ≤ 10⁹',
      'Only one valid answer exists.'
    ],
    testCases: [
      {
        id: 'test-1',
        input: 'nums = [2,7,11,15], target = 9',
        expectedOutput: '[0,1]',
        explanation: 'nums[0] + nums[1] = 2 + 7 = 9'
      },
      {
        id: 'test-2',
        input: 'nums = [3,2,4], target = 6',
        expectedOutput: '[1,2]',
        explanation: 'nums[1] + nums[2] = 2 + 4 = 6'
      },
      {
        id: 'test-3',
        input: 'nums = [3,3], target = 6',
        expectedOutput: '[0,1]',
        explanation: 'nums[0] + nums[1] = 3 + 3 = 6',
        isHidden: true
      }
    ],
    hints: [
      'A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Again, it\'s best to try out brute force solutions for just for completeness. It is from these brute force solutions that you can come up with optimizations.',
      'So, if we fix one of the numbers, say x, we have to scan the entire array to find the next number y which is value - x where value is the input parameter. Can we change our array somehow so that this search becomes faster?',
      'The second train of thought is, without changing the array, can we use additional space somehow? Like maybe a hash map to speed up the search?'
    ],
    timeLimit: 30,
    memoryLimit: 64
  },
  'reverse-string': {
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'Easy',
    description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: 'The string "hello" is reversed to "olleh".'
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        output: '["h","a","n","n","a","H"]',
        explanation: 'The string "Hannah" is reversed to "hannaH".'
      }
    ],
    constraints: [
      '1 ≤ s.length ≤ 10⁵',
      's[i] is a printable ascii character.'
    ],
    testCases: [
      {
        id: 'test-1',
        input: 's = ["h","e","l","l","o"]',
        expectedOutput: '["o","l","l","e","h"]'
      },
      {
        id: 'test-2',
        input: 's = ["H","a","n","n","a","h"]',
        expectedOutput: '["h","a","n","n","a","H"]'
      }
    ],
    hints: [
      'The entire logic for reversing a string is based on using the opposite directional two-pointer approach!'
    ],
    timeLimit: 15,
    memoryLimit: 32
  }
};

// Initialize Retell Web Client
const webClient = new RetellWebClient();

export default function CodingDemoPage() {
  const [selectedProblem, setSelectedProblem] = useState<string>('two-sum');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceAgents, setVoiceAgents] = useState<VoiceAgent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<VoiceAgent | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);
  const [isCalling, setIsCalling] = useState(false);
  const [callId, setCallId] = useState<string>('');
  const [isCallStarted, setIsCallStarted] = useState(false);
  const [lastAgentResponse, setLastAgentResponse] = useState<string>('');
  const [lastUserResponse, setLastUserResponse] = useState<string>('');
  const [activeTurn, setActiveTurn] = useState<'agent' | 'user'>('agent');
  const [currentCode, setCurrentCode] = useState<string>('');
  const [currentLanguage, setCurrentLanguage] = useState<string>('javascript');

  const currentProblem = DEMO_PROBLEMS[selectedProblem];

  // Debug state changes
  useEffect(() => {
    console.log('Voice interview state changed:', {
      isVoiceEnabled,
      isCalling,
      callId,
      selectedAgent: selectedAgent?.name
    });
  }, [isVoiceEnabled, isCalling, callId, selectedAgent]);

  // Fetch voice agents on component mount
  useEffect(() => {
    fetchVoiceAgents();
  }, []);

  // Set up Retell Web Client event handlers
  useEffect(() => {
    webClient.on("call_started", () => {
      console.log("Voice call started");
      setIsCalling(true);
      setIsCallStarted(true);
      toast.success("Voice interview started! The AI agent will begin speaking shortly.");
    });

    webClient.on("call_ended", () => {
      console.log("Voice call ended");
      setIsCalling(false);
      setIsVoiceEnabled(false);
      setIsCallStarted(false);
      toast.info("Voice interview ended");
    });

    webClient.on("agent_start_talking", () => {
      setActiveTurn("agent");
      console.log("Agent started talking");
    });

    webClient.on("agent_stop_talking", () => {
      setActiveTurn("user");
      console.log("Agent stopped talking");
    });

    webClient.on("error", (error) => {
      console.error("Retell Web Client error:", error);
      setIsCalling(false);
      setIsVoiceEnabled(false);
      setIsCallStarted(false);
      toast.error("Voice interview error: " + (error.message || "Unknown error"));
    });

    webClient.on("update", (update) => {
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

    return () => {
      // Clean up event listeners
      webClient.removeAllListeners();
    };
  }, []);

  const fetchVoiceAgents = async () => {
    try {
      setIsLoadingAgents(true);
      
      // First, try to sync agents from Retell AI
      await fetch('/api/sync-retell-agents', {
        method: 'POST',
      });
      
      // Then fetch synced agents from database
      const response = await fetch('/api/get-voice-agents');
      
      if (response.ok) {
        const data = await response.json();
        setVoiceAgents(data.agents || []);
        
        if (data.agents?.length > 0) {
          toast.success(`Loaded ${data.agents.length} voice agent(s)`);
        } else {
          toast.info('No voice agents found. Make sure you have voice-enabled agents in Retell AI.');
        }
      } else {
        throw new Error('Failed to fetch agents');
      }
    } catch (error) {
      console.error('Error fetching voice agents:', error);
      toast.error('Failed to load voice agents');
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const handleExecute = async (code: string, language: string) => {
    try {
      const response = await fetch('/api/execute-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          testCases: currentProblem.testCases.map(tc => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput
          }))
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Execution failed');
      }

      // Trigger AI analysis after successful code execution if in voice interview
      if (isVoiceEnabled && isCalling && callId && code.trim().length > 0) {
        console.log('Triggering AI analysis after code execution...');
        // Use setTimeout to not block the execution result display
        setTimeout(() => {
          sendCodeForVoiceReview(code, language, 'review');
        }, 1000);
      }

      return result;
    } catch (error) {
      console.error('Execution error:', error);
      throw error;
    }
  };

  const handleSubmit = async (code: string, language: string) => {
    console.log('Coding demo handleSubmit called', {
      codeLength: code.length,
      language,
      isVoiceEnabled,
      isCalling,
      callId,
      selectedProblem
    });
    
    setIsSubmitting(true);
    
    try {
      console.log('Starting submission process...');
      
      // Temporarily bypass API call for testing
      const mockSubmission = true;
      
      if (mockSubmission) {
        console.log('Using mock submission for testing');
        // Mock successful submission
        toast.success(`Solution submitted! Mock Score: 85/100`, {
          description: `Mock: 2/2 test cases passed`,
        });
        
        console.log('Mock submission result: success');
        
        // Proceed directly to voice analysis
        if (isVoiceEnabled && isCalling && callId) {
          console.log('Voice interview conditions met, triggering comprehensive AI analysis after submission...');
          // Use setTimeout to not interfere with submission feedback
          setTimeout(() => {
            console.log('Executing sendCodeForVoiceReview with:', { code: code.substring(0, 50) + '...', language });
            sendCodeForVoiceReview(code, language, 'review');
          }, 1500);
        } else {
          console.log('Voice interview conditions NOT met:', {
            isVoiceEnabled,
            isCalling,
            callId: !!callId
          });
        }
      } else {
        // Original API call (commented out for testing)
        const response = await fetch('/api/submit-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            language,
            problemId: selectedProblem,
            interviewId: 'demo-interview',
            userId: 'demo-user'
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Submission failed');
        }

        // Show success notification
        toast.success(`Solution submitted! Score: ${result.score}/100`, {
          description: `${result.testResults.passed}/${result.testResults.total} test cases passed`,
        });

        // You could also show a detailed feedback modal here
        console.log('Submission result:', result);
        
        // If voice interview is active, send code for comprehensive analysis
        if (isVoiceEnabled && isCalling && callId) {
          console.log('Voice interview conditions met, triggering comprehensive AI analysis after submission...');
          // Use setTimeout to not interfere with submission feedback
          setTimeout(() => {
            console.log('Executing sendCodeForVoiceReview with:', { code: code.substring(0, 50) + '...', language });
            sendCodeForVoiceReview(code, language, 'review');
          }, 1500);
        } else {
          console.log('Voice interview conditions NOT met:', {
            isVoiceEnabled,
            isCalling,
            callId: !!callId
          });
        }
      }
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Submission failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Callback to receive code updates from CodingEnvironment
  const handleCodeChange = (code: string, language: string) => {
    setCurrentCode(code);
    setCurrentLanguage(language);
  };

  // Function to send code to voice agent for review
  const sendCodeForVoiceReview = async (code: string, language: string, analysisType: 'review' | 'hint' | 'debug' = 'review') => {
    try {
      console.log('Sending code to voice agent for review...', {
        codeLength: code.length,
        language,
        analysisType
      });
      
      if (!code || code.trim().length === 0) {
        toast.error('Please write some code first before requesting analysis');
        return;
      }
      
      // Show immediate feedback
      toast.info('🤖 AI agent is analyzing your code...', {
        description: 'You\'ll hear feedback through the voice call',
        duration: 2000,
      });
      
      // Call our code analysis API
      const response = await fetch('/api/analyze-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          analysis_type: analysisType,
          problem_title: currentProblem.title,
          problem_description: currentProblem.description
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Code analysis result:', result);
        
        // Update the conversation display to show the AI feedback
        const feedbackMessage = `I've ${analysisType === 'hint' ? 'provided a hint' : analysisType === 'debug' ? 'helped debug' : 'reviewed'} your ${language} code for the ${currentProblem.title} problem. ${result.feedback}`;
        setLastAgentResponse(feedbackMessage);
        
        // Update dynamic variables in the active Retell call so the agent can see the code
        if (callId) {
          try {
            const updateResponse = await fetch('/api/update-call-variables', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                callId: callId,
                variables: {
                  code_submission: code,
                  analysis_type: analysisType,
                  problem_title: currentProblem.title,
                  language: language,
                  last_analysis_result: result.feedback,
                  code_length: String(code.length),
                  timestamp: new Date().toISOString()
                }
              }),
            });

            if (updateResponse.ok) {
              const updateResult = await updateResponse.json();
              console.log('Updated call variables:', updateResult);
              
              toast.success(`🎤 Code analysis complete`, {
                description: 'The AI agent is ready to discuss your solution',
                duration: 3000,
              });
              
              // Show a helpful prompt for the user
              setLastAgentResponse(`I've analyzed your ${language} code for the ${currentProblem.title} problem. ${result.feedback}`);
              
            } else {
              console.error('Failed to update call variables:', updateResponse.status);
              toast.info(`🎤 AI Agent: ${result.feedback.substring(0, 100)}...`, {
                description: 'Fallback: showing analysis as notification',
                duration: 5000,
              });
            }
          } catch (updateError) {
            console.error('Error updating call variables:', updateError);
            toast.info(`🎤 AI Agent: ${result.feedback.substring(0, 100)}...`, {
              description: 'Fallback: showing analysis as notification',
              duration: 5000,
            });
          }
        } else {
          toast.info(`🎤 AI Agent: ${result.feedback.substring(0, 100)}...`, {
            description: 'No active call - showing analysis as notification',
            duration: 5000,
          });
        }
        
      } else {
        throw new Error('Analysis API returned error');
      }
    } catch (error) {
      console.error('Error sending code for review:', error);
      toast.error('Failed to get AI code review');
    }
  };

  const startVoiceInterview = async () => {
    if (!selectedAgent) {
      toast.error('Please select a voice agent first');
      return;
    }

    try {
      setIsVoiceEnabled(true);
      toast.info('Connecting to voice agent...');

      // Prepare dynamic data for the coding interview
      const dynamicData = {
        problem_title: currentProblem.title,
        problem_difficulty: currentProblem.difficulty,
        problem_description: currentProblem.description,
        interviewer_name: selectedAgent.name,
        interview_type: 'coding_demo'
      };

      console.log('Registering call with data:', dynamicData);

      // Register the call with Retell AI
      const registerCallResponse = await axios.post('/api/register-call', {
        dynamic_data: dynamicData,
        interviewer_id: selectedAgent.id
      });

      console.log('Register call response:', registerCallResponse.data);

      if (registerCallResponse.data.registerCallResponse.access_token) {
        console.log('Starting web call with access token');
        
        // Start the actual voice call
        await webClient.startCall({
          accessToken: registerCallResponse.data.registerCallResponse.access_token,
        });

        setCallId(registerCallResponse.data.registerCallResponse.call_id);
        toast.success(`Connected to ${selectedAgent.name}! The agent will begin speaking shortly.`);
      } else {
        throw new Error('No access token received from register call');
      }
    } catch (error) {
      console.error('Error starting voice interview:', error);
      setIsVoiceEnabled(false);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message;
        toast.error(`Failed to start voice interview: ${errorMessage}`);
      } else {
        toast.error('Failed to start voice interview. Please try again.');
      }
    }
  };

  const stopVoiceInterview = () => {
    if (isCalling) {
      webClient.stopCall();
      toast.info('Ending voice interview...');
    } else {
      setIsVoiceEnabled(false);
      toast.info('Voice interview ended');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                FoloUp Coding Environment Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Experience our AI-powered coding interview platform with voice interaction
              </p>
            </div>
            
            {/* Problem Selector */}
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Problem:
              </label>
              <select
                value={selectedProblem}
                onChange={(e) => setSelectedProblem(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                {Object.entries(DEMO_PROBLEMS).map(([key, problem]) => (
                  <option key={key} value={key}>
                    {problem.title} ({problem.difficulty})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Agent Selection */}
      {!isVoiceEnabled && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                  Voice-Powered Coding Interview
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-sm">
                  Select an AI interviewer to guide you through the coding challenge
                </p>
              </div>
              
              {isLoadingAgents ? (
                <div className="text-blue-600 dark:text-blue-400">Loading agents...</div>
              ) : (
                <div className="flex items-center space-x-4">
                  {voiceAgents.length > 0 && (
                    <>
                      <select
                        value={selectedAgent?.id || ''}
                        onChange={(e) => {
                          const agent = voiceAgents.find(a => a.id === parseInt(e.target.value));
                          setSelectedAgent(agent || null);
                        }}
                        className="bg-white border border-blue-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Voice Agent</option>
                        {voiceAgents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>
                      
                      <Button
                        onClick={startVoiceInterview}
                        disabled={!selectedAgent}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Mic className="w-4 h-4 mr-2" />
                        Start Voice Interview
                      </Button>
                    </>
                  )}
                  
                  {voiceAgents.length === 0 && (
                    <div className="text-center">
                      <p className="text-blue-600 dark:text-blue-400 text-sm mb-2">
                        No voice agents found. Make sure you have voice-enabled agents in Retell AI.
                      </p>
                      <Button
                        onClick={fetchVoiceAgents}
                        variant="outline"
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        Sync Voice Agents
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {selectedAgent && (
              <Card className="mt-4 bg-white/80 dark:bg-gray-800/80">
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {selectedAgent.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {selectedAgent.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedAgent.description}
                      </p>
                      <div className="flex space-x-4 mt-2">
                        <Badge variant="outline">Empathy: {selectedAgent.empathy}/10</Badge>
                        <Badge variant="outline">Technical: {selectedAgent.exploration}/10</Badge>
                        <Badge variant="outline">Rapport: {selectedAgent.rapport}/10</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Active Voice Interview Bar */}
      {isVoiceEnabled && selectedAgent && (
        <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-700">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  {isCalling ? (
                    <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <Mic className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <div>
                  <span className="font-semibold text-green-900 dark:text-green-100">
                    {isCalling ? "Voice Interview Active" : "Connecting..."}
                  </span>
                  <span className="text-green-700 dark:text-green-300 text-sm ml-2">
                    with {selectedAgent.name}
                  </span>
                  {activeTurn && isCalling && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {activeTurn === 'agent' ? '🎤 AI is speaking...' : '👂 Listening to you...'}
                    </div>
                  )}
                </div>
                {isCalling && (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {callId && (
                  <Badge variant="outline" className="text-xs">
                    Call ID: {callId.slice(-8)}
                  </Badge>
                )}
                <Button
                  onClick={stopVoiceInterview}
                  variant="outline"
                  size="sm"
                  className="border-green-300 text-green-600 hover:bg-green-50"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  End Interview
                </Button>
              </div>
            </div>
            
            {/* Conversation Display */}
            {(lastAgentResponse || lastUserResponse) && (
              <div className="mt-3 p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg text-sm">
                <div className="flex space-x-4">
                  {lastAgentResponse && (
                    <div className="flex-1">
                      <div className="font-medium text-green-800 dark:text-green-200 mb-1">
                        🤖 {selectedAgent.name}:
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        {lastAgentResponse.slice(-150)}
                        {lastAgentResponse.length > 150 && '...'}
                      </div>
                    </div>
                  )}
                  {lastUserResponse && (
                    <div className="flex-1">
                      <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                        👤 You:
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        {lastUserResponse.slice(-150)}
                        {lastUserResponse.length > 150 && '...'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Code Analysis Info */}
            {isCalling && (
              <div className="mt-3 text-center">
                <p className="text-sm text-green-700 dark:text-green-300">
                  💡 The AI agent will automatically analyze your code when you run or submit it
                </p>
                {currentCode && currentCode.trim().length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Code ready for analysis ({currentCode.length} characters)
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coding Environment */}
      <div className="h-[calc(100vh-200px)]">
        <CodingEnvironment
          problem={currentProblem}
          interviewId={isVoiceEnabled ? `voice-demo-${selectedAgent?.agent_id}` : "demo-interview"}
          onExecute={handleExecute}
          onSubmit={handleSubmit}
          onCodeChange={handleCodeChange}
        />
      </div>

      {/* Instructions Footer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-blue-700 dark:text-blue-300">
              <span>💡 Write your solution and click "Run Code" to test it</span>
              <span>•</span>
              {isVoiceEnabled ? (
                <span>🎤 AI agent will automatically analyze your code when you run or submit</span>
              ) : (
                <span>🚀 Click "Submit Solution" to get AI-powered feedback</span>
              )}
              {isVoiceEnabled && (
                <>
                  <span>•</span>
                  <span>🗣️ Ask your AI interviewer questions about your approach</span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <span>⌘+Enter: Run</span>
              <span>•</span>
              <span>⌘+Shift+Enter: Submit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
