'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TestWebhookPage() {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [packageId, setPackageId] = useState('starter-pack');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const handleTestWebhook = async () => {
    if (!packageId || (!userId && !email)) {
      setError('Please provide either userId or email, and select a package');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/stripe/test-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId,
          userId: userId || undefined,
          email: email || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to create test session');
      }
    } catch (err) {
      setError('Network error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test Stripe Webhook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="packageId">Package</Label>
            <Select value={packageId} onValueChange={setPackageId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a package" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter-pack">Starter Pack - $15 (150 min)</SelectItem>
                <SelectItem value="pro-pack">Pro Pack - $40 (675 min)</SelectItem>
                <SelectItem value="starter">Starter - $12 (100 min)</SelectItem>
                <SelectItem value="pro">Pro - $20 (167 min)</SelectItem>
                <SelectItem value="advanced">Advanced - $24 (200 min)</SelectItem>
                <SelectItem value="enterprise">Enterprise - $48 (400 min)</SelectItem>
                <SelectItem value="premium">Premium - $100 (833 min)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId">User ID (optional if email provided)</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (optional if userId provided)</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
            />
          </div>

          <Button 
            onClick={handleTestWebhook} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating Test Session...' : '🧪 Test Webhook'}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-700 text-sm font-medium">✅ Test session created successfully!</p>
              </div>
              
              <div className="space-y-2">
                <Label>Session ID:</Label>
                <Input value={result.sessionId} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Checkout URL:</Label>
                <Input value={result.checkoutUrl} readOnly />
              </div>

              <div className="space-y-2">
                <Label>Instructions:</Label>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  {result.instructions.map((instruction: string, index: number) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>

              <Button 
                onClick={() => window.open(result.checkoutUrl, '_blank')}
                className="w-full"
                variant="outline"
              >
                🔗 Open Checkout Page
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>📋 How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">1. Create Test Session</h4>
            <p className="text-sm text-gray-600">
              Fill in the form above and click "Test Webhook" to create a test checkout session.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. Complete Test Payment</h4>
            <p className="text-sm text-gray-600">
              Use the checkout URL to complete a test payment with Stripe test card: <code className="bg-gray-100 px-1 rounded">4242 4242 4242 4242</code>
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">3. Check Webhook Delivery</h4>
            <p className="text-sm text-gray-600">
              Watch your server logs for webhook events. You should see messages like "🔔 Webhook received event: checkout.session.completed"
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">4. Verify Credits Added</h4>
            <p className="text-sm text-gray-600">
              Check your database or dashboard to confirm credits were automatically added to the user account.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
