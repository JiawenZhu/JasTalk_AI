"use client";

import React, { useState } from 'react';
import { useCredits } from '@/contexts/credits-context';
import { Button } from '@/components/ui/button';
import CreditsDisplay from '@/components/CreditsDisplay';

export default function TestCreditsPage() {
  const { 
    state, 
    startInterviewTracking, 
    stopInterviewTracking, 
    hasCredits,
    refreshCredits 
  } = useCredits();
  
  const [testResults, setTestResults] = useState<string[]>([]);

  const addLog = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testStartTracking = () => {
    addLog('🚀 Testing startInterviewTracking...');
    addLog(`Current credits: ${state.minutes}m ${state.seconds}s`);
    addLog(`hasCredits: ${hasCredits}`);
    addLog(`startInterviewTracking function: ${typeof startInterviewTracking}`);
    
    try {
      startInterviewTracking();
      addLog('✅ startInterviewTracking called successfully');
      
      // Check if tracking started after a delay
      setTimeout(() => {
        addLog(`🔍 Checking tracking state after 2 seconds...`);
        addLog(`Current credits: ${state.minutes}m ${state.seconds}s`);
        addLog(`Total seconds: ${state.minutes * 60 + state.seconds}`);
      }, 2000);
      
    } catch (error) {
      addLog(`❌ Error calling startInterviewTracking: ${error}`);
    }
  };

  const testStopTracking = () => {
    addLog('🛑 Testing stopInterviewTracking...');
    stopInterviewTracking();
    addLog('✅ stopInterviewTracking called');
  };

  const testRefreshCredits = async () => {
    addLog('🔄 Testing refreshCredits...');
    await refreshCredits();
    addLog('✅ refreshCredits completed');
    addLog(`New credits: ${state.minutes}m ${state.seconds}s`);
  };

  const clearLogs = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Credit System Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current State Display */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Current Credit State</h2>
          
          {/* Debug: Show raw state values */}
          <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
            <div><strong>Raw State:</strong> minutes={state.minutes}, seconds={state.seconds}</div>
            <div><strong>hasCredits:</strong> {hasCredits.toString()}</div>
            <div><strong>isLoading:</strong> {state.isLoading.toString()}</div>
          </div>
          
          <CreditsDisplay variant="detailed" className="mb-4" />
          
          {/* Test different variants */}
          <div className="mb-4 space-y-2">
            <div><strong>Minimal:</strong> <CreditsDisplay variant="minimal" /></div>
            <div><strong>Compact:</strong> <CreditsDisplay variant="compact" /></div>
            <div><strong>Detailed:</strong> <CreditsDisplay variant="detailed" /></div>
          </div>
          
          <div className="space-y-2 text-sm">
            <div><strong>Minutes:</strong> {state.minutes}</div>
            <div><strong>Seconds:</strong> {state.seconds}</div>
            <div><strong>Total Seconds:</strong> {state.minutes * 60 + state.seconds}</div>
            <div><strong>Has Credits:</strong> {hasCredits ? 'Yes' : 'No'}</div>
            <div><strong>Loading:</strong> {state.isLoading ? 'Yes' : 'No'}</div>
            <div><strong>Error:</strong> {state.error || 'None'}</div>
            <div><strong>Last Updated:</strong> {state.lastUpdated ? new Date(state.lastUpdated).toLocaleString() : 'Never'}</div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="space-y-3">
            <Button onClick={testStartTracking} className="w-full">
              🚀 Start Credit Tracking
            </Button>
            
            <Button onClick={testStopTracking} variant="outline" className="w-full">
              🛑 Stop Credit Tracking
            </Button>
            
            <Button onClick={testRefreshCredits} variant="secondary" className="w-full">
              🔄 Refresh Credits from API
            </Button>
            
            <Button onClick={clearLogs} variant="destructive" className="w-full">
              🗑️ Clear Logs
            </Button>
          </div>
        </div>
      </div>

      {/* Test Results Log */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Test Results Log</h2>
        
        {testResults.length === 0 ? (
          <p className="text-gray-500">No test results yet. Use the test controls above.</p>
        ) : (
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            {testResults.map((log, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-800">How to Test</h2>
        <ol className="list-decimal list-inside space-y-2 text-blue-700">
          <li>Click "Refresh Credits from API" to load your current credit balance</li>
          <li>Click "Start Credit Tracking" to begin real-time deduction</li>
          <li>Wait a few seconds to see credits being deducted</li>
          <li>Click "Stop Credit Tracking" to stop the deduction</li>
          <li>Check the logs below to see what's happening</li>
        </ol>
      </div>
    </div>
  );
}
