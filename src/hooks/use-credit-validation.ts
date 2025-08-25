import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth.context';
import { useCredits } from '@/contexts/credits-context';
import { useRouter } from 'next/navigation';

interface CreditValidationResult {
  hasCredits: boolean;
  creditsRemaining: number;
  isLoading: boolean;
  error: string | null;
  checkCredits: () => Promise<void>;
  redirectToAddCredits: () => void;
}

export function useCreditValidation(): CreditValidationResult {
  const { isAuthenticated, user } = useAuth();
  const { state, hasCredits: contextHasCredits, isLoading: contextIsLoading, error: contextError, manualRefreshCredits } = useCredits();
  const router = useRouter();
  
  // Use credits from context instead of local state
  const hasCredits = contextHasCredits;
  const creditsRemaining = state.minutes + (state.seconds > 0 ? 1 : 0); // Round up if there are seconds
  const isLoading = contextIsLoading;
  const error = contextError;

  const checkCredits = async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      console.log('🔄 Manual credit refresh requested by CreditValidation component');
      await manualRefreshCredits();
    } catch (err) {
      console.error('Error refreshing credits:', err);
    }
  };

  const redirectToAddCredits = () => {
    router.push('/premium?insufficient-credits=true');
  };

  // No need for useEffect since we're using the context
  // The context handles all the credit loading logic

  return {
    hasCredits,
    creditsRemaining,
    isLoading,
    error,
    checkCredits,
    redirectToAddCredits
  };
}


