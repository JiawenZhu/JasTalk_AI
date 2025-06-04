import { createServerComponentClient, createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Server-side Supabase client for Server Components
export const createServerClient = () =>
  createServerComponentClient({ cookies })

// Server-side Supabase client for Server Actions
export const createActionClient = () =>
  createServerActionClient({ cookies }) 
