"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, CreditCard } from 'lucide-react';
import { CREDIT_PACKAGES } from '@/lib/credit-packages';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
// Load client-side Stripe in a browser-safe way
const loadClientStripe = async () => {
  if (typeof window === 'undefined') return null;
  const { loadStripe } = await import('@stripe/stripe-js');
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST;
  return loadStripe(publishableKey as string);
};

interface CreditPurchaseProps {
  onSuccess?: () => void;
}

export default function CreditPurchase({ onSuccess }: CreditPurchaseProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>('pro');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handlePurchase = async () => {
    if (!selectedPackage) {
      toast({
        title: "Please select a package",
        description: "Choose a credit package to continue",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId: selectedPackage }),
      });

      if (!response.ok) {
        let details = 'Failed to create checkout session';
        try {
          const data = await response.json();
          details = data?.details || data?.error || details;
        } catch {}
        throw new Error(details);
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout with correct publishable key for current mode
      const stripe = await loadClientStripe();

      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Package Selection */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {CREDIT_PACKAGES.map((pkg) => (
          <motion.div
            key={pkg.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
              ${selectedPackage === pkg.id
                ? 'border-blue-500 bg-blue-50 shadow-lg'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
            onClick={() => setSelectedPackage(pkg.id)}
          >
            {/* Popular Badge */}
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </span>
              </div>
            )}

            {/* Selection Indicator */}
            {selectedPackage === pkg.id && (
              <div className="absolute top-4 right-4">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
              <div className="text-3xl font-bold text-gray-900">
                ${pkg.price}
              </div>
              <p className="text-sm text-gray-600">{pkg.description}</p>
              
              {/* Value Proposition */}
              <div className="text-xs text-gray-500">
                <p>${(pkg.price / pkg.credits * 100).toFixed(2)} per minute</p>
                <p>vs. standard $0.12/min</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Purchase Button */}
      <div className="text-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePurchase}
          disabled={isLoading}
          className={`
            inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold
            transition-all duration-200 shadow-lg
            ${isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
            }
            text-white
          `}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Purchase Credits
            </>
          )}
        </motion.button>
        
        <p className="text-sm text-gray-500 mt-3">
          Secure payment powered by Stripe
        </p>
      </div>

      {/* Features */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          What you get with credits:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <CheckIcon className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Real-time AI voice interviews</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <CheckIcon className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Personalized feedback & analytics</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <CheckIcon className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Unlimited practice sessions</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
              <CheckIcon className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Credits never expire</span>
          </div>
        </div>
      </div>
    </div>
  );
}
