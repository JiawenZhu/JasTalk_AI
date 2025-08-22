import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth.context';

interface MinutesTrackingState {
  isTracking: boolean;
  startTime: number | null;
  elapsedMinutes: number;
  totalDeducted: number;
}

export const useMinutesTracking = () => {
  const { user } = useAuth();
  const [trackingState, setTrackingState] = useState<MinutesTrackingState>({
    isTracking: false,
    startTime: null,
    elapsedMinutes: 0,
    totalDeducted: 0
  });

  // Start tracking minutes
  const startTracking = useCallback(() => {
    setTrackingState(prev => ({
      ...prev,
      isTracking: true,
      startTime: Date.now(),
      elapsedMinutes: 0
    }));
  }, []);

  // Stop tracking and calculate total minutes
  const stopTracking = useCallback(() => {
    if (!trackingState.startTime) return 0;

    const endTime = Date.now();
    const totalMinutes = Math.ceil((endTime - trackingState.startTime) / (1000 * 60)); // Round up to nearest minute

    setTrackingState(prev => ({
      ...prev,
      isTracking: false,
      startTime: null,
      elapsedMinutes: totalMinutes,
      totalDeducted: prev.totalDeducted + totalMinutes
    }));

    return totalMinutes;
  }, [trackingState.startTime]);

  // Update elapsed minutes in real-time
  useEffect(() => {
    if (!trackingState.isTracking || !trackingState.startTime) return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = Math.ceil((currentTime - trackingState.startTime!) / (1000 * 60));
      
      setTrackingState(prev => ({
        ...prev,
        elapsedMinutes: elapsed
      }));
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [trackingState.isTracking, trackingState.startTime]);

  // Deduct minutes from user's account
  const deductMinutes = useCallback(async (minutes: number) => {
    if (!user) return false;

    try {
      const response = await fetch('/api/user-subscription', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deduct_minutes',
          minutes: minutes
        }),
      });

      if (response.ok) {
        // Dispatch event to refresh subscription data
        window.dispatchEvent(new CustomEvent('credits-updated'));
        return true;
      } else {
        console.error('Failed to deduct minutes:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('Error deducting minutes:', error);
      return false;
    }
  }, [user]);

  // Get current tracking status
  const getTrackingStatus = useCallback(() => {
    if (!trackingState.isTracking) {
      return {
        status: 'idle',
        message: 'Not tracking',
        elapsed: 0
      };
    }

    return {
      status: 'tracking',
      message: `Tracking: ${trackingState.elapsedMinutes} minutes elapsed`,
      elapsed: trackingState.elapsedMinutes
    };
  }, [trackingState.isTracking, trackingState.elapsedMinutes]);

  return {
    // State
    isTracking: trackingState.isTracking,
    elapsedMinutes: trackingState.elapsedMinutes,
    totalDeducted: trackingState.totalDeducted,
    
    // Actions
    startTracking,
    stopTracking,
    deductMinutes,
    
    // Utilities
    getTrackingStatus,
    
    // Auto-deduct when stopping (recommended usage)
    stopAndDeduct: async () => {
      const minutes = stopTracking();
      if (minutes > 0) {
        return await deductMinutes(minutes);
      }
      return true;
    }
  };
};

