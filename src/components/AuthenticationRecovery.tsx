"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth.context';
import { useRouter } from 'next/navigation';

export const AuthenticationRecovery: React.FC = () => {
  const { forceRefreshSession, clearInvalidTokens, signOut } = useAuth();
  const router = useRouter();

  const handleTryRefreshSession = async () => {
    try {
      console.log('🔄 Attempting to force refresh session...');
      const result = await forceRefreshSession();
      if (result.success) {
        console.log('✅ Session refreshed successfully');
        window.location.reload(); // Force page reload to update all contexts
      } else {
        console.log('❌ Session refresh failed:', result.error);
        alert('Session refresh failed. Please try signing in again.');
      }
    } catch (error) {
      console.error('❌ Error during session refresh:', error);
      alert('An error occurred. Please try signing in again.');
    }
  };

  const handleClearAndSignIn = async () => {
    try {
      console.log('🧹 Clearing invalid tokens and redirecting to sign-in...');
      await clearInvalidTokens();
      await signOut();
      router.push('/sign-in');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      // Force redirect even if cleanup fails
      router.push('/sign-in');
    }
  };

  const handleForceReAuth = async () => {
    try {
      console.log('🔄 Force re-authentication...');
      
      // Clear all local storage and session storage
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        console.log('🧹 Cleared all local storage');
      }
      
      // Sign out from Supabase
      await signOut();
      
      // Force redirect to sign-in
      console.log('🔄 Redirecting to sign-in...');
      window.location.href = '/sign-in';
    } catch (error) {
      console.error('❌ Error during force re-auth:', error);
      // Force redirect even if cleanup fails
      window.location.href = '/sign-in';
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-red-600">🔐 Authentication Issue Detected</CardTitle>
        <CardDescription>
          We detected an authentication problem that's preventing access to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p>This usually happens when:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Your session has expired</li>
            <li>You recently reset your password</li>
            <li>There's a browser cache issue</li>
            <li>Cookies are disabled or blocked</li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <Button 
            onClick={handleTryRefreshSession} 
            className="w-full"
            variant="outline"
          >
            🔄 Try Refresh Session
          </Button>
          
          <Button 
            onClick={handleClearAndSignIn} 
            className="w-full"
            variant="outline"
          >
            🧹 Clear & Sign In
          </Button>
          
          <Button 
            onClick={handleForceReAuth} 
            className="w-full"
            variant="destructive"
          >
            🚨 Force Re-Authentication
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          <p>If the issue persists, try:</p>
          <p>• Clearing browser cookies for this site</p>
          <p>• Disabling browser extensions temporarily</p>
          <p>• Using a different browser</p>
        </div>
      </CardContent>
    </Card>
  );
};
