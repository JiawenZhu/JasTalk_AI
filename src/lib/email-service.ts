// Email service for sending interview summaries
export interface InterviewSummary {
  agentName: string;
  totalQuestions: number;
  questionsAnswered: number;
  timeSpent: number;
  conversationSummary: string;
  detailedLogs: Array<{
    speaker: 'user' | 'ai';
    text: string;
    timestamp: string;
  }>;
  interviewStatus: 'paused' | 'completed';
  resumeLink?: string;
}

export async function sendInterviewSummary(
  userEmail: string,
  summary: InterviewSummary
): Promise<boolean> {
  try {
    console.log('📧 Sending interview summary email to:', userEmail);
    
    const response = await fetch('/api/send-interview-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userEmail,
        summary
      }),
    });

    if (response.ok) {
      console.log('✅ Interview summary email sent successfully');
      return true;
    } else {
      const errorData = await response.json();
      console.error('❌ Failed to send interview summary email:', errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending interview summary email:', error);
    return false;
  }
}

export function generateConversationSummary(conversationHistory: Array<{speaker: 'user' | 'ai', text: string, timestamp: Date}>): string {
  if (conversationHistory.length === 0) {
    return 'No conversation recorded yet.';
  }

  const userResponses = conversationHistory.filter(h => h.speaker === 'user');
  const aiQuestions = conversationHistory.filter(h => h.speaker === 'ai');
  
  let summary = `Interview Progress: ${userResponses.length} questions answered.\n\n`;
  
  // Add key points from user responses
  if (userResponses.length > 0) {
    summary += 'Key Points from Your Responses:\n';
    userResponses.forEach((response, index) => {
      const keyPoints = extractKeyPoints(response.text);
      summary += `${index + 1}. ${keyPoints}\n`;
    });
    summary += '\n';
  }
  
  // Add AI interviewer insights
  if (aiQuestions.length > 0) {
    summary += 'Interviewer Questions & Insights:\n';
    aiQuestions.forEach((question, index) => {
      const questionText = question.text.length > 100 
        ? question.text.substring(0, 100) + '...' 
        : question.text;
      summary += `${index + 1}. ${questionText}\n`;
    });
  }
  
  return summary;
}

function extractKeyPoints(text: string): string {
  // Simple key point extraction - take first sentence or first 80 characters
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    return sentences[0].trim().substring(0, 80) + (sentences[0].length > 80 ? '...' : '');
  }
  return text.substring(0, 80) + (text.length > 80 ? '...' : '');
}

export function formatDetailedLogs(conversationHistory: Array<{speaker: 'user' | 'ai', text: string, timestamp: Date}>): Array<{speaker: 'user' | 'ai', text: string, timestamp: string }> {
  return conversationHistory.map(entry => ({
    speaker: entry.speaker,
    text: entry.text,
    timestamp: entry.timestamp.toLocaleString()
  }));
}
