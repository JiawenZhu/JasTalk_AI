export interface Question {
  id: string;
  question: string;
  follow_up_count: number;
}

// NEW: Coding Question Types
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type ProgrammingLanguage = 'javascript' | 'python' | 'java' | 'typescript' | 'cpp' | 'csharp' | 'go' | 'rust';

export interface CodingQuestion {
  id: string;
  created_at?: string;
  title: string;
  description: string;
  difficulty: DifficultyLevel;
  tags: string[];
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  test_cases: Array<{
    input: string;
    expected_output: string;
    is_hidden?: boolean;
  }>;
  hints: string[];
  time_limit: number; // in minutes
  memory_limit: number; // in MB
  company_origin?: string;
  topic: string;
  is_active: boolean;
  solution_template: Record<ProgrammingLanguage, string>;
}

export interface InterviewCodingQuestion {
  id: string;
  interview_id: string;
  coding_question_id: string;
  question_order: number;
  is_active: boolean;
  coding_question?: CodingQuestion; // populated when joined
}

export interface CodingSubmission {
  id: string;
  created_at: string;
  response_id: number;
  coding_question_id: string;
  language: ProgrammingLanguage;
  code: string;
  submission_time: string;
  test_results: {
    passed: number;
    total: number;
    details: Array<{
      input: string;
      expected: string;
      actual: string;
      passed: boolean;
    }>;
  };
  ai_feedback: {
    overall: string;
    strengths: string[];
    improvements: string[];
    hints: string[];
    code_quality: {
      readability: number;
      efficiency: number;
      correctness: number;
    };
  };
  score: number; // 0-100
  execution_time?: number; // in milliseconds
  memory_used?: number; // in MB
  is_final_submission: boolean;
}

export interface Quote {
  quote: string;
  call_id: string;
}

export interface InterviewBase {
  user_id: string;
  organization_id: string;
  name: string;
  interviewer_id: bigint;
  objective: string;
  question_count: number;
  time_duration: string;
  is_anonymous: boolean;
  questions: Question[];
  description: string;
  response_count: bigint;
  // NEW: Coding Question Support
  has_coding_questions?: boolean;
  coding_question_count?: number;
  coding_questions?: InterviewCodingQuestion[];
}

export interface InterviewDetails {
  id: string;
  created_at: Date;
  url: string | null;
  insights: string[];
  quotes: Quote[];
  details: any;
  is_active: boolean;
  theme_color: string;
  logo_url: string;
  respondents: string[];
  readable_slug: string;
}

export interface Interview extends InterviewBase, InterviewDetails {}
