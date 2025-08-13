export interface Organization {
  id: string;
  name: string;
  slug?: string;
  user_id?: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  image_url?: string;
  allowed_responses_count?: number;
  plan?: 'free' | 'pro' | 'free_trial_over';
  created_at?: string;
  updated_at?: string;
  owner_id?: string;
  is_active?: boolean;
  subscription_tier?: string;
  subscription_status?: string;
  subscription_expires_at?: string | null;
  settings?: {
    allow_public_interviews?: boolean;
    require_approval?: boolean;
    max_interviews_per_month?: number;
    max_team_members?: number;
  };
}
