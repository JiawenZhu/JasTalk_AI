"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth.context';
import { AuthenticationRecovery } from '@/components/AuthenticationRecovery';

export default function AuthDebugPage() {
  const { user, session, isAuthenticated, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testResults, setTestResults] = useState<any>(null);

  const testAuthAPI = async () => {
    try {
      console.log('🧪 Testing auth API...');
      const response = await fetch('/api/debug-auth', {
        credentials: 'include'
      });
      
      const data = await response.json();
      setTestResults({
        status: response.status,
        data,
        timestamp: new Date().toISOString()
      });
      
      console.log('🧪 Auth API test result:', { status: response.status, data });
    } catch (error) {
      console.error('❌ Auth API test failed:', error);
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };

  const testCreditsAPI = async () => {
    try {
      console.log('🧪 Testing credits API...');
      const response = await fetch('/api/user-subscription', {
        credentials: 'include'
      });
      
      const data = await response.json();
      setTestResults({
        endpoint: 'user-subscription',
        status: response.status,
        data,
        timestamp: new Date().toISOString()
      });
      
      console.log('🧪 Credits API test result:', { status: response.status, data });
    } catch (error) {
      console.error('❌ Credits API test failed:', error);
      setTestResults({
        endpoint: 'user-subscription',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  };

  const clearAllStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      console.log('🧹 Cleared all local storage');
      alert('All local storage cleared. Please refresh the page.');
    }
  };

  useEffect(() => {
    // Collect debug information
    const info = {
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      cookiesEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : 'unknown',
      localStorage: typeof localStorage !== 'undefined' ? 'available' : 'unavailable',
      sessionStorage: typeof sessionStorage !== 'undefined' ? 'available' : 'unavailable',
      location: typeof window !== 'undefined' ? window.location.href : 'unknown',
      authState: {
        isAuthenticated,
        hasUser: !!user,
        hasSession: !!session,
        loading
      }
    };
    
    setDebugInfo(info);
  }, [user, session, isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading authentication state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">🔐 Authentication Debug</h1>
          <p className="text-gray-600 mt-2">
            Diagnose and fix authentication issues preventing access to interviews
          </p>
        </div>

        {/* Current Auth State */}
        <Card>
          <CardHeader>
            <CardTitle>Current Authentication State</CardTitle>
            <CardDescription>
              Real-time status of your authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Authenticated:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {isAuthenticated ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-semibold">User:</span>
                <span className="ml-2">{user ? user.email : 'None'}</span>
              </div>
              <div>
                <span className="font-semibold">Session:</span>
                <span className="ml-2">{session ? 'Active' : 'None'}</span>
              </div>
              <div>
                <span className="font-semibold">Loading:</span>
                <span className="ml-2">{loading ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Tests */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoint Tests</CardTitle>
            <CardDescription>
              Test if your authentication is working with the backend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={testAuthAPI} variant="outline">
                🧪 Test Auth API
              </Button>
              <Button onClick={testCreditsAPI} variant="outline">
                🧪 Test Credits API
              </Button>
            </div>
            
            {testResults && (
              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h4 className="font-semibold mb-2">Test Results:</h4>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Information */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              Technical details about your environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Environment:</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(debugInfo, null, 2)}
                </pre>
              </div>
              
              <div className="flex gap-4">
                <Button onClick={clearAllStorage} variant="outline">
                  🧹 Clear All Storage
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                >
                  🔄 Refresh Page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Recovery */}
        {!isAuthenticated && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">🔴 Authentication Required</CardTitle>
              <CardDescription className="text-red-700">
                You need to authenticate to access interviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthenticationRecovery />
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Troubleshooting Steps</CardTitle>
            <CardDescription>
              Follow these steps to resolve authentication issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">1</span>
                <div>
                  <p className="font-semibold">Test API Endpoints</p>
                  <p className="text-gray-600">Use the buttons above to test if your authentication is working with the backend.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">2</span>
                <div>
                  <p className="font-semibold">Check Browser Settings</p>
                  <p className="text-gray-600">Ensure cookies are enabled and no extensions are blocking them.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">3</span>
                <div>
                  <p className="font-semibold">Clear Storage</p>
                  <p className="text-gray-600">Clear local storage and session storage to remove corrupted data.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">4</span>
                <div>
                  <p className="font-semibold">Re-authenticate</p>
                  <p className="text-gray-600">Use the recovery options above to sign in again.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
