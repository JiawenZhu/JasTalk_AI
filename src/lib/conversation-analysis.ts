/**
 * Utility functions for analyzing conversation logs to determine interview progress
 */

export interface ConversationEntry {
  role: string;
  text: string;
  timestamp: string;
  speaker?: string; // For compatibility with different formats
}

export interface QuestionProgress {
  totalQuestions: number;
  questionsAnswered: number;
  nextQuestionNumber: number; // The question number user should start with next time
  isComplete: boolean;
  lastUserResponse?: string;
  lastAiResponse?: string;
}

/**
 * Analyzes conversation transcript to determine interview progress
 * @param transcript Array of conversation entries
 * @param totalInterviewQuestions Total number of questions in the interview (from question list)
 * @returns Progress information
 */
export function analyzeInterviewProgress(
  transcript: ConversationEntry[], 
  totalInterviewQuestions: number
): QuestionProgress {
  if (!transcript || transcript.length === 0) {
    return {
      totalQuestions: totalInterviewQuestions,
      questionsAnswered: 0,
      nextQuestionNumber: 1,
      isComplete: false
    };
  }

  // Count user responses (each user response = one question answered)
  const userResponses = transcript.filter(entry => 
    entry.role === 'user' || entry.speaker === 'user'
  );
  
  const aiResponses = transcript.filter(entry => 
    entry.role === 'assistant' || entry.role === 'ai' || entry.speaker === 'ai'
  );

  const questionsAnswered = userResponses.length;
  const nextQuestionNumber = questionsAnswered + 1;
  const isComplete = questionsAnswered >= totalInterviewQuestions;

  // Get last responses for context
  const lastUserResponse = userResponses[userResponses.length - 1]?.text;
  const lastAiResponse = aiResponses[aiResponses.length - 1]?.text;

  return {
    totalQuestions: totalInterviewQuestions,
    questionsAnswered,
    nextQuestionNumber: Math.min(nextQuestionNumber, totalInterviewQuestions),
    isComplete,
    lastUserResponse,
    lastAiResponse
  };
}

/**
 * Gets the most recent interview progress for a user and agent
 * @param conversationLogs Array of conversation logs from database
 * @param agentId The agent ID to filter by
 * @param totalQuestions Total questions in the interview
 * @returns Progress information or null if no recent interview found
 */
export function getRecentInterviewProgress(
  conversationLogs: any[], 
  agentId: string,
  totalQuestions: number
): QuestionProgress | null {
  if (!conversationLogs || conversationLogs.length === 0) {
    return null;
  }

  // Find the most recent log for this agent that's paused (not completed)
  const recentLog = conversationLogs
    .filter(log => log.agent_id === agentId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .find(log => {
      // Check if interview was explicitly paused
      const isPaused = log.metadata?.interviewStatus === 'paused';
      if (isPaused) return true;
      
      // Fallback: check if interview is incomplete (for backwards compatibility)
      const progress = analyzeInterviewProgress(log.transcript || [], totalQuestions);
      return !progress.isComplete;
    });

  if (!recentLog) {
    return null;
  }

  return analyzeInterviewProgress(recentLog.transcript || [], totalQuestions);
}

/**
 * Checks if an interview can be resumed based on conversation logs
 * @param conversationLogs Array of conversation logs
 * @param agentId Agent ID to check
 * @param totalQuestions Total questions in interview
 * @returns Resume information
 */
export function canResumeInterview(
  conversationLogs: any[], 
  agentId: string, 
  totalQuestions: number
): { canResume: boolean; progress?: QuestionProgress; logId?: string } {
  const progress = getRecentInterviewProgress(conversationLogs, agentId, totalQuestions);
  
  if (!progress || progress.isComplete || progress.questionsAnswered === 0) {
    return { canResume: false };
  }

  // Find the log ID for this resumable interview (prioritize paused interviews)
  const resumableLog = conversationLogs
    .filter(log => log.agent_id === agentId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .find(log => {
      // Check if explicitly paused first
      const isPaused = log.metadata?.interviewStatus === 'paused';
      if (isPaused) return true;
      
      // Fallback for incomplete interviews
      const logProgress = analyzeInterviewProgress(log.transcript || [], totalQuestions);
      return !logProgress.isComplete && logProgress.questionsAnswered > 0;
    });

  return {
    canResume: true,
    progress,
    logId: resumableLog?.id
  };
}
