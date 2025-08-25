import { createClient } from '@/lib/supabase'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { emailService } from '@/lib/emailService'

export interface AuthResponse {
  success: boolean
  data?: any
  error?: string
}

export interface SignUpData {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface PasswordResetData {
  email: string
}

export interface UpdateProfileData {
  firstName?: string
  lastName?: string
  avatar_url?: string
}



class AuthService {
  private supabase = createClient()

  // Sign up with email and password
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      return {
        success: true,
        data: authData
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during sign up'
      }
    }
  }

  // Sign in with email and password
  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting sign in for:', data.email);
      
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        console.error('❌ Sign in error:', error);
        
        // Handle specific error types
        if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
          return {
            success: false,
            error: 'Too many sign-in attempts. Please wait a few minutes and try again.'
          }
        }
        
        if (error.message.includes('Invalid login credentials')) {
          return {
            success: false,
            error: 'Invalid email or password. Please check your credentials.'
          }
        }
        
        if (error.message.includes('Email not confirmed')) {
          return {
            success: false,
            error: 'Please check your email and confirm your account before signing in.'
          }
        }
        
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      console.log('✅ Sign in successful for:', data.email);
      return {
        success: true,
        data: {
          session: authData.session,
          user: authData.user
        }
      }
    } catch (error) {
      console.error('❌ Unexpected sign in error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during sign in. Please try again.'
      }
    }
  }

  // Sign in with retry mechanism for rate limits
  async signInWithRetry(data: SignInData, maxRetries: number = 3): Promise<AuthResponse> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔐 Sign in attempt ${attempt}/${maxRetries} for:`, data.email);
        
        const result = await this.signIn(data);
        
        if (result.success) {
          return result;
        }
        
        // If it's a rate limit error and we have retries left, wait and retry
        if (result.error?.includes('rate limit') && attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        return result;
      } catch (error) {
        console.error(`❌ Sign in attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: 'Sign in failed after multiple attempts. Please try again later.'
          };
        }
      }
    }
    
    return {
      success: false,
      error: 'Sign in failed. Please try again later.'
    };
  }

  // Sign in with OAuth provider
  async signInWithOAuth(provider: 'google' | 'github' | 'discord'): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during OAuth sign in'
      }
    }
  }

  // Sign out
  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await this.supabase.auth.signOut()

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during sign out'
      }
    }
  }

  // Reset password
  async resetPassword(data: PasswordResetData): Promise<AuthResponse> {
    try {
      console.log('🔐 Initiating password reset for:', data.email);
      
      // STEP 1: Use Supabase's built-in password reset (this properly invalidates old JWT tokens)
      console.log('🔄 Using Supabase built-in password reset for JWT management...');
      
      const { error: supabaseError } = await this.supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (supabaseError) {
        console.error('❌ Supabase password reset failed:', supabaseError);
        return {
          success: false,
          error: this.getErrorMessage(supabaseError)
        };
      }
      
      console.log('✅ Supabase password reset initiated successfully');
      console.log('✅ Old JWT tokens will be automatically invalidated by Supabase');
      console.log('✅ New session will be created after password reset');
      
      // STEP 2: Send our custom email with better branding and user experience
      console.log('📧 Sending enhanced password reset email via our email server...');
      
      try {
        const emailData = {
          to: data.email,
          username: data.email.split('@')[0],
          resetUrl: `${window.location.origin}/reset-password?email=${encodeURIComponent(data.email)}`,
          expiryTime: '1 hour',
          supportEmail: 'support@jastalk.com',
          requestTime: new Date().toLocaleString(),
          ipAddress: 'Unknown'
        };
        
        console.log('📧 Email data prepared:', emailData);
        console.log('📧 Calling emailService.sendPasswordResetEmail...');
        
        const emailSent = await emailService.sendPasswordResetEmail(emailData);
        
        console.log('📧 Email service response:', emailSent);
        
        if (emailSent) {
          console.log('✅ Enhanced email sent successfully via our email server');
        } else {
          console.log('⚠️ Enhanced email failed, but Supabase email was sent');
        }
      } catch (emailError) {
        console.error('❌ Enhanced email error:', emailError);
        console.log('⚠️ Enhanced email error, but Supabase email was sent');
        // Don't fail the whole operation - Supabase email was sent successfully
      }
      
      return {
        success: true,
        data: {
          message: 'Password reset email sent successfully',
          method: 'supabase_with_enhanced_email',
          jwtManagement: 'handled_by_supabase',
          sessionInvalidation: 'automatic',
          note: 'Old JWT tokens are automatically invalidated by Supabase'
        }
      };
      
    } catch (error) {
      console.error('❌ Error during password reset:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during password reset'
      };
    }
  }

  // Update password
  async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      return {
        success: true
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during password update'
      }
    }
  }

  // Update password with reset token (for password reset flow)
  async updatePasswordWithToken(newPassword: string, accessToken: string, refreshToken: string): Promise<AuthResponse> {
    try {
      console.log('🔐 Updating password with recovery tokens...');
      
      // First, set the recovery tokens in Supabase client
      // This is crucial for the password reset to work properly
      const { data, error: setSessionError } = await this.supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
      
      if (setSessionError) {
        console.error('❌ Error setting recovery session:', setSessionError);
        return {
          success: false,
          error: `Failed to set recovery session: ${this.getErrorMessage(setSessionError)}`
        };
      }
      
      if (!data.session) {
        console.error('❌ No session established with recovery tokens');
        return {
          success: false,
          error: 'Invalid or expired recovery tokens'
        };
      }
      
      console.log('✅ Recovery session established, updating password...');
      
      // Now update the password
      const { error: updateError } = await this.supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError);
        return {
          success: false,
          error: this.getErrorMessage(updateError)
        };
      }
      
      console.log('✅ Password updated successfully');
      
      // Get the new session after password update
      const { data: { session: newSession }, error: sessionError } = await this.supabase.auth.getSession();
      
      if (sessionError || !newSession) {
        console.error('❌ Error getting new session:', sessionError);
        return {
          success: false,
          error: 'Password updated but failed to establish new session'
        };
      }
      
      console.log('✅ New session established after password update');
      
      return {
        success: true,
        data: {
          session: newSession,
          user: newSession.user
        }
      };
    } catch (error) {
      console.error('❌ Unexpected error during password reset:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during password reset'
      };
    }
  }

  // Update user profile
  async updateProfile(data: UpdateProfileData): Promise<AuthResponse> {
    try {
      const { data: userData, error } = await this.supabase.auth.updateUser({
        data: data
      })

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      return {
        success: true,
        data: userData
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during profile update'
      }
    }
  }

  // Validate current session
  async validateSession(): Promise<AuthResponse> {
    try {
      console.log('🔍 Validating current session...');
      
      // Get current session
      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession();
      if (sessionError) {
        console.error('❌ Session validation error:', sessionError);
        return {
          success: false,
          error: this.getErrorMessage(sessionError)
        };
      }

      if (!session) {
        console.log('❌ No session found');
        return {
          success: false,
          error: 'No active session'
        };
      }

      // Check if session is expired
      const now = Math.floor(Date.now() / 1000);
      if (session.expires_at && session.expires_at < now) {
        console.log('❌ Session expired, attempting refresh...');
        
        // Try to refresh the session
        const { data: refreshData, error: refreshError } = await this.supabase.auth.refreshSession();
        if (refreshError) {
          console.error('❌ Session refresh failed:', refreshError);
          return {
            success: false,
            error: 'Session expired and refresh failed'
          };
        }

        if (refreshData.session) {
          console.log('✅ Session refreshed successfully');
          return {
            success: true,
            data: {
              session: refreshData.session,
              user: refreshData.user
            }
          };
        } else {
          console.log('❌ No session data after refresh');
          return {
            success: false,
            error: 'Session refresh returned no data'
          };
        }
      }

      // Get current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError) {
        console.error('❌ User validation error:', userError);
        return {
          success: false,
          error: this.getErrorMessage(userError)
        };
      }

      if (!user) {
        console.log('❌ No user found in session');
        return {
          success: false,
          error: 'No user found in session'
        };
      }

      console.log('✅ Session validation successful:', user.email);
      return {
        success: true,
        data: {
          session,
          user
        }
      };
    } catch (error) {
      console.error('❌ Unexpected error during session validation:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during session validation'
      };
    }
  }

  // Get current session
  async getSession(): Promise<{ session: Session | null; error?: string }> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()

      if (error) {
        return {
          session: null,
          error: this.getErrorMessage(error)
        }
      }

      return {
        session
      }
    } catch (error) {
      return {
        session: null,
        error: 'An unexpected error occurred while getting session'
      }
    }
  }

  // Get current user
  async getUser(): Promise<{ user: User | null; error?: string }> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()

      if (error) {
        return {
          user: null,
          error: this.getErrorMessage(error)
        }
      }

      return {
        user
      }
    } catch (error) {
      return {
        user: null,
        error: 'An unexpected error occurred while getting user'
      }
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }

  // Verify OAuth callback
  async handleAuthCallback(): Promise<AuthResponse> {
    try {
      const { data, error } = await this.supabase.auth.getSession()

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      return {
        success: true,
        data
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during auth callback'
      }
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      return !!session
    } catch (error) {
      return false
    }
  }

  // Refresh the current session
  async refreshSession(): Promise<AuthResponse> {
    try {
      const { data: { session }, error } = await this.supabase.auth.refreshSession()
      
      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      if (!session) {
        return {
          success: false,
          error: 'No session to refresh'
        }
      }

      return {
        success: true,
        data: {
          session: session,
          user: session.user
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during session refresh'
      }
    }
  }

  // Force refresh session with more aggressive error handling
  async forceRefreshSession(): Promise<AuthResponse> {
    try {
      console.log('🔄 Force refreshing session...');
      
      // First try normal refresh
      const refreshResult = await this.refreshSession();
      if (refreshResult.success) {
        console.log('✅ Normal session refresh successful');
        return refreshResult;
      }
      
      console.log('❌ Normal refresh failed, trying alternative methods...');
      
      // Try to get current session and refresh it
      const { data: { session: currentSession } } = await this.supabase.auth.getSession();
      if (currentSession) {
        console.log('🔄 Attempting to refresh existing session...');
        const { data: { session }, error } = await this.supabase.auth.refreshSession();
        
        if (!error && session) {
          console.log('✅ Alternative refresh successful');
          return {
            success: true,
            data: {
              session: session,
              user: session.user
            }
          };
        }
      }
      
      // If all else fails, try to sign out and check if user is still authenticated
      console.log('🔄 Trying to recover from invalid session...');
      const { data: { user } } = await this.supabase.auth.getUser();
      
      if (user) {
        // User exists but session is invalid, try to create new session
        console.log('🔄 User exists, attempting to create new session...');
        const { data: { session }, error } = await this.supabase.auth.refreshSession();
        
        if (!error && session) {
          console.log('✅ New session created successfully');
          return {
            success: true,
            data: {
              session: session,
              user: session.user
            }
          };
        }
      }
      
      console.log('❌ All session refresh attempts failed');
      return {
        success: false,
        error: 'Unable to refresh session - user may need to sign in again'
      };
      
    } catch (error) {
      console.error('❌ Force refresh session error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during force session refresh'
      }
    }
  }

  // Clear invalid tokens and force fresh authentication
  async clearInvalidTokens(): Promise<AuthResponse> {
    try {
      console.log('🧹 Clearing invalid tokens and forcing fresh authentication...');
      
      // Sign out to clear all tokens
      const { error: signOutError } = await this.supabase.auth.signOut();
      if (signOutError) {
        console.log('⚠️ Error during sign out (this might be expected):', signOutError);
      }
      
      // Clear any local storage tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.refreshToken');
        sessionStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.refreshToken');
      }
      
      console.log('✅ Invalid tokens cleared successfully');
      
      return {
        success: true,
        data: {
          message: 'Invalid tokens cleared. User should sign in again.'
        }
      };
      
    } catch (error) {
      console.error('❌ Error clearing invalid tokens:', error);
      return {
        success: false,
        error: 'Failed to clear invalid tokens'
      };
    }
  }

  // Get user's full name
  getUserFullName(user: User | null): string {
    if (!user) return ''
    
    const firstName = user.user_metadata?.firstName || ''
    const lastName = user.user_metadata?.lastName || ''
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`
    } else if (firstName) {
      return firstName
    } else if (lastName) {
      return lastName
    } else {
      return user.email?.split('@')[0] || 'User'
    }
  }

  // Get user's initials
  getUserInitials(user: User | null): string {
    if (!user) return ''
    
    const firstName = user.user_metadata?.firstName || ''
    const lastName = user.user_metadata?.lastName || ''
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase()
    } else if (firstName) {
      return firstName[0].toUpperCase()
    } else if (lastName) {
      return lastName[0].toUpperCase()
    } else {
      return user.email?.[0].toUpperCase() || 'U'
    }
  }

  // Private method to get user-friendly error messages
  private getErrorMessage(error: AuthError): string {
    switch (error.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password'
      case 'Email not confirmed':
        return 'Please check your email and click the confirmation link'
      case 'User already registered':
        return 'An account with this email already exists'
      case 'Password should be at least 6 characters':
        return 'Password must be at least 6 characters long'
      case 'Unable to validate email address: invalid format':
        return 'Please enter a valid email address'
      case 'Signup is disabled':
        return 'Sign up is currently disabled'
      case 'Signin is disabled':
        return 'Sign in is currently disabled'
      default:
        return error.message || 'An error occurred'
    }
  }
}

export const authService = new AuthService() 
