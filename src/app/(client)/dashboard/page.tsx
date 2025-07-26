"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  ChartBarIcon,
  MicrophoneIcon,
  CameraIcon,
  PhotoIcon,
  DocumentIcon,
  PlusIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/auth.context";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

interface VoiceAgent {
  agent_id: string;
  name: string;
  description: string;
  voice_id: string;
  category: string;
  difficulty: string;
  specialties: string[];
}

interface PracticeSession {
  id: string;
  title: string;
  type: string;
  score: number;
  date: string;
  questionCount: number;
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState<VoiceAgent | null>(null);
  const [recentSessions, setRecentSessions] = useState<PracticeSession[]>([
    {
      id: "1",
      title: "Software Engineer - Google",
      type: "Technical Interview",
      score: 85,
      date: "2024-01-15",
      questionCount: 10
    },
    {
      id: "2", 
      title: "Product Manager - Meta",
      type: "Behavioral Interview",
      score: 78,
      date: "2024-01-14",
      questionCount: 8
    }
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, router]);

  // Load selected agent from localStorage
  useEffect(() => {
    const storedAgent = localStorage.getItem('selectedDashboardAgent');
    if (storedAgent) {
      try {
        const agent = JSON.parse(storedAgent);
        setSelectedAgent(agent);
      } catch (error) {
        console.error('Error parsing stored dashboard agent:', error);
      }
    }
  }, []);

  const handleUploadDocument = () => {
    router.push('/upload');
  };

  const handlePasteText = () => {
    router.push('/upload?mode=text');
  };

  const handleContinuePractice = () => {
    if (selectedAgent) {
      // Store the selected agent for the practice session
      localStorage.setItem('selectedPracticeAgent', JSON.stringify(selectedAgent));
      router.push('/practice/new');
    } else {
      // If no agent is selected, go to interviewers page first
      toast({
        title: "Select an Interviewer",
        description: "Please select an interviewer first to continue practice.",
      });
      router.push('/dashboard/interviewers');
    }
  };

  const handleViewProgress = () => {
    router.push('/analytics');
  };

  const handleChangeAgent = () => {
    router.push('/dashboard/interviewers');
  };

  const createTestLog = async () => {
    try {
      const response = await fetch('/api/test-create-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          call_id: `test_call_${Date.now()}`,
          agent_name: 'Test Interviewer'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create test log');
      }

      const data = await response.json();
      toast({
        title: "Test Log Created",
        description: "A test conversation log has been created successfully.",
      });
      
      console.log('Test log created:', data);
    } catch (error) {
      console.error('Error creating test log:', error);
      toast({
        title: "Error",
        description: "Failed to create test log. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) {
      return "text-green-600";
    }
    if (score >= 60) {
      return "text-yellow-600";
    }

    return "text-red-600";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) {
      return "A";
    }
    if (score >= 80) {
      return "B";
    }
    if (score >= 70) {
      return "C";
    }
    if (score >= 60) {
      return "D";
    }

    return "F";
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">FoloUp</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-600 text-sm font-medium">
                {user?.user_metadata?.first_name?.[0] || user?.email?.[0] || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="px-4 py-6 bg-gradient-to-br from-blue-600 to-blue-700">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Master your interviews</h2>
          <p className="text-blue-100 mb-6">
            Upload job descriptions, get personalized questions, and improve your skills
          </p>
          <motion.button
            className="w-full bg-white text-blue-600 font-semibold py-3 px-6 rounded-xl shadow-lg"
            whileTap={{ scale: 0.95 }}
            onClick={handleUploadDocument}
          >
            Start Practice Interview
          </motion.button>
        </div>
      </div>

      {/* Selected Agent Section */}
      {selectedAgent && (
        <div className="px-4 py-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-blue-600">
                    {selectedAgent.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Your Interviewer</h3>
                  <p className="text-sm text-gray-600">{selectedAgent.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {selectedAgent.category}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {selectedAgent.difficulty}
                    </span>
                  </div>
                </div>
              </div>
              <button
                className="text-sm text-blue-600 hover:text-blue-700 underline"
                onClick={handleChangeAgent}
              >
                Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Upload Document */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50"
            onClick={handleUploadDocument}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CloudArrowUpIcon className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Upload Job Description</span>
            </div>
          </motion.div>

          {/* Paste Text */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50"
            onClick={handlePasteText}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Paste Job Description</span>
            </div>
          </motion.div>

          {/* Continue Practice */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50"
            onClick={handleContinuePractice}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Continue Practice</span>
            </div>
          </motion.div>

          {/* View Progress */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50"
            onClick={handleViewProgress}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">My Progress</span>
            </div>
          </motion.div>

          {/* View Logs */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50"
            onClick={() => router.push('/practice/logs')}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">View Logs</span>
            </div>
          </motion.div>

                  {/* Test Logs */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50"
          onClick={() => router.push('/test-logs')}
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Test Logs</span>
          </div>
        </motion.div>

        {/* Create Test Log */}
        <motion.div
          whileTap={{ scale: 0.95 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50"
          onClick={createTestLog}
        >
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <PlusIcon className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">Create Test Log</span>
          </div>
        </motion.div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="px-4 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Recent Practice Sessions</h3>
          </div>
          
          {recentSessions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentSessions.map((session) => (
                <div key={session.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {session.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {session.type} • {session.questionCount} questions
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(session.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`text-sm font-bold ${getScoreColor(session.score)}`}>
                        {session.score}%
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        session.score >= 80 ? 'bg-green-100 text-green-600' :
                        session.score >= 60 ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {getScoreGrade(session.score)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <MicrophoneIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No practice sessions yet</p>
              <p className="text-gray-400 text-xs mt-1">Start your first interview practice</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-200">
            <div className="text-lg font-bold text-blue-600">{recentSessions.length}</div>
            <div className="text-xs text-gray-500">Sessions</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-200">
            <div className="text-lg font-bold text-green-600">
              {recentSessions.length > 0 
                ? Math.round(recentSessions.reduce((acc, s) => acc + s.score, 0) / recentSessions.length)
                : 0
              }%
            </div>
            <div className="text-xs text-gray-500">Avg Score</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-200">
            <div className="text-lg font-bold text-purple-600">
              {recentSessions.length > 0 
                ? recentSessions.reduce((acc, s) => acc + s.questionCount, 0)
                : 0
              }
            </div>
            <div className="text-xs text-gray-500">Questions</div>
          </div>
        </div>
      </div>
    </div>
  );
}
