"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TestInvoicesPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('TestUser');
  const [amount, setAmount] = useState('1500'); // $15.00 in cents
  const [description, setDescription] = useState('5 Interviews Package - 150 minutes');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [invoiceType, setInvoiceType] = useState<'one_time' | 'subscription'>('one_time');

  // Initialize email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem('testEmail') || '';
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleEmailChange = (newEmail: string) => {
    setEmail(newEmail);
    localStorage.setItem('testEmail', newEmail);
  };

  const generateInvoice = async () => {
    if (!email || !username || !amount || !description) {
      setResult('❌ Please fill in all required fields');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/invoices/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: invoiceType,
          customerEmail: email,
          customerName: username,
          amount: parseInt(amount),
          description,
          currency: 'usd',
          metadata: {
            source: 'test_page',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(`✅ Invoice generated successfully!
        
Invoice ID: ${data.data.invoiceId}
Invoice Number: ${data.data.invoiceNumber}
Amount: ${data.data.amount} ${data.data.currency}
Status: ${data.data.status}
Email Sent: ${data.data.emailSent ? 'Yes' : 'No'}

Check your email for the invoice!`);
      } else {
        setResult(`❌ Failed to generate invoice: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (cents: string) => {
    const dollars = parseInt(cents) / 100;
    return `$${dollars.toFixed(2)}`;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">🧾 Invoice Testing Dashboard</h1>
          <p className="text-lg text-gray-600">
            Test the Stripe invoice generation and email system for Jastalk.AI
          </p>
        </div>

        {/* Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>⚙️ Invoice Configuration</CardTitle>
            <CardDescription>
              Configure the invoice details for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Customer Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <Label htmlFor="username">Customer Name</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount (in cents)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="1500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formatAmount(amount)} USD
                </p>
              </div>
              <div>
                <Label htmlFor="invoiceType">Invoice Type</Label>
                <Select value={invoiceType} onValueChange={(value: 'one_time' | 'subscription') => setInvoiceType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-time Purchase</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product or service description"
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>👀 Invoice Preview</CardTitle>
            <CardDescription>
              Preview of what the invoice will look like
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Customer:</strong> {username}
                </div>
                <div>
                  <strong>Email:</strong> {email}
                </div>
                <div>
                  <strong>Amount:</strong> {formatAmount(amount)}
                </div>
                <div>
                  <strong>Type:</strong> {invoiceType === 'one_time' ? 'One-time' : 'Subscription'}
                </div>
                <div className="col-span-2">
                  <strong>Description:</strong> {description}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🚀 Generate Invoice</CardTitle>
            <CardDescription>
              Create and send the invoice via email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={generateInvoice} 
              disabled={loading || !email || !username || !amount || !description}
              className="w-full"
              size="lg"
            >
              {loading ? 'Generating Invoice...' : '🧾 Generate & Send Invoice'}
            </Button>
            
            <p className="text-sm text-gray-500 mt-2 text-center">
              This will create a Stripe invoice and send it to the customer's email
            </p>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>📋 Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${
                result.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                <pre className="whitespace-pre-wrap font-mono text-sm">{result}</pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Information */}
        <Card>
          <CardHeader>
            <CardTitle>📖 How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">1. Invoice Generation</h4>
              <p className="text-sm text-gray-600">
                The system creates a professional Stripe invoice with your specified details.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. Email Delivery</h4>
              <p className="text-sm text-gray-600">
                A beautifully formatted invoice email is sent to the customer with download links.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3. Stripe Integration</h4>
              <p className="text-sm text-gray-600">
                The invoice is also available in the Stripe dashboard and can be managed there.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">4. Use Cases</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>Credit package purchases</li>
                <li>Monthly subscription renewals</li>
                <li>Enterprise service billing</li>
                <li>One-time service charges</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
