import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface InterviewSession {
  id: string;
  sessionKey: string;
  agentId: string;
  agentName: string;
  agentVoice?: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  questionsCompleted: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  conversationHistory?: any[];
  questions?: any[];
  lastAiResponse?: string;
  lastUserResponse?: string;
  currentTurn?: 'user' | 'ai' | 'waiting';
  timeSpent: number;
  completionPercentage: number;
  questionsRemaining: number;
  canResume: boolean;
  currentQuestion?: any;
  nextQuestion?: any;
  lastActivityAt: string;
  startedAt: string;
}

interface CreateSessionData {
  agentId: string;
  agentName: string;
  agentVoice?: string;
  questions: any[];
  estimatedDuration?: number;
  difficulty?: string;
}

interface UpdateSessionData {
  currentQuestionIndex?: number;
  questionsCompleted?: number;
  conversationHistory?: any[];
  lastAiResponse?: string;
  lastUserResponse?: string;
  currentTurn?: 'user' | 'ai' | 'waiting';
  timeSpent?: number;
  status?: 'active' | 'paused' | 'completed' | 'abandoned';
  snapshotType?: 'question_start' | 'question_complete' | 'pause' | 'resume' | 'error';
  responseTime?: number;
  confidenceScore?: number;
}

export const useInterviewSession = () => {
  const [currentSession, setCurrentSession] = useState<InterviewSession | null>(null);
  const [allSessions, setAllSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSaveData = useRef<string>('');

  // Create a new interview session
  const createSession = useCallback(async (sessionData: CreateSessionData): Promise<InterviewSession | null> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Creating new interview session...', sessionData);

      const response = await fetch('/api/interview-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create session');
      }

      console.log('✅ Session created successfully:', result.session);
      setCurrentSession(result.session);
      
      return result.session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create session';
      console.error('❌ Error creating session:', error);
      setError(errorMessage);
      toast.error(`Failed to create session: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load session by session key
  const loadSession = useCallback(async (sessionKey: string): Promise<InterviewSession | null> => {
    try {
      setLoading(true);
      setError(null);

      console.log('📁 Loading session:', sessionKey);

      const response = await fetch(`/api/interview-sessions/${sessionKey}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load session');
      }

      console.log('✅ Session loaded successfully:', result.session);
      setCurrentSession(result.session);
      
      return result.session;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session';
      console.error('❌ Error loading session:', error);
      setError(errorMessage);
      toast.error(`Failed to load session: ${errorMessage}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update session progress
  const updateSession = useCallback(async (sessionKey: string, updateData: UpdateSessionData): Promise<boolean> => {
    try {
      console.log('💾 Updating session progress:', sessionKey, updateData);

      const response = await fetch(`/api/interview-sessions/${sessionKey}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update session');
      }

      console.log('✅ Session updated successfully:', result.session);
      setCurrentSession(result.session);
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update session';
      console.error('❌ Error updating session:', error);
      setError(errorMessage);
      toast.error(`Failed to save progress: ${errorMessage}`);
      return false;
    }
  }, []);

  // Auto-save session progress
  const autoSaveSession = useCallback((sessionKey: string, updateData: UpdateSessionData) => {
    if (!sessionKey) return;

    // Debounce auto-save to avoid too many requests
    const dataString = JSON.stringify(updateData);
    if (dataString === lastSaveData.current) return;

    lastSaveData.current = dataString;

    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    autoSaveTimer.current = setTimeout(async () => {
      await updateSession(sessionKey, updateData);
    }, 2000); // Auto-save after 2 seconds of inactivity

  }, [updateSession]);

  // Load all user sessions
  const loadAllSessions = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      
      const response = await fetch(`/api/interview-sessions?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load sessions');
      }

      console.log('📋 Sessions loaded:', result.sessions?.length || 0);
      setAllSessions(result.sessions || []);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load sessions';
      console.error('❌ Error loading sessions:', error);
      setError(errorMessage);
      return { sessions: [], summary: { canResume: false } };
    } finally {
      setLoading(false);
    }
  }, []);

  // Complete session
  const completeSession = useCallback(async (sessionKey: string, finalData?: Partial<UpdateSessionData>): Promise<boolean> => {
    const updateData: UpdateSessionData = {
      ...finalData,
      status: 'completed',
      snapshotType: 'question_complete'
    };

    return await updateSession(sessionKey, updateData);
  }, [updateSession]);

  // Pause session
  const pauseSession = useCallback(async (sessionKey: string, pauseData?: Partial<UpdateSessionData>): Promise<boolean> => {
    const updateData: UpdateSessionData = {
      ...pauseData,
      status: 'paused',
      snapshotType: 'pause'
    };

    return await updateSession(sessionKey, updateData);
  }, [updateSession]);

  // Resume session
  const resumeSession = useCallback(async (sessionKey: string): Promise<InterviewSession | null> => {
    const session = await loadSession(sessionKey);
    if (session) {
      await updateSession(sessionKey, { 
        status: 'active',
        snapshotType: 'resume'
      });
    }
    return session;
  }, [loadSession, updateSession]);

  // Abandon session
  const abandonSession = useCallback(async (sessionKey: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/interview-sessions/${sessionKey}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to abandon session');
      }

      console.log('🗑️ Session abandoned successfully');
      setCurrentSession(null);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to abandon session';
      console.error('❌ Error abandoning session:', error);
      setError(errorMessage);
      toast.error(`Failed to abandon session: ${errorMessage}`);
      return false;
    }
  }, []);

  // Get progress summary
  const getProgressSummary = useCallback((session: InterviewSession) => {
    if (!session) return null;

    return {
      completed: session.questionsCompleted,
      total: session.totalQuestions,
      percentage: session.completionPercentage,
      remaining: session.questionsRemaining,
      timeSpent: session.timeSpent,
      timeSpentMinutes: Math.round(session.timeSpent / 60),
      currentQuestion: session.currentQuestionIndex + 1, // 1-based for display
      canContinue: session.canResume,
      isComplete: session.status === 'completed'
    };
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Cleanup auto-save timer
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  return {
    // State
    currentSession,
    allSessions,
    loading,
    error,

    // Actions
    createSession,
    loadSession,
    updateSession,
    autoSaveSession,
    loadAllSessions,
    completeSession,
    pauseSession,
    resumeSession,
    abandonSession,

    // Utilities
    getProgressSummary,
    clearError
  };
};

