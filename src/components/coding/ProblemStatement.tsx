'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Code, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
  isHidden?: boolean;
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: Example[];
  constraints: string[];
  testCases: TestCase[];
  hints?: string[];
  timeLimit?: number; // in seconds
  memoryLimit?: number; // in MB
}

interface ProblemStatementProps {
  problem: CodingProblem;
  className?: string;
}

export default function ProblemStatement({ problem, className = '' }: ProblemStatementProps) {
  const [expandedSections, setExpandedSections] = useState({
    examples: true,
    constraints: true,
    testCases: false,
    hints: false
  });
  const [showHiddenTests, setShowHiddenTests] = useState(false);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-400 bg-green-400/10';
      case 'Medium':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'Hard':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  const visibleTestCases = showHiddenTests 
    ? problem.testCases 
    : problem.testCases.filter(tc => !tc.isHidden);

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {problem.title}
          </h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
        </div>
        
        {(problem.timeLimit || problem.memoryLimit) && (
          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            {problem.timeLimit && (
              <div className="flex items-center space-x-1">
                <span>⏱️ Time Limit:</span>
                <span className="font-medium">{problem.timeLimit}s</span>
              </div>
            )}
            {problem.memoryLimit && (
              <div className="flex items-center space-x-1">
                <span>💾 Memory Limit:</span>
                <span className="font-medium">{problem.memoryLimit}MB</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Problem Description */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Problem Description
          </h2>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <div 
              className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: problem.description }}
            />
          </div>
        </div>

        {/* Examples */}
        <div>
          <button
            onClick={() => toggleSection('examples')}
            className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {expandedSections.examples ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            <span>Examples ({problem.examples.length})</span>
          </button>
          
          {expandedSections.examples && (
            <div className="space-y-4">
              {problem.examples.map((example, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="font-medium text-gray-900 dark:text-white mb-2">
                    Example {index + 1}:
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Input:</span>
                      <pre className="mt-1 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-sm font-mono overflow-x-auto">
                        {example.input}
                      </pre>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Output:</span>
                      <pre className="mt-1 bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-sm font-mono overflow-x-auto">
                        {example.output}
                      </pre>
                    </div>
                    
                    {example.explanation && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Explanation:</span>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {example.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Constraints */}
        <div>
          <button
            onClick={() => toggleSection('constraints')}
            className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            {expandedSections.constraints ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
            <span>Constraints</span>
          </button>
          
          {expandedSections.constraints && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <ul className="space-y-1">
                {problem.constraints.map((constraint, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span>{constraint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Test Cases */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => toggleSection('testCases')}
              className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {expandedSections.testCases ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
              <span>Test Cases ({visibleTestCases.length})</span>
            </button>
            
            {problem.testCases.some(tc => tc.isHidden) && (
              <button
                onClick={() => setShowHiddenTests(!showHiddenTests)}
                className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors"
              >
                {showHiddenTests ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showHiddenTests ? 'Hide' : 'Show'} Hidden</span>
              </button>
            )}
          </div>
          
          {expandedSections.testCases && (
            <div className="space-y-3">
              {visibleTestCases.map((testCase, index) => (
                <div 
                  key={testCase.id} 
                  className={`border rounded-lg p-4 ${
                    testCase.isHidden 
                      ? 'border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' 
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Code className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Test Case {index + 1}
                    </span>
                    {testCase.isHidden && (
                      <span className="text-xs px-2 py-1 bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Input:</span>
                      <pre className="mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm font-mono overflow-x-auto">
                        {testCase.input}
                      </pre>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Expected Output:</span>
                      <pre className="mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-sm font-mono overflow-x-auto">
                        {testCase.expectedOutput}
                      </pre>
                    </div>
                    
                    {testCase.explanation && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Explanation:</span>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                          {testCase.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hints */}
        {problem.hints && problem.hints.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('hints')}
              className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-white mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {expandedSections.hints ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
              <span>Hints ({problem.hints.length})</span>
            </button>
            
            {expandedSections.hints && (
              <div className="space-y-3">
                {problem.hints.map((hint, index) => (
                  <div key={index} className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <span className="text-amber-500 font-bold text-sm">💡</span>
                      <div>
                        <span className="font-medium text-amber-800 dark:text-amber-200">
                          Hint {index + 1}:
                        </span>
                        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                          {hint}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
