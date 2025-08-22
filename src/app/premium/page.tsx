"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, StarIcon, ZapIcon, CrownIcon, PhoneIcon, MessageCircleIcon, CreditCard } from 'lucide-react';
import StripeStatus from '@/components/StripeStatus';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

export default function PremiumPage() {
  const [isProcessingSubscription, setIsProcessingSubscription] = useState(false);
  const [selectedCreditPack, setSelectedCreditPack] = useState<string>('starter-pack');
  const [isLoadingCredits, setIsLoadingCredits] = useState(false);
  const [creditPacks, setCreditPacks] = useState<any[]>([]);
  const router = useRouter();

  // Load credit packs on component mount
  React.useEffect(() => {
    const loadCreditPacks = async () => {
      const { SIMPLIFIED_CREDIT_PACKS } = await import('@/lib/credit-packages');
      setCreditPacks(Object.values(SIMPLIFIED_CREDIT_PACKS));
    };
    loadCreditPacks();
  }, []);

  // New Credit-Based Model - Credits = Access
  const subscriptionPlans = [
    {
      name: 'Free',
      price: 0,
      interval: 'forever',
      tagline: 'Get started and see how it works.',
      features: [
        '1 Free 15-Minute Interview Session',
        'Standard AI Voices',
        'Basic Interview Feedback'
      ],
      popular: false,
      cta: 'Start for Free',
      href: '/practice/new',
      color: 'from-gray-400 to-gray-500'
    },
    {
      name: 'Monthly Credits',
      price: 15,
      interval: 'month',
      tagline: 'Get 8 hours of practice time every month.',
      features: [
        '8 Hours (480 minutes) of Interview Practice per Month',
        'All 20+ Premium & Multilingual AI Voices',
        'Detailed Performance Analysis & Radar Chart',
        'Full Interview Log with Audio Playback',
        'Priority Support',
        '🎯 Credits = Full Access to All Features'
      ],
      popular: true,
      cta: 'Get Monthly Credits',
      href: '#subscription',
      color: 'from-blue-600 to-purple-600'
    },
    {
      name: 'Enterprise',
      price: 'Contact Us',
      interval: '',
      tagline: 'For teams and organizations.',
      features: [
        'Everything in Monthly Credits',
        'Volume Discounts for Multiple Seats',
        'Team Management Dashboard',
        'Custom Integrations',
        'Dedicated Support & SLA'
      ],
      popular: false,
      cta: 'Contact Sales',
      href: '#contact',
      color: 'from-purple-600 to-pink-600'
    }
  ];



  const handleSubscriptionPurchase = async (planName: string) => {
    if (planName === 'Free') {
      router.push('/practice/new');
      return;
    }

    if (planName === 'Enterprise') {
      // Scroll to contact section
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    if (planName === 'Monthly Credits') {
      setIsProcessingSubscription(true);
      try {
        // Create Stripe subscription checkout session
        const response = await fetch('/api/stripe/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ planId: 'monthly-credits' }),
        });

        if (!response.ok) {
          let details = 'Failed to create subscription session';
          try {
            const data = await response.json();
            details = data?.details || data?.error || details;
          } catch {}
          throw new Error(details);
        }

        const { sessionId, planName: plan, amount } = await response.json();

        // Load Stripe and redirect to checkout
        const { loadStripe } = await import('@stripe/stripe-js');
        const { getStripeConfig } = await import('@/lib/stripe');
        const config = getStripeConfig();
        const stripe = await loadStripe(config.publishableKey);

        if (stripe) {
          const { error } = await stripe.redirectToCheckout({ sessionId });
          if (error) {
            throw error;
          }
        }
      } catch (error) {
        console.error('Error creating subscription session:', error);
        toast({
          title: "Subscription Failed",
          description: error instanceof Error ? error.message : "Failed to process subscription. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsProcessingSubscription(false);
      }
    }
  };

  const handleCreditPurchase = async () => {
    if (!selectedCreditPack) return;

    setIsLoadingCredits(true);
    try {
      // Create Stripe checkout session for credit purchase
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId: selectedCreditPack }),
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

      // Load Stripe and redirect to checkout
      const { loadStripe } = await import('@stripe/stripe-js');
      const { getStripeConfig } = await import('@/lib/stripe');
      const config = getStripeConfig();
      const stripe = await loadStripe(config.publishableKey);

      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Purchase Failed",
        description: error instanceof Error ? error.message : "Failed to process credit purchase. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCredits(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Stripe Status Indicator */}
      <StripeStatus />
      
      {/* Header */}
      <div className="text-center py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Simple minutes-based system. Buy minutes monthly or one-time - 
            any user with minutes gets full access to all premium features.
          </p>
        </motion.div>
      </div>

      {/* Subscription Plans - Primary Section */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {subscriptionPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`
                relative bg-white rounded-2xl p-8 shadow-lg border-2 cursor-pointer
                ${plan.popular 
                  ? 'border-blue-500 scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                transition-all duration-300 hover:shadow-xl
              `}
              onClick={() => handleSubscriptionPurchase(plan.name)}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center">
                    <StarIcon className="w-4 h-4 mr-2" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {plan.price === 0 ? 'Free' : typeof plan.price === 'number' ? `$${plan.price}` : plan.price}
                </div>
                {plan.interval && (
                  <p className="text-gray-600">
                    {plan.interval === 'forever' ? plan.interval : `per ${plan.interval}`}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-2 italic">
                  {plan.tagline}
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start space-x-3">
                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckIcon className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubscriptionPurchase(plan.name);
                }}
                disabled={isProcessingSubscription}
                className={`
                  w-full py-3 px-6 rounded-xl font-semibold text-white
                  bg-gradient-to-r ${plan.color} hover:scale-105
                  transition-all duration-200 shadow-lg
                  ${isProcessingSubscription ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isProcessingSubscription && plan.name === 'Monthly Credits' ? 'Processing...' : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-600 font-medium">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
      </div>

      {/* Purchase Credits Section - Secondary */}
      <div className="max-w-4xl mx-auto px-4 pb-16" id="credits">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Need a Quick Tune-Up? Purchase One-Time Credits
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Credits never expire and are perfect for last-minute practice.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          {/* Credit Pack Selection */}
          {creditPacks.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading credit packages...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {creditPacks.map((pack) => (
              <motion.div
                key={pack.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
                  ${selectedCreditPack === pack.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                  }
                `}
                onClick={() => setSelectedCreditPack(pack.id)}
              >
                {/* Selection Indicator */}
                {selectedCreditPack === pack.id && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                <div className="text-center space-y-3">
                  <h3 className="text-xl font-semibold text-gray-900">{pack.name}</h3>
                  <div className="text-3xl font-bold text-gray-900">
                    ${pack.price}
                  </div>
                  <p className="text-lg text-blue-600 font-medium">
                    {pack.interviews} Interviews
                  </p>
                  <p className="text-sm text-gray-600 mb-2">{pack.description}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>{pack.minutesPerInterview} minutes per interview</div>
                    <div className="font-medium text-blue-600">Total: {pack.totalMinutes} minutes</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          )}

          {/* Purchase Button */}
          <div className="text-center">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreditPurchase}
              disabled={isLoadingCredits}
              className={`
                inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold
                transition-all duration-200 shadow-lg
                ${isLoadingCredits
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                }
                text-white
              `}
            >
              {isLoadingCredits ? (
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

          {/* Credit Features */}
          <div className="bg-gray-50 rounded-xl p-6 mt-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              🎯 Minutes = Full Access to All Features
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">All 20+ Premium AI Voices</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">Detailed Performance Analysis</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">Full Interview Logs with Audio</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">Credits Never Expire</span>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 text-center">
                <strong>No tier restrictions!</strong> Any user with minutes gets access to all premium features.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section for Enterprise */}
      <div className="max-w-4xl mx-auto px-4 pb-16" id="contact">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready for Enterprise?</h2>
          <p className="text-lg mb-6 opacity-90">
            Get custom pricing, dedicated support, and enterprise features tailored to your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              <PhoneIcon className="w-5 h-5 mr-2" />
              Schedule a Call
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center px-6 py-3 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-colors"
            >
              <MessageCircleIcon className="w-5 h-5 mr-2" />
              Send Message
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
