import { configureStore } from '@reduxjs/toolkit';
import interviewerReducer from './interviewerSlice';
import questionsReducer from './questionsSlice';
import sessionReducer from './sessionSlice';
import onboardingReducer from './onboardingSlice';
import agentsReducer from './agentsSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    interviewer: interviewerReducer,
    questions: questionsReducer,
    session: sessionReducer,
    onboarding: onboardingReducer,
    agents: agentsReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

