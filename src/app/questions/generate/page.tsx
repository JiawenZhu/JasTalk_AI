"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export const dynamic = 'force-dynamic';
import { 
  ArrowLeftIcon,
  MicrophoneIcon,
  CogIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";

interface Question {
  id: string;
  text: string;
  type: 'technical' | 'behavioral' | 'system-design' | 'coding';
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

interface InterviewConfig {
  type: string;
  questionCount: number;
  difficulty: string;
  focusAreas: string[];
}

export default function QuestionGenerationPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [config, setConfig] = useState<InterviewConfig>({
    type: 'technical',
    questionCount: 10,
    difficulty: 'medium',
    focusAreas: ['programming', 'problem-solving']
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [jobDescription, setJobDescription] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    // Load generated questions from localStorage
    loadGeneratedQuestions();
  }, [isAuthenticated, router]);

  const loadGeneratedQuestions = () => {
    setIsGenerating(true);
    
    // Simulate loading time
    setTimeout(() => {
      try {
        // Load questions from localStorage
        const storedQuestions = localStorage.getItem('generatedQuestions');
        const storedConfig = localStorage.getItem('questionConfig');
        
        if (storedQuestions) {
          const parsedQuestions = JSON.parse(storedQuestions);
          setQuestions(parsedQuestions);
          
          if (storedConfig) {
            const parsedConfig = JSON.parse(storedConfig);
            setConfig(prev => ({
              ...prev,
              questionCount: parsedConfig.questionCount,
              type: parsedConfig.interviewType,
              difficulty: parsedConfig.difficulty,
              focusAreas: parsedConfig.focusAreas
            }));
          }
          
          // Load job description
          const storedJobDescription = localStorage.getItem('jobDescription');
          if (storedJobDescription) {
            setJobDescription(storedJobDescription);
          }
        } else {
          // Fallback to mock questions if none stored
          generateMockQuestions();
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        generateMockQuestions();
      } finally {
        setIsGenerating(false);
      }
    }, 1000);
  };

  const generateMockQuestions = () => {
    const mockQuestions: Question[] = [
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
      }
    ];
    
    setQuestions(mockQuestions);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    
    try {
      // Get stored job description and config
      const storedJobDescription = jobDescription || localStorage.getItem('jobDescription');
      const storedConfig = localStorage.getItem('questionConfig');
      
      if (!storedJobDescription) {
        // If no job description stored, navigate back to upload page
        router.push('/upload?mode=text');
        return;
      }
      
      const config = storedConfig ? JSON.parse(storedConfig) : {
        questionCount: 10,
        interviewType: 'mixed',
        difficulty: 'medium',
        focusAreas: ['programming', 'problem-solving', 'system-design']
      };
      
      // Call the AI question generation API with stored job description
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: storedJobDescription,
          questionCount: config.questionCount,
          interviewType: config.interviewType,
          difficulty: config.difficulty,
          focusAreas: config.focusAreas
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate questions');
      }

      const data = await response.json();
      
      // Update the questions and config
      setQuestions(data.questions);
      setConfig(prev => ({
        ...prev,
        questionCount: config.questionCount,
        type: config.interviewType,
        difficulty: config.difficulty,
        focusAreas: config.focusAreas
      }));
      
      // Update localStorage with new questions
      localStorage.setItem('generatedQuestions', JSON.stringify(data.questions));
      localStorage.setItem('questionConfig', JSON.stringify(config));
      
    } catch (error) {
      console.error('Error regenerating questions:', error);
      // Fallback to mock questions
      generateMockQuestions();
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleEditQuestion = (questionId: string) => {
    setEditingQuestion(questionId);
  };

  const handleSaveQuestion = (questionId: string, newText: string) => {
    setQuestions(prev => 
      prev.map(q => 
        q.id === questionId ? { ...q, text: newText } : q
      )
    );
    setEditingQuestion(null);
  };

  const handleRemoveQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleStartPractice = () => {
    // Store job description for reuse
    if (jobDescription) {
      localStorage.setItem('jobDescription', jobDescription);
    }
    
    // Navigate to practice session
    router.push('/practice/new');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'behavioral': return 'bg-green-100 text-green-800';
      case 'system-design': return 'bg-purple-100 text-purple-800';
      case 'coding': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Generated Questions</h1>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 -mr-2 rounded-lg hover:bg-gray-100"
          >
            <CogIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Configuration Panel */}
      {showConfig && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-white border-b border-gray-200 overflow-hidden"
        >
          <div className="p-4 space-y-4">
            <h3 className="font-semibold text-gray-900">Interview Configuration</h3>
            
            {/* Job Description Preview */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Job Description Used
                </label>
                <button
                  onClick={() => router.push('/upload?mode=text')}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                >
                  Change
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <p className="text-sm text-gray-700">
                  {jobDescription || 'No job description available'}
                </p>
              </div>
            </div>
            
            {/* Interview Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Type
              </label>
              <select
                value={config.type}
                onChange={(e) => setConfig(prev => ({ ...prev, type: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="technical">Technical Interview</option>
                <option value="behavioral">Behavioral Interview</option>
                <option value="system-design">System Design Interview</option>
                <option value="coding">Coding Interview</option>
                <option value="mixed">Mixed Interview</option>
              </select>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions: {config.questionCount}
              </label>
              <input
                type="range"
                min="5"
                max="20"
                value={config.questionCount}
                onChange={(e) => setConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setConfig(prev => ({ ...prev, difficulty: level }))}
                    className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                      config.difficulty === level
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Areas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Focus Areas
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['programming', 'problem-solving', 'system-design', 'algorithms', 'databases', 'networking'].map((area) => (
                  <button
                    key={area}
                    onClick={() => {
                      setConfig(prev => ({
                        ...prev,
                        focusAreas: prev.focusAreas.includes(area)
                          ? prev.focusAreas.filter(a => a !== area)
                          : [...prev.focusAreas, area]
                      }));
                    }}
                    className={`p-2 text-sm rounded-lg border transition-colors ${
                      config.focusAreas.includes(area)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {area.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                isRegenerating
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRegenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Regenerating Questions...</span>
                </div>
              ) : (
                'Regenerate Questions'
              )}
            </motion.button>
          </div>
        </motion.div>
      )}

      <div className="p-4">
        {/* Loading State */}
        {isGenerating && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Generating Questions
            </h3>
            <p className="text-gray-600">
              Analyzing your document and creating personalized interview questions...
            </p>
          </div>
        )}

        {/* Questions List */}
        {!isGenerating && questions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {questions.length} Questions Generated
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {config.type.charAt(0).toUpperCase() + config.type.slice(1)} • {config.difficulty}
                </span>
              </div>
            </div>

            {questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">
                      #{index + 1}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(question.type)}`}>
                      {question.type.replace('-', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditQuestion(question.id)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveQuestion(question.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {editingQuestion === question.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={question.text}
                      onChange={(e) => {
                        setQuestions(prev => 
                          prev.map(q => 
                            q.id === question.id ? { ...q, text: e.target.value } : q
                          )
                        );
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveQuestion(question.id, question.text)}
                        className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingQuestion(null)}
                        className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-900 leading-relaxed">
                    {question.text}
                  </p>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Category: {question.category}
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Start Practice Button */}
            <div className="pt-6">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleStartPractice}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <MicrophoneIcon className="w-5 h-5" />
                <span>Start Practice Interview</span>
              </motion.button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && questions.length === 0 && (
          <div className="text-center py-12">
            <MicrophoneIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Questions Generated
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your configuration or regenerating questions.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRegenerate}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium"
            >
              Generate Questions
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
} 
