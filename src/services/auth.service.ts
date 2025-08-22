import { createClient } from '@/lib/supabase'
import { User, Session, AuthError } from '@supabase/supabase-js'

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
      const { error } = await this.supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
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
        error: 'An unexpected error occurred during password reset'
      }
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
