"use client";

import "../../globals.css";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeftIcon, 
  MicrophoneIcon,
  ClockIcon,
  ChartBarIcon,
  PlayIcon,
  ShareIcon,
  TrashIcon,
  DocumentTextIcon
} from "@heroicons/react/24/outline";
import { useAuth } from "@/contexts/auth.context";
import { toast } from "@/components/ui/use-toast";
import Navbar from "@/components/navbar";

export const dynamic = 'force-dynamic';

interface PracticeSession {
  id: string;
  title: string;
  type: string;
  score: number;
  date: string;
  questionCount: number;
  questions: Array<{
    id: string;
    text: string;
    type: string;
    difficulty: string;
    category: string;
  }>;
  duration?: number;
  status: 'completed' | 'in-progress' | 'abandoned';
  email?: string;
  name?: string;
}

export default function PracticeHistoryPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress'>('all');

  // Mock data - in real app, this would come from database
  const mockSessions: PracticeSession[] = [
    {
      id: 'session-1',
      title: 'Software Engineer Interview',
      type: 'Technical',
      score: 85,
      date: '2024-01-15T10:30:00Z',
      questionCount: 5,
      questions: [
        {
          id: '1',
          text: 'Tell me about a challenging technical problem you solved recently.',
          type: 'behavioral',
          difficulty: 'medium',
          category: 'Problem Solving'
        },
        {
          id: '2',
          text: 'How would you design a scalable web application?',
          type: 'system-design',
          difficulty: 'hard',
          category: 'System Design'
        }
      ],
      duration: 1800, // 30 minutes
      status: 'completed',
      email: 'john@example.com',
      name: 'John Doe'
    },
    {
      id: 'session-2',
      title: 'Product Manager Interview',
      type: 'Behavioral',
      score: 92,
      date: '2024-01-14T14:20:00Z',
      questionCount: 4,
      questions: [
        {
          id: '1',
          text: 'Describe a time when you had to make a difficult product decision.',
          type: 'behavioral',
          difficulty: 'medium',
          category: 'Leadership'
        }
      ],
      duration: 1500, // 25 minutes
      status: 'completed',
      email: 'john@example.com',
      name: 'John Doe'
    },
    {
      id: 'session-3',
      title: 'Data Scientist Interview',
      type: 'Technical',
      score: 0,
      date: '2024-01-13T09:15:00Z',
      questionCount: 6,
      questions: [
        {
          id: '1',
          text: 'Explain the difference between supervised and unsupervised learning.',
          type: 'technical',
          difficulty: 'easy',
          category: 'Machine Learning'
        }
      ],
      status: 'in-progress',
      email: 'john@example.com',
      name: 'John Doe'
    }
  ];

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    // Load practice sessions
    loadPracticeSessions();
  }, [isAuthenticated, authLoading, router]);

  const loadPracticeSessions = async () => {
    try {
      setIsLoading(true);
      
      // Fetch from API
      const response = await fetch('/api/practice-sessions');
      const data = await response.json();
      
      if (response.ok) {
        // Filter only completed sessions and transform database data
        const completedSessions = data.sessions.filter((session: any) => session.status === 'completed');
        const transformedSessions = completedSessions.map((session: any) => ({
          id: session.id,
          title: session.session_name,
          type: session.interviews?.interview_type || 'Practice',
          score: session.score || 0,
          date: session.created_at,
          questionCount: session.total_questions || 0,
          questions: session.practice_responses?.map((response: any) => ({
            id: response.id,
            text: response.user_response || '',
            type: 'general',
            difficulty: 'medium',
            category: 'Practice'
          })) || [],
          duration: session.duration_seconds,
          status: session.status,
          email: user?.email,
          name: user?.user_metadata?.full_name || user?.email
        }));
        
        setSessions(transformedSessions);
      } else {
        console.error('Error fetching practice sessions:', data.error);
        // Fallback to mock data in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Development mode: Using mock practice sessions');
          setSessions(mockSessions);
        } else {
          toast({
            title: "Error",
            description: "Failed to load practice sessions.",
            variant: "destructive",
          });
        }
      }
      
    } catch (error) {
      console.error('Error loading practice sessions:', error);
      
      // Fallback to mock data in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Development mode: Using mock practice sessions due to error');
        setSessions(mockSessions);
      } else {
        toast({
          title: "Error",
          description: "Failed to load practice sessions.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinuePractice = (session: PracticeSession) => {
    if (session.status === 'in-progress') {
      // Continue existing session
      router.push(`/practice/continue/${session.id}`);
    } else {
      // Retake completed session
      router.push(`/practice/retake/${session.id}`);
    }
  };

  const handleShareSession = (session: PracticeSession) => {
    // Copy share link to clipboard
    const shareUrl = `${window.location.origin}/practice/shared/${session.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: "Link Copied",
        description: "Practice session link copied to clipboard!",
      });
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      // In a real app, this would call API to delete
      // await fetch(`/api/practice-sessions/${sessionId}`, { method: 'DELETE' });
      
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({
        title: "Session Deleted",
        description: "Practice session has been deleted.",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete practice session.",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'abandoned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    return session.status === filter;
  });

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Redirecting to sign in...'}
          </p>
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
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Practice History</h1>
            <p className="text-sm text-gray-500">
              {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="w-9"></div> {/* Spacer */}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-3 bg-white border-b border-gray-200 pt-20">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              filter === 'all' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              filter === 'completed' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
              filter === 'in-progress' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            In Progress
          </button>
        </div>
      </div>

      {/* Practice Sessions List */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-16 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {session.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(session.status)}`}>
                      {session.status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      {new Date(session.date).toLocaleDateString()}
                    </span>
                    <span>{session.questionCount} questions</span>
                    {session.duration && (
                      <span>{formatDuration(session.duration)}</span>
                    )}
                  </div>

                  {session.status === 'completed' && (
                    <div className="flex items-center space-x-3">
                      <div className={`text-lg font-bold ${getScoreColor(session.score)}`}>
                        {session.score}%
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        session.score >= 80 ? 'bg-green-100 text-green-600' :
                        session.score >= 60 ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {getScoreGrade(session.score)}
                      </div>
                      <span className="text-sm text-gray-500">Score</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleContinuePractice(session)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlayIcon className="w-4 h-4" />
                  </motion.button>
                  
                  {session.status === 'completed' && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push(`/practice/logs?call_id=${session.id}`)}
                      className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                      title="View Conversation Log"
                    >
                      <DocumentTextIcon className="w-4 h-4" />
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleShareSession(session)}
                    className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                  >
                    <ShareIcon className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteSession(session.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <MicrophoneIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No practice sessions</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? "You haven't started any practice sessions yet."
                : `No ${filter.replace('-', ' ')} sessions found.`
              }
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/upload')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Start Your First Practice
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
} 
