"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, TestTube, Zap, AlertCircle } from 'lucide-react';

export default function StripeStatus() {
  const [stripeMode, setStripeMode] = useState<string>('loading');
  const [isProduction, setIsProduction] = useState<boolean>(false);

  useEffect(() => {
    // Get Stripe mode from environment
    const mode = process.env.NEXT_PUBLIC_STRIPE_MODE || 'test';
    const production = process.env.NODE_ENV === 'production';
    
    setStripeMode(mode);
    setIsProduction(production);
  }, []);

  const getModeInfo = () => {
    if (stripeMode === 'live') {
      return {
        icon: <Zap className="w-4 h-4 text-red-600" />,
        label: 'LIVE MODE',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        description: 'Real payments - Production environment'
      };
    } else {
      return {
        icon: <TestTube className="w-4 h-4 text-blue-600" />,
        label: 'TEST MODE',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        description: 'Test payments - Development environment'
      };
    }
  };

  const modeInfo = getModeInfo();

  // Only show in development or when explicitly enabled
  if (isProduction && stripeMode !== 'live') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-4 right-4 z-50 ${modeInfo.bgColor} ${modeInfo.borderColor} border rounded-lg px-3 py-2 shadow-lg`}
    >
      <div className="flex items-center space-x-2">
        {modeInfo.icon}
        <div>
          <span className={`text-xs font-bold ${modeInfo.color}`}>
            {modeInfo.label}
          </span>
          <p className="text-xs text-gray-600">
            {modeInfo.description}
          </p>
        </div>
      </div>
      
      {/* Warning for live mode */}
      {stripeMode === 'live' && (
        <div className="mt-2 flex items-center space-x-1 text-xs text-red-600">
          <AlertCircle className="w-3 h-3" />
          <span>Real money transactions</span>
        </div>
      )}
    </motion.div>
  );
}
