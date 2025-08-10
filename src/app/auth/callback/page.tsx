"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Image from "next/image";

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus('loading');
        setMessage('Verifying your authentication...');

        // Add a small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For now, just redirect to dashboard
        // In a real implementation, you would handle the OAuth callback here
        setStatus('success');
        setMessage('Authentication successful! Redirecting to dashboard...');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } catch (error) {
        setStatus('error');
        setMessage('An unexpected error occurred during authentication');
      }
    };

    handleCallback();
  }, [router]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center mb-4">
              <Image
                src="/jastalk.png"
                alt="JasTalk AI Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <div className="flex justify-center">
              {getStatusIcon()}
            </div>
            <CardTitle className={`text-xl font-bold ${getStatusColor()}`}>
              {status === 'loading' && 'Authenticating...'}
              {status === 'success' && 'Authentication Successful'}
              {status === 'error' && 'Authentication Failed'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {status === 'error' && (
              <button
                onClick={() => router.push('/sign-in')}
                className="text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Return to sign in
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
