'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, MessageCircle, Code, Lightbulb, Zap } from 'lucide-react';

interface AICopilotProps {
  code: string;
  language: string;
  problem?: {
    title: string;
    description: string;
    constraints: string[];
  };
  isEnabled?: boolean;
  onSuggestionAccept?: (suggestion: string) => void;
  className?: string;
}

interface Suggestion {
  id: string;
  type: 'completion' | 'optimization' | 'hint' | 'correction';
  content: string;
  confidence: number; // 0-1
  position?: {
    line: number;
    column: number;
  };
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AICopilot({
  code,
  language,
  problem,
  isEnabled = false,
  onSuggestionAccept,
  className = ''
}: AICopilotProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Debounced code analysis for suggestions
  useEffect(() => {
    if (!isEnabled || !code.trim()) {
      setSuggestions([]);
      return;
    }

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced analysis
    debounceTimer.current = setTimeout(() => {
      analyzeCodeForSuggestions(code, language);
    }, 1000); // 1 second delay

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [code, language, isEnabled]);

  const analyzeCodeForSuggestions = async (currentCode: string, currentLanguage: string) => {
    if (!currentCode.trim()) return;

    setIsLoading(true);
    
    try {
      // Mock AI suggestions for demo (replace with actual AI service)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockSuggestions: Suggestion[] = [];
      
      // Mock completion suggestions
      if (currentCode.includes('function') && !currentCode.includes('return')) {
        mockSuggestions.push({
          id: '1',
          type: 'completion',
          content: 'return result;',
          confidence: 0.85,
          position: { line: currentCode.split('\n').length, column: 0 }
        });
      }
      
      // Mock optimization suggestions
      if (currentCode.includes('for') && currentCode.includes('for')) {
        mockSuggestions.push({
          id: '2',
          type: 'optimization',
          content: 'Consider using a more efficient algorithm like HashMap for O(1) lookup instead of nested loops',
          confidence: 0.92
        });
      }
      
      // Mock hint suggestions
      if (currentCode.length > 50 && !currentCode.includes('console.log') && !currentCode.includes('print')) {
        mockSuggestions.push({
          id: '3',
          type: 'hint',
          content: 'Consider adding debug output to trace your algorithm execution',
          confidence: 0.70
        });
      }
      
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error analyzing code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptSuggestion = (suggestion: Suggestion) => {
    if (onSuggestionAccept) {
      onSuggestionAccept(suggestion.content);
    }
    
    // Remove the accepted suggestion
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const dismissSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  const getSuggestionIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'completion':
        return <Code className="w-4 h-4 text-blue-500" />;
      case 'optimization':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'hint':
        return <Lightbulb className="w-4 h-4 text-green-500" />;
      case 'correction':
        return <Sparkles className="w-4 h-4 text-red-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSuggestionColor = (type: Suggestion['type']) => {
    switch (type) {
      case 'completion':
        return 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20';
      case 'optimization':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20';
      case 'hint':
        return 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20';
      case 'correction':
        return 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/20';
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      // Mock AI response (replace with actual AI chat service)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const responses = [
        "I'd be happy to help! Can you share more details about what you're trying to implement?",
        "That's a great question! Consider breaking down the problem into smaller steps.",
        "For this type of problem, a hash map approach might be more efficient than nested loops.",
        "Have you considered the edge cases mentioned in the constraints?",
        "Your approach looks good! You might want to optimize the time complexity."
      ];
      
      const assistantMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };
      
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
    } finally {
      setIsChatLoading(false);
    }
  };

  if (!isEnabled) {
    return (
      <div className={`flex items-center justify-center p-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <div className="text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">AI Copilot</p>
          <p className="text-sm">Coming in Phase 2</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <span className="font-semibold text-gray-900 dark:text-white">AI Copilot</span>
          {isLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
          )}
        </div>
        
        <button
          onClick={() => setShowChat(!showChat)}
          className={`p-2 rounded-lg transition-colors ${
            showChat 
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Toggle AI Chat"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showChat ? (
          /* AI Chat Interface */
          <div className="flex flex-col h-full">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Ask the AI for help with your code!</p>
                  <p className="text-xs mt-1">Tips, optimizations, debugging help</p>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg text-sm ${
                        message.type === 'user'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))
              )}
              
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask AI for help..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isChatLoading}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Suggestions Panel */
          <div className="p-4 space-y-3">
            {suggestions.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No suggestions yet</p>
                <p className="text-xs mt-1">Keep coding to get AI assistance</p>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`border rounded-lg p-3 ${getSuggestionColor(suggestion.type)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getSuggestionIcon(suggestion.type)}
                      <span className="text-sm font-medium capitalize text-gray-900 dark:text-white">
                        {suggestion.type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                    <button
                      onClick={() => dismissSuggestion(suggestion.id)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    {suggestion.content}
                  </p>
                  
                  {suggestion.type === 'completion' && (
                    <button
                      onClick={() => acceptSuggestion(suggestion)}
                      className="w-full px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                    >
                      Accept Suggestion
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
