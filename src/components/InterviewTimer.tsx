"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Clock } from 'lucide-react';

interface InterviewTimerProps {
  isRunning: boolean;
  onTimeUpdate?: (seconds: number) => void;
  maxTime?: number; // Maximum time in seconds (default: 3 minutes = 180 seconds)
}

export default function InterviewTimer({ 
  isRunning, 
  onTimeUpdate, 
  maxTime = 180 
}: InterviewTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Format time display (e.g., 2:45)
  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Calculate progress percentage
  const progressPercentage = Math.min((seconds / maxTime) * 100, 100);

  // Start timer when isRunning becomes true
  useEffect(() => {
    if (isRunning && !isPaused) {
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

          // Stop timer if max time reached
          if (newSeconds >= maxTime) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return maxTime;
          }

          return newSeconds;
        });
      }, 1000);

      console.log('⏰ Interview timer started');
    } else if (!isRunning || isPaused) {
      // Stop timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('⏰ Interview timer stopped/paused');
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, maxTime, onTimeUpdate]);

  // Reset timer when interview starts fresh
  useEffect(() => {
    if (isRunning && seconds === 0) {
      setSeconds(0);
      setIsPaused(false);
      console.log('⏰ Interview timer reset to 0');
    }
  }, [isRunning, seconds]);

  const handlePause = () => {
    setIsPaused(!isPaused);
    console.log('⏰ Interview timer paused/resumed');
  };

  const handleReset = () => {
    setSeconds(0);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    console.log('⏰ Interview timer reset');
  };

  // Get status message
  const getStatusMessage = () => {
    if (!isRunning) return "Timer is ready. Interview will start soon.";
    if (isPaused) return "Timer is paused.";
    if (seconds >= maxTime) return "Interview time limit reached!";
    return "Interview in progress...";
  };

  // Get button text and variant
  const getButtonProps = () => {
    if (!isRunning) return { text: 'Start', variant: 'bg-blue-500 hover:bg-blue-600' };
    if (isPaused) return { text: 'Resume', variant: 'bg-blue-500 hover:bg-blue-600' };
    return { text: 'Pause', variant: 'bg-orange-500 hover:bg-orange-600' };
  };

  const buttonProps = getButtonProps();

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full text-center space-y-4">
      {/* Timer Display */}
      <div className="flex items-center justify-center space-x-4 p-4 text-gray-700 font-bold text-4xl">
        <Clock className="h-8 w-8 text-gray-500" />
        <span className="font-mono">{formatTime(seconds)}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Time Info */}
      <div className="text-sm text-gray-600">
        <div>Time Used: {formatTime(seconds)}</div>
        <div>Time Remaining: {formatTime(Math.max(0, maxTime - seconds))}</div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center space-x-3">
        <button
          onClick={handlePause}
          disabled={!isRunning}
          className={`text-white font-semibold py-2 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 ${
            !isRunning ? 'bg-gray-400 cursor-not-allowed' : buttonProps.variant
          }`}
        >
          {buttonProps.text}
        </button>
        
        <button
          onClick={handleReset}
          disabled={!isRunning}
          className={`text-white font-semibold py-2 px-6 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-red-300 transition-all duration-200 ${
            !isRunning ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
          }`}
        >
          Reset
        </button>
      </div>

      {/* Status Message */}
      <div className="mt-3 p-2 text-sm text-gray-600 bg-gray-100 rounded-lg">
        {getStatusMessage()}
      </div>
    </div>
  );
}
