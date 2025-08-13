export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: 'free' | 'pro';
  status: 'active' | 'inactive' | 'cancelled';
  interview_time_remaining: number; // in minutes
  interview_time_total: number; // in minutes
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface ProUserSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  cost: number; // $20/hour = $0.33/minute
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

export interface FreeUserSession {
  id: string;
  user_id: string;
  duration_minutes: number;
  time_remaining: number; // remaining free time
  status: 'active' | 'completed';
  created_at: string;
  started_at?: string;
  ended_at?: string;
}
