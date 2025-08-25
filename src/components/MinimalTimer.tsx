"use client";

import React, { useState, useEffect, useRef } from 'react';

interface MinimalTimerProps {
  isRunning: boolean;
  onTimeUpdate?: (seconds: number) => void;
}

export default function MinimalTimer({ 
  isRunning, 
  onTimeUpdate
}: MinimalTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time display (e.g., 2:45)
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Start timer when isRunning becomes true
  useEffect(() => {
    if (isRunning) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Start the timer
      intervalRef.current = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1;
          
          // Notify parent component of time update
          if (onTimeUpdate) {
            onTimeUpdate(newSeconds);
          }

          return newSeconds;
        });
      }, 1000);

      console.log('⏰ Minimal timer started');
    } else {
      // Stop timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('⏰ Minimal timer stopped');
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTimeUpdate]);

  // Reset timer when component mounts fresh
  useEffect(() => {
    if (!isRunning) {
      setSeconds(0);
    }
  }, [isRunning]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1 shadow-sm">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="font-mono font-medium">{formatTime(seconds)}</span>
        </div>
      </div>
    </div>
  );
}

