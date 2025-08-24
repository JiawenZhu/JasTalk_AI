"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth.context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Image from "next/image";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { updatePasswordWithToken } = useAuth();

  // Get Supabase recovery tokens from URL (since we're using Supabase's native flow)
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const type = searchParams.get('type');
  const email = searchParams.get('email');

  // Check if this is a valid Supabase recovery flow
  const isValidRecoveryFlow = type === 'recovery' && accessToken && refreshToken;

  useEffect(() => {
    if (!isValidRecoveryFlow) {
      setError('Invalid or missing reset token. Please request a new password reset.');
    } else {
      console.log('✅ Valid Supabase recovery flow detected for:', email);
      console.log('✅ Old JWT tokens will be automatically invalidated by Supabase');
    }
  }, [isValidRecoveryFlow, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!password.trim()) {
      setError('Please enter a new password');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // IMPORTANT: Use updatePasswordWithToken for password reset flow
      // This properly handles the recovery tokens and creates a new session
      const result = await updatePasswordWithToken(password, accessToken!, refreshToken!); // Assuming refreshToken is not needed for custom flow
      
      if (result.success) {
        setSuccess('Password updated successfully! Creating new session...');
        setPassword('');
        setConfirmPassword('');
        
        // Clear any old invalid tokens from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('supabase.auth.refreshToken');
        }
        
        // Wait a moment for the new session to be established
        setTimeout(() => {
          setSuccess('Password updated successfully! Redirecting to dashboard...');
          
          // Redirect to dashboard after successful password reset
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        }, 1000);
      } else {
        setError(result.error || 'Failed to update password');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setError('An unexpected error occurred during password reset');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidRecoveryFlow) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center mb-4">
                <Image
                  src="/jastalk.png"
                  alt="JasTalk AI Logo"
                  width={120}
                  height={40}
                  className="h-10 w-auto"
                />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-800">
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-gray-600">
                This password reset link is invalid or has expired
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  Please request a new password reset link from the forgot password page.
                </p>
                <Link href="/forgot-password">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Request New Reset Link
                  </Button>
                </Link>
                <div className="pt-4">
                  <Link 
                    href="/sign-in" 
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-700 hover:underline"
                  >
                    <ArrowLeft className="mr-1 h-3 w-3" />
                    Back to sign in
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <Image
                src="/jastalk.png"
                alt="JasTalk AI Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Set New Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Must be at least 8 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md border border-green-200">
                  {success}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating password...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>

            {/* Links */}
            <div className="space-y-3 text-center text-sm">
              <div>
                <Link 
                  href="/sign-in" 
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" />
                  Back to sign in
                </Link>
              </div>
              <div className="text-gray-600">
                Don&apos;t have an account?{' '}
                <Link 
                  href="/sign-up" 
                  className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
