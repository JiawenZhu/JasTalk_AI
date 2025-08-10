export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      interviews: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          title: string
          description: string | null
          status: 'draft' | 'active' | 'completed' | 'archived'
          interview_type: string | null
          duration_minutes: number | null
          question_count: number | null
          is_practice: boolean | null
          agent_id: string | null
          agent_name: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          title: string
          description?: string | null
          status?: 'draft' | 'active' | 'completed' | 'archived'
          interview_type?: string | null
          duration_minutes?: number | null
          question_count?: number | null
          is_practice?: boolean | null
          agent_id?: string | null
          agent_name?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: 'draft' | 'active' | 'completed' | 'archived'
          interview_type?: string | null
          duration_minutes?: number | null
          question_count?: number | null
          is_practice?: boolean | null
          agent_id?: string | null
          agent_name?: string | null
          metadata?: Json | null
        }
      }
      practice_sessions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          interview_id: string | null
          session_name: string
          status: 'in-progress' | 'completed' | 'abandoned'
          start_time: string | null
          end_time: string | null
          duration_seconds: number | null
          score: number | null
          total_questions: number | null
          completed_questions: number | null
          agent_id: string | null
          agent_name: string | null
          retell_agent_id: string | null
          retell_call_id: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          interview_id?: string | null
          session_name: string
          status?: 'in-progress' | 'completed' | 'abandoned'
          start_time?: string | null
          end_time?: string | null
          duration_seconds?: number | null
          score?: number | null
          total_questions?: number | null
          completed_questions?: number | null
          agent_id?: string | null
          agent_name?: string | null
          retell_agent_id?: string | null
          retell_call_id?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          interview_id?: string | null
          session_name?: string
          status?: 'in-progress' | 'completed' | 'abandoned'
          start_time?: string | null
          end_time?: string | null
          duration_seconds?: number | null
          score?: number | null
          total_questions?: number | null
          completed_questions?: number | null
          agent_id?: string | null
          agent_name?: string | null
          retell_agent_id?: string | null
          retell_call_id?: string | null
          metadata?: Json | null
        }
      }
      questions: {
        Row: {
          id: string
          created_at: string
          interview_id: string | null
          question_text: string
          question_type: 'behavioral' | 'technical' | 'system-design' | 'coding' | 'general'
          difficulty: string | null
          category: string | null
          order_index: number | null
          is_active: boolean | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          interview_id?: string | null
          question_text: string
          question_type?: 'behavioral' | 'technical' | 'system-design' | 'coding' | 'general'
          difficulty?: string | null
          category?: string | null
          order_index?: number | null
          is_active?: boolean | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          interview_id?: string | null
          question_text?: string
          question_type?: 'behavioral' | 'technical' | 'system-design' | 'coding' | 'general'
          difficulty?: string | null
          category?: string | null
          order_index?: number | null
          is_active?: boolean | null
          metadata?: Json | null
        }
      }
      practice_responses: {
        Row: {
          id: string
          created_at: string
          practice_session_id: string | null
          question_id: string | null
          user_response: string | null
          ai_feedback: string | null
          score: number | null
          response_duration_seconds: number | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          practice_session_id?: string | null
          question_id?: string | null
          user_response?: string | null
          ai_feedback?: string | null
          score?: number | null
          response_duration_seconds?: number | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          practice_session_id?: string | null
          question_id?: string | null
          user_response?: string | null
          ai_feedback?: string | null
          score?: number | null
          response_duration_seconds?: number | null
          metadata?: Json | null
        }
      }
      conversation_logs: {
        Row: {
          id: string
          call_id: string
          agent_id: string
          agent_name: string
          candidate_name: string
          summary: string | null
          detailed_summary: string | null
          transcript: Json
          post_call_analysis: Json
          duration_seconds: number
          call_cost: Json
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          call_id: string
          agent_id: string
          agent_name: string
          candidate_name: string
          summary?: string | null
          detailed_summary?: string | null
          transcript?: Json
          post_call_analysis?: Json
          duration_seconds?: number
          call_cost?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          call_id?: string
          agent_id?: string
          agent_name?: string
          candidate_name?: string
          summary?: string | null
          detailed_summary?: string | null
          transcript?: Json
          post_call_analysis?: Json
          duration_seconds?: number
          call_cost?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      interviewers: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          voice_id: string | null
          user_id: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          is_active: boolean
          settings: Json | null
          retell_agent_id: string | null
          sync_status: string | null
          last_sync_at: string | null
        }
        Insert: {
          id?: string
          name: string
          avatar_url?: string | null
          voice_id?: string | null
          user_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          settings?: Json | null
          retell_agent_id?: string | null
          sync_status?: string | null
          last_sync_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          avatar_url?: string | null
          voice_id?: string | null
          user_id?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          settings?: Json | null
          retell_agent_id?: string | null
          sync_status?: string | null
          last_sync_at?: string | null
        }
      }
      responses: {
        Row: {
          id: string
          interview_id: string | null
          interviewer_id: string | null
          user_id: string | null
          call_id: string | null
          content: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          interview_id?: string | null
          interviewer_id?: string | null
          user_id?: string | null
          call_id?: string | null
          content?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          interview_id?: string | null
          interviewer_id?: string | null
          user_id?: string | null
          call_id?: string | null
          content?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      coding_questions: {
        Row: {
          id: string
          title: string
          description: string | null
          difficulty: string | null
          category: string | null
          language: string | null
          template_code: string | null
          test_cases: Json | null
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          difficulty?: string | null
          category?: string | null
          language?: string | null
          template_code?: string | null
          test_cases?: Json | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          difficulty?: string | null
          category?: string | null
          language?: string | null
          template_code?: string | null
          test_cases?: Json | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      question_answers: {
        Row: {
          id: string
          user_email: string
          question: string
          answer: string
          audio_url: string | null
          duration: number
          category: string
          difficulty: string
          practice_session_id: string | null
          call_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_email: string
          question: string
          answer: string
          audio_url?: string | null
          duration?: number
          category?: string
          difficulty?: string
          practice_session_id?: string | null
          call_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_email?: string
          question?: string
          answer?: string
          audio_url?: string | null
          duration?: number
          category?: string
          difficulty?: string
          practice_session_id?: string | null
          call_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
