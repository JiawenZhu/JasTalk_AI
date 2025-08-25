'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function TestSendGridPage() {
  const [email, setEmail] = useState('');
  const [testType, setTestType] = useState('simple');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testSendGrid = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      console.log('🧪 Testing SendGrid with:', { email, testType });
      
      const response = await fetch('/api/test-sendgrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: email, testType }),
      });

      const data = await response.json();
      console.log('📧 SendGrid test result:', data);
      
      setResult(data);
      
      if (data.success) {
        toast.success('Test email sent successfully! Check your inbox.');
      } else {
        toast.error(`Email test failed: ${data.error}`);
      }
      
    } catch (error) {
      console.error('❌ SendGrid test error:', error);
      toast.error('Failed to test SendGrid');
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">🧪 SendGrid Email Test</CardTitle>
          <p className="text-center text-gray-600">
            Test SendGrid email functionality to identify delivery issues
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Input */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Test Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="your-email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Test Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="testType"
                  value="simple"
                  checked={testType === 'simple'}
                  onChange={(e) => setTestType(e.target.value)}
                  className="mr-2"
                />
                Simple Test
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="testType"
                  value="pause-summary"
                  checked={testType === 'pause-summary'}
                  onChange={(e) => setTestType(e.target.value)}
                  className="mr-2"
                />
                Pause Summary Test
              </label>
            </div>
          </div>

          {/* Test Button */}
          <Button
            onClick={testSendGrid}
            disabled={isLoading || !email}
            className="w-full"
          >
            {isLoading ? 'Sending Test Email...' : 'Send Test Email'}
          </Button>

          {/* Results Display */}
          {result && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Test Results</h3>
              <div className={`p-4 rounded-lg ${
                result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="font-medium mb-2">
                  {result.success ? '✅ Success' : '❌ Failed'}
                </div>
                <div className="text-sm space-y-1">
                  <div><strong>Message:</strong> {result.message || result.error}</div>
                  {result.attempt && <div><strong>Attempt:</strong> {result.attempt}</div>}
                  {result.messageId && <div><strong>Message ID:</strong> {result.messageId}</div>}
                  {result.statusCode && <div><strong>Status Code:</strong> {result.statusCode}</div>}
                  {result.details && (
                    <div>
                      <strong>Error Details:</strong>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Troubleshooting Tips */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">🔍 Troubleshooting Tips</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check your spam/junk folder</li>
              <li>• Verify the email address is correct</li>
              <li>• Check browser console for detailed logs</li>
              <li>• Monitor server logs for SendGrid responses</li>
              <li>• Verify SendGrid API key is valid and active</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
