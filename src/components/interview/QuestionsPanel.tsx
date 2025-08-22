'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp, List, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  category: string;
}

interface QuestionsPanelProps {
  questions: Question[];
  currentQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
  isVisible: boolean;
  onToggle: () => void;
}

export default function QuestionsPanel({
  questions,
  currentQuestionIndex,
  onQuestionSelect,
  isVisible,
  onToggle
}: QuestionsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        className="fixed left-4 top-20 z-40"
      >
        {/* Questions Card */}
        <motion.div
          className={`
            bg-white/90 backdrop-blur-sm border-2 border-green-200 rounded-2xl shadow-xl
            transition-all duration-300 ease-in-out
            ${isExpanded ? 'w-80 h-96' : 'w-64 h-auto max-h-32'}
          `}
          animate={{
            scale: isExpanded ? 1.02 : 1,
            boxShadow: isExpanded 
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
              : "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-green-100">
            <div className="flex items-center space-x-2">
              <List className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-700 text-lg">Interview Questions</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-green-100 rounded-full transition-colors"
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-green-600" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-green-600" />
                )}
              </button>
              <button
                onClick={onToggle}
                className="p-1 hover:bg-green-100 rounded-full transition-colors"
                title="Close"
              >
                <X className="w-4 h-4 text-green-600" />
              </button>
            </div>
          </div>

          {/* Professional Note */}
          <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                These are your initial interview questions. Additional questions may be asked throughout the conversation to better understand your experience and skills.
              </p>
            </div>
          </div>

          {/* Questions List */}
          <div className={`p-4 transition-all duration-300 ${
            isExpanded ? 'max-h-64' : 'max-h-20'
          }`}>
            <div className={`space-y-3 transition-all duration-300 ${
              isExpanded ? 'opacity-100' : 'opacity-60'
            }`}>
              {questions && questions.length > 0 ? (
                <div className={`${isExpanded ? 'max-h-56 overflow-y-auto pr-2' : 'max-h-16 overflow-hidden'}`}>
                  {questions.map((question, index) => (
                    <motion.div
                      key={question.id || `q${index + 1}`}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-all duration-200
                        ${index === currentQuestionIndex 
                          ? 'bg-green-50 border-green-300 shadow-md' 
                          : 'bg-white/60 border-green-100 hover:bg-green-50/50'
                        }
                      `}
                      onClick={() => onQuestionSelect(index)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-start gap-3">
                        <Badge 
                          variant={index === currentQuestionIndex ? "default" : "secondary"}
                          className={index === currentQuestionIndex ? "bg-green-600" : ""}
                        >
                          Q{index + 1}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-relaxed ${
                            index === currentQuestionIndex ? 'text-green-800' : 'text-gray-700'
                          }`}>
                            {isExpanded 
                              ? question.text 
                              : question.text.length > 50 
                                ? question.text.substring(0, 50) + '...' 
                                : question.text
                            }
                          </p>
                          {isExpanded && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                              <span className="px-2 py-1 bg-gray-100 rounded-full">
                                {question.type || 'general'}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 rounded-full">
                                {question.difficulty || 'medium'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No questions loaded yet</p>
                  <p className="text-gray-400 text-xs mt-1">Questions will appear here once the interview begins</p>
                </div>
              )}
            </div>
          </div>

          {/* Expand/Collapse Indicator */}
          {!isExpanded && questions && questions.length > 0 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1 h-1 bg-green-400 rounded-full"
              />
            </div>
          )}

          {/* Scroll Indicator for Expanded State */}
          {isExpanded && questions && questions.length > 3 && (
            <div className="absolute bottom-2 right-2">
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-xs text-gray-400 bg-white/80 px-2 py-1 rounded-full"
              >
                Scroll to see more
              </motion.div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
