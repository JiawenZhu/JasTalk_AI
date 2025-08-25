"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { useAuth } from "./auth.context";

// Production configuration
const PRODUCTION_CONFIG = {
  enableDebugLogs: process.env.NODE_ENV === 'development',
  enableCreditEvents: true,
  maxCredits: 999999, // Maximum credits allowed (safety limit)
  minIntervalMs: 1000, // Minimum interval between deductions
  maxConsecutiveErrors: 3 // Maximum consecutive errors before stopping
};

// Credit state interface with minutes and seconds
interface CreditsState {
  minutes: number;
  seconds: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  isTracking: boolean;
  isPostInterviewLock: boolean;
}

// Actions for the reducer
type CreditsAction =
  | { type: "SET_INITIAL"; payload: { minutes: number; seconds: number } }
  | { type: "ADD_CREDITS"; payload: number } // minutes to add
  | { type: "DEDUCT_SECOND" }
  | { type: "DEDUCT_CREDITS"; payload: number } // specific amount to deduct
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_TRACKING"; payload: boolean }
  | { type: "SET_POST_INTERVIEW_LOCK"; payload: boolean }
  | { type: "RESET" }
  | { type: "REFRESH_FROM_API" };

const initialState: CreditsState = {
  minutes: 0,
  seconds: 0,
  isLoading: true,
  error: null,
  lastUpdated: null,
  isTracking: false,
  isPostInterviewLock: false
};

// Production logging function
function logProduction(message: string, data?: any, level: 'info' | 'warn' | 'error' = 'info') {
  if (PRODUCTION_CONFIG.enableDebugLogs) {
    const timestamp = new Date().toISOString();
    const logData = { timestamp, level, message, data };
    
    switch (level) {
      case 'error':
        console.error('🚨 [Credits]', logData);
        break;
      case 'warn':
        console.warn('⚠️ [Credits]', logData);
        break;
      default:
        console.log('ℹ️ [Credits]', logData);
    }
  }
}

// Reducer for credit state management
function creditsReducer(state: CreditsState, action: CreditsAction): CreditsState {
  switch (action.type) {
    case "SET_INITIAL":
      console.log('💰 SET_INITIAL called with payload:', action.payload);
      console.log('💰 Previous state:', { minutes: state.minutes, seconds: state.seconds });
      console.log('💰 Current isTracking state:', state.isTracking);
      console.log('💰 Current isPostInterviewLock state:', state.isPostInterviewLock);
      
      // Check if user is actively in an interview (more intelligent check)
      const isActivelyInInterview = state.isTracking || 
        (typeof document !== 'undefined' && document.documentElement.hasAttribute('data-interview-active'));
      
      console.log('🔍 SET_INITIAL interview activity check:', { 
        pathname: typeof document !== 'undefined' ? document.location.pathname : 'unknown',
        isTracking: state.isTracking,
        hasInterviewActiveAttribute: typeof document !== 'undefined' ? document.documentElement.hasAttribute('data-interview-active') : false,
        isActivelyInInterview
      });
      
      // BLOCK SET_INITIAL only during active interview tracking OR during post-interview lock
      if (state.isTracking || state.isPostInterviewLock || isActivelyInInterview) {
        const reason = state.isTracking ? 'active interview tracking' : 
                      state.isPostInterviewLock ? 'post-interview lock period' : 'actively in interview session';
        console.log('🚫 BLOCKED SET_INITIAL during ' + reason);
        console.log('🚫 Current local state:', { minutes: state.minutes, seconds: state.seconds });
        console.log('🚫 Ignoring API value:', { minutes: action.payload.minutes, seconds: action.payload.seconds });
        
return state; // Keep current local state
      } else {
        console.log('✅ SET_INITIAL allowed - not actively in interview, no post-interview lock');
      }
      
      const newState = {
        ...state,
        minutes: action.payload.minutes,
        seconds: action.payload.seconds,
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      };
      
      console.log('💰 New state after SET_INITIAL:', { 
        minutes: newState.minutes, 
        seconds: newState.seconds,
        isLoading: newState.isLoading,
        error: newState.error,
        lastUpdated: newState.lastUpdated
      });
      
      return newState;
    
    case "ADD_CREDITS":
      const addedMinutes = state.minutes + action.payload;
      
return {
        ...state,
        minutes: addedMinutes,
        lastUpdated: Date.now()
      };
    
    case "DEDUCT_SECOND":
      console.log('💰 DEDUCT_SECOND reducer called!');
      console.log('💰 DEDUCT_SECOND called - Current state:', { 
        minutes: state.minutes, 
        seconds: state.seconds,
        totalSeconds: state.minutes * 60 + state.seconds
      });
      console.log('💰 DEDUCT_SECOND called - Full action:', action);
      
      if (state.seconds > 0) {
        console.log('💰 Deducting 1 second from current seconds...');
        const newState = {
          ...state,
          seconds: state.seconds - 1,
          lastUpdated: Date.now()
        };
        console.log('💰 Deducted 1 second - New state:', { 
          minutes: newState.minutes, 
          seconds: newState.seconds,
          totalSeconds: newState.minutes * 60 + newState.seconds
        });
        
        // Dispatch credit deduction event for real-time updates
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('credit-deduction'));
        }
        
        console.log('💰 Returning new state with deducted credits');
        
return newState;
      } else if (state.minutes > 0) {
        console.log('💰 Seconds reached 0, deducting 1 minute and setting seconds to 59');
        const newState = {
          ...state,
          minutes: state.minutes - 1,
          seconds: 59,
          lastUpdated: Date.now()
        };
        console.log('💰 Deducted 1 minute - New state:', { 
          minutes: newState.minutes, 
          seconds: newState.seconds,
          totalSeconds: newState.minutes * 60 + newState.seconds
        });
        
        // Dispatch credit deduction event for real-time updates
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('credit-deduction'));
        }
        
        console.log('💰 Returning new state with deducted credits');
        
return newState;
      }
      console.log('💰 No credits left to deduct');
      
return state; // No credits left
    
    case "DEDUCT_CREDITS":
      const totalSeconds = state.minutes * 60 + state.seconds;
      const remainingSeconds = Math.max(0, totalSeconds - action.payload);
      const deductedMinutes = Math.floor(remainingSeconds / 60);
      const deductedSeconds = remainingSeconds % 60;
      
      return {
        ...state,
        minutes: deductedMinutes,
        seconds: deductedSeconds,
        lastUpdated: Date.now()
      };
    
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    
    case "SET_TRACKING":
      console.log('🎯 SET_TRACKING called with payload:', action.payload);
      console.log('🎯 Previous isTracking state:', state.isTracking);
      const newTrackingState = { ...state, isTracking: action.payload };
      console.log('🎯 New isTracking state:', newTrackingState.isTracking);
      
return newTrackingState;
    
    case "SET_POST_INTERVIEW_LOCK":
      console.log('🔒 SET_POST_INTERVIEW_LOCK called with payload:', action.payload);
      
return { ...state, isPostInterviewLock: action.payload };
    
    case "RESET":
      return { ...initialState, isLoading: false };
    
    case "REFRESH_FROM_API":
      return { ...state, isLoading: true, error: null };
    
    default:
      return state;
  }
}

// Context interface
interface CreditsContextType {
  state: CreditsState;
  dispatch: React.Dispatch<CreditsAction>;
  // Helper functions
  addCredits: (minutes: number) => void;
  deductCredits: (seconds: number) => void;
  startInterviewTracking: () => void;
  stopInterviewTracking: () => void;
  refreshCredits: () => Promise<void>;
  manualRefreshCredits: () => Promise<void>; // New manual refresh function
  getTotalSeconds: () => number;
  getTrackingElapsedTime: () => number;
  hasCredits: boolean;
  // State properties for components
  isLoading: boolean;
  error: string | null;
}

const CreditsContext = createContext<CreditsContextType | undefined>(undefined);

// Provider component
export const CreditsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(creditsReducer, initialState);
  const { isAuthenticated, user, validateSession } = useAuth();
  
  // Helper functions
  const addCredits = useCallback((minutes: number) => {
    dispatch({ type: "ADD_CREDITS", payload: minutes });
  }, []);

  const deductCredits = useCallback((seconds: number) => {
    dispatch({ type: "DEDUCT_CREDITS", payload: seconds });
  }, []);

  const getTotalSeconds = useCallback(() => {
    return state.minutes * 60 + state.seconds;
  }, [state.minutes, state.seconds]);

  const hasCredits = React.useMemo(() => {
    const total = getTotalSeconds();
    console.log('💰 hasCredits recalculated:', { 
      total, 
      minutes: state.minutes, 
      seconds: state.seconds,
      state: state
    });
    
return total > 0;
  }, [getTotalSeconds, state.minutes, state.seconds, state]);

  // Manual refresh function for when user pauses/ends interview
  const manualRefreshCredits = useCallback(async () => {
    console.log('🔄 Manual credit refresh requested by user...');
    
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, cannot refresh credits');
      
return;
    }

    try {
      dispatch({ type: "REFRESH_FROM_API" });
      console.log('📡 Fetching credits from API...');
      
      const response = await fetch('/api/user-subscription', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API response:', data);
        
        // Server returns aggregated interview_time_remaining in MINUTES
        const totalMinutes = data.subscription?.interview_time_remaining || 0;
        const leftoverSeconds = data.subscription?.leftover_seconds || 0;
        
        console.log('💰 Manual refresh - Credits from API:', { totalMinutes, leftoverSeconds });
        
        dispatch({ 
          type: "SET_INITIAL", 
          payload: { minutes: totalMinutes, seconds: leftoverSeconds } 
        });
        
        console.log('✅ Manual credit refresh completed');
      } else {
        console.log('❌ API response not ok:', response.status);
        dispatch({ type: "SET_ERROR", payload: "Failed to fetch credits" });
      }
    } catch (error) {
      console.error('❌ Error in manual credit refresh:', error);
      dispatch({ type: "SET_ERROR", payload: "Error fetching credits" });
    }
  }, [isAuthenticated]);

  // Fetch credits from API
  const refreshCredits = useCallback(async () => {
    console.log('🔄 Refreshing credits...');
    console.log('🔍 Auth state check:', { isAuthenticated, user: user?.email });
    
    // If not authenticated, try to validate session first
    if (!isAuthenticated) {
      console.log('🔄 User not authenticated, attempting session validation...');
      try {
        const isValid = await validateSession();
        if (isValid) {
          console.log('✅ Session validated, user is now authenticated');
          // Wait a bit for auth state to update
          setTimeout(() => refreshCredits(), 100);
          return;
        } else {
          console.log('❌ Session validation failed, using emergency fallback credits');
        }
      } catch (error) {
        console.error('❌ Error during session validation:', error);
      }
    }

    if (!isAuthenticated) {
      console.log('🚨 EMERGENCY: User not authenticated, providing emergency fallback credits');
      console.log('🚨 This allows users to access interviews even when JWT tokens are invalid');
      console.log('🚨 Common causes: password reset, token expiration, browser cache issues');
      
      // Give user 60 minutes as emergency credits
      const emergencyMinutes = 60;
      const emergencySeconds = 0;
      
      console.log('🚨 Setting emergency credits:', { minutes: emergencyMinutes, seconds: emergencySeconds });
      
      dispatch({ 
        type: "SET_INITIAL", 
        payload: { minutes: emergencyMinutes, seconds: emergencySeconds } 
      });
      
      dispatch({ type: "SET_ERROR", payload: "Using emergency credits - authentication issue detected" });
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }
    
    // Check if user is actively in an interview (more intelligent check)
    const isActivelyInInterview = state.isTracking || 
      (typeof document !== 'undefined' && document.documentElement.hasAttribute('data-interview-active'));
  
    console.log('🔍 Interview activity check:', { 
      pathname: typeof document !== 'undefined' ? document.location.pathname : 'unknown',
      isTracking: state.isTracking,
      hasInterviewActiveAttribute: typeof document !== 'undefined' ? document.documentElement.hasAttribute('data-interview-active') : false,
      isActivelyInInterview
    });
    
    // BLOCK credit refreshes only during active interview tracking OR during post-interview lock
    if (state.isTracking || state.isPostInterviewLock || isActivelyInInterview) {
      const reason = state.isTracking ? 'active interview tracking' : 
                    state.isPostInterviewLock ? 'post-interview lock period' : 'actively in interview session';
      console.log('🚫 BLOCKED: refreshCredits called during ' + reason);
      console.log('🚫 Current local state:', { minutes: state.minutes, seconds: state.seconds });
      console.log('🚫 Blocking API refresh to preserve local deductions');
      return;
    }
    
    try {
      dispatch({ type: "REFRESH_FROM_API" });
      console.log('📡 Fetching credits from API...');
      
      const response = await fetch('/api/user-subscription', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API response:', data);
        console.log('🔍 Data structure check:', {
          hasSubscription: !!data.subscription,
          subscriptionKeys: data.subscription ? Object.keys(data.subscription) : 'no subscription',
          interviewTimeRemaining: data.subscription?.interview_time_remaining,
          typeOfRemaining: typeof data.subscription?.interview_time_remaining
        });
        
        // Server returns aggregated interview_time_remaining in MINUTES
        const totalMinutes = data.subscription?.interview_time_remaining || 0;
        // If we later support leftover seconds on server, prefer it; otherwise 0
        const leftoverSeconds = data.subscription?.leftover_seconds || 0;
        
        console.log('💰 Calculated credits from API (aggregated):', { 
          totalMinutes, 
          leftoverSeconds,
          subscriptionData: data.subscription,
          tier: data.subscription?.tier
        });
        
        // PROTECTION: Don't clear credits if user had credits before and API returns 0
        // This prevents the "Continue Practice" button from clearing credits
        if (totalMinutes === 0 && leftoverSeconds === 0 && state.minutes > 0) {
          console.log('🚫 PROTECTION: API returned 0 credits but user had credits before');
          console.log('🚫 Current local credits:', { minutes: state.minutes, seconds: state.seconds });
          console.log('🚫 Skipping SET_INITIAL to preserve existing credits');
          // Reset loading state since we're not updating credits
          dispatch({ type: "SET_LOADING", payload: false });
          return;
        }
        
        console.log('🚀 About to dispatch SET_INITIAL with:', { minutes: totalMinutes, seconds: leftoverSeconds });
        
        dispatch({ 
          type: "SET_INITIAL", 
          payload: { minutes: totalMinutes, seconds: leftoverSeconds } 
        });
        
        console.log('✅ Credits set in state');
      } else {
        console.log('❌ API response not ok:', response.status);
        
        // FALLBACK: Give user some credits if API fails so they can access interviews
        if (response.status === 401 || response.status === 403) {
          console.log('🔑 Authentication error detected, providing fallback credits for interview access');
          console.log('🔑 This allows users to access interviews even when the credit system has issues');
          console.log('🔑 Likely cause: JWT token invalid after password reset or token expiration');
          
          // Give user 60 minutes as fallback credits (increased from 30)
          const fallbackMinutes = 60;
          const fallbackSeconds = 0;
          
          console.log('🔑 Setting fallback credits:', { minutes: fallbackMinutes, seconds: fallbackSeconds });
          
          dispatch({ 
            type: "SET_INITIAL", 
            payload: { minutes: fallbackMinutes, seconds: fallbackSeconds } 
          });
          
          dispatch({ type: "SET_ERROR", payload: "Using fallback credits due to authentication issue" });
        } else {
          dispatch({ type: "SET_ERROR", payload: "Failed to fetch credits" });
        }
      }
    } catch (error) {
      console.error('❌ Error fetching credits:', error);
      
      // FALLBACK: Give user some credits if API fails so they can access interviews
      console.log('🔑 API call failed, providing fallback credits for interview access');
      console.log('🔑 This allows users to access interviews even when the credit system has issues');
      console.log('🔑 Likely cause: Network error or JWT token issues after password reset');
      
      // Give user 60 minutes as fallback credits (increased from 30)
      const fallbackMinutes = 60;
      const fallbackSeconds = 0;
      
      console.log('🔑 Setting fallback credits:', { minutes: fallbackMinutes, seconds: fallbackSeconds });
      
      dispatch({ 
        type: "SET_INITIAL", 
        payload: { minutes: fallbackMinutes, seconds: fallbackSeconds } 
      });
      
      dispatch({ type: "SET_ERROR", payload: "Using fallback credits due to system error" });
    }
  }, [isAuthenticated, state.minutes, user?.email, validateSession, state.isTracking, state.isPostInterviewLock]);

  // Interview tracking state
  // Remove local isTracking state since it's now in the global state
  const [trackingInterval, setTrackingInterval] = React.useState<NodeJS.Timeout | null>(null);
  
  // Use ref to store current state for the interval to avoid closure issues
  const currentStateRef = React.useRef({ minutes: 0, seconds: 0 });
  
  // Update ref whenever state changes
  React.useEffect(() => {
    currentStateRef.current = { minutes: state.minutes, seconds: state.seconds };
  }, [state.minutes, state.seconds]);

  // Debug: Monitor credit state changes
  React.useEffect(() => {
    console.log('🔄 Credits state changed:', { 
      minutes: state.minutes, 
      seconds: state.seconds, 
      hasCredits, 
      isLoading: state.isLoading, 
      error: state.error 
    });
  }, [state.minutes, state.seconds, hasCredits, state.isLoading, state.error]);

  // Start real-time credit tracking during interview
  const startInterviewTracking = useCallback(() => {
    console.log('🚀 startInterviewTracking called - Current state:', { 
      isTracking: state.isTracking, 
      hasCredits, 
      currentCredits: { minutes: state.minutes, seconds: state.seconds },
      state: state
    });
    
    if (state.isTracking) {
      console.log('❌ Already tracking, cannot start again');
      
return;
    }
    
    if (!hasCredits) {
      console.log('❌ No credits available, cannot start tracking');
      
return;
    }
    
    console.log('✅ Starting credit tracking...');
    console.log('✅ Current credits before tracking:', { minutes: state.minutes, seconds: state.seconds });
    console.log('✅ hasCredits value:', hasCredits);
    
    dispatch({ type: "SET_TRACKING", payload: true });
    
    // Mark the page as having an active interview
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-interview-active', 'true');
    }
    
    console.log('✅ Setting up tracking interval...');
    
    // Store the exact start time for synchronization
    const trackingStartTime = Date.now();
    console.log('⏰ Credit tracking started at:', new Date(trackingStartTime).toISOString());
    
    const interval = setInterval(() => {
      try {
        // Get current state from ref to avoid closure issues
        const currentState = { ...currentStateRef.current };
        
        // Calculate elapsed time since tracking started for synchronization
        const elapsedSeconds = Math.floor((Date.now() - trackingStartTime) / 1000);
        
        console.log('⏰ Tracking interval fired - elapsed time:', elapsedSeconds, 'seconds');
        console.log('⏰ Current state from ref:', currentState);
        console.log('⏰ State from context:', { minutes: state.minutes, seconds: state.seconds });
        
        // Validate state integrity
        if (typeof currentState.minutes !== 'number' || typeof currentState.seconds !== 'number') {
          console.error('❌ Invalid credit state detected:', currentState);
          clearInterval(interval);
          dispatch({ type: "SET_TRACKING", payload: false });
          
return;
        }
        
        // Ensure non-negative values
        if (currentState.minutes < 0 || currentState.seconds < 0) {
          console.error('❌ Negative credit values detected:', currentState);
          clearInterval(interval);
          dispatch({ type: "SET_TRACKING", payload: false });
          
return;
        }
        
        console.log('⏰ Tracking interval fired - dispatching DEDUCT_SECOND (elapsed: ' + elapsedSeconds + 's)');
        console.log('⏰ Current state before dispatch:', currentState);
        console.log('⏰ About to dispatch DEDUCT_SECOND action...');
        
        // Check if we can actually deduct
        if (currentState.seconds > 0 || currentState.minutes > 0) {
          console.log('⏰ Dispatching DEDUCT_SECOND action...');
          dispatch({ type: "DEDUCT_SECOND" });
          console.log('⏰ DEDUCT_SECOND action dispatched successfully');
        } else {
          console.log('⏰ No credits left, stopping tracking');
          clearInterval(interval);
          dispatch({ type: "SET_TRACKING", payload: false });
        }
      } catch (error) {
        console.error('❌ Error in credit tracking interval:', error);
        clearInterval(interval);
        dispatch({ type: "SET_TRACKING", payload: false });
      }
    }, 1000);
    
    setTrackingInterval(interval);
    console.log('✅ Tracking interval set up successfully with ID:', interval);
    console.log('✅ Credit tracking is now ACTIVE - credits will deduct every second');
  }, [state.isTracking, hasCredits, dispatch]);

  // Stop interview tracking
  const stopInterviewTracking = useCallback(() => {
    console.log('🛑 stopInterviewTracking called - Current state:', { isTracking: state.isTracking, hasInterval: !!trackingInterval });
    
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
      console.log('✅ Tracking interval cleared');
    } else {
      console.log('⚠️ No tracking interval to clear');
    }
    
    // Store the final deducted state before stopping tracking
    const finalDeductedState = { minutes: state.minutes, seconds: state.seconds };
    console.log('💰 Final deducted state before stopping:', finalDeductedState);
    
    // CRITICAL: Sync deducted credits to database immediately
    // This ensures the database has the correct values for future page refreshes
    const syncCreditsToDatabase = async () => {
      try {
        console.log('💾 Syncing deducted credits to database...');
        console.log('💾 Credits to sync:', finalDeductedState);
        
        // Calculate total seconds for the API
        const totalSeconds = finalDeductedState.minutes * 60 + finalDeductedState.seconds;
        const totalMinutes = Math.ceil(totalSeconds / 60); // Round up to nearest minute
        
        // PREVENT CREDIT RESET: Don't sync if credits are already zero
        if (totalMinutes === 0 && totalSeconds === 0) {
          console.log('🚫 Skipping credit sync - credits already zero, no need to reset database');
          
return;
        }
        
        console.log('📤 Sending credit update to API:', {
          totalMinutes,
          totalSeconds,
          action: 'set_remaining_credits'
        });
        
        const response = await fetch('/api/update-user-credits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // This sends the cookies for authentication
          body: JSON.stringify({
            totalMinutes: totalMinutes,
            totalSeconds: totalSeconds,
            action: 'set_remaining_credits'
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('✅ Credits successfully synced to database:', result);
          console.log('✅ Database now has:', { totalMinutes, totalSeconds });
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('❌ Failed to sync credits to database:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });
          
          // Don't throw error, just log it - this shouldn't block the interview flow
          console.warn('⚠️ Credit sync failed, but interview can continue');
        }
      } catch (error) {
        console.error('❌ Error syncing credits to database:', error);
      }
    };
    
    // Execute the sync immediately
    syncCreditsToDatabase();
    
    dispatch({ type: "SET_TRACKING", payload: false });
    
    // Remove interview active marker when tracking stops
    if (typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-interview-active');
    }
    
    console.log('✅ Tracking stopped');
    
    // IMPORTANT: Block any credit refreshes for 30 seconds after interview ends
    // This prevents the API from overwriting the deducted credits
    // 5 seconds was too short - users might still be on the interview page
    dispatch({ type: "SET_POST_INTERVIEW_LOCK", payload: true });
    console.log('🔒 Post-interview lock activated - blocking all credit refreshes for 30 seconds');
    
    setTimeout(() => {
      dispatch({ type: "SET_POST_INTERVIEW_LOCK", payload: false });
      console.log('🔓 Post-interview lock released - API refreshes now allowed');
    }, 30000); // 30 seconds instead of 5 seconds
    
  }, [trackingInterval, dispatch]);

  // Auto-stop tracking when credits run out
  useEffect(() => {
    if (hasCredits === false && state.isTracking) {
      stopInterviewTracking();
    }
  }, [hasCredits, state.isTracking, stopInterviewTracking]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('💰 Credits state changed:', { 
      minutes: state.minutes, 
      seconds: state.seconds, 
      hasCredits, 
      isLoading: state.isLoading,
      error: state.error 
    });
  }, [state.minutes, state.seconds, hasCredits, state.isLoading, state.error]);

  // Initial load and refresh on auth changes - REMOVED automatic refresh
  useEffect(() => {
    if (isAuthenticated && !state.isTracking && !state.isPostInterviewLock) {
      // Only set initial credits if we don't have any, don't auto-refresh
      if (state.minutes === 0 && state.seconds === 0) {
        console.log('🔐 User authenticated but no credits, doing initial load...');
        refreshCredits();
      } else {
        console.log('🔐 User authenticated and has credits, skipping auto-refresh');
      }
    } else if (isAuthenticated && (state.isTracking || state.isPostInterviewLock)) {
      const reason = state.isTracking ? 'active interview tracking' : 'post-interview lock period';
      console.log('⏸️ Skipping auth refresh during ' + reason);
    } else {
      console.log('🔐 User not authenticated, resetting credits...');
      dispatch({ type: "RESET" });
    }
  }, [isAuthenticated, refreshCredits, state.isTracking, state.isPostInterviewLock, state.minutes, state.seconds]);

  // Force refresh credits when component mounts - REMOVED automatic refresh
  useEffect(() => {
    if (isAuthenticated && !state.isTracking && !state.isPostInterviewLock) {
      // Only refresh if we have no credits at all
      if (state.minutes === 0 && state.seconds === 0) {
        console.log('🚀 Component mounted with no credits, doing initial load...');
        // Small delay to ensure auth is fully loaded
        const timer = setTimeout(() => {
          console.log('⏰ Timer fired, calling refreshCredits...');
          refreshCredits();
        }, 100);
        
return () => clearTimeout(timer);
      } else {
        console.log('⏸️ Component mounted with existing credits, skipping refresh');
        console.log('⏸️ Current credits:', { minutes: state.minutes, seconds: state.seconds });
      }
    } else if (isAuthenticated && (state.isTracking || state.isPostInterviewLock)) {
      const reason = state.isTracking ? 'active interview tracking' : 'post-interview lock period';
      console.log('⏸️ Skipping component mount refresh during ' + reason);
    }
  }, [isAuthenticated, refreshCredits, state.isTracking, state.isPostInterviewLock, state.minutes, state.seconds]);

  // Debug: Log every state change with more context
  useEffect(() => {
    console.log('🔄 Credits state changed:', { 
      minutes: state.minutes, 
      seconds: state.seconds, 
      hasCredits, 
      isLoading: state.isLoading,
      error: state.error,
      lastUpdated: state.lastUpdated,
      isTracking: state.isTracking,
      isPostInterviewLock: state.isPostInterviewLock
    });
    
    // Track when credits jump back to original values
    if (state.minutes === 514 && state.seconds === 0) {
      console.log('🚨 CREDITS JUMPED BACK TO 514m 0s!');
      console.log('🚨 Stack trace:', new Error().stack);
      console.log('🚨 Current tracking state:', { isTracking: state.isTracking, isPostInterviewLock: state.isPostInterviewLock });
      console.log('🚨 This should NOT happen if blocking is working properly!');
    }
  }, [state.minutes, state.seconds, hasCredits, state.isLoading, state.error, state.lastUpdated, state.isTracking, state.isPostInterviewLock]);

      // Listen for external credit updates - REMOVED automatic refresh
      // Credits will only refresh when user explicitly pauses/ends interview
      useEffect(() => {
        const handleCreditsUpdated = () => {
          console.log('🔄 External credits-updated event received, but skipping auto-refresh');
          console.log('🔄 User must manually pause/end interview to refresh credits');
        };

        // Also listen for payment success events - REMOVED automatic refresh
        const handlePaymentSuccess = () => {
          console.log('💳 Payment success event received, but skipping auto-refresh');
          console.log('💳 User must manually pause/end interview to refresh credits');
        };

        // Listen for credit deduction events (during interviews)
        const handleCreditDeduction = () => {
          console.log('⏰ Credit deduction event received, but NOT refreshing credits during interview...');
          // Don't refresh credits during interviews - let the local state handle deductions
          // This prevents the API from overwriting the deducted amounts
        };

        window.addEventListener('credits-updated', handleCreditsUpdated);
        window.addEventListener('payment-success', handlePaymentSuccess);
        window.addEventListener('credit-deduction', handleCreditDeduction);
        
        return () => {
          window.removeEventListener('credits-updated', handleCreditsUpdated);
          window.removeEventListener('payment-success', handlePaymentSuccess);
          window.removeEventListener('credit-deduction', handleCreditDeduction);
        };
      }, [refreshCredits, isAuthenticated, state.isTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [trackingInterval]);

  // Add function to get current tracking elapsed time for synchronization
  const getTrackingElapsedTime = useCallback(() => {
    if (!state.isTracking || !trackingInterval) {
      return 0;
    }
    // This would need to be implemented with a ref to track start time
    // For now, return 0 to avoid breaking existing functionality
    return 0;
  }, [state.isTracking, trackingInterval]);

  const contextValue: CreditsContextType = {
    state,
    dispatch,
    addCredits,
    deductCredits,
    startInterviewTracking,
    stopInterviewTracking,
    refreshCredits,
    manualRefreshCredits,
    getTotalSeconds,
    hasCredits,
    isLoading: state.isLoading,
    error: state.error,
    getTrackingElapsedTime
  };

  // Debug: Log context value
  console.log('💰 CreditsContext value:', {
    minutes: state.minutes,
    seconds: state.seconds,
    hasCredits,
    isLoading: state.isLoading,
    error: state.error,
    totalSeconds: getTotalSeconds()
  });

  // Add manual refresh function to window for debugging
  if (typeof window !== 'undefined') {
    (window as any).refreshCreditsManually = () => {
      console.log('🔄 Manual credit refresh triggered from console');
      manualRefreshCredits();
    };
    
    // Add debug function to check current state
    (window as any).debugCredits = () => {
      console.log('🔍 Current Credits State:', {
        state,
        hasCredits,
        isLoading: state.isLoading,
        error: state.error,
        totalSeconds: getTotalSeconds()
      });
    };
    
    // Add test function to manually test deduction
    (window as any).testDeduction = () => {
      console.log('🧪 Testing deduction logic...');
      console.log('🧪 Current state:', { minutes: state.minutes, seconds: state.seconds });
      dispatch({ type: "DEDUCT_SECOND" });
    };
    
    // Add test function to test minute rollover specifically
    (window as any).testMinuteRollover = () => {
      console.log('🧪 Testing minute rollover...');
      console.log('🧪 Current state:', { minutes: state.minutes, seconds: state.seconds });
      
      if (state.seconds === 0 && state.minutes > 0) {
        console.log('🧪 Perfect! Testing minute rollover from 0 seconds');
        dispatch({ type: "DEDUCT_SECOND" });
      } else {
        console.log('🧪 Need to get to 0 seconds first. Current state:', { minutes: state.minutes, seconds: state.seconds });
      }
    };
  }

  // Debug functions for testing
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Add debug functions to window for console testing
      (window as any).testCreditDeduction = () => {
        console.log('🧪 Testing credit deduction...');
        console.log('🧪 Current state:', state);
        console.log('🧪 Starting tracking...');
        startInterviewTracking();
        
        // Stop after 5 seconds for testing
        setTimeout(() => {
          console.log('🧪 Stopping tracking after 5 seconds...');
          stopInterviewTracking();
          console.log('🧪 Final state:', state);
        }, 5000);
      };
      
      (window as any).debugCredits = () => {
        console.log('🔍 Credits Debug Info:');
        console.log('🔍 Current state:', state);
        console.log('🔍 isTracking:', state.isTracking);
        console.log('🔍 hasCredits:', hasCredits);
        console.log('🔍 trackingInterval:', trackingInterval);
        console.log('🔍 currentStateRef:', currentStateRef.current);
      };
    }
  }, [state, hasCredits, trackingInterval, startInterviewTracking, stopInterviewTracking]);

  return (
    <CreditsContext.Provider value={contextValue}>
      {children}
    </CreditsContext.Provider>
  );
};

// Hook to use credits context
export function useCredits(): CreditsContextType {
  const context = useContext(CreditsContext);
  if (context === undefined) {
    throw new Error('useCredits must be used within a CreditsProvider');
  }
  
return context;
}
