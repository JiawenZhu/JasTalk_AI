'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { Play, Square, Send, RotateCcw, Settings, Monitor, Smartphone } from 'lucide-react';
import CodeEditor from './CodeEditor';
import ConsoleOutput, { ConsoleMessage } from './ConsoleOutput';
import ProblemStatement, { CodingProblem } from './ProblemStatement';

interface CodingEnvironmentProps {
  problem: CodingProblem;
  interviewId?: string;
  onSubmit?: (code: string, language: string) => void;
  onExecute?: (code: string, language: string) => Promise<ExecutionResult>;
  className?: string;
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  testResults?: {
    passed: number;
    total: number;
    results: Array<{
      input: string;
      expected: string;
      actual: string;
      passed: boolean;
    }>;
  };
  executionTime?: number;
  memoryUsed?: number;
}

export default function CodingEnvironment({
  problem,
  interviewId,
  onSubmit,
  onExecute,
  className = ''
}: CodingEnvironmentProps) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isExecuting, setIsExecuting] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [layout, setLayout] = useState<'desktop' | 'mobile'>('desktop');
  const [activePanel, setActivePanel] = useState<'problem' | 'editor' | 'console'>('problem');

  // Initialize with language template
  useEffect(() => {
    const templates = {
      javascript: `// Write your JavaScript solution here
function solution() {
    // Your code here
    return result;
}

// Example usage:
console.log(solution());`,
      python: `# Write your Python solution here
def solution():
    # Your code here
    return result

# Example usage:
if __name__ == "__main__":
    print(solution())`,
      java: `// Write your Java solution here
public class Solution {
    public static void main(String[] args) {
        Solution sol = new Solution();
        // Your code here
    }
    
    public Object solution() {
        // Your code here
        return result;
    }
}`
    };
    
    setCode(templates[language as keyof typeof templates] || '');
  }, [language]);

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setLayout(window.innerWidth < 1024 ? 'mobile' : 'desktop');
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleExecuteCode = () => handleExecute();
    const handleSubmitCode = () => handleSubmit();

    window.addEventListener('executeCode', handleExecuteCode);
    window.addEventListener('submitCode', handleSubmitCode);

    return () => {
      window.removeEventListener('executeCode', handleExecuteCode);
      window.removeEventListener('submitCode', handleSubmitCode);
    };
  }, [code, language]);

  const addConsoleMessage = useCallback((message: Omit<ConsoleMessage, 'id' | 'timestamp'>) => {
    setConsoleMessages(prev => [...prev, {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }]);
  }, []);

  const clearConsole = useCallback(() => {
    setConsoleMessages([]);
  }, []);

  const handleExecute = async () => {
    if (isExecuting || !code.trim()) return;

    setIsExecuting(true);
    addConsoleMessage({
      type: 'info',
      content: `Executing ${language} code...`
    });

    try {
      if (onExecute) {
        const result = await onExecute(code, language);
        
        if (result.success) {
          if (result.output) {
            addConsoleMessage({
              type: 'output',
              content: result.output
            });
          }

          if (result.testResults) {
            const { passed, total, results } = result.testResults;
            
            addConsoleMessage({
              type: 'success',
              content: `✅ Test Results: ${passed}/${total} test cases passed`
            });

            results.forEach((testResult, index) => {
              addConsoleMessage({
                type: 'test-result',
                content: testResult.passed ? 'Test case passed' : 'Test case failed',
                testCase: testResult
              });
            });

            if (result.executionTime !== undefined) {
              addConsoleMessage({
                type: 'info',
                content: `Execution time: ${result.executionTime}ms`
              });
            }

            if (result.memoryUsed !== undefined) {
              addConsoleMessage({
                type: 'info',
                content: `Memory used: ${result.memoryUsed}MB`
              });
            }
          }
        } else {
          addConsoleMessage({
            type: 'error',
            content: result.error || 'Execution failed'
          });
        }
      } else {
        // Mock execution for demo
        await new Promise(resolve => setTimeout(resolve, 1000));
        addConsoleMessage({
          type: 'output',
          content: 'Hello World!\n(This is a demo execution - integrate with your code execution service)'
        });
      }
    } catch (error) {
      addConsoleMessage({
        type: 'error',
        content: `Execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmit = () => {
    if (!code.trim()) {
      addConsoleMessage({
        type: 'error',
        content: 'Cannot submit empty solution'
      });
      return;
    }

    addConsoleMessage({
      type: 'info',
      content: 'Submitting solution for evaluation...'
    });

    if (onSubmit) {
      onSubmit(code, language);
    } else {
      // Mock submission
      setTimeout(() => {
        addConsoleMessage({
          type: 'success',
          content: 'Solution submitted successfully! The AI interviewer will provide feedback shortly.'
        });
      }, 1000);
    }
  };

  const handleReset = () => {
    const templates = {
      javascript: `// Write your JavaScript solution here
function solution() {
    // Your code here
    return result;
}

// Example usage:
console.log(solution());`,
      python: `# Write your Python solution here
def solution():
    # Your code here
    return result

# Example usage:
if __name__ == "__main__":
    print(solution())`,
      java: `// Write your Java solution here
public class Solution {
    public static void main(String[] args) {
        Solution sol = new Solution();
        // Your code here
    }
    
    public Object solution() {
        // Your code here
        return result;
    }
}`
    };
    
    setCode(templates[language as keyof typeof templates] || '');
    clearConsole();
    addConsoleMessage({
      type: 'info',
      content: 'Code editor reset to template'
    });
  };

  // Mobile layout with tabs
  if (layout === 'mobile') {
    return (
      <div className={`flex flex-col h-full bg-gray-100 dark:bg-gray-900 ${className}`}>
        {/* Mobile Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {[
            { key: 'problem', label: 'Problem', icon: Monitor },
            { key: 'editor', label: 'Editor', icon: Settings },
            { key: 'console', label: 'Console', icon: Smartphone }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActivePanel(key as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activePanel === key
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Mobile Panel Content */}
        <div className="flex-1 overflow-hidden">
          {activePanel === 'problem' && (
            <ProblemStatement problem={problem} />
          )}
          
          {activePanel === 'editor' && (
            <div className="h-full flex flex-col">
              <CodeEditor
                language={language}
                value={code}
                onChange={(value) => setCode(value || '')}
                onLanguageChange={setLanguage}
                className="flex-1"
              />
              
              {/* Mobile Action Bar */}
              <div className="p-4 bg-gray-800 border-t border-gray-700 flex space-x-2">
                <button
                  onClick={handleExecute}
                  disabled={isExecuting || !code.trim()}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  {isExecuting ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isExecuting ? 'Running...' : 'Run'}</span>
                </button>
                
                <button
                  onClick={handleSubmit}
                  disabled={!code.trim()}
                  className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit</span>
                </button>
                
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                  title="Reset to template"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {activePanel === 'console' && (
            <ConsoleOutput
              messages={consoleMessages}
              onClear={clearConsole}
              isExecuting={isExecuting}
            />
          )}
        </div>
      </div>
    );
  }

  // Desktop layout with resizable panels
  return (
    <div className={`flex flex-col h-full bg-gray-100 dark:bg-gray-900 ${className}`}>
      {/* Desktop Action Bar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Coding Challenge
          </h2>
          {interviewId && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Interview: {interviewId}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExecute}
            disabled={isExecuting || !code.trim()}
            className="flex items-center space-x-2 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            {isExecuting ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isExecuting ? 'Running...' : 'Run Code'}</span>
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!code.trim()}
            className="flex items-center space-x-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Submit Solution</span>
          </button>
          
          <button
            onClick={handleReset}
            className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
            title="Reset to template"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Desktop Panel Layout */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* Problem Statement Panel */}
          <Panel defaultSize={30} minSize={25} maxSize={50}>
            <ProblemStatement problem={problem} />
          </Panel>
          
          <PanelResizeHandle className="w-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" />
          
          {/* Editor and Console Panel */}
          <Panel defaultSize={70} minSize={50}>
            <PanelGroup direction="vertical">
              {/* Code Editor */}
              <Panel defaultSize={65} minSize={40}>
                <CodeEditor
                  language={language}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  onLanguageChange={setLanguage}
                />
              </Panel>
              
              <PanelResizeHandle className="h-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" />
              
              {/* Console Output */}
              <Panel defaultSize={35} minSize={20}>
                <ConsoleOutput
                  messages={consoleMessages}
                  onClear={clearConsole}
                  isExecuting={isExecuting}
                />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
} 
