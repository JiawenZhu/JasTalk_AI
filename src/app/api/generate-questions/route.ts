import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

interface GenerateQuestionsRequest {
  jobDescription: string;
  numberOfQuestions?: number;
  questionCount?: number;
  questionType?: string;
  interviewType?: string;
  difficulty?: string;
  focusAreas?: string[];
}

interface Question {
  id: string;
  text: string;
  type: 'technical' | 'behavioral' | 'system-design' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface ModelConfig {
  provider: 'openai' | 'gemini';
  model: string;
  apiKey: string;
  isEnabled: boolean;
  features: {
    liveStreaming: boolean;
    realTimeInteraction: boolean;
    multimodal: boolean;
    longContext: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Generate Questions API Called ===');
    
    // Auth is required for question generation
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in to generate questions' }, { status: 401 });
    }

    // Check if user has sufficient credits
    // Check user's remaining credits (aggregated from all subscriptions)
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('interview_time_remaining, interview_time_total, tier, status')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscriptions:', subError);
      
      return NextResponse.json({ error: 'Failed to fetch subscription data' }, { status: 500 });
    }

    // Aggregate credits from all active subscriptions
    const totalMinutes = subscriptions?.reduce((total, sub) => total + (sub.interview_time_remaining || 0), 0) || 0;
    const creditsRemaining = totalMinutes;
    
    console.log('🔍 Generate Questions API - Credit check:', {
      userId: user.id,
      totalSubscriptions: subscriptions?.length || 0,
      subscriptions: subscriptions?.map(s => ({ 
        remaining: s.interview_time_remaining,
        total: s.interview_time_total,
        tier: s.tier
      })),
      totalMinutes,
      creditsRemaining
    });
    
    if (creditsRemaining <= 0) {
      return NextResponse.json({ 
        error: 'Insufficient credits - Please add credits to generate questions',
        creditsRemaining,
        requiredCredits: 0.01 // Minimum credit needed
      }, { status: 402 }); // Payment Required
    }

    console.log('User auth result:', `User ID: ${user.id}, Credits: ${creditsRemaining}`);

    const body: GenerateQuestionsRequest = await request.json();
    const { jobDescription, numberOfQuestions, questionCount, questionType, interviewType, difficulty, focusAreas } = body;

    if (!jobDescription.trim()) {
      return NextResponse.json({ error: 'Job description is required' }, { status: 400 });
    }

    // Use numberOfQuestions if provided, otherwise fall back to questionCount
    const finalQuestionCount = numberOfQuestions || questionCount || 5;
    
    // Allow 3 questions for free practice, 5-20 for regular practice
    if (finalQuestionCount < 3 || finalQuestionCount > 20) {
      return NextResponse.json({ error: 'Question count must be between 3 and 20' }, { status: 400 });
    }

    // Get model configuration
    const modelConfig = await getModelConfig(user?.id);
    
    console.log('Model config received:', {
      provider: modelConfig.provider,
      model: modelConfig.model,
      isEnabled: modelConfig.isEnabled,
      hasApiKey: !!modelConfig.apiKey
    });
    
    if (!modelConfig.isEnabled) {
      console.log('Model is disabled, using mock questions');
      // Return enhanced mock questions if no model is enabled
      const mockQuestions: Question[] = generateEnhancedMockQuestions(jobDescription, finalQuestionCount, interviewType || 'behavioral', difficulty || 'medium', focusAreas || []);
      
      return NextResponse.json({ questions: mockQuestions });
    }

    // Generate questions based on selected provider
    let questions: Question[];
    
    if (modelConfig.provider === 'gemini') {
      console.log('Using Gemini provider');
      questions = await generateQuestionsWithGemini(jobDescription, finalQuestionCount, interviewType || 'behavioral', difficulty || 'medium', focusAreas || [], modelConfig);
    } else {
      console.log('Using OpenAI provider with model:', modelConfig.model);
      questions = await generateQuestionsWithOpenAI(jobDescription, finalQuestionCount, interviewType || 'behavioral', difficulty || 'medium', focusAreas || [], modelConfig);
    }
    
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getModelConfig(userId?: string | null): Promise<ModelConfig> {
  try {
    // Try to get from database if user is available
    if (userId) {
      const supabase = createServerClient();
      const { data: configData } = await supabase
        .from('model_configurations')
        .select('config')
        .eq('user_id', userId)
        .single();

      if (configData?.config) {
        return configData.config;
      }
    }
  } catch (error) {
    console.log('No saved configuration found');
  }

  // Debug logging
  console.log('Environment check:');
  console.log('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('- OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
  console.log('- NODE_ENV:', process.env.NODE_ENV);

  // Force use the environment variable directly
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY not found in environment');
    throw new Error('OPENAI_API_KEY not configured');
  }

  // Return default configuration
  const defaultConfig = {
    provider: 'openai' as const,
    model: 'gpt-4o-mini', // Default to gpt-4o-mini
    apiKey: apiKey, // Use the verified API key
    isEnabled: true,
    features: {
      liveStreaming: false,
      realTimeInteraction: false,
      multimodal: false,
      longContext: false
    }
  };

  console.log('Default config:', {
    ...defaultConfig,
    apiKey: defaultConfig.apiKey ? `${defaultConfig.apiKey.substring(0, 10)}...` : 'NOT_SET'
  });

  return defaultConfig;
}

async function generateQuestionsWithGemini(
  jobDescription: string,
  questionCount: number,
  interviewType: string,
  difficulty: string,
  focusAreas: string[],
  modelConfig: ModelConfig
): Promise<Question[]> {
  const geminiApiKey = modelConfig.apiKey || process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    console.error('No Gemini API key available');
    
return generateEnhancedMockQuestions(jobDescription, questionCount, interviewType, difficulty, focusAreas);
  }

  const prompt = `You are an expert interview question generator for AI-powered interview practice. Generate ${questionCount} high-quality, job-specific interview questions based on the following job description.

Job Description:
${jobDescription}

Requirements:
- Interview Type: ${interviewType}
- Difficulty Level: ${difficulty}
- Focus Areas: ${focusAreas.join(', ')}
- Number of Questions: ${questionCount}

Instructions:
1. Analyze the job description to understand the role, required skills, and responsibilities
2. Generate questions that are SPECIFIC to this job and company context
3. Include questions about technologies, tools, and frameworks mentioned in the job description
4. Create behavioral questions relevant to the role's responsibilities
5. Include system design questions appropriate for the seniority level
6. Add coding questions that test skills mentioned in the job requirements

Question Types to Include:
- Technical questions about specific technologies/tools mentioned
- Behavioral questions about relevant work scenarios
- System design questions appropriate for the role level
- Coding questions that test required programming skills

For each question, provide:
1. The question text (make it specific to the job description)
2. Question type (technical, behavioral, system-design, or coding)
3. Difficulty level (easy, medium, or hard)
4. Category (e.g., "React Development", "System Design", "Team Leadership", etc.)

Return the response as a JSON array with this structure:
[
  {
    "text": "Specific question text related to the job description",
    "type": "technical|behavioral|system-design|coding",
    "difficulty": "easy|medium|hard",
    "category": "Specific category based on job requirements"
  }
]

Make sure the questions are highly relevant to the specific job description provided, not generic questions.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.model}:generateContent`, {
      method: 'POST',
      headers: {
        'x-goog-api-key': geminiApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!content) {
      throw new Error('No content received from Gemini');
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
      console.error('Error parsing Gemini response:', parseError);
      throw new Error('Failed to parse Gemini response');
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
    console.error('Gemini API error:', error);
    // Fallback to enhanced mock questions

    return generateEnhancedMockQuestions(
      jobDescription,
      questionCount,
      interviewType,
      difficulty,
      focusAreas
    );
  }
}

async function generateQuestionsWithOpenAI(
  jobDescription: string,
  questionCount: number,
  interviewType: string,
  difficulty: string,
  focusAreas: string[],
  modelConfig: ModelConfig
): Promise<Question[]> {
  console.log('generateQuestionsWithOpenAI called with config:', {
    provider: modelConfig.provider,
    model: modelConfig.model,
    hasApiKey: !!modelConfig.apiKey,
    apiKeyLength: modelConfig.apiKey?.length || 0
  });

  const openaiApiKey = modelConfig.apiKey || process.env.OPENAI_API_KEY;
  
  console.log('Final API key check:', {
    fromConfig: !!modelConfig.apiKey,
    fromEnv: !!process.env.OPENAI_API_KEY,
    finalKeyExists: !!openaiApiKey,
    finalKeyLength: openaiApiKey?.length || 0
  });
  
  if (!openaiApiKey) {
    console.error('No OpenAI API key available');
    
    return generateEnhancedMockQuestions(jobDescription, questionCount, interviewType, difficulty, focusAreas);
  }

  console.log('Proceeding with OpenAI API call...');

  const prompt = `You are an expert interview question generator for AI-powered interview practice. Generate ${questionCount} high-quality, job-specific interview questions based on the following job description.

Job Description:
${jobDescription}

Requirements:
- Interview Type: ${interviewType}
- Difficulty Level: ${difficulty}
- Focus Areas: ${focusAreas.join(', ')}
- Number of Questions: ${questionCount}

Instructions:
1. Analyze the job description to understand the role, required skills, and responsibilities
2. Generate questions that are SPECIFIC to this job and company context
3. Include questions about technologies, tools, and frameworks mentioned in the job description
4. Create behavioral questions relevant to the role's responsibilities
5. Include system design questions appropriate for the seniority level
6. Add coding questions that test skills mentioned in the job requirements

Question Types to Include:
- Technical questions about specific technologies/tools mentioned
- Behavioral questions about relevant work scenarios
- System design questions appropriate for the role level
- Coding questions that test required programming skills

For each question, provide:
1. The question text (make it specific to the job description)
2. Question type (technical, behavioral, system-design, or coding)
3. Difficulty level (easy, medium, or hard)
4. Category (e.g., "React Development", "System Design", "Team Leadership", etc.)

Return the response as a JSON array with this structure:
[
  {
    "text": "Specific question text related to the job description",
    "type": "technical|behavioral|system-design|coding",
    "difficulty": "easy|medium|hard",
    "category": "Specific category based on job requirements"
  }
]

Make sure the questions are highly relevant to the specific job description provided, not generic questions.`;

  // Define fallback models in order of preference
  const fallbackModels = [
    'gpt-4o-mini',
    'gpt-4-mini'
  ];

  // Try each model until one works
  for (const modelId of fallbackModels) {
    try {
      console.log(`Attempting to use model: ${modelId}`);
      
      // Check if this is a GPT-5 model (uses different parameters)
      const isGpt5Model = modelId.startsWith('gpt-5');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'system',
              content: 'You are an expert interview question generator. Generate high-quality, job-specific interview questions based on job descriptions. Always return valid JSON arrays.',
            },
            { role: 'user', content: prompt },
          ],
          // Use correct parameter based on model type and omit temperature for GPT-5
          ...(isGpt5Model ? { max_completion_tokens: 2000 } : { max_tokens: 2000, temperature: 0.7 }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`Model ${modelId} failed: ${response.status} - ${errorText}`);
        continue; // Try next model
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        console.log(`Model ${modelId} returned no content`);
        continue; // Try next model
      }

      console.log(`Successfully used model: ${modelId}`);

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
        continue; // Try next model
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
      console.log(`Model ${modelId} encountered error:`, error);
      continue; // Try next model
    }
  }

  // If all models failed, fall back to mock questions
  console.log('All OpenAI models failed, falling back to mock questions');
  
  return generateEnhancedMockQuestions(jobDescription, questionCount, interviewType, difficulty, focusAreas);
}

function generateEnhancedMockQuestions(
  jobDescription: string,
  questionCount: number,
  interviewType: string,
  difficulty: string,
  focusAreas: string[]
): Question[] {
  // Extract detailed information from job description
  const jobAnalysis = analyzeJobDescription(jobDescription);
  
  // Generate dynamic questions based on job analysis
  const dynamicQuestions = generateDynamicQuestions(jobAnalysis, questionCount, interviewType, difficulty);
  
  return dynamicQuestions;
}

function analyzeJobDescription(jobDescription: string) {
  const lowerDescription = jobDescription.toLowerCase();
  
  // Detect technologies and frameworks
  const technologies = {
    frontend: ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'sass', 'next.js', 'nuxt'],
    backend: ['node.js', 'python', 'java', 'c#', '.net', 'php', 'ruby', 'go', 'rust', 'express', 'django', 'spring'],
    database: ['postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb', 'firebase'],
    cloud: ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform', 'serverless'],
    testing: ['jest', 'cypress', 'selenium', 'pytest', 'junit', 'mocha', 'chai'],
    tools: ['git', 'jenkins', 'github actions', 'ci/cd', 'webpack', 'babel', 'eslint']
  };
  
  const detectedTechs = {
    frontend: technologies.frontend.filter(tech => lowerDescription.includes(tech)),
    backend: technologies.backend.filter(tech => lowerDescription.includes(tech)),
    database: technologies.database.filter(tech => lowerDescription.includes(tech)),
    cloud: technologies.cloud.filter(tech => lowerDescription.includes(tech)),
    testing: technologies.testing.filter(tech => lowerDescription.includes(tech)),
    tools: technologies.tools.filter(tech => lowerDescription.includes(tech))
  };
  
  // Detect seniority level
  const seniority = lowerDescription.includes('senior') || lowerDescription.includes('lead') || lowerDescription.includes('principal') ? 'senior' :
                   lowerDescription.includes('junior') || lowerDescription.includes('entry') ? 'junior' : 'mid';
  
  // Detect role type
  const roleType = lowerDescription.includes('full stack') ? 'fullstack' :
                  lowerDescription.includes('frontend') ? 'frontend' :
                  lowerDescription.includes('backend') ? 'backend' :
                  lowerDescription.includes('devops') ? 'devops' :
                  lowerDescription.includes('data') ? 'data' : 'general';
  
  return {
    technologies: detectedTechs,
    seniority,
    roleType,
    hasTesting: detectedTechs.testing.length > 0,
    hasCloud: detectedTechs.cloud.length > 0,
    hasDatabase: detectedTechs.database.length > 0,
    hasFrontend: detectedTechs.frontend.length > 0,
    hasBackend: detectedTechs.backend.length > 0
  };
}

function generateDynamicQuestions(jobAnalysis: any, questionCount: number, interviewType: string, difficulty: string): Question[] {
  const questions: Question[] = [];
  let questionId = 1;
  
  // Technical questions based on detected technologies
  if (jobAnalysis.hasFrontend) {
    const frontendTechs = jobAnalysis.technologies.frontend;
    if (frontendTechs.includes('react')) {
      questions.push({
        id: `q${questionId++}`,
        text: 'How would you optimize the performance of a React application with large component trees? What strategies would you use for code splitting and lazy loading?',
        type: 'technical',
        difficulty: jobAnalysis.seniority === 'senior' ? 'hard' : 'medium',
        category: 'React Development'
      });
    }
    if (frontendTechs.includes('typescript')) {
      questions.push({
        id: `q${questionId++}`,
        text: 'Explain how you would use TypeScript to create a type-safe API client. What patterns would you use for error handling and response typing?',
        type: 'technical',
        difficulty: 'medium',
        category: 'TypeScript'
      });
    }
  }
  
  if (jobAnalysis.hasBackend) {
    const backendTechs = jobAnalysis.technologies.backend;
    if (backendTechs.includes('node.js')) {
      questions.push({
        id: `q${questionId++}`,
        text: 'How would you design a scalable Node.js API that can handle high concurrent requests? What would you consider for error handling and logging?',
        type: 'technical',
        difficulty: jobAnalysis.seniority === 'senior' ? 'hard' : 'medium',
        category: 'Node.js Development'
      });
    }
    if (backendTechs.includes('python')) {
      questions.push({
        id: `q${questionId++}`,
        text: 'Describe how you would implement a RESTful API using Python. What frameworks would you choose and why?',
        type: 'technical',
        difficulty: 'medium',
        category: 'Python Development'
      });
    }
  }
  
  if (jobAnalysis.hasDatabase) {
    const dbTechs = jobAnalysis.technologies.database;
    if (dbTechs.includes('postgresql') || dbTechs.includes('mysql')) {
      questions.push({
        id: `q${questionId++}`,
        text: 'How would you design a database schema for a social media application? What indexes would you create and how would you handle scalability?',
        type: 'system-design',
        difficulty: 'hard',
        category: 'Database Design'
      });
    }
  }
  
  if (jobAnalysis.hasCloud) {
    const cloudTechs = jobAnalysis.technologies.cloud;
    if (cloudTechs.includes('aws')) {
      questions.push({
        id: `q${questionId++}`,
        text: 'How would you design a serverless architecture on AWS for a web application? What services would you use and how would you handle state management?',
        type: 'system-design',
        difficulty: 'hard',
        category: 'AWS Architecture'
      });
    }
  }
  
  // System design questions based on seniority
  if (jobAnalysis.seniority === 'senior') {
    questions.push({
      id: `q${questionId++}`,
      text: 'How would you design a real-time messaging system that can handle millions of concurrent users? Consider scalability, reliability, and performance.',
      type: 'system-design',
      difficulty: 'hard',
      category: 'System Design'
    });
  }
  
  // Behavioral questions relevant to the role
  if (jobAnalysis.seniority === 'senior') {
    questions.push({
      id: `q${questionId++}`,
      text: 'Tell me about a time when you had to lead a team through a major technical migration. How did you handle resistance and ensure successful delivery?',
      type: 'behavioral',
      difficulty: 'medium',
      category: 'Leadership'
    });
  }
  
  questions.push({
    id: `q${questionId++}`,
    text: 'Describe a challenging technical problem you solved recently. What was your approach, what obstacles did you face, and what did you learn?',
    type: 'behavioral',
    difficulty: 'medium',
    category: 'Problem Solving'
  });
  
  // Coding questions based on role type
  if (jobAnalysis.roleType === 'fullstack' || jobAnalysis.roleType === 'frontend') {
    questions.push({
      id: `q${questionId++}`,
      text: 'Implement a function to debounce user input in JavaScript. How would you handle edge cases and what would you consider for performance?',
      type: 'coding',
      difficulty: 'medium',
      category: 'JavaScript'
    });
  }
  
  if (jobAnalysis.roleType === 'fullstack' || jobAnalysis.roleType === 'backend') {
    questions.push({
      id: `q${questionId++}`,
      text: 'Write a function to implement rate limiting for an API. Consider different algorithms and how you would handle distributed systems.',
      type: 'coding',
      difficulty: 'medium',
      category: 'API Design'
    });
  }
  
  // Testing questions if testing is mentioned
  if (jobAnalysis.hasTesting) {
    questions.push({
      id: `q${questionId++}`,
      text: 'How would you implement comprehensive testing for a web application? What types of tests would you write and how would you structure them?',
      type: 'technical',
      difficulty: 'medium',
      category: 'Testing'
    });
  }
  
  // Performance and optimization questions
  questions.push({
    id: `q${questionId++}`,
    text: 'How would you approach optimizing the performance of a web application? What metrics would you monitor and what tools would you use?',
    type: 'technical',
    difficulty: 'medium',
    category: 'Performance'
  });
  
  // Security questions
  questions.push({
    id: `q${questionId++}`,
    text: 'What security considerations would you have when building a web application? How would you handle authentication, authorization, and data protection?',
    type: 'technical',
    difficulty: 'medium',
    category: 'Security'
  });
  
  // Teamwork and collaboration
  questions.push({
    id: `q${questionId++}`,
    text: 'Tell me about a time when you had to work with a difficult team member. How did you handle the situation and what was the outcome?',
    type: 'behavioral',
    difficulty: 'easy',
    category: 'Teamwork'
  });
  
  // Learning and adaptability
  questions.push({
    id: `q${questionId++}`,
    text: 'How do you stay updated with the latest technologies and industry trends? What resources do you use and how do you apply new knowledge?',
    type: 'behavioral',
    difficulty: 'easy',
    category: 'Learning'
  });
  
  // Filter questions based on interview type and difficulty
  let filteredQuestions = questions.filter(q => {
    if (interviewType !== 'mixed' && q.type !== interviewType) {
      return false;
    }
    if (difficulty !== 'mixed' && q.difficulty !== difficulty) {
      return false;
    }
    
return true;
  });
  
  // If not enough questions after filtering, add more generic ones
  if (filteredQuestions.length < questionCount) {
    const genericQuestions: Question[] = [
      {
        id: `q${questionId++}`,
        text: 'How would you design a scalable web application that can handle millions of users?',
        type: 'system-design',
        difficulty: 'hard',
        category: 'System Design'
      },
      {
        id: `q${questionId++}`,
        text: 'Write a function to find the longest palindromic substring in a given string.',
        type: 'coding',
        difficulty: 'medium',
        category: 'Algorithms'
      },
      {
        id: `q${questionId++}`,
        text: 'Explain the difference between REST and GraphQL APIs. When would you choose one over the other?',
        type: 'technical',
        difficulty: 'medium',
        category: 'API Design'
      }
    ];
    filteredQuestions = [...filteredQuestions, ...genericQuestions];
  }
  
  // Shuffle and take the requested number of questions
  const shuffled = filteredQuestions.sort(() => 0.5 - Math.random());
  
return shuffled.slice(0, questionCount);
} 
