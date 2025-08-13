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
  updateProfile: (data: UpdateProfileData) => Promise<AuthResponse>;
  getUserFullName: (user: User | null) => string;
  getUserInitials: (user: User | null) => string;
  refreshSession: () => Promise<AuthResponse>;
  handleAuthCallback: () => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const isAuthenticated = !!user && !!session;

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current session
      const { session: currentSession, error: sessionError } = await authService.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
      }

      // Get current user
      const { user: currentUser, error: userError } = await authService.getUser();
      if (userError) {
        console.error('User error:', userError);
      }

      setSession(currentSession);
      setUser(currentUser);
    } catch (error) {
      console.error('Auth initialization error:', error);
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

    // Temporarily disable initializeAuth to prevent infinite loop
    // Will re-enable once the auth state is stable

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
  }, [mounted]); // Remove initializeAuth dependency to prevent infinite loops

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
        updateProfile: async () => ({ success: false, error: 'Not mounted' }),
        getUserFullName: () => '',
        getUserInitials: () => '',
        refreshSession: async () => ({ success: false, error: 'Not mounted' }),
        handleAuthCallback: async () => ({ success: false, error: 'Not mounted' })
      }}>
        {children}
      </AuthContext.Provider>
    );
  }

  const signIn = async (data: SignInData): Promise<AuthResponse> => {
    const result = await authService.signIn(data);
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
    updateProfile,
    getUserFullName,
    getUserInitials,
    refreshSession,
    handleAuthCallback,
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
