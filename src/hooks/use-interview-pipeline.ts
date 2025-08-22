import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth.context';

interface Interview {
  id: string;
  user_id: string;
  interviewer_name: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'PROCESSING_ANALYSIS' | 'ANALYSIS_COMPLETE';
  job_title?: string;
  key_skills?: string;
  agent_id?: string;
  total_questions?: number;
  questions_answered: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface Utterance {
  speaker: 'USER' | 'AGENT';
  text: string;
  timestamp?: string;
  duration_seconds?: number;
  confidence_score?: number;
}

interface AnalysisData {
  overall_score: number;
  metrics: {
    communication_clarity: number;
    technical_knowledge: number;
    problem_solving: number;
    cultural_fit: number;
    confidence: number;
  };
  strengths: string[];
  areas_for_improvement: string[];
  key_insights: string[];
  detailed_feedback: string;
  speaking_metrics: {
    estimated_words_per_minute: number;
    response_quality: number;
    filler_word_usage: string;
  };
  recommendations: string[];
}

export function useInterviewPipeline() {
  const { session } = useAuth();
  const [currentInterview, setCurrentInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to get auth headers
  const getAuthHeaders = useCallback((): { [key: string]: string } => {
    if (!session?.access_token) {
      console.warn('No session access token available for API call.');
      return {
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };
  }, [session]);

  // Create new interview
  const createInterview = useCallback(async (params: {
    interviewer_name: string;
    job_title?: string;
    key_skills?: string;
    agent_id?: string;
    total_questions?: number;
  }): Promise<Interview | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error(`Failed to create interview: ${response.statusText}`);
      }

      const { interview } = await response.json();
      setCurrentInterview(interview);
      console.log('✅ Created interview:', interview.id);
      return interview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create interview';
      setError(errorMessage);
      console.error('❌ Error creating interview:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);

  // Log single or batch utterances
  const logUtterance = useCallback(async (
    interview_id: string,
    utterances: Utterance | Utterance[]
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/utterances', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          interview_id,
          utterances
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to log utterances: ${response.statusText}`);
      }

      const utteranceArray = Array.isArray(utterances) ? utterances : [utterances];
      console.log(`✅ Logged ${utteranceArray.length} utterances for interview ${interview_id}`);
      return true;
    } catch (err) {
      console.error('❌ Error logging utterances:', err);
      return false;
    }
  }, [getAuthHeaders]);

  // Update interview status
  const updateInterviewStatus = useCallback(async (
    interview_id: string,
    status: Interview['status'],
    questions_answered?: number
  ): Promise<Interview | null> => {
    try {
      const updateData: any = { status };
      if (questions_answered !== undefined) {
        updateData.questions_answered = questions_answered;
      }
      if (status === 'COMPLETED' || status === 'ANALYSIS_COMPLETE') {
        updateData.completed_at = new Date().toISOString();
      }

      const response = await fetch(`/api/interviews/${interview_id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update interview: ${response.statusText}`);
      }

      const { interview } = await response.json();
      setCurrentInterview(interview);
      console.log(`✅ Updated interview ${interview_id} to ${status}`);
      return interview;
    } catch (err) {
      console.error('❌ Error updating interview:', err);
      return null;
    }
  }, [getAuthHeaders]);

  // Complete interview and trigger analysis
  const completeInterview = useCallback(async (
    interview_id: string,
    questions_answered: number
  ): Promise<{ interview: Interview | null; analysis: AnalysisData | null }> => {
    try {
      setIsLoading(true);
      setError(null);

      // First, mark interview as completed
      const interview = await updateInterviewStatus(interview_id, 'COMPLETED', questions_answered);
      if (!interview) {
        throw new Error('Failed to complete interview');
      }

      // Then trigger analysis
              const analysisResponse = await fetch('/api/analyze-interview', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ interview_id })
        });

      if (!analysisResponse.ok) {
        console.warn('Analysis failed, but interview was completed');
        return { interview, analysis: null };
      }

      const { analysis, fallback } = await analysisResponse.json();
      
      if (fallback) {
        console.warn('Using fallback analysis');
      }

      console.log('✅ Interview completed and analyzed:', interview_id);
      return { interview, analysis };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete interview';
      setError(errorMessage);
      console.error('❌ Error completing interview:', err);
      return { interview: null, analysis: null };
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders, updateInterviewStatus]);

  // Get interview details
  const getInterview = useCallback(async (interview_id: string): Promise<Interview | null> => {
    try {
              const response = await fetch(`/api/interviews/${interview_id}`, {
          method: 'GET',
          headers: getAuthHeaders()
        });

      if (!response.ok) {
        throw new Error(`Failed to fetch interview: ${response.statusText}`);
      }

      const { interview } = await response.json();
      return interview;
    } catch (err) {
      console.error('❌ Error fetching interview:', err);
      return null;
    }
  }, [getAuthHeaders]);

  return {
    // State
    currentInterview,
    isLoading,
    error,

    // Actions
    createInterview,
    logUtterance,
    updateInterviewStatus,
    completeInterview,
    getInterview,

    // Utils
    clearError: () => setError(null),
    setCurrentInterview
  };
}
