import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Question {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  category: string;
}

export interface QuestionConfig {
  questionCount: number;
  interviewType: string;
  difficulty: string;
  focusAreas: string[];
}

export interface QuestionsState {
  questions: Question[];
  config: QuestionConfig;
  jobDescription: string;
}

const readJSON = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const initialState: QuestionsState = {
  questions: [],
  config: {
    questionCount: 10,
    interviewType: 'mixed',
    difficulty: 'medium',
    focusAreas: ['programming', 'problem-solving', 'system-design'],
  },
  jobDescription: '',
};

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    hydrateFromStorage(state) {
      state.questions = readJSON('generatedQuestions', state.questions);
      const storedConfig = readJSON('questionConfig', null as any);
      if (storedConfig) {
        state.config = {
          questionCount: storedConfig.questionCount ?? state.config.questionCount,
          interviewType: storedConfig.interviewType ?? state.config.interviewType,
          difficulty: storedConfig.difficulty ?? state.config.difficulty,
          focusAreas: storedConfig.focusAreas ?? state.config.focusAreas,
        };
      }
      state.jobDescription = readJSON('jobDescription', state.jobDescription);
    },
    setQuestions(state, action: PayloadAction<Question[]>) {
      state.questions = action.payload;
      try { localStorage.setItem('generatedQuestions', JSON.stringify(action.payload)); } catch {}
    },
    setConfig(state, action: PayloadAction<Partial<QuestionConfig>>) {
      state.config = { ...state.config, ...action.payload } as QuestionConfig;
      try { localStorage.setItem('questionConfig', JSON.stringify(state.config)); } catch {}
    },
    setJobDescription(state, action: PayloadAction<string>) {
      state.jobDescription = action.payload;
      try { localStorage.setItem('jobDescription', action.payload); } catch {}
    },
    resetQuestions(state) {
      state.questions = [];
    }
  }
});

export const { hydrateFromStorage, setQuestions, setConfig, setJobDescription, resetQuestions } = questionsSlice.actions;
export default questionsSlice.reducer;

