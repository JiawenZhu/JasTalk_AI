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

// Enhanced utterance interface for Google API integration
interface Utterance {
  speaker: 'USER' | 'AGENT';
  text: string;
  timestamp?: string;
  // Google API integration fields
  google_conversation_id?: string; // Link to Google's conversation log
  session_context?: string; // Session identifier
  turn_number?: number; // Sequential turn number in conversation
  
  // Question tracking
  question_id?: string; // Unique identifier for the question
  question_text?: string; // The actual question being asked
  question_topic?: string; // Topic/category of the question
  question_difficulty?: 'easy' | 'medium' | 'hard';
  
  // Answer tracking (for USER utterances)
  answer_to_question_id?: string; // Which question this answers
  answer_quality?: {
    completeness: number; // 0-100
    accuracy: number; // 0-100
    clarity: number; // 0-100
    technical_depth: number; // 0-100
    confidence: number; // 0-100
  };
  
  // Google Analytics integration
  google_analytics?: {
    conversation_id?: string;
    turn_number?: number;
    response_quality?: number; // 0-100
    sentiment_score?: number; // -1 to 1
    topic_tags?: string[];
    language_complexity?: 'basic' | 'intermediate' | 'advanced';
    professional_tone?: boolean;
    technical_depth?: 'surface' | 'moderate' | 'deep';
    speaking_pace?: number; // words per minute
    filler_words?: string[]; // detected filler words
    engagement_level?: 'low' | 'medium' | 'high';
  };
  
  // Metadata
  metadata?: {
    audio_duration?: number; // seconds
    word_count?: number;
    character_count?: number;
    language?: string;
    confidence_score?: number; // speech recognition confidence
  };
}

interface Question {
  id: string;
  text: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  expected_key_points: string[];
  follow_up_questions?: string[];
  timestamp: string;
  interviewer_id?: string;
}

interface Answer {
  question_id: string;
  user_id: string;
  text: string;
  timestamp: string;
  quality_metrics: {
    completeness: number;
    accuracy: number;
    clarity: number;
    technical_depth: number;
    confidence: number;
  };
  google_analysis?: {
    sentiment: number;
    topic_tags: string[];
    language_complexity: string;
    professional_tone: boolean;
    technical_depth: string;
  };
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

  // Simple utterance logging (fallback)
  const logUtterance = useCallback(async (
    interview_id: string,
    utterances: Utterance[]
  ): Promise<boolean> => {
    try {
      const response = await fetch('/api/utterances', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          interview_id,
          utterances: utterances.map(u => ({
            ...u,
            timestamp: u.timestamp || new Date().toISOString(),
            session_context: u.session_context || `interview_${interview_id}`
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to log utterances: ${response.statusText}`);
      }

      console.log(`✅ Logged ${utterances.length} utterances for interview ${interview_id}`);
      return true;
    } catch (err) {
      console.error('❌ Error logging utterances:', err);
      return false;
    }
  }, [getAuthHeaders]);

  // Get Google performance analytics
  const getGooglePerformanceAnalytics = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/google/performance-analytics?conversation_id=${conversationId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch performance analytics: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Retrieved Google performance analytics for ${conversationId}`);
      return data;
    } catch (err) {
      console.error('❌ Error fetching Google performance analytics:', err);
      return null;
    }
  }, [getAuthHeaders]);

  // Get Google content analysis
  const getGoogleContentAnalysis = useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(`/api/google/content-analysis?conversation_id=${conversationId}`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch content analysis: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Retrieved Google content analysis for ${conversationId}`);
      return data;
    } catch (err) {
      console.error('❌ Error fetching Google content analysis:', err);
      return null;
    }
  }, [getAuthHeaders]);

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
      return interview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error creating interview:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getAuthHeaders]);



  // Enhanced logging with Google API integration
  const logUtteranceWithGoogleAnalytics = useCallback(async (
    interview_id: string,
    utterances: Utterance | Utterance[],
    googleConversationId?: string
  ): Promise<boolean> => {
    try {
      const utteranceArray = Array.isArray(utterances) ? utterances : [utterances];
      
      // If we have a Google conversation ID, fetch analytics
      if (googleConversationId) {
        const [analytics, content] = await Promise.all([
          getGooglePerformanceAnalytics(googleConversationId),
          getGoogleContentAnalysis(googleConversationId)
        ]);
        
        // Enhance utterances with Google analytics
        const enhancedUtterances = utteranceArray.map((utterance, index) => ({
          ...utterance,
          timestamp: utterance.timestamp || new Date().toISOString(),
          session_context: `interview_${interview_id}`,
          google_conversation_id: googleConversationId,
          turn_number: utterance.turn_number || index + 1,
          google_analytics: {
            conversation_id: googleConversationId,
            turn_number: utterance.turn_number || index + 1,
            response_quality: analytics?.response_quality || 85,
            sentiment_score: content?.sentiment_score || 0.2,
            topic_tags: content?.topic_tags || ['interview', 'practice'],
            language_complexity: content?.language_complexity || 'intermediate',
            professional_tone: content?.professional_tone || true,
            technical_depth: content?.technical_depth || 'moderate',
            speaking_pace: analytics?.speaking_pace || 150,
            filler_words: analytics?.filler_words || [],
            engagement_level: analytics?.engagement_level || 'medium'
          }
        }));
        
        // Log enhanced utterances
        const response = await fetch('/api/utterances', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            interview_id,
            utterances: enhancedUtterances
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to log enhanced utterances: ${response.statusText}`);
        }
        
        console.log(`✅ Logged ${enhancedUtterances.length} utterances with Google analytics for interview ${interview_id}`);
        return true;
      } else {
        // Fallback to simple logging
        return await logUtterance(interview_id, utteranceArray);
      }
    } catch (err) {
      console.error('❌ Error logging utterances with Google analytics:', err);
      return false;
    }
  }, [getAuthHeaders, getGooglePerformanceAnalytics, getGoogleContentAnalysis, logUtterance]);

  // Log a question being asked by the interviewer
  const logQuestion = useCallback(async (
    interview_id: string,
    question: Omit<Question, 'id' | 'timestamp'>
  ): Promise<string | null> => {
    try {
      const questionData = {
        ...question,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          interview_id,
          question: questionData
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to log question: ${response.statusText}`);
      }

      const { question_id } = await response.json();
      console.log(`✅ Logged question: ${question.text} for interview ${interview_id}`);
      return question_id;
    } catch (err) {
      console.error('❌ Error logging question:', err);
      return null;
    }
  }, [getAuthHeaders]);

  // Log an answer to a specific question
  const logAnswer = useCallback(async (
    interview_id: string,
    answer: Omit<Answer, 'timestamp'>
  ): Promise<boolean> => {
    try {
      const answerData = {
        ...answer,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/answers', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          interview_id,
          answer: answerData
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to log answer: ${response.statusText}`);
      }

      console.log(`✅ Logged answer to question ${answer.question_id} for interview ${interview_id}`);
      return true;
    } catch (err) {
      console.error('❌ Error logging answer:', err);
      return false;
    }
  }, [getAuthHeaders]);

  // Log a complete Q&A exchange
  const logQuestionAnswerExchange = useCallback(async (
    interview_id: string,
    question: Omit<Question, 'id' | 'timestamp'>,
    answer: Omit<Answer, 'id' | 'timestamp'>,
    googleConversationId?: string
  ): Promise<boolean> => {
    try {
      // First log the question
      const question_id = await logQuestion(interview_id, question);
      if (!question_id) {
        throw new Error('Failed to log question');
      }

      // Then log the answer with the question reference
      const answerData = {
        ...answer,
        question_id,
        timestamp: new Date().toISOString()
      };

      const answerResponse = await fetch('/api/answers', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          interview_id,
          answer: answerData
        })
      });

      if (!answerResponse.ok) {
        throw new Error(`Failed to log answer: ${answerResponse.statusText}`);
      }

      // Log the complete exchange as utterances
      const utterances: Utterance[] = [
        {
          speaker: 'AGENT',
          text: question.text,
          timestamp: new Date().toISOString(),
          question_id,
          question_text: question.text,
          question_topic: question.topic,
          question_difficulty: question.difficulty,
          session_context: `interview_${interview_id}`,
          google_conversation_id: googleConversationId,
          turn_number: 1
        },
        {
          speaker: 'USER',
          text: answer.text,
          timestamp: new Date().toISOString(),
          answer_to_question_id: question_id,
          answer_quality: answer.quality_metrics,
          session_context: `interview_${interview_id}`,
          google_conversation_id: googleConversationId,
          turn_number: 2
        }
      ];

      // Log utterances with Google analytics if available
      await logUtteranceWithGoogleAnalytics(interview_id, utterances, googleConversationId);

      console.log(`✅ Logged complete Q&A exchange for interview ${interview_id}`);
      return true;
    } catch (err) {
      console.error('❌ Error logging Q&A exchange:', err);
      return false;
    }
  }, [getAuthHeaders, logQuestion, logUtteranceWithGoogleAnalytics]);



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
      return interview;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error updating interview:', err);
      return null;
    }
  }, [getAuthHeaders]);

  // Complete interview with analysis
  const completeInterview = useCallback(async (
    interview_id: string,
    analysis_data: AnalysisData
  ): Promise<boolean> => {
    try {
      const response = await fetch(`/api/interviews/${interview_id}/complete`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(analysis_data)
      });

      if (!response.ok) {
        throw new Error(`Failed to complete interview: ${response.statusText}`);
      }

      console.log(`✅ Interview ${interview_id} completed successfully`);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error completing interview:', err);
      return false;
    }
  }, [getAuthHeaders]);

  return {
    currentInterview,
    isLoading,
    error,
    createInterview,
    logUtterance,
    logUtteranceWithGoogleAnalytics,
    logQuestion,
    logAnswer,
    logQuestionAnswerExchange,
    updateInterviewStatus,
    completeInterview,
    getGooglePerformanceAnalytics,
    getGoogleContentAnalysis
  };
}
