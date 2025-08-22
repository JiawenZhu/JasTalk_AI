'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, Clock, MessageSquare, ArrowRight, Home } from 'lucide-react';

interface PausePanelProps {
  isVisible: boolean;
  questionsAnswered: number;
  totalQuestions: number;
  duration: number; // in seconds
  onClose: () => void;
}

const PausePanel: React.FC<PausePanelProps> = ({ 
  isVisible, 
  questionsAnswered, 
  totalQuestions, 
  duration,
  onClose
}) => {
  const [animationPhase, setAnimationPhase] = useState<'pause' | 'progress' | 'instructions'>('pause');

  useEffect(() => {
    if (isVisible) {
      setAnimationPhase('pause');

      // Phase 1: Pause animation (first 3 seconds)
      const pauseTimer = setTimeout(() => {
        setAnimationPhase('progress');
      }, 3000);

      // Phase 2: Progress display (next 4 seconds)
      const progressTimer = setTimeout(() => {
        setAnimationPhase('instructions');
      }, 7000);

      return () => {
        clearTimeout(pauseTimer);
        clearTimeout(progressTimer);
      };
    }
  }, [isVisible]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return Math.round((questionsAnswered / totalQuestions) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-green-400 to-emerald-500';
    if (percentage >= 60) return 'from-blue-400 to-cyan-500';
    if (percentage >= 40) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 backdrop-blur-sm z-50"
        >
          {/* Floating Elements Background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-200 rounded-full opacity-60"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.6, 0.3, 0.6],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
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
            {/* Pause Phase */}
            {animationPhase === 'pause' && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: 2 }}
                  className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <Pause className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-3xl font-bold text-gray-800 mb-3"
                >
                  Interview Paused
                </motion.h2>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-lg text-gray-600"
                >
                  Your progress has been saved
                </motion.p>
              </>
            )}

            {/* Progress Phase */}
            {animationPhase === 'progress' && (
              <>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, ease: 'easeInOut' }}
                  className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <MessageSquare className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl font-bold text-gray-800 mb-4"
                >
                  Great Progress!
                </motion.h2>
                
                {/* Progress Stats */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="space-y-4"
                >
                  {/* Questions Answered */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Questions Answered</span>
                      <span className="text-lg font-bold text-gray-800">
                        {questionsAnswered} / {totalQuestions}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(getProgressPercentage())}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage()}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {getProgressPercentage()}% Complete
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-600">Interview Duration</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatDuration(duration)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </>
            )}

            {/* Instructions Phase */}
            {animationPhase === 'instructions' && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: 2 }}
                  className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                >
                  <ArrowRight className="w-12 h-12 text-white" />
                </motion.div>
                
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-2xl font-bold text-gray-800 mb-4"
                >
                  Ready to Continue?
                </motion.h2>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="space-y-4"
                >
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <p className="text-sm text-gray-600 mb-3">
                      Your interview progress has been saved. You can pick up exactly where you left off!
                    </p>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Home className="w-4 h-4" />
                      <span>Click "Continue Practice" to resume your interview</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onClose();
                        // Redirect to dashboard/home
                        window.location.href = '/dashboard';
                      }}
                      className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Home
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onClose();
                        // Redirect back to the interview page
                        window.location.href = '/practice/new';
                      }}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Continue Practice
                    </motion.button>
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>

          {/* Progress Bar at Bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          >
            <div className="w-64 h-2 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                initial={{ width: '0%' }}
                animate={{ 
                  width: animationPhase === 'pause' ? '33%' : 
                         animationPhase === 'progress' ? '66%' : '100%' 
                }}
                transition={{ duration: 1, ease: 'easeInOut' }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              {animationPhase === 'pause' ? 'Pausing...' : 
               animationPhase === 'progress' ? 'Showing Progress...' : 'Instructions Ready'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PausePanel;

