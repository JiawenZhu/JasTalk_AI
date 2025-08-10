import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  sharePopupOpen: boolean;
  agentSelectorOpen: boolean;
  globalLoading: boolean;
  errorMessage?: string;
}

const initialState: UIState = {
  sharePopupOpen: false,
  agentSelectorOpen: false,
  globalLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setSharePopupOpen(state, action: PayloadAction<boolean>) { state.sharePopupOpen = action.payload; },
    setAgentSelectorOpen(state, action: PayloadAction<boolean>) { state.agentSelectorOpen = action.payload; },
    setGlobalLoading(state, action: PayloadAction<boolean>) { state.globalLoading = action.payload; },
    setError(state, action: PayloadAction<string | undefined>) { state.errorMessage = action.payload; },
  }
});

export const { setSharePopupOpen, setAgentSelectorOpen, setGlobalLoading, setError } = uiSlice.actions;
export default uiSlice.reducer;

