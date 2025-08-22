"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/auth.context";
import { useRouter, useSearchParams } from "next/navigation";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { Button } from "@/components/ui/button";
import AnimatedInterviewBanner from "@/components/AnimatedInterviewBanner";
import { 
  CloudArrowUpIcon, 
  DocumentTextIcon, 
  ClockIcon, 
  ChartBarIcon,
  MicrophoneIcon,
  TrashIcon,
  CheckIcon,
  CreditCardIcon
} from "@heroicons/react/24/outline";
import { toast } from "@/components/ui/use-toast";
import { useInterviewSession } from "@/hooks/use-interview-session";
import { analyzeInterviewProgress, canResumeInterview, type QuestionProgress } from '@/lib/conversation-analysis';
import CreditsDisplay from "@/components/CreditsDisplay";

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
  score?: number;
  date: string;
  endedAt?: string;
  questionCount: number;
  status?: string;
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedAgent, setSelectedAgent] = useState<VoiceAgent | null>(null);
  const [recentSessions, setRecentSessions] = useState<PracticeSession[]>([]);
  const [allSessions, setAllSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(false); // Start with false, not true
  
  // Interview session management
  const { 
    allSessions: interviewSessions, 
    loadAllSessions, 
    resumeSession,
    loading: sessionsLoading 
  } = useInterviewSession();
  
  // Conversation logs for resume functionality
  const [conversationLogs, setConversationLogs] = useState<any[]>([]);
  const [resumeInfo, setResumeInfo] = useState<{agentId: string; agentName: string; progress: QuestionProgress; logId: string} | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showProgressDetails, setShowProgressDetails] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const sessionsPerPage = 10;

  // Credit state is now managed by CreditsDisplay component

  // Deletion confirmation modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<{ type: 'single' | 'bulk'; sessionId?: string; itemName?: string } | null>(null);

  const openConfirmForSingle = (sessionId: string, itemName?: string) => {
    setConfirmConfig({ type: 'single', sessionId, itemName });
    setConfirmOpen(true);
  };

  const openConfirmForBulk = () => {
    setConfirmConfig({ type: 'bulk' });
    setConfirmOpen(true);
  };

  const confirmDeletion = async () => {
    if (!confirmConfig) {return;}
    if (confirmConfig.type === 'single' && confirmConfig.sessionId) {
      await handleDeleteSession(confirmConfig.sessionId);
    } else if (confirmConfig.type === 'bulk') {
      await handleBulkDelete();
    }
    setConfirmOpen(false);
  };

  // Load conversation logs to check for resumable interviews
  const loadConversationLogs = async () => {
    try {
      const response = await fetch('/api/get-conversation-logs', {
        credentials: 'include'
      });
      if (response.ok) {
        const responseData = await response.json();
        console.log('📊 Conversation logs response:', responseData);
        
        // Extract logs array from the response
        const logs = responseData.logs || [];
        setConversationLogs(responseData);
        
        // Check for resumable interviews
        // For now, we'll use a default 10 questions per interview
        // In the future, this could be dynamic based on the interview type
        const defaultQuestionCount = 10;
        
        // Find the most recent incomplete interview across all agents
        let bestResumeOption = null;
        
        for (const log of logs) {
          const resumeCheck = canResumeInterview([log], log.agent_id, defaultQuestionCount);
          if (resumeCheck.canResume && resumeCheck.progress) {
            bestResumeOption = {
              agentId: log.agent_id,
              agentName: log.agent_name,
              progress: resumeCheck.progress,
              logId: log.id
            };
            break; // Take the most recent one
          }
        }
        
        setResumeInfo(bestResumeOption);
      }
    } catch (error) {
      console.error('Error loading conversation logs:', error);
    }
  };

  // Function to handle reset and retry for completed sessions
  const handleResetAndRetry = async (session: PracticeSession) => {
    try {
      console.log('🔄 Resetting and retrying session:', session.id);
      
      // First, get the original session data to extract questions
      const sessionResponse = await fetch(`/api/practice-sessions/${session.id}`);
      if (!sessionResponse.ok) {
        throw new Error('Failed to fetch original session data');
      }
      
      const sessionData = await sessionResponse.json();
      const originalQuestions = sessionData.session.questions || [];
      
      console.log('📋 Original questions found:', originalQuestions.length);
      
      // Reset the session status to in-progress
              await fetch('/api/practice-sessions', {
          credentials: 'include',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          status: 'in-progress',
          start_time: new Date().toISOString(),
          end_time: null,
          score: null,
          duration: null,
        }),
      });
      
      console.log('✅ Session reset to in-progress');
      
      // Redirect to the continue page (same as Continue button)
      router.push(`/practice/continue/${session.id}`);
      
      toast({
        title: "Session Reset",
        description: "Session has been reset! You can now retry the interview.",
      });
    } catch (error) {
      console.error('❌ Error resetting session:', error);
      toast({
        title: "Reset Failed",
        description: "Failed to reset session. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Helper function to safely get session display name
  const getSessionDisplayName = (session: PracticeSession) => {
    if (!session.type) {return 'AI Interviewer';}
    
return session.type.replace(' Interview', '');
  };

  // Fetch practice sessions from database
  const fetchPracticeSessions = useCallback(async () => {
      if (!isAuthenticated || !user) {
      setLoading(false);
      
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch('/api/practice-sessions', {
        credentials: 'include'
      });
        
        if (response.ok) {
          const data = await response.json();
        setRecentSessions(data.sessions.slice(0, 5));
        setAllSessions(data.sessions);
        setTotalSessions(data.sessions.length);
        }
      } catch (error) {
        console.error('Error fetching practice sessions:', error);
      } finally {
        setLoading(false);
      }
  }, [isAuthenticated, user]);

  // Fetch practice sessions only once when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
    fetchPracticeSessions();
      // Also load interview sessions for resume functionality
      loadAllSessions();
      // Load conversation logs to check for resumable interviews
      loadConversationLogs();
    } else {
      // Reset loading state when user is not authenticated
      setLoading(false);
      setRecentSessions([]);
      setAllSessions([]);
      setTotalSessions(0);
      setConversationLogs([]);
      setResumeInfo(null);
    }
  }, [isAuthenticated, user]); // Only depend on auth state, not the function

  // Credit updates are now handled by CreditsDisplay component
  // No need to fetch subscription data manually

  // Handle payment success
  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    
    if (success === 'true' && sessionId) {
      toast({
        title: "🎉 Payment Successful!",
        description: "Your credits have been added to your account. You can now use them for practice interviews.",
        duration: 8000,
      });
      
      // Dispatch custom event to notify navigation component
      window.dispatchEvent(new CustomEvent('payment-success'));
      
      // Clean up URL parameters
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams, router]);

  const handleUploadDocument = () => {
    router.push('/upload');
  };

  const handlePasteText = () => {
    router.push('/upload?mode=text');
  };

    const handleContinuePractice = async () => {
    // Check for resumable interviews based on conversation logs
    if (resumeInfo) {
      try {
        setLoading(true);
        console.log('🔄 Resuming interview from conversation logs:', {
          agent: resumeInfo.agentName,
          questionsAnswered: resumeInfo.progress.questionsAnswered,
          nextQuestion: resumeInfo.progress.nextQuestionNumber
        });
        
        // Navigate to practice page with resume parameters
        // We'll pass the log ID and agent info to restore the conversation
        const resumeParams = new URLSearchParams({
          resumeFromLog: resumeInfo.logId,
          agentId: resumeInfo.agentId,
          questionsAnswered: resumeInfo.progress.questionsAnswered.toString(),
          nextQuestion: resumeInfo.progress.nextQuestionNumber.toString()
        });
        
        router.push(`/practice/new?${resumeParams.toString()}`);
        
        toast({
          title: "Interview Resumed",
          description: `Continuing interview with ${resumeInfo.agentName}. Starting from question ${resumeInfo.progress.nextQuestionNumber} of ${resumeInfo.progress.totalQuestions}.`,
        });
      } catch (error) {
        console.error('Error resuming interview:', error);
        toast({
          title: "Resume Failed",
          description: "Failed to resume interview. You can start a new practice instead.",
        });
      } finally {
        setLoading(false);
      }
    } else if (recentSessions.length > 0) {
      // Fallback to old system for backward compatibility
      const lastSession = recentSessions[0];
      if (lastSession.status !== 'completed') {
        router.push(`/practice/continue/${lastSession.id}`);
    } else {
      toast({
          title: "No active session",
          description: "All recent sessions are completed. Start a new practice session.",
        });
      }
    } else {
      toast({
        title: "No sessions to resume",
        description: "Start your first practice session to begin.",
      });
    }
  };

  const handleViewProgress = () => {
    router.push('/dashboard');
  };

  const handleChangeAgent = () => {
            router.push('/practice/new');
  };

  const handleSelectSession = (sessionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSessions(prev => [...prev, sessionId]);
    } else {
      setSelectedSessions(prev => prev.filter(id => id !== sessionId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSessions(allSessions.map(s => s.id));
      setSelectAll(true);
    } else {
      setSelectedSessions([]);
      setSelectAll(false);
    }
  };

  const toggleSelecting = () => {
    setIsSelecting(!isSelecting);
    if (isSelecting) {
        setSelectedSessions([]);
      setSelectAll(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/practice-sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Session deleted",
          description: "Practice session has been removed successfully.",
        });
        await fetchPracticeSessions();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete session. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the session.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSessions.length === 0) {return;}

    try {
      setDeleting(true);
      const response = await fetch('/api/practice-sessions', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionIds: selectedSessions }),
      });

      if (response.ok) {
        toast({
          title: "Sessions deleted",
          description: `${selectedSessions.length} practice session(s) have been removed successfully.`,
        });
        setSelectedSessions([]);
        setSelectAll(false);
        await fetchPracticeSessions();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete sessions. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting sessions:', error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the sessions.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleClearAllSessions = async () => {
    if (!confirm('Are you sure you want to delete ALL practice sessions? This action cannot be undone.')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch('/api/clear-all-sessions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "All Sessions Cleared", 
          description: `Successfully deleted ${data.deletedCount} practice sessions.` 
        });
        setRecentSessions([]);
        setAllSessions([]);
        setTotalSessions(0);
        setSelectedSessions([]);
        setSelectAll(false);
        setCurrentPage(1);
      } else {
        toast({
          title: "Error",
          description: "Failed to clear all sessions. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error clearing all sessions:', error);
      toast({
        title: "Error", 
        description: "An error occurred while clearing sessions.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MicrophoneIcon className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign in to Access Your Dashboard</h2>
          <p className="text-gray-600 mb-6">You need to be authenticated to access our AI-powered interview practice services.</p>
          <div className="space-y-3">
            <Button className="w-full" onClick={() => router.push('/sign-in')}>
              Sign In
            </Button>
            <Button variant="outline" className="w-full" onClick={() => router.push('/sign-up')}>
              Create Account
            </Button>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Service Tiers:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Free Users:</strong> 10 minutes interview time</p>
              <p>• <strong>Pro Users:</strong> 1 minute per minute of practice</p>
              <p className="text-xs text-blue-600 mt-2">Based on actual AI costs: LLM + Voice Engine</p>
            </div>
          </div>
          
          {/* Cost Breakdown */}
          <div className="mt-4 p-4 bg-white/80 backdrop-blur-md rounded-lg border border-blue-200/50">
            <h3 className="font-semibold text-blue-900 mb-3">Cost Breakdown (Per Minute)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">LLM Cost:</span>
                <span className="font-medium text-green-600">$0.003</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Voice Engine Cost:</span>
                <span className="font-medium text-blue-600">$0.070</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Telephony Cost:</span>
                <span className="font-medium text-gray-500">$0.000</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total Cost:</span>
                  <span className="font-bold text-blue-900">$0.073</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Your Price:</span>
                  <span className="font-bold text-green-700">1 minute</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-600">Profit Margin:</span>
                  <span className="text-xs font-medium text-green-600">64%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
        <AnimatedInterviewBanner />

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
                Change Interviewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Grid */}
      <div className="px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              className={`bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50 ${
                (sessionsLoading || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              onClick={!sessionsLoading && !loading ? handleContinuePractice : undefined}
          >
            <div className="flex flex-col items-center text-center space-y-2">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  resumeInfo
                    ? 'bg-green-100' 
                    : 'bg-purple-100'
                }`}>
                  <ClockIcon className={`w-6 h-6 ${
                    resumeInfo
                      ? 'text-green-600' 
                      : 'text-purple-600'
                  }`} />
              </div>
                <span className="text-sm font-medium text-gray-900">
                  {loading ? 'Loading...' : 'Continue Practice'}
                </span>
                <span className="text-xs text-gray-500">
                  {resumeInfo
                    ? `Resume from Question ${resumeInfo.progress.nextQuestionNumber} from Last Session`
                    : 'Start new interview'
                  }
                </span>
            </div>
          </motion.div>

            {/* My Progress */}
          <motion.div
            whileTap={{ scale: 0.95 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50 cursor-pointer"
              onClick={() => setShowProgressDetails(!showProgressDetails)}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">My Progress</span>
                {recentSessions.length > 0 && (
                  <div className="text-xs text-gray-500">
                    {recentSessions.filter(s => s.score !== undefined).length} scored sessions
                  </div>
                )}
            </div>
          </motion.div>

          {/* View Logs */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50"
              onClick={() => router.push('/conversation-logs')}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <DocumentTextIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">View Logs</span>
            </div>
          </motion.div>

            {/* Credit Balance Card */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:bg-gray-50"
              onClick={() => router.push('/premium')}
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CreditCardIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <CreditsDisplay variant="detailed" />
              </div>
            </motion.div>
        </div>
      </div>

        {/* Progress Details Section */}
        {showProgressDetails && recentSessions.length > 0 && (
      <div className="px-4 pb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Progress Analytics</h3>
                <button
                  onClick={() => setShowProgressDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Progress Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">
                    {recentSessions.filter(s => s.score !== undefined).length}
                  </div>
                  <div className="text-sm text-blue-600">Scored Sessions</div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-2xl font-bold text-green-700">
                    {recentSessions.filter(s => s.score !== undefined).length > 0 
                      ? (recentSessions.filter(s => s.score !== undefined).reduce((sum, s) => sum + (s.score || 0), 0) / recentSessions.filter(s => s.score !== undefined).length).toFixed(1)
                      : '0'}%
                  </div>
                  <div className="text-sm text-green-600">Average Score</div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-2xl font-bold text-purple-700">
                    {recentSessions.length}
                  </div>
                  <div className="text-sm text-purple-600">Total Sessions</div>
                </div>
                
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="text-2xl font-bold text-orange-700">
                    {recentSessions.filter(s => s.score !== undefined && (s.score || 0) >= 80).length}
                  </div>
                  <div className="text-sm text-orange-600">High Scores (80%+)</div>
                </div>
              </div>

              {/* Score Distribution */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Score Distribution</h4>
                <div className="space-y-3">
                  {[
                    { range: '90-100%', color: 'bg-green-500', count: recentSessions.filter(s => s.score !== undefined && (s.score || 0) >= 90).length },
                    { range: '80-89%', color: 'bg-green-400', count: recentSessions.filter(s => s.score !== undefined && (s.score || 0) >= 80 && (s.score || 0) < 90).length },
                    { range: '70-79%', color: 'bg-yellow-400', count: recentSessions.filter(s => s.score !== undefined && (s.score || 0) >= 70 && (s.score || 0) < 80).length },
                    { range: '60-69%', color: 'bg-orange-400', count: recentSessions.filter(s => s.score !== undefined && (s.score || 0) >= 60 && (s.score || 0) < 70).length },
                    { range: 'Below 60%', color: 'bg-red-400', count: recentSessions.filter(s => s.score !== undefined && (s.score || 0) < 60).length }
                  ].map(({ range, color, count }) => (
                    <div key={range} className="flex items-center gap-3">
                      <div className="w-20 text-sm text-gray-600">{range}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full ${color} transition-all duration-500`}
                          style={{ 
                            width: `${recentSessions.filter(s => s.score !== undefined).length > 0 
                              ? (count / recentSessions.filter(s => s.score !== undefined).length) * 100 
                              : 0}%` 
                          }}
                        />
                      </div>
                      <div className="w-12 text-sm text-gray-600 text-right">{count}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Performance */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Recent Performance</h4>
                <div className="space-y-2">
                  {recentSessions
                    .filter(s => s.score !== undefined)
                    .slice(0, 5)
                    .map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">
                            {getSessionDisplayName(session)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(session.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          (session.score || 0) >= 80 ? 'bg-green-100 text-green-800' :
                          (session.score || 0) >= 70 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {session.score?.toFixed(1)}%
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Past Practice Sessions */}
        <div className="px-4 pb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Past Practice Sessions</h3>
                {!isSelecting ? (
                  <>
                    <div className="flex items-center space-x-2">
                  <button
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                    onClick={toggleSelecting}
                  >
                    Select to Remove
                  </button>
                      <button
                        className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50"
                        disabled={deleting}
                        onClick={handleClearAllSessions}
                      >
                        {deleting ? 'Clearing...' : 'Clear All Sessions'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selectAll}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                      Select all
                    </label>
                    <button
                      disabled={selectedSessions.length === 0 || deleting}
                      className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={openConfirmForBulk}
                    >
                      {deleting ? 'Deleting...' : `Delete Selected${selectedSessions.length ? ` (${selectedSessions.length})` : ''}`}
                    </button>
                    <button
                      className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                      onClick={toggleSelecting}
                    >
                      Done
                    </button>
                  </>
                )}
              </div>
          </div>
          
          {loading ? (
            <div className="px-4 py-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading practice sessions...</p>
            </div>
          ) : recentSessions.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {recentSessions.map((session) => (
                <div key={session.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {isSelecting && (
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4"
                          checked={selectedSessions.includes(session.id)}
                          aria-label="Select session"
                          onChange={(e) => handleSelectSession(session.id, e.target.checked)}
                        />
                      )}
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                            Interview with {getSessionDisplayName(session)}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(session.date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {session.questionCount} questions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {session.status !== 'completed' ? (
                        <button
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
                          onClick={() => router.push(`/practice/continue/${session.id}`)}
                        >
                          Continue
                        </button>
                      ) : (
                        <>
                          {typeof session.score === 'number' && session.score > 0 ? (
                            <>
                                <div className={`text-sm font-bold ${session.score >= 80 ? 'text-green-600' : session.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {session.score}%
                              </div>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                session.score >= 80 ? 'bg-green-100 text-green-600' :
                                session.score >= 60 ? 'bg-yellow-100 text-yellow-600' :
                                'bg-red-100 text-red-600'
                              }`}>
                                  {session.score >= 80 ? 'A' : session.score >= 60 ? 'B' : 'C'}
                              </div>
                            </>
                          ) : (
                            <div className="text-xs text-gray-400">
                              {new Date((session as any).endedAt || session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                            {/* Reset & Retry Button for Completed Sessions */}
                            <button
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
                              onClick={() => handleResetAndRetry(session)}
                              title="Reset and retry this interview"
                            >
                              Reset & Retry
                            </button>
                        </>
                      )}
                      <button
                        className="p-2 rounded-lg border border-gray-300 hover:bg-red-50 text-red-600"
                        aria-label="Delete session"
                        disabled={deleting}
                        title="Delete"
                          onClick={() => openConfirmForSingle(session.id, `Interview with ${getSessionDisplayName(session)} on ${new Date(session.date).toLocaleString()}`)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-8 text-center">
              <MicrophoneIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No practice sessions yet</p>
                <p className="text-gray-400 text-xs mt-1 mb-4">Start your first interview practice</p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    onClick={() => router.push('/upload')}
                  >
                    📄 Upload Job Description
                  </button>
                  <button
                    className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    onClick={() => router.push('/upload?mode=text')}
                  >
                    ✍️ Paste Job Description
                  </button>
                </div>
            </div>
          )}
          
          {/* Pagination Controls */}
          {totalSessions > sessionsPerPage && (
            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {Math.min((currentPage - 1) * sessionsPerPage + 1, totalSessions)} to {Math.min(currentPage * sessionsPerPage, totalSessions)} of {totalSessions} sessions
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md">
                  {currentPage}
                </span>
                <button
                  disabled={currentPage >= Math.ceil(totalSessions / sessionsPerPage)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalSessions / sessionsPerPage), prev + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Invoice History - Temporarily removed while migrating to new credit system */}
        <div className="px-4 pb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CreditCardIcon className="w-5 h-5 mr-2 text-blue-600" />
                Purchase History
              </h3>
            </div>
            <div className="p-4">
              <div className="text-center py-6">
                <CreditCardIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Purchase history temporarily unavailable</p>
                <p className="text-gray-400 text-xs mt-1">We're updating the credit system</p>
              </div>
            </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 pb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-200">
            <div className="text-lg font-bold text-blue-600">{totalSessions}</div>
            <div className="text-xs text-gray-500">Total Sessions</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-200">
            <div className="text-lg font-bold text-green-600">
              {allSessions.length > 0 
                ? Math.round(
                    allSessions.filter((s) => typeof s.score === 'number').reduce((acc, s) => acc + (s.score as number), 0) /
                    Math.max(1, allSessions.filter((s) => typeof s.score === 'number').length)
                  )
                : 0
              }%
            </div>
            <div className="text-xs text-gray-500">Avg Score</div>
          </div>
          <div className="bg-white rounded-lg p-3 text-center shadow-sm border border-gray-200">
            <div className="text-lg font-bold text-purple-600">
              {allSessions.length > 0 
                ? allSessions.reduce((acc, s) => acc + s.questionCount, 0)
                : 0
              }
            </div>
            <div className="text-xs text-gray-500">Total Questions</div>
          </div>
        </div>
      </div>
    </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={confirmOpen}
        title={confirmConfig?.type === 'bulk' ? 'Delete selected sessions?' : 'Delete this session?'}
        description={confirmConfig?.type === 'bulk' ? `This will permanently delete ${selectedSessions.length} session${selectedSessions.length > 1 ? 's' : ''}.` : 'This action cannot be undone.'}
        itemName={confirmConfig?.itemName}
        isLoading={deleting}
        destructiveAction="Delete"
        onConfirm={confirmDeletion}
        onClose={() => setConfirmOpen(false)}
      />
  </>
  );
}
