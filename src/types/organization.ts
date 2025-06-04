export interface Organization {
  id: string;
  name: string;
  user_id: string;
  image_url?: string;
  allowed_responses_count?: number;
  plan?: 'free' | 'pro' | 'free_trial_over';
  created_at?: string;
}
