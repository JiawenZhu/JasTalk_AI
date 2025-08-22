'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth.context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestWelcomeCreditsPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const testWelcomeCredits = async () => {
    if (!isAuthenticated) {
      setResult('❌ You must be signed in to test welcome credits');
      return;
    }

    setLoading(true);
    setResult('🔄 Testing welcome credits...');

    try {
      const response = await fetch('/api/test-welcome-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add_welcome_credits',
          amount: 5.00
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Success! ${data.message}\nCredits added: ${data.creditsAdded} minutes`);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentCredits = async () => {
    if (!isAuthenticated) {
      setResult('❌ You must be signed in to check credits');
      return;
    }

    setLoading(true);
    setResult('🔄 Checking current credits...');

    try {
      const response = await fetch('/api/user-subscription');
      const data = await response.json();

      if (response.ok) {
        if (data.subscription) {
          setResult(`📊 Current Credits:\nRemaining: ${data.subscription.interview_time_remaining} minutes\nTotal: ${data.subscription.interview_time_total} minutes`);
        } else {
          setResult('📊 No subscription found - user has 0 credits');
        }
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Test Welcome Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You must be signed in to test the welcome credits system.
            </p>
            <Button onClick={() => window.location.href = '/sign-in'}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Welcome Credits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600">
            <p><strong>User:</strong> {user?.email}</p>
            <p><strong>User ID:</strong> {user?.id}</p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={testWelcomeCredits} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Testing...' : 'Test Welcome Credits ($5)'}
            </Button>

            <Button 
              onClick={checkCurrentCredits} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Checking...' : 'Check Current Credits'}
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{result}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


