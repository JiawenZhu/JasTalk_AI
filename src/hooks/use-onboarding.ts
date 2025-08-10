import { useState, useEffect } from 'react';

export function useOnboarding() {
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if user is first time
    const onboardingCompleted = localStorage.getItem('onboardingCompleted');
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    
    if (!hasVisitedBefore) {
      // First time user
      setIsFirstTime(true);
      setShowOnboarding(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    } else if (!onboardingCompleted) {
      // User has visited but hasn't completed onboarding
      setIsFirstTime(false);
      setShowOnboarding(true);
    } else {
      // User has completed onboarding
      setIsOnboardingCompleted(true);
      setShowOnboarding(false);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('onboardingCompleted', 'true');
    setIsOnboardingCompleted(true);
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('onboardingCompleted');
    localStorage.removeItem('hasVisitedBefore');
    setIsOnboardingCompleted(false);
    setShowOnboarding(true);
  };

  const showOnboardingModal = () => {
    setShowOnboarding(true);
  };

  const hideOnboardingModal = () => {
    setShowOnboarding(false);
  };

  return {
    isFirstTime,
    isOnboardingCompleted,
    showOnboarding,
    completeOnboarding,
    resetOnboarding,
    showOnboardingModal,
    hideOnboardingModal,
  };
} 
