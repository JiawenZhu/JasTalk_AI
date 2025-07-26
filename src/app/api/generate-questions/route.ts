import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

interface GenerateQuestionsRequest {
  jobDescription: string;
  questionCount: number;
  interviewType: string;
  difficulty: string;
  focusAreas: string[];
}

interface Question {
  id: string;
  text: string;
  type: 'technical' | 'behavioral' | 'system-design' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: GenerateQuestionsRequest = await request.json();
    const { jobDescription, questionCount, interviewType, difficulty, focusAreas } = body;

    if (!jobDescription.trim()) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    if (questionCount < 5 || questionCount > 20) {
      return NextResponse.json({ error: 'Question count must be between 5 and 20' }, { status: 400 });
    }

    // Check if OpenAI API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      // Return mock questions in development
      const mockQuestions: Question[] = generateMockQuestions(jobDescription, questionCount, interviewType, difficulty, focusAreas);
      return NextResponse.json({ questions: mockQuestions });
    }

    // Generate questions using OpenAI
    const questions = await generateQuestionsWithOpenAI(jobDescription, questionCount, interviewType, difficulty, focusAreas);
    
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateQuestionsWithOpenAI(
  jobDescription: string,
  questionCount: number,
  interviewType: string,
  difficulty: string,
  focusAreas: string[]
): Promise<Question[]> {
  const openaiApiKey = process.env.OPENAI_API_KEY;
  
  const prompt = `Generate ${questionCount} interview questions based on the following job description and requirements:

Job Description:
${jobDescription}

Requirements:
- Interview Type: ${interviewType}
- Difficulty Level: ${difficulty}
- Focus Areas: ${focusAreas.join(', ')}
- Number of Questions: ${questionCount}

Please generate a diverse mix of question types:
- Technical questions about skills and technologies
- Behavioral questions about past experiences
- System design questions for architecture discussions
- Coding questions for programming challenges

For each question, provide:
1. The question text
2. Question type (technical, behavioral, system-design, or coding)
3. Difficulty level (easy, medium, or hard)
4. Category (e.g., "Problem Solving", "System Design", "Algorithms", "Teamwork", etc.)

Return the response as a JSON array with this structure:
[
  {
    "text": "Question text here",
    "type": "technical|behavioral|system-design|coding",
    "difficulty": "easy|medium|hard",
    "category": "Category name"
  }
]

Make sure the questions are relevant to the job description and appropriate for the specified difficulty level.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview question generator. Generate high-quality, relevant interview questions based on job descriptions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response
    let questions: any[];
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(content);
      }
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.log('Raw response:', content);
      throw new Error('Failed to parse OpenAI response');
    }

    // Validate and format questions
    const formattedQuestions: Question[] = questions.map((q, index) => ({
      id: `question_${Date.now()}_${index}`,
      text: q.text || 'Question text not provided',
      type: q.type || 'technical',
      difficulty: q.difficulty || 'medium',
      category: q.category || 'General'
    }));

    return formattedQuestions;
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Fallback to mock questions
    return generateMockQuestions(jobDescription, questionCount, interviewType, difficulty, focusAreas);
  }
}

function generateMockQuestions(
  jobDescription: string,
  questionCount: number,
  interviewType: string,
  difficulty: string,
  focusAreas: string[]
): Question[] {
  const baseQuestions: Question[] = [
    {
      id: '1',
      text: 'Tell me about a challenging technical problem you solved recently. What was your approach and what did you learn?',
      type: 'behavioral',
      difficulty: 'medium',
      category: 'Problem Solving'
    },
    {
      id: '2',
      text: 'How would you design a scalable web application that can handle millions of users?',
      type: 'system-design',
      difficulty: 'hard',
      category: 'System Design'
    },
    {
      id: '3',
      text: 'Write a function to find the longest palindromic substring in a given string.',
      type: 'coding',
      difficulty: 'medium',
      category: 'Algorithms'
    },
    {
      id: '4',
      text: 'Describe a time when you had to work with a difficult team member. How did you handle the situation?',
      type: 'behavioral',
      difficulty: 'easy',
      category: 'Teamwork'
    },
    {
      id: '5',
      text: 'Explain the difference between REST and GraphQL APIs. When would you choose one over the other?',
      type: 'technical',
      difficulty: 'medium',
      category: 'Web Development'
    },
    {
      id: '6',
      text: 'How would you implement a caching system for a high-traffic website?',
      type: 'system-design',
      difficulty: 'hard',
      category: 'Performance'
    },
    {
      id: '7',
      text: 'What are the advantages and disadvantages of microservices architecture?',
      type: 'technical',
      difficulty: 'medium',
      category: 'Architecture'
    },
    {
      id: '8',
      text: 'Write a function to implement a basic LRU (Least Recently Used) cache.',
      type: 'coding',
      difficulty: 'hard',
      category: 'Data Structures'
    },
    {
      id: '9',
      text: 'How do you stay updated with the latest technologies and industry trends?',
      type: 'behavioral',
      difficulty: 'easy',
      category: 'Learning'
    },
    {
      id: '10',
      text: 'Explain the concept of eventual consistency in distributed systems.',
      type: 'technical',
      difficulty: 'hard',
      category: 'Distributed Systems'
    },
    {
      id: '11',
      text: 'Describe a project where you had to optimize performance. What metrics did you use and what improvements did you achieve?',
      type: 'behavioral',
      difficulty: 'medium',
      category: 'Performance'
    },
    {
      id: '12',
      text: 'How would you design a real-time messaging system like Slack or WhatsApp?',
      type: 'system-design',
      difficulty: 'hard',
      category: 'Real-time Systems'
    },
    {
      id: '13',
      text: 'Implement a function to check if a binary tree is balanced.',
      type: 'coding',
      difficulty: 'medium',
      category: 'Data Structures'
    },
    {
      id: '14',
      text: 'What testing strategies do you use to ensure code quality?',
      type: 'technical',
      difficulty: 'medium',
      category: 'Testing'
    },
    {
      id: '15',
      text: 'Tell me about a time when you had to learn a new technology quickly for a project.',
      type: 'behavioral',
      difficulty: 'easy',
      category: 'Adaptability'
    },
    {
      id: '16',
      text: 'How would you design a recommendation system for an e-commerce platform?',
      type: 'system-design',
      difficulty: 'hard',
      category: 'Machine Learning'
    },
    {
      id: '17',
      text: 'Write a function to find all pairs of integers in an array that sum to a target value.',
      type: 'coding',
      difficulty: 'easy',
      category: 'Algorithms'
    },
    {
      id: '18',
      text: 'Explain the CAP theorem and its implications for distributed systems.',
      type: 'technical',
      difficulty: 'hard',
      category: 'Distributed Systems'
    },
    {
      id: '19',
      text: 'Describe a situation where you had to make a difficult technical decision with limited information.',
      type: 'behavioral',
      difficulty: 'medium',
      category: 'Decision Making'
    },
    {
      id: '20',
      text: 'How would you implement a rate limiting system for an API?',
      type: 'system-design',
      difficulty: 'medium',
      category: 'API Design'
    }
  ];

  // Filter questions based on interview type and difficulty
  let filteredQuestions = baseQuestions.filter(q => {
    if (interviewType !== 'mixed' && q.type !== interviewType) {
      return false;
    }
    if (difficulty !== 'mixed' && q.difficulty !== difficulty) {
      return false;
    }
    return true;
  });

  // If not enough questions after filtering, add more
  if (filteredQuestions.length < questionCount) {
    filteredQuestions = baseQuestions;
  }

  // Shuffle and take the requested number of questions
  const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, questionCount);
} 
