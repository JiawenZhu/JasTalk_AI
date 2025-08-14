import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Client-side Supabase client (for use in client components)
export const createClient = () => {
  if (typeof window !== 'undefined') {
    // Lazy import on client to avoid server/edge env requirements
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('@supabase/auth-helpers-nextjs');
    const createClientComponentClient: <T>() => any = mod.createClientComponentClient;
    return createClientComponentClient<Database>();
  }
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Server-side Supabase client (for use in API routes)
export const createServerClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Admin client with service role key
export const createAdminClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations');
  }
  
  console.log('Creating admin client with URL:', supabaseUrl);
  console.log('Using service role key for project:', supabaseUrl.includes('cymlflkqutqbyniqsdxg') ? 'Free' : 'Main');
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Types for auth
export type { User, Session } from '@supabase/auth-helpers-nextjs' 
