import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SessionState {
  sessionId?: string;
  status: 'preparing' | 'active' | 'completed' | 'paused' | 'error';
  agent?: { id: string; name: string };
  call?: { retellCallId?: string; accessToken?: string };
  startedAt?: string;
  endedAt?: string;
  totalQuestions?: number;
  currentQuestionIndex?: number;
}

const initialState: SessionState = {
  status: 'preparing',
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    hydrateFromServer(state, action: PayloadAction<Partial<SessionState>>) {
      return { ...state, ...action.payload };
    },
    createSession(state, action: PayloadAction<Partial<SessionState>>) {
      return { ...state, ...action.payload, status: action.payload.status || 'preparing' };
    },
    markActive(state) { state.status = 'active'; },
    markCompleted(state, action: PayloadAction<{ endedAt?: string }>) {
      state.status = 'completed';
      state.endedAt = action.payload.endedAt;
    },
    setProgress(state, action: PayloadAction<number>) {
      state.currentQuestionIndex = action.payload;
    },
    setCallInfo(state, action: PayloadAction<{ callId?: string; accessToken?: string }>) {
      state.call = { retellCallId: action.payload.callId, accessToken: action.payload.accessToken };
    },
    resetSession() { return initialState; }
  }
});

export const { hydrateFromServer, createSession, markActive, markCompleted, setProgress, setCallInfo, resetSession } = sessionSlice.actions;
export default sessionSlice.reducer;

