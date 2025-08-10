"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XMarkIcon,
  PlayIcon,
  UserGroupIcon,
  DocumentTextIcon,
  MicrophoneIcon,
  ChartBarIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
  action?: string;
  tips?: string[];
}

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstTime?: boolean;
}

export default function WelcomeModal({ isOpen, onClose, isFirstTime = false }: WelcomeModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to JasTalk AI!",
      description: "Your AI-powered interview practice platform. Let's get you started with a quick tour of how to use our product effectively.",
      icon: <SparklesIcon className="w-8 h-8 text-blue-600" />,
      action: "Let's get started!",
      tips: [
        "Practice with real AI interviewers",
        "Get instant feedback and insights",
        "Track your progress over time"
      ]
    },
    {
      id: "upload",
      title: "Upload Your Documents",
      description: "Start by uploading your resume, job description, or any relevant documents. Our AI will generate personalized interview questions based on your content.",
      icon: <DocumentTextIcon className="w-8 h-8 text-green-600" />,
      image: "/upload-demo.png",
      action: "Upload your documents",
      tips: [
        "Upload resume for personalized questions",
        "Include job descriptions for targeted practice",
        "AI analyzes your background automatically"
      ]
    },
    {
      id: "questions",
      title: "Generate Interview Questions",
      description: "Our AI analyzes your documents and creates relevant interview questions. You can review, edit, or regenerate questions to match your practice goals.",
      icon: <DocumentTextIcon className="w-8 h-8 text-purple-600" />,
      action: "Generate questions",
      tips: [
        "Questions tailored to your background",
        "Mix of technical and behavioral questions",
        "Adjust difficulty and focus areas"
      ]
    },
    {
      id: "interviewers",
      title: "Choose Your Interviewer",
      description: "Select from our AI interviewers, each with different personalities, specialties, and difficulty levels. Find the perfect match for your practice session.",
      icon: <UserGroupIcon className="w-8 h-8 text-orange-600" />,
      action: "Select interviewer",
      tips: [
        "Different personalities and styles",
        "Specialized in various domains",
        "Adjustable difficulty levels"
      ]
    },
    {
      id: "practice",
      title: "Start Your Practice Interview",
      description: "Begin your voice-based interview with the AI. Speak naturally, answer questions, and get real-time feedback. It's just like a real phone interview!",
      icon: <MicrophoneIcon className="w-8 h-8 text-blue-600" />,
      action: "Start practice interview",
      tips: [
        "Voice-based conversation",
        "Real-time AI responses",
        "Natural interview flow"
      ]
    },
    {
      id: "analytics",
      title: "Review Your Performance",
      description: "After each practice session, review detailed analytics including communication skills, technical depth, confidence, and areas for improvement.",
      icon: <ChartBarIcon className="w-8 h-8 text-green-600" />,
      action: "View analytics",
      tips: [
        "Detailed performance metrics",
        "Communication analysis",
        "Improvement suggestions"
      ]
    },
    {
      id: "complete",
      title: "You're All Set!",
      description: "You now know how to use JasTalk AI effectively. Start practicing and improve your interview skills with our AI-powered platform.",
      icon: <CheckIcon className="w-8 h-8 text-green-600" />,
      action: "Start practicing",
      tips: [
        "Practice regularly for best results",
        "Try different interviewers",
        "Track your progress over time"
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsLoading(true);
    
    // Mark onboarding as completed
    localStorage.setItem('onboardingCompleted', 'true');
    
    // Close modal after a short delay
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1000);
  };

  const handleSkip = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    onClose();
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {currentStepData.icon}
                  <div>
                    <h2 className="text-xl font-semibold">{currentStepData.title}</h2>
                    <p className="text-blue-100 text-sm">
                      Step {currentStep + 1} of {onboardingSteps.length}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleSkip}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full bg-white/20 rounded-full h-2">
                  <motion.div
                    className="bg-white h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="text-center mb-6">
                <p className="text-gray-700 text-lg leading-relaxed">
                  {currentStepData.description}
                </p>
              </div>

              {/* Tips Section */}
              {currentStepData.tips && (
                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Pro Tips
                  </h3>
                  <ul className="space-y-2">
                    {currentStepData.tips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm text-blue-800">
                        <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Demo Image Placeholder */}
              {currentStepData.image && (
                <div className="bg-gray-100 rounded-xl p-8 mb-6 text-center">
                  <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <PlayIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Demo visualization</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-3">
                  {!isFirstTime && (
                    <button
                      onClick={handleSkip}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Skip
                    </button>
                  )}
                  
                  <Button
                    onClick={handleNext}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Completing...</span>
                      </div>
                    ) : isLastStep ? (
                      <div className="flex items-center space-x-2">
                        <span>{currentStepData.action}</span>
                        <CheckIcon className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>{currentStepData.action}</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
