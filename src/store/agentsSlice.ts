import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface VoiceAgent {
  agent_id: string;
  name: string;
  description: string;
  voice_id: string;
  category: string;
  difficulty: string;
  specialties: string[];
  agent_type?: string;
}

export interface AgentsState {
  list: VoiceAgent[];
  lastFetchedAt?: string;
}

const initialState: AgentsState = {
  list: [],
};

const agentsSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {
    setAgents(state, action: PayloadAction<{ agents: VoiceAgent[]; fetchedAt?: string }>) {
      state.list = action.payload.agents;
      state.lastFetchedAt = action.payload.fetchedAt || new Date().toISOString();
    },
    clearAgents(state) { state.list = []; state.lastFetchedAt = undefined; }
  }
});

export const { setAgents, clearAgents } = agentsSlice.actions;
export default agentsSlice.reducer;

