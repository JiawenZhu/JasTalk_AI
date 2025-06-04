'use client';

import React, { useState } from 'react';
import CodingEnvironment from '@/components/coding/CodingEnvironment';
import { CodingProblem } from '@/components/coding/ProblemStatement';
import { toast } from 'sonner';

// Sample coding problems for demo
const DEMO_PROBLEMS: Record<string, CodingProblem> = {
  'two-sum': {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].'
      }
    ],
    constraints: [
      '2 ≤ nums.length ≤ 10⁴',
      '-10⁹ ≤ nums[i] ≤ 10⁹',
      '-10⁹ ≤ target ≤ 10⁹',
      'Only one valid answer exists.'
    ],
    testCases: [
      {
        id: 'test-1',
        input: 'nums = [2,7,11,15], target = 9',
        expectedOutput: '[0,1]',
        explanation: 'nums[0] + nums[1] = 2 + 7 = 9'
      },
      {
        id: 'test-2',
        input: 'nums = [3,2,4], target = 6',
        expectedOutput: '[1,2]',
        explanation: 'nums[1] + nums[2] = 2 + 4 = 6'
      },
      {
        id: 'test-3',
        input: 'nums = [3,3], target = 6',
        expectedOutput: '[0,1]',
        explanation: 'nums[0] + nums[1] = 3 + 3 = 6',
        isHidden: true
      }
    ],
    hints: [
      'A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Again, it\'s best to try out brute force solutions for just for completeness. It is from these brute force solutions that you can come up with optimizations.',
      'So, if we fix one of the numbers, say x, we have to scan the entire array to find the next number y which is value - x where value is the input parameter. Can we change our array somehow so that this search becomes faster?',
      'The second train of thought is, without changing the array, can we use additional space somehow? Like maybe a hash map to speed up the search?'
    ],
    timeLimit: 30,
    memoryLimit: 64
  },
  'reverse-string': {
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'Easy',
    description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: 'The string "hello" is reversed to "olleh".'
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        output: '["h","a","n","n","a","H"]',
        explanation: 'The string "Hannah" is reversed to "hannaH".'
      }
    ],
    constraints: [
      '1 ≤ s.length ≤ 10⁵',
      's[i] is a printable ascii character.'
    ],
    testCases: [
      {
        id: 'test-1',
        input: 's = ["h","e","l","l","o"]',
        expectedOutput: '["o","l","l","e","h"]'
      },
      {
        id: 'test-2',
        input: 's = ["H","a","n","n","a","h"]',
        expectedOutput: '["h","a","n","n","a","H"]'
      }
    ],
    hints: [
      'The entire logic for reversing a string is based on using the opposite directional two-pointer approach!'
    ],
    timeLimit: 15,
    memoryLimit: 32
  }
};

export default function CodingDemoPage() {
  const [selectedProblem, setSelectedProblem] = useState<string>('two-sum');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentProblem = DEMO_PROBLEMS[selectedProblem];

  const handleExecute = async (code: string, language: string) => {
    try {
      const response = await fetch('/api/execute-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          testCases: currentProblem.testCases.map(tc => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput
          }))
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Execution failed');
      }

      return result;
    } catch (error) {
      console.error('Execution error:', error);
      throw error;
    }
  };

  const handleSubmit = async (code: string, language: string) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/submit-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          problemId: selectedProblem,
          interviewId: 'demo-interview',
          userId: 'demo-user'
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      // Show success notification
      toast.success(`Solution submitted! Score: ${result.score}/100`, {
        description: `${result.testResults.passed}/${result.testResults.total} test cases passed`,
      });

      // You could also show a detailed feedback modal here
      console.log('Submission result:', result);
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Submission failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                FoloUp Coding Environment Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Experience our AI-powered coding interview platform
              </p>
            </div>
            
            {/* Problem Selector */}
            <div className="flex items-center space-x-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Problem:
              </label>
              <select
                value={selectedProblem}
                onChange={(e) => setSelectedProblem(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                {Object.entries(DEMO_PROBLEMS).map(([key, problem]) => (
                  <option key={key} value={key}>
                    {problem.title} ({problem.difficulty})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Coding Environment */}
      <div className="h-[calc(100vh-120px)]">
        <CodingEnvironment
          problem={currentProblem}
          interviewId="demo-interview"
          onExecute={handleExecute}
          onSubmit={handleSubmit}
        />
      </div>

      {/* Instructions Footer */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4 text-blue-700 dark:text-blue-300">
              <span>💡 Try writing a solution and click "Run Code" to test it</span>
              <span>•</span>
              <span>🚀 Click "Submit Solution" to get AI-powered feedback</span>
            </div>
            
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
              <span>⌘+Enter: Run</span>
              <span>•</span>
              <span>⌘+Shift+Enter: Submit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
