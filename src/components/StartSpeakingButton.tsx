import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic } from 'lucide-react';

interface StartSpeakingButtonProps {
  onStartSpeaking: () => void;
  isVisible: boolean;
  className?: string;
}

export default function StartSpeakingButton({ 
  onStartSpeaking, 
  isVisible, 
  className = "" 
}: StartSpeakingButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cycleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animation cycle: 2-3 seconds animation, then 5 seconds pause
  useEffect(() => {
    if (!isVisible) {
      setIsAnimating(false);
      return;
    }

    const startAnimationCycle = () => {
      setIsAnimating(true);
      
      // Stop animation after 2-3 seconds (random between 2-3)
      const animationDuration = Math.random() * 1000 + 2000; // 2000-3000ms
      
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        
        // Wait 5 seconds before starting next cycle
        cycleTimeoutRef.current = setTimeout(() => {
          if (isVisible) {
            startAnimationCycle();
          }
        }, 5000);
      }, animationDuration);
    };

    // Start the first cycle
    startAnimationCycle();

    // Cleanup function
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (cycleTimeoutRef.current) {
        clearTimeout(cycleTimeoutRef.current);
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={`fixed inset-0 flex items-center justify-center z-50 ${className}`}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        
        {/* Button Container */}
        <motion.button
          onClick={onStartSpeaking}
          className={`
            relative bg-white rounded-2xl p-8 shadow-2xl border-2 border-blue-500
            hover:scale-105 transition-transform duration-200 cursor-pointer
            focus:outline-none focus:ring-4 focus:ring-blue-300
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Status Indicator */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full mb-4">
              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
              <span className="text-sm font-medium text-gray-700">Your turn to respond</span>
              <div className="w-2 h-2 bg-gray-400 rounded-full ml-2" />
            </div>
                            <p className="text-gray-600 text-lg">Ready to listen when you click to speak</p>
          </div>

          {/* Animated Button */}
          <motion.div
            className="relative"
            animate={isAnimating ? {
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            } : {}}
            transition={{
              duration: 0.6,
              repeat: isAnimating ? Infinity : 0,
              ease: "easeInOut"
            }}
          >
            <motion.div
              className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg"
              animate={isAnimating ? {
                boxShadow: [
                  "0 0 0 0 rgba(59, 130, 246, 0.7)",
                  "0 0 0 20px rgba(59, 130, 246, 0)",
                  "0 0 0 0 rgba(59, 130, 246, 0)"
                ]
              } : {}}
              transition={{
                duration: 2,
                repeat: isAnimating ? Infinity : 0,
                ease: "easeOut"
              }}
            >
              <Mic className="w-10 h-10 text-white" />
            </motion.div>
          </motion.div>

          {/* Button Text */}
          <div className="text-center mt-6">
                            <span className="text-blue-600 font-semibold text-lg">Click To Speak</span>
          </div>

          {/* Additional Animation Elements */}
          {isAnimating && (
            <>
              {/* Floating particles */}
              <motion.div
                className="absolute -top-2 -left-2 w-3 h-3 bg-blue-400 rounded-full"
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.5, 1, 0.5],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="absolute -top-2 -right-2 w-2 h-2 bg-blue-300 rounded-full"
                animate={{
                  y: [0, -15, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [1, 1.5, 1]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              />
              <motion.div
                className="absolute -bottom-2 -left-2 w-2.5 h-2.5 bg-blue-300 rounded-full"
                animate={{
                  y: [0, 15, 0],
                  opacity: [0.4, 0.9, 0.4],
                  scale: [1, 1.3, 1]
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
            </>
          )}
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
