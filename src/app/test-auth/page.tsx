"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth.context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAuthPage() {
  const { user, loading, signOut } = useAuth();
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    if (loading) {
      setAuthStatus('Loading...');
    } else if (user) {
      setAuthStatus(`Logged in as: ${user.email}`);
    } else {
      setAuthStatus('Not logged in');
    }
  }, [user, loading]);

  const testAuthAPIs = async () => {
    addResult('Testing authentication APIs...');
    
    try {
      // Test user subscription API
      const subscriptionResponse = await fetch('/api/user-subscription');
      if (subscriptionResponse.ok) {
        addResult('✅ User subscription API: Working');
      } else {
        const error = await subscriptionResponse.text();
        addResult(`❌ User subscription API: ${subscriptionResponse.status} - ${error}`);
      }
    } catch (error) {
      addResult(`❌ User subscription API error: ${error}`);
    }

    try {
      // Test interview sessions API
      const sessionsResponse = await fetch('/api/interview-sessions');
      if (sessionsResponse.ok) {
        addResult('✅ Interview sessions API: Working');
      } else {
        const error = await sessionsResponse.text();
        addResult(`❌ Interview sessions API: ${sessionsResponse.status} - ${error}`);
      }
    } catch (error) {
      addResult(`❌ Interview sessions API error: ${error}`);
    }

    try {
      // Test interviews API
      const interviewsResponse = await fetch('/api/interviews');
      if (interviewsResponse.ok) {
        addResult('✅ Interviews API: Working');
      } else {
        const error = await interviewsResponse.text();
        addResult(`❌ Interviews API: ${interviewsResponse.status} - ${error}`);
      }
    } catch (error) {
      addResult(`❌ Interviews API error: ${error}`);
    }
  };

  const testEmailAPIs = async () => {
    addResult('Testing email APIs...');
    
    try {
      // Test pause email API
      const pauseResponse = await fetch('/api/emails/interview-pause-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: 'test@example.com',
          username: 'testuser',
          interviewerName: 'Test Interviewer',
          interviewTitle: 'Test Interview',
          questionsAnswered: 1,
          totalQuestions: 10,
          duration: '1m 0s',
          conversationSummary: 'Test conversation',
          detailedLogs: [],
          resumeUrl: 'http://localhost:3000/practice/new'
        })
      });
      
      if (pauseResponse.ok) {
        addResult('✅ Pause email API: Working');
      } else {
        const error = await pauseResponse.text();
        addResult(`❌ Pause email API: ${pauseResponse.status} - ${error}`);
      }
    } catch (error) {
      addResult(`❌ Pause email API error: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🔐 Authentication Status Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Current Status:</h4>
            <p className="text-blue-700">{authStatus}</p>
            {user && (
              <div className="mt-2 text-sm text-blue-600">
                <p>User ID: {user.id}</p>
                <p>Email: {user.email}</p>
                <p>Last Sign In: {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Unknown'}</p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button onClick={testAuthAPIs} className="bg-blue-600 hover:bg-blue-700">
              Test Auth APIs
            </Button>
            <Button onClick={testEmailAPIs} className="bg-green-600 hover:bg-green-700">
              Test Email APIs
            </Button>
            {user && (
              <Button onClick={signOut} variant="outline" className="bg-red-50 hover:bg-red-100 text-red-700">
                Sign Out
              </Button>
            )}
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
            <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No test results yet. Click a test button above.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-2 font-mono text-sm">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Instructions:</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Check your authentication status above</li>
              <li>• If not logged in, go to /dashboard to log in</li>
              <li>• Test the APIs to see which ones are working</li>
              <li>• The email functionality requires valid authentication</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
