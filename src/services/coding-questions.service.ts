import { createServerClient } from '@/lib/supabase';
import { CodingQuestion, InterviewCodingQuestion, DifficultyLevel } from '@/types/interview';

export class CodingQuestionsService {
  // Get all coding questions from the pool
  static async getAllCodingQuestions(): Promise<CodingQuestion[]> {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('coding_question')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coding questions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllCodingQuestions:', error);
      throw error;
    }
  }

  // Get coding questions by difficulty
  static async getCodingQuestionsByDifficulty(difficulty: DifficultyLevel): Promise<CodingQuestion[]> {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('coding_question')
        .select('*')
        .eq('difficulty', difficulty)
        .eq('is_active', true)
        .order('title');

      if (error) {
        console.error('Error fetching coding questions by difficulty:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCodingQuestionsByDifficulty:', error);
      throw error;
    }
  }

  // Get coding questions by topic
  static async getCodingQuestionsByTopic(topic: string): Promise<CodingQuestion[]> {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('coding_question')
        .select('*')
        .eq('topic', topic)
        .eq('is_active', true)
        .order('difficulty', { ascending: true });

      if (error) {
        console.error('Error fetching coding questions by topic:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCodingQuestionsByTopic:', error);
      throw error;
    }
  }

  // Get coding questions for a specific interview
  static async getCodingQuestionsForInterview(interviewId: string): Promise<InterviewCodingQuestion[]> {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('interview_coding_question')
        .select(`
          *,
          coding_question (*)
        `)
        .eq('interview_id', interviewId)
        .eq('is_active', true)
        .order('question_order');

      if (error) {
        console.error('Error fetching interview coding questions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCodingQuestionsForInterview:', error);
      throw error;
    }
  }

  // Add coding questions to an interview
  static async addCodingQuestionsToInterview(
    interviewId: string, 
    codingQuestionIds: string[]
  ): Promise<void> {
    try {
      const supabase = createServerClient();
      
      // First, remove existing coding questions for this interview
      await supabase
        .from('interview_coding_question')
        .delete()
        .eq('interview_id', interviewId);

      // Add new coding questions
      if (codingQuestionIds.length > 0) {
        const interviewCodingQuestions = codingQuestionIds.map((questionId, index) => ({
          interview_id: interviewId,
          coding_question_id: questionId,
          question_order: index + 1,
          is_active: true
        }));

        const { error } = await supabase
          .from('interview_coding_question')
          .insert(interviewCodingQuestions);

        if (error) {
          console.error('Error adding coding questions to interview:', error);
          throw error;
        }

        // Update interview to mark it as having coding questions
        await supabase
          .from('interview')
          .update({
            has_coding_questions: true,
            coding_question_count: codingQuestionIds.length
          })
          .eq('id', interviewId);
      } else {
        // Update interview to mark it as not having coding questions
        await supabase
          .from('interview')
          .update({
            has_coding_questions: false,
            coding_question_count: 0
          })
          .eq('id', interviewId);
      }
    } catch (error) {
      console.error('Error in addCodingQuestionsToInterview:', error);
      throw error;
    }
  }

  // Create a new coding question (for admins)
  static async createCodingQuestion(question: Omit<CodingQuestion, 'id' | 'created_at'>): Promise<CodingQuestion> {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('coding_question')
        .insert([question])
        .select()
        .single();

      if (error) {
        console.error('Error creating coding question:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in createCodingQuestion:', error);
      throw error;
    }
  }

  // Get available topics
  static async getAvailableTopics(): Promise<string[]> {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('coding_question')
        .select('topic')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching topics:', error);
        throw error;
      }

      // Get unique topics
      const topics = Array.from(new Set(data?.map(item => item.topic).filter(Boolean))) as string[];
      return topics.sort();
    } catch (error) {
      console.error('Error in getAvailableTopics:', error);
      throw error;
    }
  }

  // Get available companies
  static async getAvailableCompanies(): Promise<string[]> {
    try {
      const supabase = createServerClient();
      const { data, error } = await supabase
        .from('coding_question')
        .select('company_origin')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching companies:', error);
        throw error;
      }

      // Get unique companies
      const companies = Array.from(new Set(data?.map(item => item.company_origin).filter(Boolean))) as string[];
      return companies.sort();
    } catch (error) {
      console.error('Error in getAvailableCompanies:', error);
      throw error;
    }
  }
} 
