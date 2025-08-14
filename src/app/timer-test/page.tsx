"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth.context';

export default function TimerTestPage() {
  const { isAuthenticated, user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [maxTime, setMaxTime] = useState(60); // 1 minute for testing
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      console.log('🚀 Starting test timer');
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          console.log(`⏰ Test timer: ${newTime}s`);
          
          if (newTime >= maxTime) {
            console.log('⏰ Test timer reached max time');
            setIsRunning(false);
            handleTimerComplete();
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        console.log('🛑 Clearing test timer');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, maxTime]);

  const startTimer = () => {
    console.log('🎯 Starting test timer for 1 minute');
    setElapsedTime(0);
    setIsRunning(true);
  };

  const stopTimer = () => {
    console.log('⏹️ Stopping test timer');
    setIsRunning(false);
  };

  const resetTimer = () => {
    console.log('🔄 Resetting test timer');
    setElapsedTime(0);
    setIsRunning(false);
  };

  const handleTimerComplete = async () => {
    // Capture the final time value
    const finalTime = maxTime;
    console.log(`⏰ Timer completed! Total time: ${finalTime} seconds`);
    
    // Wait 5 seconds then deduct credits (simulating interview completion)
    toast({
      title: "Timer Complete!",
      description: "Waiting 5 seconds before processing credits...",
    });

    setTimeout(async () => {
      if (isAuthenticated && user) {
        console.log(`💰 Processing credit deduction for ${finalTime} seconds`);
        await deductCredits(finalTime);
      } else {
        console.log('⚠️ User not authenticated, skipping credit deduction');
        toast({
          title: "Not Authenticated",
          description: "Please sign in to test credit deduction",
          variant: "destructive",
        });
      }
    }, 5000);
  };

  const deductCredits = async (totalSeconds: number) => {
    try {
      console.log(`🔍 Testing credit deduction with ${totalSeconds} seconds`);
      console.log(`🔍 Type of totalSeconds:`, typeof totalSeconds);
      console.log(`🔍 Request payload:`, { totalSeconds });
      console.log(`🔍 User authenticated:`, isAuthenticated);
      console.log(`🔍 User email:`, user?.email);
      
      const response = await fetch('/api/deduct-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({ totalSeconds }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Credit deduction successful:`, data);
        
        toast({
          title: "Credits Deducted!",
          description: `Used ${data.deductedMinutes} minute(s). ${data.remainingCredits} minutes remaining. Leftover: ${data.leftoverSeconds}s`,
        });
      } else {
        const errorData = await response.json();
        console.error('Credit deduction failed:', errorData);
        
        toast({
          title: "Credit Deduction Failed",
          description: errorData.error || "Failed to deduct credits",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing credit deduction:', error);
      toast({
        title: "Error",
        description: "Failed to test credit deduction",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Timer & Credit Deduction Test</h1>
          
          <div className="text-center mb-6">
            <div className="text-4xl font-mono font-bold text-blue-600 mb-2">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-gray-500">
              / {formatTime(maxTime)} (1 minute test)
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <Button 
              onClick={startTimer} 
              disabled={isRunning}
              className="w-full"
            >
              Start 1-Minute Timer
            </Button>
            
            <Button 
              onClick={stopTimer} 
              disabled={!isRunning}
              variant="outline"
              className="w-full"
            >
              Stop Timer
            </Button>
            
            <Button 
              onClick={resetTimer} 
              variant="secondary"
              className="w-full"
            >
              Reset Timer
            </Button>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Test Instructions:</h3>
            <ol className="text-sm text-gray-700 space-y-1">
              <li>1. Click "Start 1-Minute Timer"</li>
              <li>2. Wait for timer to complete (1 minute)</li>
              <li>3. Wait 5 seconds for credit processing</li>
              <li>4. Check console logs for debugging</li>
              <li>5. Verify credits are deducted</li>
            </ol>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <p><strong>Authentication:</strong> {isAuthenticated ? '✅ Signed In' : '❌ Not Signed In'}</p>
            <p><strong>User:</strong> {user?.email || 'None'}</p>
            <p><strong>Timer State:</strong> {isRunning ? 'Running' : 'Stopped'}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
