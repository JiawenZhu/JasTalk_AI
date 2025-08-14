"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/auth.context';

export default function TestPaymentPage() {
  const { isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const testCreditAddition = async (packageId: string, credits: number, amount: number) => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Not Authenticated",
        description: "Please sign in to test credit addition",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTestResult(null);

    try {
      console.log('🧪 Testing credit addition for package:', { packageId, credits, amount });
      
      const response = await fetch('/api/test-webhook-simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          packageId,
          credits,
          amount,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Credit addition successful:', data);
        setTestResult(data);
        toast({
          title: "Credits Added Successfully!",
          description: `Added ${credits} credits to your account`,
        });
      } else {
        console.error('❌ Credit addition failed:', data);
        setTestResult(data);
        toast({
          title: "Credit Addition Failed",
          description: data.error || "Failed to add credits",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error testing credit addition:', error);
      setTestResult({ error: 'Network error', details: error });
      toast({
        title: "Error",
        description: "Failed to test credit addition",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testPackages = [
    { id: 'starter', name: 'Starter Package', credits: 100, price: 12.00 },
    { id: 'pro', name: 'Pro Package', credits: 167, price: 20.00 },
    { id: 'advanced', name: 'Advanced Package', credits: 200, price: 24.00 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 mb-6">
          <h1 className="text-2xl font-bold text-center mb-6">Payment & Credit Addition Test</h1>
          
          <div className="text-center mb-6">
            <div className="bg-blue-100 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800">Test Credit Addition</h3>
              <p className="text-blue-600 text-sm">
                This simulates what happens when a payment is completed through Stripe.
                It will add credits to your account without charging you.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {testPackages.map((pkg) => (
              <Card key={pkg.id} className="p-4 border-2 hover:border-blue-300 transition-colors">
                <h4 className="font-semibold text-lg mb-2">{pkg.name}</h4>
                <p className="text-gray-600 text-sm mb-2">{pkg.description}</p>
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {pkg.credits} credits
                </div>
                <div className="text-gray-500 mb-3">${pkg.price}</div>
                <Button
                  onClick={() => testCreditAddition(pkg.id, pkg.credits, pkg.price)}
                  disabled={isLoading || !isAuthenticated}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? 'Testing...' : 'Test Add Credits'}
                </Button>
              </Card>
            ))}
          </div>

          {testResult && (
            <Card className="p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">Test Result:</h3>
              <pre className="text-sm bg-white p-3 rounded border overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </Card>
          )}

          <div className="mt-6 bg-yellow-100 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">What This Tests:</h3>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Database connection and permissions</li>
              <li>• Credit addition logic</li>
              <li>• User subscription updates</li>
              <li>• Admin client functionality</li>
            </ul>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <p><strong>Authentication:</strong> {isAuthenticated ? '✅ Signed In' : '❌ Not Signed In'}</p>
            <p><strong>User:</strong> {user?.email || 'None'}</p>
            <p><strong>User ID:</strong> {user?.id || 'None'}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
