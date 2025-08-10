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
  PlusIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/auth.context";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";

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
  const [selectedAgent, setSelectedAgent] = useState<VoiceAgent | null>(null);
  const [recentSessions, setRecentSessions] = useState<PracticeSession[]>([]);
  const [allSessions, setAllSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSessions, setTotalSessions] = useState(0);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const sessionsPerPage = 10;

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

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, router]);

  // Fetch practice sessions from database
  useEffect(() => {
    const fetchPracticeSessions = async () => {
      if (!isAuthenticated || !user) {
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch('/api/practice-sessions');
        
        if (response.ok) {
          const data = await response.json();
          const sessions = data.sessions || [];

          // Show all sessions, sorted by most recent first
          const sortedSessions = sessions.sort((a: any, b: any) => 
            new Date(b.end_time || b.updated_at || b.created_at || 0).getTime() - 
            new Date(a.end_time || a.updated_at || a.created_at || 0).getTime()
          );

          const transformedSessions: PracticeSession[] = sortedSessions.map((session: any) => ({
            id: session.id,
            title: session.session_name,
            type: session.agent_name ? `${session.agent_name} Interview` : 'Practice Interview',
            // Only show score when finished_all_questions is true
            score: session.finished_all_questions ? (session.score || 0) : undefined,
            date: session.created_at,
            endedAt: session.end_time || session.updated_at || session.created_at,
            questionCount: (Array.isArray(session.questions) ? session.questions.length : (session.total_questions || 0))
          }));
          
          // Store all sessions for stats and pagination
          setAllSessions(transformedSessions);
          setTotalSessions(transformedSessions.length);
          
          // Apply pagination: show only sessions for current page
          const startIndex = (currentPage - 1) * sessionsPerPage;
          const endIndex = startIndex + sessionsPerPage;
          const paginatedSessions = transformedSessions.slice(startIndex, endIndex);
          
          setRecentSessions(paginatedSessions);
        } else {
          console.error('Failed to fetch practice sessions');
          // Show empty state if no sessions found
          setRecentSessions([]);
        }
      } catch (error) {
        console.error('Error fetching practice sessions:', error);
        // Show empty state on error
        setRecentSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPracticeSessions();
  }, [isAuthenticated, user, currentPage]);

  // Reset to page 1 when user changes to avoid empty pages
  useEffect(() => {
    setCurrentPage(1);
  }, [user]);

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
    } else {
      // Set a sensible default interviewer (Lisa) for first-time visitors
      const defaultAgent = {
        agent_id: 'mock-agent-lisa',
        name: 'Lisa',
        description: 'AI interviewer for practice sessions',
        voice_id: 'default-voice',
        category: 'general',
        difficulty: 'medium',
        specialties: ['practice', 'general']
      } as any;
      setSelectedAgent(defaultAgent);
      localStorage.setItem('selectedDashboardAgent', JSON.stringify(defaultAgent));
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

  // Selection and deletion functions
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedSessions(recentSessions.map(session => session.id));
    } else {
      setSelectedSessions([]);
    }
  };

  const toggleSelecting = () => {
    setIsSelecting((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedSessions([]);
        setSelectAll(false);
      }
      
return next;
    });
  };

  const handleSelectSession = (sessionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSessions(prev => [...prev, sessionId]);
    } else {
      setSelectedSessions(prev => prev.filter(id => id !== sessionId));
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
        // Remove from local state
        setRecentSessions(prev => prev.filter(session => session.id !== sessionId));
        setAllSessions(prev => prev.filter(session => session.id !== sessionId));
        setTotalSessions(prev => prev - 1);
        setSelectedSessions(prev => prev.filter(id => id !== sessionId));
        
        toast({
          title: "Session Deleted",
          description: "Practice session has been successfully deleted.",
        });
      } else {
        throw new Error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionIds: selectedSessions }),
      });

      if (response.ok) {
        // Remove from local state
        setRecentSessions(prev => prev.filter(session => !selectedSessions.includes(session.id)));
        setAllSessions(prev => prev.filter(session => !selectedSessions.includes(session.id)));
        setTotalSessions(prev => prev - selectedSessions.length);
        setSelectedSessions([]);
        setSelectAll(false);
        
        toast({
          title: "Sessions Deleted",
          description: `Successfully deleted ${selectedSessions.length} sessions.`,
        });
      } else {
        throw new Error('Failed to delete sessions');
      }
    } catch (error) {
      console.error('Error deleting sessions:', error);
      toast({
        title: "Error", 
        description: "Failed to delete sessions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
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
    <>
    <div className="min-h-screen bg-gray-50">
      {/* Removed duplicate mobile header to avoid double top bars; global navbar remains */}

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
                Change Interviewer
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
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="px-4 pb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <h3 className="font-semibold text-gray-900">Recent Practice Sessions</h3>
              <div className="flex items-center gap-4">
                {!isSelecting ? (
                  <button
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-50"
                    onClick={toggleSelecting}
                  >
                    Select to Remove
                  </button>
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
            {totalSessions > sessionsPerPage && (
              <div className="mt-3 flex items-center justify-between">
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
                        {/* Title revised to avoid duplication and be concise */}
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          Interview with {session.type.replace(' Interview','')}
                        </h4>
                        {/* Timestamp directly under title in the same color tone as other metadata */}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(session.date).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {/* Compact meta: topic + questions */}
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
                            </>
                          ) : (
                            <div className="text-xs text-gray-400">
                              {new Date((session as any).endedAt || session.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </>
                      )}
                      <button
                        className="p-2 rounded-lg border border-gray-300 hover:bg-red-50 text-red-600"
                        aria-label="Delete session"
                        disabled={deleting}
                        title="Delete"
                        onClick={() => openConfirmForSingle(session.id, `Interview with ${session.type.replace(' Interview','')} on ${new Date(session.date).toLocaleString()}`)}
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
              <p className="text-gray-400 text-xs mt-1">Start your first interview practice</p>
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
