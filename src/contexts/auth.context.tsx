"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { authService, AuthResponse, SignUpData, SignInData, PasswordResetData, UpdateProfileData } from '@/services/auth.service';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (data: SignInData) => Promise<AuthResponse>;
  signUp: (data: SignUpData) => Promise<AuthResponse>;
  signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<AuthResponse>;
  signOut: () => Promise<AuthResponse>;
  resetPassword: (data: PasswordResetData) => Promise<AuthResponse>;
  updatePassword: (newPassword: string) => Promise<AuthResponse>;
  updatePasswordWithToken: (newPassword: string, accessToken: string, refreshToken: string) => Promise<AuthResponse>;
  updateProfile: (data: UpdateProfileData) => Promise<AuthResponse>;
  getUserFullName: (user: User | null) => string;
  getUserInitials: (user: User | null) => string;
  refreshSession: () => Promise<AuthResponse>;
  forceRefreshSession: () => Promise<AuthResponse>;
  clearInvalidTokens: () => Promise<AuthResponse>;
  handleAuthCallback: () => Promise<AuthResponse>;
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const isAuthenticated = !!user && !!session;

  // Handle welcome credits for new users
  const handleNewUserWelcomeCredits = async (user: User) => {
    try {
      // Check if user already has a subscription (to avoid adding credits multiple times)
      const response = await fetch('/api/user-subscription', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        // If user already has credits, they're not a new user
        if (data.subscription && data.subscription.interview_time_remaining > 0) {
          console.log('User already has credits, skipping welcome credits');
          return;
        }
      }

      // Add welcome minutes for new user
      console.log('Adding welcome minutes for new user:', user.email);
      const creditResponse = await fetch('/api/user-subscription', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add_welcome_credits',
          minutes: 42 // 42 minutes instead of $5.00
        }),
      });

      if (creditResponse.ok) {
        console.log('✅ Welcome credits added successfully for new user');
      } else {
        console.error('❌ Failed to add welcome credits:', await creditResponse.text());
      }
    } catch (error) {
      console.error('Error adding welcome credits:', error);
    }
  };

  // Track if welcome credits have been checked for this session
  const [welcomeCreditsChecked, setWelcomeCreditsChecked] = React.useState(false);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current session
      const { session: currentSession, error: sessionError } = await authService.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        
        // Try to refresh the session if there's an error
        console.log('🔄 Attempting to refresh session...');
        const refreshResult = await authService.refreshSession();
        if (refreshResult.success) {
          console.log('✅ Session refreshed successfully');
          setSession(refreshResult.data.session);
          setUser(refreshResult.data.user);
          setLoading(false);
          return;
        } else {
          console.log('❌ Session refresh failed:', refreshResult.error);
          // Clear invalid session state
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
      }

      // Get current user
      const { user: currentUser, error: userError } = await authService.getUser();
      if (userError) {
        console.error('User error:', userError);
        
        // If user fetch fails, try to refresh session
        if (currentSession) {
          console.log('🔄 Attempting to refresh session due to user fetch failure...');
          const refreshResult = await authService.refreshSession();
          if (refreshResult.success) {
            console.log('✅ Session refreshed successfully after user fetch failure');
            setSession(refreshResult.data.session);
            setUser(refreshResult.data.user);
            setLoading(false);
            return;
          } else {
            // Clear invalid session state
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
        } else {
          // No session, clear state
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
      }

      // Validate that we have both session and user
      if (!currentSession || !currentUser) {
        console.log('❌ Missing session or user, clearing auth state');
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      // Verify session is still valid by checking expiration
      const now = Math.floor(Date.now() / 1000);
      if (currentSession.expires_at && currentSession.expires_at < now) {
        console.log('❌ Session expired, attempting refresh...');
        const refreshResult = await authService.refreshSession();
        if (refreshResult.success) {
          console.log('✅ Expired session refreshed successfully');
          setSession(refreshResult.data.session);
          setUser(refreshResult.data.user);
        } else {
          console.log('❌ Failed to refresh expired session, clearing state');
          setSession(null);
          setUser(null);
        }
        setLoading(false);
        return;
      }

      setSession(currentSession);
      setUser(currentUser);
      console.log('✅ Auth state initialized successfully:', currentUser.email);
    } catch (error) {
      console.error('Auth initialization error:', error);
      
      // Try one more time to refresh session
      try {
        console.log('🔄 Final attempt to refresh session...');
        const refreshResult = await authService.refreshSession();
        if (refreshResult.success) {
          console.log('✅ Session refreshed successfully on final attempt');
          setSession(refreshResult.data.session);
          setUser(refreshResult.data.user);
        } else {
          console.log('❌ Final session refresh attempt failed, clearing state');
          setSession(null);
          setUser(null);
        }
      } catch (refreshError) {
        console.error('Final session refresh attempt failed:', refreshError);
        setSession(null);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);



  // Refresh session
  const refreshSession = async (): Promise<AuthResponse> => {
    try {
      const result = await authService.refreshSession();
      if (result.success) {
        const { session: currentSession, user: currentUser } = result.data;
        setSession(currentSession);
        setUser(currentUser);
      }
      return result;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return {
        success: false,
        error: 'Failed to refresh session'
      };
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Initialize auth state when component mounts
    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle specific auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('User signed in:', session?.user?.email);
            // Check if this is a new user and add welcome credits (only once per session)
            if (session?.user && !welcomeCreditsChecked) {
              setWelcomeCreditsChecked(true);
              handleNewUserWelcomeCredits(session.user);
            }
            break;
          case 'SIGNED_OUT':
            console.log('User signed out');
            break;
          case 'TOKEN_REFRESHED':
            console.log('Token refreshed');
            break;
          case 'USER_UPDATED':
            console.log('User updated:', session?.user?.email);
            break;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [mounted, initializeAuth]); // Re-enable initializeAuth dependency

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <AuthContext.Provider value={{
        user: null,
        session: null,
        loading: true,
        isAuthenticated: false,
        signIn: async () => ({ success: false, error: 'Not mounted' }),
        signUp: async () => ({ success: false, error: 'Not mounted' }),
        signInWithOAuth: async () => ({ success: false, error: 'Not mounted' }),
        signOut: async () => ({ success: false, error: 'Not mounted' }),
        resetPassword: async () => ({ success: false, error: 'Not mounted' }),
        updatePassword: async () => ({ success: false, error: 'Not mounted' }),
        updatePasswordWithToken: async () => ({ success: false, error: 'Not mounted' }),
        updateProfile: async () => ({ success: false, error: 'Not mounted' }),
        getUserFullName: () => '',
        getUserInitials: () => '',
        refreshSession: async () => ({ success: false, error: 'Not mounted' }),
        forceRefreshSession: async () => ({ success: false, error: 'Not mounted' }),
        clearInvalidTokens: async () => ({ success: false, error: 'Not mounted' }),
        handleAuthCallback: async () => ({ success: false, error: 'Not mounted' }),
        validateSession: async () => false
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  const signIn = async (data: SignInData): Promise<AuthResponse> => {
    // Use retry mechanism for better rate limit handling
    const result = await authService.signInWithRetry(data);
    if (result.success) {
      // Update local state immediately
      const { session: currentSession, user: currentUser } = result.data;
      setSession(currentSession);
      setUser(currentUser);
    }
    return result;
  };

  const signUp = async (data: SignUpData): Promise<AuthResponse> => {
    return await authService.signUp(data);
  };

  const signInWithOAuth = async (provider: 'google' | 'github' | 'discord'): Promise<AuthResponse> => {
    return await authService.signInWithOAuth(provider);
  };

  const signOut = async (): Promise<AuthResponse> => {
    const result = await authService.signOut();
    if (result.success) {
      // Clear local state immediately
      setUser(null);
      setSession(null);
    }
    return result;
  };

  const resetPassword = async (data: PasswordResetData): Promise<AuthResponse> => {
    return await authService.resetPassword(data);
  };

  const updatePassword = async (newPassword: string): Promise<AuthResponse> => {
    return await authService.updatePassword(newPassword);
  };

  const updatePasswordWithToken = async (newPassword: string, accessToken: string, refreshToken: string): Promise<AuthResponse> => {
    return await authService.updatePasswordWithToken(newPassword, accessToken, refreshToken);
  };

  const updateProfile = async (data: UpdateProfileData): Promise<AuthResponse> => {
    const result = await authService.updateProfile(data);
    if (result.success && result.data?.user) {
      setUser(result.data.user);
    }
    return result;
  };

  const getUserFullName = (user: User | null): string => {
    return authService.getUserFullName(user);
  };

  const getUserInitials = (user: User | null): string => {
    return authService.getUserInitials(user);
  };

  const handleAuthCallback = async (): Promise<AuthResponse> => {
    return await authService.handleAuthCallback();
  };

  const forceRefreshSession = async (): Promise<AuthResponse> => {
    try {
      const result = await authService.forceRefreshSession();
      if (result.success) {
        const { session: currentSession, user: currentUser } = result.data;
        setSession(currentSession);
        setUser(currentUser);
      }
      return result;
    } catch (error) {
      console.error('Error forcing session refresh:', error);
      return {
        success: false,
        error: 'Failed to force session refresh'
      };
    }
  };

  const clearInvalidTokens = async (): Promise<AuthResponse> => {
    try {
      const result = await authService.clearInvalidTokens();
      if (result.success) {
        console.log('Invalid tokens cleared successfully.');
      } else {
        console.error('Failed to clear invalid tokens:', result.error);
      }
      return result;
    } catch (error) {
      console.error('Error clearing invalid tokens:', error);
      return {
        success: false,
        error: 'Failed to clear invalid tokens'
      };
    }
  };

  const validateSession = async (): Promise<boolean> => {
    try {
      const result = await authService.validateSession();
      if (result.success) {
        const { session: currentSession, user: currentUser } = result.data;
        setSession(currentSession);
        setUser(currentUser);
        return true;
      } else {
        console.error('Session validation failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error validating session:', error);
      return false;
    }
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    resetPassword,
    updatePassword,
    updatePasswordWithToken,
    updateProfile,
    getUserFullName,
    getUserInitials,
    refreshSession,
    forceRefreshSession,
    clearInvalidTokens,
    handleAuthCallback,
    validateSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
