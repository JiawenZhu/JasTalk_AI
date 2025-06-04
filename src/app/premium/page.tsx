"use client";

import React, { useState } from "react";
import Navigation from "@/components/Navigation";
import { CheckIcon } from "@heroicons/react/24/outline";

const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started with basic interview prep',
    price: 0,
    interval: 'forever',
    features: [
      '5 practice interviews per month',
      'Basic AI feedback',
      'Standard question bank',
      'Email support'
    ],
    priceId: '',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for serious interview preparation',
    price: 19,
    interval: 'month',
    popular: true,
    features: [
      'Unlimited practice interviews',
      'Advanced AI feedback with detailed analysis',
      'Interactive AI interviewer with voice',
      'Custom interviewer personas',
      'Comprehensive question bank (1000+ questions)',
      'Performance analytics and progress tracking',
      'Export interview reports (PDF)',
      'Priority support',
      '7-day free trial'
    ],
    priceId: 'price_1234567890',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For teams and organizations with advanced needs',
    price: 99,
    interval: 'month',
    features: [
      'Everything in Pro',
      'Team management dashboard',
      'Custom branding',
      'Advanced analytics and reporting',
      'Integration APIs',
      'Dedicated customer success manager',
      'Custom interviewer training',
      'SSO integration',
      'Priority phone support'
    ],
    priceId: 'price_0987654321',
  },
];

const faqs = [
  {
    question: "What's included in the free trial?",
    answer: "Get full access to Pro features for 7 days, including unlimited interviews, AI voice interviewer, and detailed analytics."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes! You can cancel your subscription at any time through the customer portal. You'll continue to have access until the end of your billing period."
  },
  {
    question: "Do you offer student discounts?",
    answer: "Yes! Contact our support team with your student email for a 50% discount on Pro plans."
  },
  {
    question: "How does the AI interviewer work?",
    answer: "Our AI uses advanced natural language processing and voice synthesis to conduct realistic interviews with customizable personas and difficulty levels."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use enterprise-grade encryption and never share your interview data. All recordings are processed securely and deleted after analysis."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and other payment methods through our secure Stripe integration."
  },
];

export default function PremiumPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPlan, setCurrentPlan] = useState<string | null>('pro');

  const handleSubscribe = async (priceId: string) => {
    if (!priceId) {
      // Handle free plan or show message
      console.log('Free plan selected');
      return;
    }

    console.log('Subscribing to plan:', priceId);
    // Here you would integrate with Stripe or your payment processor
  };

  const handleManageSubscription = () => {
    console.log('Managing subscription');
    // Redirect to customer portal
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[#1E2B3A] mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Supercharge your interview preparation with AI-powered mock interviews, personalized 
            feedback, and comprehensive analytics.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
                plan.popular 
                  ? 'border-blue-500 relative' 
                  : 'border-gray-200'
              } ${
                currentPlan === plan.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-gray-900">
                      ${plan.price}
                    </span>
                    <span className="text-gray-500 ml-2">
                      /{plan.interval}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <div className="space-y-4">
                  {plan.id === 'free' ? (
                    <button
                      onClick={() => handleSubscribe(plan.priceId)}
                      className="w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                      Subscribe to Free
                    </button>
                  ) : plan.id === currentPlan ? (
                    <div className="space-y-2">
                      <div className="bg-blue-50 border border-blue-200 text-blue-800 py-3 px-6 rounded-lg text-center font-medium">
                        Current Plan: {plan.name}
                      </div>
                      <button
                        onClick={handleManageSubscription}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Manage Subscription
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.priceId)}
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
                        plan.popular
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      Subscribe to {plan.name}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Current Plan Status */}
        {currentPlan && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-16">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Current Plan: Pro</h3>
              <p className="text-blue-800 mb-4">
                Manage your subscription, update payment methods, or view billing history
              </p>
              <button
                onClick={handleManageSubscription}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mt-16 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of successful candidates who prepared with our AI interviewer
          </p>
          <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors">
            You're All Set!
          </button>
        </div>
      </div>
    </div>
  );
} 