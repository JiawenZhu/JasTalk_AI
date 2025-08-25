'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/auth.context';
import { useRouter } from 'next/navigation';

export default function AuthenticationRecovery() {
  const { forceRefreshSession, clearInvalidTokens, signOut } = useAuth();
  const router = useRouter();

  const handleRefreshSession = async () => {
    try {
      const result = await forceRefreshSession();
      if (result.success) {
        console.log('✅ Session refreshed successfully');
        window.location.reload();
      } else {
        console.error('❌ Failed to refresh session:', result.error);
      }
    } catch (error) {
      console.error('❌ Error refreshing session:', error);
    }
  };

  const handleClearAndSignIn = async () => {
    try {
      await clearInvalidTokens();
      router.push('/signin');
    } catch (error) {
      console.error('❌ Error clearing tokens:', error);
    }
  };

  const handleForceReAuth = () => {
    // Clear all storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    router.push('/signin');
  };

  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
          <Shield className="w-6 h-6 text-red-600" />
        </div>
        <CardTitle className="text-lg text-red-800">
          Authentication Recovery
        </CardTitle>
        <p className="text-sm text-red-600 mt-2">
          Having trouble with your session? Try these recovery options:
        </p>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <Button
          onClick={handleRefreshSession}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          variant="default"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Refresh Session
        </Button>
        
        <Button
          onClick={handleClearAndSignIn}
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          variant="default"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Clear & Sign In
        </Button>
        
        <Button
          onClick={signOut}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white"
          variant="default"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out Manually
        </Button>
        
        <Button
          onClick={handleForceReAuth}
          className="w-full bg-red-600 hover:bg-red-700 text-white"
          variant="default"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Force Re-Authentication
        </Button>
        
        <div className="text-xs text-red-500 text-center pt-2">
          <p>If problems persist, try clearing your browser cache</p>
          <p>or contact support for assistance.</p>
        </div>
      </CardContent>
    </Card>
  );
}
