"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon, CheckIcon, SparklesIcon } from "@heroicons/react/24/outline";

interface UploadGuideTourProps {
  isVisible: boolean;
  onComplete: () => void;
  onClose: () => void;
}

const UploadGuideTour: React.FC<UploadGuideTourProps> = ({ 
  isVisible, 
  onComplete, 
  onClose 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  const steps = [
    {
      title: "Welcome to Jastalk.AI! 🎯",
      description: "Let's create personalized interview questions together. Follow these simple steps to get started.",
      position: "center",
      highlight: null
    },
    {
      title: "Choose Your Input Method 📝",
      description: "Select between 'Text Input' to paste a job description, or 'File Upload' to upload a document.",
      position: "top",
      highlight: "mode-selection"
    },
    {
      title: "Add Job Description 💼",
      description: "Paste your job description in the text area, or use one of our quick templates for common roles.",
      position: "center",
      highlight: "job-description"
    },
    {
      title: "Configure Questions ⚙️",
      description: "Choose how many questions you want (5-20) and set the difficulty level (Easy, Medium, Hard).",
      position: "center",
      highlight: "question-config"
    },
    {
      title: "Use Quick Templates 🚀",
      description: "Click on any template card to instantly fill in a job description for that role.",
      position: "center",
      highlight: "quick-templates"
    },
    {
      title: "Generate & Practice 🎉",
      description: "Click 'Generate Questions' to create your personalized interview questions and start practicing!",
      position: "bottom",
      highlight: "generate-button"
    }
  ];

  useEffect(() => {
    if (isVisible) {
      setCurrentStep(0);
      setShowCompletion(false);
    }
  }, [isVisible]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Show completion animation
      setShowCompletion(true);
      setTimeout(() => {
        onComplete();
      }, 3000); // Show completion for 3 seconds
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const getStepPosition = () => {
    const step = steps[currentStep];
    switch (step.position) {
      case "top":
        return "top-20";
      case "bottom":
        return "bottom-20";
      default:
        return "top-1/2 -translate-y-1/2";
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        >
          {/* Step Indicator */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'bg-blue-600 scale-125'
                      : index < currentStep
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Main Guide Content */}
          <div className={`absolute left-1/2 transform -translate-x-1/2 ${getStepPosition()}`}>
            <motion.div
              key={currentStep}
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4 text-center"
            >
              {/* Step Number */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-lg">{currentStep + 1}</span>
              </div>

              {/* Step Title */}
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                {steps[currentStep].title}
              </h3>

              {/* Step Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {steps[currentStep].description}
              </p>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentStep === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Previous
                </button>

                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Completion Animation */}
          <AnimatePresence>
            {showCompletion && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.6 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              >
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm">
                  <motion.div
                    animate={{ 
                      rotate: [0, 10, -10, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 0.6, repeat: 2 }}
                    className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckIcon className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  <motion.h3
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-2xl font-bold text-gray-800 mb-2"
                  >
                    You're All Set! 🎉
                  </motion.h3>
                  
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="text-gray-600"
                  >
                    You now know how to create personalized interview questions. Start practicing and ace your interviews!
                  </motion.p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadGuideTour;
