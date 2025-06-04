import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SubmissionRequest {
  code: string;
  language: string;
  problemId: string;
  interviewId?: string;
  userId?: string;
}

interface TestCaseResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  explanation?: string;
}

interface SubmissionResult {
  success: boolean;
  score: number; // 0-100
  testResults: {
    passed: number;
    total: number;
    details: TestCaseResult[];
  };
  feedback: {
    overall: string;
    strengths: string[];
    improvements: string[];
    hints: string[];
    codeQuality: {
      readability: number; // 1-10
      efficiency: number; // 1-10
      correctness: number; // 1-10
    };
  };
  executionTime?: number;
  memoryUsed?: number;
  error?: string;
}

// Mock problem database (replace with actual database)
const MOCK_PROBLEMS = {
  'two-sum': {
    title: 'Two Sum',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    testCases: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        expected: '[0,1]',
        hidden: false
      },
      {
        input: 'nums = [3,2,4], target = 6',
        expected: '[1,2]',
        hidden: false
      },
      {
        input: 'nums = [3,3], target = 6',
        expected: '[0,1]',
        hidden: true
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    difficulty: 'Easy'
  },
  'reverse-string': {
    title: 'Reverse String',
    description: 'Write a function that reverses a string. The input string is given as an array of characters s.',
    testCases: [
      {
        input: 's = ["h","e","l","l","o"]',
        expected: '["o","l","l","e","h"]',
        hidden: false
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        expected: '["h","a","n","n","a","H"]',
        hidden: false
      }
    ],
    constraints: [
      '1 <= s.length <= 10^5',
      's[i] is a printable ascii character.'
    ],
    difficulty: 'Easy'
  }
};

async function generateAIFeedback(
  code: string,
  language: string,
  problem: any,
  testResults: TestCaseResult[]
): Promise<SubmissionResult['feedback']> {
  try {
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const prompt = `You are an expert coding interview evaluator. Analyze this ${language} solution for the problem "${problem.title}".

Problem Description:
${problem.description}

Constraints:
${problem.constraints.join('\n')}

Submitted Code:
\`\`\`${language}
${code}
\`\`\`

Test Results: ${passedTests}/${totalTests} tests passed (${passRate.toFixed(1)}%)

Test Case Details:
${testResults.map((test, i) => `
Test ${i + 1}: ${test.passed ? '✅ PASSED' : '❌ FAILED'}
Input: ${test.input}
Expected: ${test.expected}
Actual: ${test.actual}
`).join('\n')}

Please provide constructive feedback in the following JSON format:
{
  "overall": "A concise 2-3 sentence summary of the solution's performance",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "hints": ["hint1", "hint2"],
  "codeQuality": {
    "readability": 8,
    "efficiency": 7,
    "correctness": 9
  }
}

Guidelines:
- Be encouraging and constructive
- Focus on learning opportunities
- Provide specific, actionable feedback
- Don't give away the complete solution
- Rate code quality on a scale of 1-10
- If tests are failing, provide hints to guide toward the correct approach
- If tests are passing, suggest optimizations or edge cases to consider`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert coding interview evaluator who provides constructive, encouraging feedback to help candidates improve their coding skills.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const feedbackText = response.choices[0]?.message?.content;
    if (!feedbackText) {
      throw new Error('No feedback generated');
    }

    // Try to parse JSON feedback
    try {
      const feedback = JSON.parse(feedbackText);
      
      // Validate feedback structure
      if (!feedback.overall || !feedback.strengths || !feedback.improvements || !feedback.codeQuality) {
        throw new Error('Invalid feedback structure');
      }
      
      return feedback;
    } catch (parseError) {
      // Fallback to structured response if JSON parsing fails
      return {
        overall: feedbackText,
        strengths: ['Code submitted successfully'],
        improvements: ['Consider reviewing the test cases that failed'],
        hints: ['Check your algorithm logic', 'Verify edge case handling'],
        codeQuality: {
          readability: 7,
          efficiency: 6,
          correctness: passRate >= 80 ? 8 : 5
        }
      };
    }
  } catch (error) {
    console.error('Error generating AI feedback:', error);
    
    // Fallback feedback
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;
    
    return {
      overall: `Your solution passed ${passedTests} out of ${totalTests} test cases. Keep working on improving your approach!`,
      strengths: ['Code compiles and runs successfully'],
      improvements: ['Review failed test cases', 'Consider edge cases', 'Optimize algorithm efficiency'],
      hints: ['Double-check your logic', 'Test with different inputs'],
      codeQuality: {
        readability: 6,
        efficiency: 5,
        correctness: passedTests === totalTests ? 8 : 4
      }
    };
  }
}

async function executeTestCases(
  code: string,
  language: string,
  testCases: any[]
): Promise<TestCaseResult[]> {
  // Mock test execution for development
  // In production, this would call the actual code execution service
  
  return testCases.map((testCase, index) => {
    // Mock logic: simulate some tests passing and some failing
    const shouldPass = Math.random() > 0.2; // 80% pass rate for demo
    
    return {
      input: testCase.input,
      expected: testCase.expected,
      actual: shouldPass ? testCase.expected : `wrong_output_${index}`,
      passed: shouldPass,
      explanation: shouldPass ? undefined : 'Output does not match expected result'
    };
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: SubmissionRequest = await req.json();
    const { code, language, problemId, interviewId, userId } = body;
    
    // Validate input
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Code is required' },
        { status: 400 }
      );
    }
    
    if (!language || typeof language !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Language is required' },
        { status: 400 }
      );
    }
    
    if (!problemId || typeof problemId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Problem ID is required' },
        { status: 400 }
      );
    }
    
    // Get problem details
    const problem = MOCK_PROBLEMS[problemId as keyof typeof MOCK_PROBLEMS];
    if (!problem) {
      return NextResponse.json(
        { success: false, error: 'Problem not found' },
        { status: 404 }
      );
    }
    
    // Security checks (reuse from execute-code endpoint)
    const securityChecks = [
      { pattern: /require\s*\(\s*['"]fs['"]/, message: 'File system access not allowed' },
      { pattern: /require\s*\(\s*['"]child_process['"]/, message: 'Process execution not allowed' },
      { pattern: /require\s*\(\s*['"]net['"]/, message: 'Network access not allowed' },
      { pattern: /import\s+os/, message: 'OS module access not allowed' },
      { pattern: /import\s+subprocess/, message: 'Subprocess module not allowed' },
      { pattern: /System\.exit/, message: 'System exit not allowed in user code' }
    ];
    
    for (const check of securityChecks) {
      if (check.pattern.test(code)) {
        return NextResponse.json(
          { success: false, error: check.message },
          { status: 400 }
        );
      }
    }
    
    // Execute test cases
    const testResults = await executeTestCases(code, language, problem.testCases);
    const passedTests = testResults.filter(t => t.passed).length;
    const totalTests = testResults.length;
    const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    // Generate AI feedback
    const feedback = await generateAIFeedback(code, language, problem, testResults);
    
    // Simulate execution metrics
    const executionTime = Math.floor(Math.random() * 500) + 50; // 50-550ms
    const memoryUsed = Math.floor(Math.random() * 20) + 5; // 5-25MB
    
    const result: SubmissionResult = {
      success: true,
      score,
      testResults: {
        passed: passedTests,
        total: totalTests,
        details: testResults
      },
      feedback,
      executionTime,
      memoryUsed
    };
    
    // Log submission for analytics (in production, save to database)
    console.log('Code submission:', {
      problemId,
      language,
      score,
      passedTests,
      totalTests,
      interviewId,
      userId,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('Code submission error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Code submission API',
    availableProblems: Object.keys(MOCK_PROBLEMS),
    features: [
      'AI-powered feedback',
      'Test case evaluation',
      'Code quality assessment',
      'Performance metrics'
    ]
  });
} 
