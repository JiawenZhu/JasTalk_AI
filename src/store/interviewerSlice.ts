import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VoiceAgent {
  agent_id: string;
  name: string;
  description: string;
  voice_id: string;
  category: string;
  difficulty: string;
  specialties: string[];
}

export interface InterviewerState {
  selectedInterviewer: VoiceAgent | null;
}

const readFromStorage = (): VoiceAgent | null => {
  try {
    const raw =
      localStorage.getItem('selectedPracticeAgent') ||
      localStorage.getItem('selectedDashboardAgent');
    return raw ? (JSON.parse(raw) as VoiceAgent) : null;
  } catch {
    return null;
  }
};

const writeToStorage = (agent: VoiceAgent | null) => {
  try {
    if (agent) {
      const str = JSON.stringify(agent);
      localStorage.setItem('selectedPracticeAgent', str);
      localStorage.setItem('selectedDashboardAgent', str);
    }
  } catch {}
};

const initialState: InterviewerState = {
  selectedInterviewer: null,
};

const interviewerSlice = createSlice({
  name: 'interviewer',
  initialState,
  reducers: {
    hydrateFromStorage(state) {
      state.selectedInterviewer = readFromStorage();
    },
    setSelectedInterviewer(state, action: PayloadAction<VoiceAgent | null>) {
      state.selectedInterviewer = action.payload;
      writeToStorage(action.payload);
    },
    clearSelectedInterviewer(state) {
      state.selectedInterviewer = null;
      try {
        localStorage.removeItem('selectedPracticeAgent');
        localStorage.removeItem('selectedDashboardAgent');
      } catch {}
    },
  },
});

export const { hydrateFromStorage, setSelectedInterviewer, clearSelectedInterviewer } = interviewerSlice.actions;

export default interviewerSlice.reducer;

