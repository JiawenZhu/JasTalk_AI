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
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      })

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error)
        }
      }

      return {
        success: true,
        data: {
          session: authData.session,
          user: authData.user
        }
      }
    } catch (error) {
      return {
        success: false,
        error: 'An unexpected error occurred during sign in'
      }
    }
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
