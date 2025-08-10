"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  SparklesIcon,
  QuestionMarkCircleIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import HelpButton from "@/components/ui/help-button";
import WelcomeModal from "@/components/onboarding/welcome-modal";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Button } from "@/components/ui/button";

export default function OnboardingDemoPage() {
  const { 
    isFirstTime, 
    showOnboarding, 
    completeOnboarding, 
    hideOnboardingModal,
    resetOnboarding,
    showOnboardingModal
  } = useOnboarding();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Onboarding Demo</h1>
              <p className="text-gray-600 mt-1">Test the user guidance system</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={resetOnboarding}
                variant="outline"
                className="text-sm"
              >
                Reset Onboarding
              </Button>
              <Button
                onClick={showOnboardingModal}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                Show Onboarding
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <QuestionMarkCircleIcon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Help Button</h3>
            </div>
            <p className="text-gray-600 mb-4">
              A floating help button that appears on all pages. Users can click it anytime to get guidance on how to use the product.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Always accessible</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Floating design</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Triggers onboarding modal</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">First-Time User</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Automatic onboarding for new users. The guidance modal appears automatically when a user visits for the first time.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Automatic detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Step-by-step guidance</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Progress tracking</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowRightIcon className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Interactive Guide</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Multi-step interactive guide that walks users through all the key features of the platform.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>7 comprehensive steps</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Pro tips included</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Skip option available</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <QuestionMarkCircleIcon className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">State Management</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Smart state management that remembers user progress and prevents showing onboarding repeatedly.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>LocalStorage persistence</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>First-time detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Manual reset option</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Current State Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current State</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {isFirstTime ? "Yes" : "No"}
              </div>
              <div className="text-sm text-blue-800">First Time User</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {showOnboarding ? "Yes" : "No"}
              </div>
              <div className="text-sm text-purple-800">Modal Open</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {localStorage.getItem('onboardingCompleted') ? "Yes" : "No"}
              </div>
              <div className="text-sm text-green-800">Completed</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {localStorage.getItem('hasVisitedBefore') ? "Yes" : "No"}
              </div>
              <div className="text-sm text-orange-800">Visited Before</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Help Button */}
      <HelpButton 
        variant="floating" 
        position="bottom-right" 
        size="md"
      />

      {/* Onboarding Modal */}
      <WelcomeModal
        isOpen={showOnboarding}
        isFirstTime={isFirstTime}
        onClose={hideOnboardingModal}
      />
    </div>
  );
} 
