"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparklesIcon, DocumentTextIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface GeneratingQuestionsModalProps {
  isVisible: boolean;
  questionCount: number;
  onComplete?: () => void;
}

const GeneratingQuestionsModal: React.FC<GeneratingQuestionsModalProps> = ({ 
  isVisible, 
  questionCount,
  onComplete 
}) => {
  const [animationPhase, setAnimationPhase] = useState<'generating' | 'processing' | 'complete'>('generating');

  useEffect(() => {
    if (isVisible) {
      setAnimationPhase('generating');

      // Phase 1: Generating animation (first 3 seconds)
      const generatingTimer = setTimeout(() => {
        setAnimationPhase('processing');
      }, 3000);

      // Phase 2: Processing display (next 3 seconds)
      const processingTimer = setTimeout(() => {
        setAnimationPhase('complete');
      }, 6000);

      // Phase 3: Complete and auto-close (after 1 second)
      const completeTimer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 7000);

      return () => {
        clearTimeout(generatingTimer);
        clearTimeout(processingTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible, onComplete]);

  const getProgressPercentage = () => {
    switch (animationPhase) {
      case 'generating': return 33;
      case 'processing': return 66;
      case 'complete': return 100;
      default: return 0;
    }
  };

  const getProgressColor = () => {
    return 'from-blue-500 to-indigo-600';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          {/* Background Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-60"
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                animate={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            ))}
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: 'spring', bounce: 0.4 }}
            className="text-center z-10 max-w-md mx-4"
          >
            {/* Generating Phase */}
            {animationPhase === 'generating' && (
              <>
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <SparklesIcon className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-3xl font-bold text-gray-800 mb-3"
                >
                  Generating Questions
                </motion.h2>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-lg text-gray-600"
                >
                  AI is analyzing your job description...
                </motion.p>
              </>
            )}

            {/* Processing Phase */}
            {animationPhase === 'processing' && (
              <>
                <motion.div
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 10, -10, 0]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <DocumentTextIcon className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-3xl font-bold text-gray-800 mb-3"
                >
                  Processing Content
                </motion.h2>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-lg text-gray-600"
                >
                  Creating {questionCount} targeted questions...
                </motion.p>
              </>
            )}

            {/* Complete Phase */}
            {animationPhase === 'complete' && (
              <>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, type: 'spring', bounce: 0.6 }}
                  className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <CheckCircleIcon className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-3xl font-bold text-gray-800 mb-3"
                >
                  Questions Ready!
                </motion.h2>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-lg text-gray-600"
                >
                  Redirecting to practice session...
                </motion.p>
              </>
            )}

            {/* Progress Bar at Bottom */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <div className="w-64 h-2 bg-white/30 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${getProgressColor()} rounded-full`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 1, ease: 'easeInOut' }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {animationPhase === 'generating' ? 'Analyzing...' : 
                 animationPhase === 'processing' ? 'Creating Questions...' : 'Complete!'}
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GeneratingQuestionsModal;
