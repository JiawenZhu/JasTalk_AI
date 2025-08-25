'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CelebrationPanelProps {
  isVisible: boolean;
  duration?: number; // in milliseconds
  onAnimationComplete?: () => void; // Callback when animation is ready to transition
}

const CelebrationPanel: React.FC<CelebrationPanelProps> = ({ 
  isVisible, 
  duration = 12000, // Increased from 4000 to 12000 (12 seconds)
  onAnimationComplete
}) => {
  const [confettiPieces, setConfettiPieces] = useState<Array<{
    id: number;
    color: string;
    left: number;
    delay: number;
    size: number;
  }>>([]);
  const [animationPhase, setAnimationPhase] = useState<'celebration' | 'loading' | 'ready'>('celebration');

  useEffect(() => {
    if (isVisible) {
      const colors = ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6'];
      const pieces = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        left: Math.random() * 100,
        delay: Math.random() * 4,
        size: Math.random() * 10 + 5,
      }));
      setConfettiPieces(pieces);
      setAnimationPhase('celebration');

      // Phase 1: Celebration (first 6 seconds)
      const celebrationTimer = setTimeout(() => {
        setAnimationPhase('loading');
      }, 6000);

      // Phase 2: Loading (next 4 seconds)
      const loadingTimer = setTimeout(() => {
        setAnimationPhase('ready');
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }, 10000);

      return () => {
        clearTimeout(celebrationTimer);
        clearTimeout(loadingTimer);
      };
    }
  }, [isVisible, onAnimationComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50"
        >
          {/* Confetti Container */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confettiPieces.map((piece) => (
              <motion.div
                key={piece.id}
                className="absolute"
                style={{
                  backgroundColor: piece.color,
                  width: `${piece.size}px`,
                  height: `${piece.size * 2}px`,
                  left: `${piece.left}%`,
                  borderRadius: '2px',
                }}
                initial={{ y: -100, rotate: 0 }}
                animate={{ 
                  y: window.innerHeight + 100, 
                  rotate: 720 
                }}
                transition={{
                  duration: 6, // Increased from 4 to 6 seconds
                  delay: piece.delay,
                  ease: 'linear',
                  repeat: Infinity,
                }}
              />
            ))}
          </div>

          {/* Main Content */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring', bounce: 0.4 }}
            className="text-center z-10"
          >
            {/* Celebration Phase */}
            {animationPhase === 'celebration' && (
              <>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 2, delay: 0.5 }}
                  className="text-8xl mb-4"
                >
                  🎉
                </motion.div>
                
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="text-4xl font-bold text-gray-800 mb-2"
                >
                  Great Job!
                </motion.h2>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="text-xl text-gray-600"
                >
                  Preparing your performance analysis...
                </motion.p>
              </>
            )}

            {/* Loading Phase */}
            {animationPhase === 'loading' && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  ⚡
                </motion.div>
                
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl font-bold text-gray-800 mb-2"
                >
                  Analyzing Your Performance
                </motion.h2>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-lg text-gray-600"
                >
                  Generating detailed insights...
                </motion.p>
              </>
            )}

            {/* Ready Phase */}
            {animationPhase === 'ready' && (
              <>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: 2 }}
                  className="text-6xl mb-4"
                >
                  ✨
                </motion.div>
                
                <motion.h2
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl font-bold text-gray-800 mb-2"
                >
                  Analysis Complete!
                </motion.h2>
                
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-lg text-gray-600"
                >
                  Your feedback is ready
                </motion.p>
              </>
            )}
          </motion.div>

          {/* Loading Dots - Enhanced for longer duration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5 }}
            className="flex space-x-2 mt-8"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-indigo-500 rounded-full"
                animate={{ y: [-5, 5, -5] }}
                transition={{
                  duration: 1.2, // Increased from 0.8 to 1.2 seconds
                  repeat: Infinity,
                  delay: i * 0.3, // Increased from 0.2 to 0.3 seconds
                  ease: 'easeInOut',
                }}
              />
            ))}
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="w-64 h-2 bg-gray-200 rounded-full mt-6 overflow-hidden"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: animationPhase === 'celebration' ? '33%' : animationPhase === 'loading' ? '66%' : '100%' }}
              transition={{ duration: 1, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CelebrationPanel;
