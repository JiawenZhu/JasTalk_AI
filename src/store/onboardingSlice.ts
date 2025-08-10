import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface OnboardingState {
  isFirstTime: boolean;
  isCompleted: boolean;
  show: boolean;
}

const initialState: OnboardingState = {
  isFirstTime: false,
  isCompleted: false,
  show: false,
};

const readFlag = (key: string) => {
  try { return localStorage.getItem(key) === 'true'; } catch { return false; }
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    hydrateFromStorage(state) {
      const completed = readFlag('onboardingCompleted');
      const visited = readFlag('hasVisitedBefore');
      state.isFirstTime = !visited;
      state.isCompleted = completed;
      state.show = !visited || !completed;
      try { localStorage.setItem('hasVisitedBefore', 'true'); } catch {}
    },
    complete(state) { state.isCompleted = true; state.show = false; try { localStorage.setItem('onboardingCompleted', 'true'); } catch {} },
    reset(state) { state.isCompleted = false; state.isFirstTime = true; state.show = true; try { localStorage.removeItem('onboardingCompleted'); localStorage.removeItem('hasVisitedBefore'); } catch {} },
    show(state) { state.show = true; },
    hide(state) { state.show = false; },
  }
});

export const { hydrateFromStorage, complete, reset, show, hide } = onboardingSlice.actions;
export default onboardingSlice.reducer;

