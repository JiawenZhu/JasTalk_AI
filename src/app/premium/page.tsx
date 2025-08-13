"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon, StarIcon, ZapIcon, CrownIcon } from 'lucide-react';
import CreditPurchase from '@/components/CreditPurchase';
import StripeStatus from '@/components/StripeStatus';

export default function PremiumPage() {
  const pricingPlans = [
    {
      name: 'Free',
      price: 0,
      interval: 'forever',
      description: 'Perfect for getting started',
      features: [
        '10 minutes of interview time',
        'Basic interview questions',
        'Standard feedback',
        'Community support'
      ],
      popular: false,
      cta: 'Current Plan',
      href: '#'
    },
    {
      name: 'Pro',
      price: 0.12,
      interval: 'per minute',
      description: 'Advanced features with pay-as-you-go pricing',
      features: [
        'Pay only for what you use',
        'No monthly commitment',
        'Real-time AI voice interviews',
        'Advanced analytics & feedback',
        'Priority support'
      ],
      popular: true,
      cta: 'Buy Credits',
      href: '#credits'
    },
    {
      name: 'Enterprise',
      price: 0.10,
      interval: 'per minute',
      description: 'For teams and organizations',
      features: [
        'Volume discounts',
        'Team management',
        'Custom integrations',
        'Dedicated support',
        'SLA guarantees'
      ],
      popular: false,
      cta: 'Contact Sales',
      href: '/contact'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Stripe Status Indicator */}
      <StripeStatus />
      
      {/* Header */}
      <div className="text-center py-16 px-4">
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        > */}
        <div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get the interview practice you need with our flexible credit system. 
            Pay only for what you use, with no monthly commitments.
          </p>
        </div>
        {/* </motion.div> */}
      </div>

      {/* Pricing Plans */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            // <motion.div
            //   key={plan.name}
            //   initial={{ opacity: 0, y: 20 }}
            //   animate={{ opacity: 1, y: 0 }}
            //   transition={{ duration: 0.6, delay: index * 0.1 }}
            <div
              key={plan.name}
              className={`
                relative bg-white rounded-2xl p-8 shadow-lg border-2
                ${plan.popular 
                  ? 'border-blue-500 scale-105' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                transition-all duration-300
              `}
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
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </div>
                <p className="text-gray-600">
                  {plan.interval === 'per minute' ? 'per minute' : plan.interval}
                </p>
                {plan.interval === 'per minute' && (
                  <div className="text-sm text-gray-500 mt-2 space-y-1">
                    <p>30 min session: ${(plan.price * 30).toFixed(2)}</p>
                    <p>1 hour session: ${(plan.price * 60).toFixed(2)}</p>
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-4">{plan.description}</p>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="text-center">
                {plan.name === 'Pro' ? (
                  <a
                    href="#credits"
                    className="inline-flex items-center px-6 py-3 rounded-xl text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200 shadow-lg"
                  >
                    <ZapIcon className="w-5 h-5 mr-2" />
                    {plan.cta}
                  </a>
                ) : (
                  <button className="inline-flex items-center px-6 py-3 rounded-xl text-lg font-semibold bg-gray-100 text-gray-700 cursor-not-allowed">
                    {plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Credit Purchase Section */}
      <div id="credits" className="max-w-6xl mx-auto px-4 pb-16">
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mb-12"
        > */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Purchase Credits
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Buy credits in bulk and save money. Credits never expire and can be used for any interview practice session.
          </p>
        </div>
        {/* </motion.div> */}

        <CreditPurchase />
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <div className="space-y-6">
          {[
            {
              question: "How do credits work?",
              answer: "Credits are converted to interview time at a rate of $0.12 per minute. For example, $12 gives you 100 minutes of practice time."
            },
            {
              question: "Do credits expire?",
              answer: "No, credits never expire. You can use them whenever you want to practice interviews."
            },
            {
              question: "Can I get a refund?",
              answer: "We offer a 30-day money-back guarantee if you're not satisfied with our service."
            },
            {
              question: "What payment methods do you accept?",
              answer: "We accept all major credit cards, debit cards, and digital wallets through our secure Stripe payment system."
            }
          ].map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-gray-600">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
