interface TranscriptEntry {
  speaker: 'agent' | 'user';
  content: string;
  timestamp?: string;
}

interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
  questionTimestamp?: string;
  answerTimestamp?: string;
  category: string;
  difficulty: string;
}

export function parseTranscriptToQuestionAnswers(
  transcript: TranscriptEntry[],
  callId: string
): QuestionAnswer[] {
  const questionAnswers: QuestionAnswer[] = [];
  let currentQuestion = '';
  let currentAnswer = '';
  let questionTimestamp = '';
  let answerTimestamp = '';
  let questionCount = 0;

  for (const entry of transcript) {
    if (entry.speaker === 'agent') {
      // Agent speaking - check if this is a question
      const isQuestion = isQuestionContent(entry.content);
      
      if (isQuestion) {
        // If we have a previous question-answer pair, save it
        if (currentQuestion && currentAnswer) {
          questionAnswers.push({
            id: `${callId}_${questionCount}`,
            question: currentQuestion,
            answer: currentAnswer,
            questionTimestamp,
            answerTimestamp,
            category: determineCategory(currentQuestion),
            difficulty: determineDifficulty(currentQuestion)
          });
          questionCount++;
        }
        
        // Start new question
        currentQuestion = entry.content;
        currentAnswer = '';
        questionTimestamp = entry.timestamp || '';
        answerTimestamp = '';
      } else {
        // Agent speaking but not a question - might be follow-up or clarification
        if (currentQuestion) {
          currentQuestion += ' ' + entry.content;
        }
      }
    } else if (entry.speaker === 'user') {
      // User speaking - this is an answer
      if (currentQuestion) {
        currentAnswer += (currentAnswer ? ' ' : '') + entry.content;
        answerTimestamp = entry.timestamp || '';
      }
    }
  }

  // Add the last question-answer pair if it exists
  if (currentQuestion && currentAnswer) {
    questionAnswers.push({
      id: `${callId}_${questionCount}`,
      question: currentQuestion,
      answer: currentAnswer,
      questionTimestamp,
      answerTimestamp,
      category: determineCategory(currentQuestion),
      difficulty: determineDifficulty(currentQuestion)
    });
  }

  return questionAnswers;
}

function isQuestionContent(content: string): boolean {
  // Check if the content contains question indicators
  const questionIndicators = [
    '?',
    'tell me',
    'describe',
    'explain',
    'how would you',
    'what would you',
    'can you',
    'could you',
    'would you',
    'please share',
    'walk me through',
    'give me an example'
  ];

  const lowerContent = content.toLowerCase();
  return questionIndicators.some(indicator => lowerContent.includes(indicator));
}

function determineCategory(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('design') || lowerQuestion.includes('figma') || lowerQuestion.includes('ui')) {
    return 'Design & UI';
  }
  if (lowerQuestion.includes('performance') || lowerQuestion.includes('optimization') || lowerQuestion.includes('speed')) {
    return 'Performance';
  }
  if (lowerQuestion.includes('accessibility') || lowerQuestion.includes('a11y') || lowerQuestion.includes('ada')) {
    return 'Accessibility';
  }
  if (lowerQuestion.includes('testing') || lowerQuestion.includes('test') || lowerQuestion.includes('qa')) {
    return 'Testing';
  }
  if (lowerQuestion.includes('team') || lowerQuestion.includes('collaboration') || lowerQuestion.includes('communication')) {
    return 'Teamwork';
  }
  if (lowerQuestion.includes('problem') || lowerQuestion.includes('challenge') || lowerQuestion.includes('difficult')) {
    return 'Problem Solving';
  }
  if (lowerQuestion.includes('code') || lowerQuestion.includes('programming') || lowerQuestion.includes('development')) {
    return 'Technical';
  }
  
  return 'General';
}

function determineDifficulty(question: string): string {
  const lowerQuestion = question.toLowerCase();
  
  // Hard questions typically involve complex scenarios
  if (lowerQuestion.includes('system design') || 
      lowerQuestion.includes('architecture') || 
      lowerQuestion.includes('scale') ||
      lowerQuestion.includes('optimization') ||
      lowerQuestion.includes('performance')) {
    return 'hard';
  }
  
  // Medium questions involve practical scenarios
  if (lowerQuestion.includes('how would you') || 
      lowerQuestion.includes('describe') ||
      lowerQuestion.includes('explain') ||
      lowerQuestion.includes('walk me through')) {
    return 'medium';
  }
  
  // Easy questions are more straightforward
  return 'easy';
}

export function formatTimestamp(timestamp: string): string {
  if (!timestamp) return '';
  
  // Convert timestamp to readable format
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
} 
