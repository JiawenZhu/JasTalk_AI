"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/auth.context';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import Image from "next/image";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const result = await resetPassword({ email });
      if (result.success) {
        setSuccess('Password reset link sent! Please check your email.');
        setEmail('');
      } else {
        setError(result.error || 'Failed to send reset link');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <Image
                src="/FoloUp.png"
                alt="FoloUp Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              Reset your password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your email address and we&apos;ll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
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
                    Sending reset link...
                  </>
                ) : (
                  'Send Reset Link'
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