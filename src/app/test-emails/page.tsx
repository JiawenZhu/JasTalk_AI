'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  sendWelcomeEmail, 
  sendPasswordResetEmail, 
  sendInterviewCompletionEmail, 
  sendCreditPurchaseEmail, 
  sendSecurityAlertEmail,
  sendTestEmail 
} from '@/lib/emailService';

export default function TestEmailsPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('TestUser');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // Initialize email from localStorage or environment
  useEffect(() => {
    const savedEmail = localStorage.getItem('testEmail') || process.env.NEXT_PUBLIC_TEST_EMAIL || '';
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  // Save email to localStorage when it changes
  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    localStorage.setItem('testEmail', newEmail);
  };

  const handleSendEmail = async (emailFunction: Function, data: any) => {
    setLoading(true);
    setResult('');
    
    try {
      const success = await emailFunction(data);
      if (success) {
        setResult('✅ Email sent successfully!');
      } else {
        setResult('❌ Failed to send email');
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testWelcomeEmail = () => {
    handleSendEmail(sendWelcomeEmail, {
      to: email,
      username,
      verificationUrl: 'https://jastalk.com/verify?token=test123'
    });
  };

  const testPasswordReset = () => {
    handleSendEmail(sendPasswordResetEmail, {
      to: email,
      username,
      resetUrl: 'https://jastalk.com/reset-password?token=test123',
      expiresIn: '15 minutes'
    });
  };

  const testInterviewCompletion = () => {
    handleSendEmail(sendInterviewCompletionEmail, {
      to: email,
      username,
      interviewTitle: 'Software Engineer - Google',
      score: 8,
      totalQuestions: 10,
      duration: '25 minutes',
      feedback: 'Excellent performance! You demonstrated strong technical knowledge and clear communication skills. Your answers were well-structured and showed good problem-solving abilities.',
      improvementTips: [
        'Consider providing more specific examples from your experience',
        'Practice explaining complex concepts in simpler terms',
        'Work on maintaining consistent eye contact during video interviews'
      ],
      nextSteps: 'Continue practicing with similar questions and focus on the areas mentioned in the feedback. Consider scheduling another practice session next week.'
    });
  };

  const testCreditPurchase = () => {
    handleSendEmail(sendCreditPurchaseEmail, {
      to: email,
      username,
      packageName: '5 Interviews Package',
      credits: 150,
      amount: '$15.00',
      transactionId: 'txn_123456789',
      newBalance: 300,
      expiryDate: '2024-12-31'
    });
  };

  const testSecurityAlert = () => {
    handleSendEmail(sendSecurityAlertEmail, {
      to: email,
      username,
      alertType: 'login_attempt',
      location: 'New York, NY, USA',
      deviceInfo: 'Chrome on Windows 10',
      timestamp: new Date().toLocaleString(),
      actionRequired: true,
      actionUrl: 'https://jastalk.com/account/security'
    });
  };

  const testBasicEmail = () => {
    handleSendEmail(sendTestEmail, email);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🧪 Email Testing Dashboard</h1>
          <p className="text-lg text-gray-600">
            Test all the different email types for your Jastalk.AI application
          </p>
        </div>

        {/* Email Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>📧 Email Configuration</CardTitle>
            <CardDescription>
              Set the recipient email and username for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Recipient Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="TestUser"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Types */}
        <Tabs defaultValue="welcome" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="welcome">Welcome</TabsTrigger>
            <TabsTrigger value="password-reset">Password Reset</TabsTrigger>
            <TabsTrigger value="interview">Interview</TabsTrigger>
            <TabsTrigger value="purchase">Purchase</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="basic">Basic</TabsTrigger>
          </TabsList>

          <TabsContent value="welcome" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>🎉 Welcome Email</CardTitle>
                <CardDescription>
                  Send a welcome email for new user signups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  This email welcomes new users and includes a verification link.
                </p>
                <Button 
                  onClick={testWelcomeEmail} 
                  disabled={loading || !email}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Welcome Email'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password-reset" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>🔐 Password Reset Email</CardTitle>
                <CardDescription>
                  Send a password reset email with security information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  This email helps users reset their password securely.
                </p>
                <Button 
                  onClick={testPasswordReset} 
                  disabled={loading || !email}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Password Reset Email'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>📊 Interview Completion Email</CardTitle>
                <CardDescription>
                  Send detailed interview results and feedback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  This email provides comprehensive interview feedback and improvement tips.
                </p>
                <Button 
                  onClick={testInterviewCompletion} 
                  disabled={loading || !email}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Interview Completion Email'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="purchase" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>💳 Credit Purchase Email</CardTitle>
                <CardDescription>
                  Send purchase confirmation and credit details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  This email confirms credit purchases and shows transaction details.
                </p>
                <Button 
                  onClick={testCreditPurchase} 
                  disabled={loading || !email}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Credit Purchase Email'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>🚨 Security Alert Email</CardTitle>
                <CardDescription>
                  Send security notifications for account activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  This email alerts users about security-related account activities.
                </p>
                <Button 
                  onClick={testSecurityAlert} 
                  disabled={loading || !email}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Security Alert Email'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="basic" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>📧 Basic Test Email</CardTitle>
                <CardDescription>
                  Send a simple test email to verify SendGrid is working
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  This is the basic test email to verify your SendGrid integration.
                </p>
                <Button 
                  onClick={testBasicEmail} 
                  disabled={loading || !email}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Basic Test Email'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Results */}
        {result && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>📋 Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${
                result.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {result}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Usage Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📖 How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Configure Email Settings</h4>
              <p className="text-sm text-gray-600">
                Enter your test email address and username above. Make sure your SendGrid API key is configured in your environment variables.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Test Different Email Types</h4>
              <p className="text-sm text-gray-600">
                Use the tabs above to test different email types. Each email has different content and styling to match the use case.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3. Check Your Email</h4>
              <p className="text-sm text-gray-600">
                After sending, check your email inbox (and spam folder) to see the formatted emails.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">4. Integration</h4>
              <p className="text-sm text-gray-600">
                Use the <code className="bg-gray-100 px-1 rounded">emailService</code> functions in your app code to send emails programmatically.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
