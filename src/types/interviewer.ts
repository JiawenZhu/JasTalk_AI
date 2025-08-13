export interface Interviewer {
  id: bigint;
  user_id: string;
  created_at: Date;
  name: string;
  rapport: number;
  exploration: number;
  empathy: number;
  speed: number;
  image: string;
  description: string;
  audio: string;
  agent_id: string;
  // New fields for Gemini integration
  agent_type: 'retell' | 'gemini';
  gemini_config?: {
    model: string;
    voice: string;
    personality: string;
    interview_style: string;
  };
  subscription_required: 'free' | 'pro';
  is_active: boolean;
  sync_status?: string;
}
