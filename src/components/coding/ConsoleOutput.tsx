'use client';

import React, { useRef, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Play, Trash2 } from 'lucide-react';

export interface ConsoleMessage {
  id: string;
  type: 'output' | 'error' | 'info' | 'success' | 'test-result';
  content: string;
  timestamp: Date;
  testCase?: {
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  };
}

interface ConsoleOutputProps {
  messages: ConsoleMessage[];
  onClear: () => void;
  isExecuting?: boolean;
  className?: string;
}

export default function ConsoleOutput({
  messages,
  onClear,
  isExecuting = false,
  className = ''
}: ConsoleOutputProps) {
  const consoleRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [messages]);

  const getMessageIcon = (message: ConsoleMessage) => {
    switch (message.type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
      case 'info':
        return <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />;
      case 'test-result':
        return message.testCase?.passed 
          ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
      default:
        return <Play className="w-4 h-4 text-gray-400 flex-shrink-0" />;
    }
  };

  const getMessageStyle = (message: ConsoleMessage) => {
    switch (message.type) {
      case 'success':
        return 'text-green-300';
      case 'error':
        return 'text-red-300';
      case 'info':
        return 'text-blue-300';
      case 'test-result':
        return message.testCase?.passed ? 'text-green-300' : 'text-red-300';
      default:
        return 'text-gray-300';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const renderTestCaseResult = (message: ConsoleMessage) => {
    if (message.type !== 'test-result' || !message.testCase) {
      return null;
    }

    const { input, expected, actual, passed } = message.testCase;

    return (
      <div className="mt-2 pl-6 space-y-2 text-sm border-l-2 border-gray-600">
        <div className="space-y-1">
          <div className="text-gray-400">
            <span className="font-medium">Input:</span> <code className="bg-gray-800 px-1 rounded">{input}</code>
          </div>
          <div className="text-gray-400">
            <span className="font-medium">Expected:</span> <code className="bg-gray-800 px-1 rounded">{expected}</code>
          </div>
          <div className={passed ? 'text-green-300' : 'text-red-300'}>
            <span className="font-medium">Actual:</span> <code className="bg-gray-800 px-1 rounded">{actual}</code>
          </div>
        </div>
        {!passed && (
          <div className="text-red-400 text-xs">
            ❌ Test case failed
          </div>
        )}
        {passed && (
          <div className="text-green-400 text-xs">
            ✅ Test case passed
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 ${className}`}>
      {/* Console Header */}
      <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <Play className="w-4 h-4 text-green-400" />
          <span className="text-white font-medium">Console Output</span>
          {isExecuting && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-green-400"></div>
              <span className="text-green-400 text-xs">Executing...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onClear}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Console Messages */}
      <div 
        ref={consoleRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-sm leading-relaxed"
        style={{ backgroundColor: '#0d1117' }}
      >
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center mt-8">
            <Play className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No output yet. Run your code to see results here.</p>
            <p className="text-xs mt-1">Press ⌘+Enter to execute code</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div key={message.id} className="group">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getMessageIcon(message)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`font-medium ${getMessageStyle(message)}`}>
                        {message.type === 'test-result' 
                          ? `Test Case ${message.testCase?.passed ? 'Passed' : 'Failed'}`
                          : message.type.charAt(0).toUpperCase() + message.type.slice(1)
                        }
                      </span>
                      <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    </div>
                    <div className={`whitespace-pre-wrap break-words ${getMessageStyle(message)}`}>
                      {message.content}
                    </div>
                    {renderTestCaseResult(message)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Execution indicator */}
        {isExecuting && (
          <div className="flex items-center space-x-2 mt-4 text-green-400">
            <div className="animate-pulse">▶</div>
            <span className="text-sm">Code is running...</span>
          </div>
        )}
      </div>
    </div>
  );
} 
