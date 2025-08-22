"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";

export const dynamic = 'force-dynamic';
import { 
  ArrowLeftIcon,
  MicrophoneIcon,
  CogIcon,
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { useCredits } from "@/contexts/credits-context";
import CreditsDisplay from "@/components/CreditsDisplay";

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
  const { hasCredits, deductCredits } = useCredits();
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

    // Check if user has enough credits for question generation
    if (!hasCredits) {
      router.push('/premium?insufficient-credits=true');
      return;
    }

    // Load generated questions from localStorage
    loadGeneratedQuestions();
  }, [isAuthenticated, hasCredits, router]);

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
        
        // Deduct 0.1 credit (6 seconds) for question generation
        deductCredits(6);
        
      } catch (error) {
        console.error('Error loading questions:', error);
        generateMockQuestions();
        // Still deduct credits even if there's an error
        deductCredits(6);
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
    // Check if user has enough credits for regeneration
    if (!hasCredits) {
      router.push('/premium?insufficient-credits=true');
      return;
    }
    
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
      
      // Deduct 0.1 credit (6 seconds) for question regeneration
      deductCredits(6);
      
    } catch (error) {
      console.error('Error regenerating questions:', error);
      // Fallback to mock questions
      generateMockQuestions();
      // Still deduct credits even if there's an error
      deductCredits(6);
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
    
    // Store current questions for practice session
    if (questions.length > 0) {
      localStorage.setItem('generatedQuestions', JSON.stringify(questions));
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
          <div className="flex items-center space-x-2">
            <CreditsDisplay variant="compact" />
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 -mr-2 rounded-lg hover:bg-gray-100"
          >
            <CogIcon className="w-5 h-5 text-gray-600" />
          </button>
          </div>
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
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                isRegenerating
                  ? 'bg-gradient-to-r from-gray-400 to-gray-500 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isRegenerating ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center space-x-3"
                >
                  {/* Enhanced Loading Spinner */}
                  <div className="relative">
                    <div className="w-5 h-5 border-2 border-white/30 rounded-full"></div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 w-5 h-5 border-2 border-transparent border-t-white rounded-full"
                    />
                </div>
                  <span>Regenerating Questions...</span>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center space-x-2"
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-lg"
                  >
                    🔄
                  </motion.div>
                  <span>Regenerate Questions</span>
                </motion.div>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}

      <div className="p-4">
        {/* Loading State */}
        <AnimatePresence mode="wait">
        {isGenerating && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="text-center py-16 relative overflow-hidden"
              style={{
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden',
                perspective: 1000,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Background Animation */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Subtle Grid Pattern - Only on desktop to avoid mobile flashing */}
                <div className="hidden md:block absolute inset-0 opacity-5">
                  <div className="w-full h-full" style={{
                    backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 0)`,
                    backgroundSize: '20px 20px'
                  }} />
                </div>
              </div>

              {/* Professional Loading Animation */}
              <div className="relative mb-8">
                {/* Main Animation Container */}
                <div 
                  className="relative w-24 h-24 md:w-32 md:h-32 mx-auto"
                  style={{
                    willChange: 'transform',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  {/* Outer Ring with Gradient */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 p-1">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      {/* Inner Content */}
                      <div className="text-center">
                        {/* Animated Icon - Reduced complexity on mobile */}
                        <motion.div
                          animate={{ 
                            scale: [1, 1.05, 1],
                            rotate: [0, 2, -2, 0]
                          }}
                          transition={{ 
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="text-2xl md:text-4xl mb-2"
                        >
                          🧠
                        </motion.div>
                        
                        {/* Progress Dots - Simplified on mobile */}
                        <div className="flex justify-center space-x-1">
                          {[0, 1, 2].map((dot) => (
                            <motion.div
                              key={dot}
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5]
                              }}
                              transition={{ 
                                duration: 2,
                                repeat: Infinity,
                                delay: dot * 0.3,
                                ease: "easeInOut"
                              }}
                              className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Rotating Border - Slower on mobile to reduce GPU load */}
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                    className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-purple-500 border-b-indigo-500 border-l-blue-400"
                  />
                </div>
                
                {/* Progress Bar with Character */}
                <div className="mt-6 md:mt-8 max-w-md mx-auto relative">
                  {/* Progress Bar Background */}
                  <div 
                    className="bg-gray-200 rounded-full h-2.5 md:h-3 overflow-hidden relative"
                    style={{
                      willChange: 'transform',
                      backfaceVisibility: 'hidden'
                    }}
                  >
                    {/* Progress Fill */}
                    <motion.div
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ 
                        duration: 8,
                        ease: "easeInOut"
                      }}
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full"
                      style={{
                        willChange: 'width',
                        backfaceVisibility: 'hidden'
                      }}
                    />
                    
                    {/* Character that moves with progress */}
                    <motion.div
                      initial={{ left: "0%" }}
                      animate={{ left: "100%" }}
                      transition={{ 
                        duration: 8,
                        ease: "easeInOut"
                      }}
                      className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                      style={{ 
                        marginLeft: '0',
                        willChange: 'left',
                        backfaceVisibility: 'hidden'
                      }}
                    >
                      {/* Character Design - Responsive sizing with running animation */}
                      <motion.div 
                        className="relative"
                        animate={{ 
                          y: [0, -2, 0],
                          rotateY: [0, 5, 0]
                        }}
                        transition={{
                          duration: 0.4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        {/* Head */}
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-amber-200 rounded-full border-2 border-amber-300 relative">
                          {/* Hat/Headband */}
                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-0.5 md:w-4 md:h-1 bg-red-500 rounded-full"></div>
                        </div>
                        {/* Body */}
                        <div className="w-3 h-5 md:w-4 md:h-6 bg-teal-400 rounded-md mx-auto mt-1"></div>
                        {/* Arms - Animated for running effect */}
                        <motion.div 
                          className="absolute top-2 -left-1 w-1.5 h-0.5 md:w-2 md:h-1 bg-teal-400 rounded-full transform rotate-45"
                          animate={{ 
                            rotate: [45, 60, 45],
                            y: [0, -1, 0]
                          }}
                          transition={{
                            duration: 0.4,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <motion.div 
                          className="absolute top-2 -right-1 w-1.5 h-0.5 md:w-2 md:h-1 bg-teal-400 rounded-full transform rotate-45"
                          animate={{ 
                            rotate: [45, 30, 45],
                            y: [0, 1, 0]
                          }}
                          transition={{
                            duration: 0.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.2
                          }}
                        />
                        {/* Legs - Added for running effect */}
                        <motion.div 
                          className="absolute bottom-0 -left-0.5 w-1.5 h-0.5 md:w-2 md:h-1 bg-teal-400 rounded-full transform rotate-45"
                          animate={{ 
                            rotate: [45, 60, 45],
                            y: [0, 1, 0]
                          }}
                          transition={{
                            duration: 0.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.1
                          }}
                        />
                        <motion.div 
                          className="absolute bottom-0 -right-0.5 w-1.5 h-0.5 md:w-2 md:h-1 bg-teal-400 rounded-full transform rotate-45"
                          animate={{ 
                            rotate: [45, 30, 45],
                            y: [0, -1, 0]
                          }}
                          transition={{
                            duration: 0.4,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.3
                          }}
                        />
                      </motion.div>
                    </motion.div>
                  </div>
                  
                  {/* Progress Percentage */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-center mt-2 text-xs md:text-sm text-gray-600"
                  >
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                    >
                      Generating your personalized questions...
                    </motion.span>
                  </motion.div>
                </div>
              </div>
              
              {/* Dynamic Status Messages */}
              <motion.div
                key="status"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-4"
              >
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Generating Your Interview Questions
            </h3>
                
                {/* Phase Indicators */}
                <div className="flex justify-center space-x-6 text-sm">
                  {[
                    { phase: "Analyzing", icon: "📄", color: "text-blue-600" },
                    { phase: "Processing", icon: "⚙️", color: "text-purple-600" },
                    { phase: "Creating", icon: "✨", color: "text-indigo-600" }
                  ].map((step, index) => (
                    <motion.div
                      key={step.phase}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.3 }}
                      className={`flex flex-col items-center space-y-2 ${step.color}`}
                    >
                      <div className="text-2xl">{step.icon}</div>
                      <span className="font-medium">{step.phase}</span>
                    </motion.div>
                  ))}
                </div>
                
                <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                  Our AI is carefully analyzing your job description and crafting personalized questions that will challenge and showcase your skills.
                </p>
                
                {/* Estimated Time */}
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                  <ClockIcon className="w-4 h-4" />
                  <span className="text-sm">Estimated time: 15-30 seconds</span>
          </div>
              </motion.div>
            </motion.div>
          )}

          {/* Success State */}
          {!isGenerating && questions.length > 0 && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="text-center py-16 relative overflow-hidden"
            >
              {/* Success Animation */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.2,
                  type: "spring",
                  stiffness: 200
                }}
                className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.4,
                    type: "spring",
                    stiffness: 200
                  }}
                  className="text-4xl"
                >
                  ✨
                </motion.div>
              </motion.div>
              
              {/* Success Message */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2"
              >
                Questions Generated Successfully!
              </motion.h2>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="text-gray-600 text-lg"
              >
                Your personalized interview questions are ready to help you practice and excel!
              </motion.p>
              
              {/* Confetti-like Elements */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 0, 
                    y: -20, 
                    x: (i % 2 === 0 ? -20 : 20),
                    rotate: 0
                  }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    y: [-20, -40, -60], 
                    x: (i % 2 === 0 ? -20 : 20),
                    rotate: 360
                  }}
                  transition={{ 
                    duration: 2,
                    delay: 1 + i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                  className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                  style={{
                    left: `${20 + i * 15}%`,
                    top: '60%'
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Questions List */}
        {!isGenerating && questions.length > 0 && (
          <div className="space-y-4">
            {/* Top Start Practice Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartPractice}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
                aria-label="Start practice interview with the generated questions"
              >
                <MicrophoneIcon className="w-5 h-5" aria-hidden="true" />
                <span>Start Practice Interview</span>
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.4 }}
              className="flex items-center justify-between"
            >
              <h2 className="text-xl font-semibold text-gray-900">
                {questions.length} Questions Generated
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {config.type.charAt(0).toUpperCase() + config.type.slice(1)} • {config.difficulty}
                </span>
              </div>
            </motion.div>

            {questions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: 1.6 + index * 0.15,
                  duration: 0.6,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -5, 
                  scale: 1.02,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 transition-all duration-200 cursor-pointer hover:border-blue-200"
                role="article"
                aria-label={`Generated question ${index + 1} of ${questions.length}: ${question.text}. Type: ${question.type.replace('-', ' ')}. Difficulty: ${question.difficulty}. Category: ${question.category || 'General'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1.8 + index * 0.15, type: "spring", stiffness: 200 }}
                      className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full"
                    >
                      #{index + 1}
                    </motion.span>
                    <motion.span 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2.0 + index * 0.15 }}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(question.type)}`}
                      aria-label={`Question type: ${question.type.replace('-', ' ')}`}
                    >
                      {question.type.replace('-', ' ')}
                    </motion.span>
                    <motion.span 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2.1 + index * 0.15 }}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}
                      aria-label={`Difficulty level: ${question.difficulty}`}
                    >
                      {question.difficulty}
                    </motion.span>
                  </div>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 2.2 + index * 0.15, type: "spring", stiffness: 200 }}
                    className="flex items-center space-x-1"
                  >
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEditQuestion(question.id)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                      aria-label={`Edit question ${index + 1}`}
                    >
                      <PencilIcon className="w-4 h-4" aria-hidden="true" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleRemoveQuestion(question.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                      aria-label={`Remove question ${index + 1}`}
                    >
                      <XMarkIcon className="w-4 h-4" aria-hidden="true" />
                    </motion.button>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.3 + index * 0.15 }}
                >
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
                        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
                </motion.div>

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
