# Coding Demo Voice Integration

## Overview

The FoloUp Coding Environment Demo now includes full voice integration with Retell AI, allowing users to have real-time voice conversations with AI interviewers while solving coding problems.

## Features

### ✅ **Real Voice Interaction**
- **Live Voice Calls**: Actual Retell AI voice calls, not simulated
- **Bidirectional Audio**: AI speaks and listens to user responses
- **Real-time Transcription**: Live conversation display
- **Turn Indicators**: Visual cues showing who's speaking

### ✅ **Voice Agent Selection**
- **Dynamic Loading**: Syncs and loads voice-enabled agents from Retell AI
- **Agent Profiles**: Shows empathy, technical skills, and rapport ratings
- **Smart Filtering**: Only displays agents with voice configured

### ✅ **Coding Interview Flow**
- **Problem Context**: AI receives coding problem details
- **Interview Guidance**: AI guides through problem-solving
- **Voice + Code**: Simultaneous voice conversation and coding
- **Call Management**: Start, end, and monitor call status

## How It Works

### 1. **Agent Synchronization**
```typescript
// Syncs voice-enabled agents from Retell AI
await fetch('/api/sync-retell-agents', { method: 'POST' });

// Fetches synced agents from database
const response = await fetch('/api/get-voice-agents');
```

### 2. **Call Registration**
```typescript
// Registers call with problem context
const registerCallResponse = await axios.post('/api/register-call', {
  dynamic_data: {
    problem_title: currentProblem.title,
    problem_difficulty: currentProblem.difficulty,
    problem_description: currentProblem.description,
    interviewer_name: selectedAgent.name,
    interview_type: 'coding_demo'
  },
  interviewer_id: selectedAgent.id
});
```

### 3. **Voice Call Initiation**
```typescript
// Starts actual voice call with Retell Web SDK
await webClient.startCall({
  accessToken: registerCallResponse.data.registerCallResponse.access_token,
});
```

## UI Components

### **Voice Agent Selection Panel**
- Agent dropdown with empathy/technical ratings
- "Start Voice Interview" button
- Agent profile with description and skills

### **Active Voice Interview Bar**
- Connection status (Connecting → Active)
- Speaking indicators (AI speaking / Listening)
- Real-time conversation display
- Call ID badge
- End interview button

### **Enhanced Status Indicators**
- 🎤 **AI is speaking...** - When agent is talking
- 👂 **Listening to you...** - When waiting for user input
- Animated pulse indicators during active call
- Connection status with visual feedback

## Error Handling

### **Graceful Fallbacks**
- Clear error messages for connection issues
- Retry mechanisms for network problems
- User-friendly notifications via toast system
- Automatic cleanup on errors

### **Development Support**
- Mock responses when Retell API unavailable
- Detailed console logging for debugging
- Environment-specific behavior

## Technical Implementation

### **Key Components**
- `RetellWebClient` - Handles voice call management
- Event listeners for call lifecycle
- State management for call status
- Real-time transcript updates

### **Event Handlers**
```typescript
webClient.on("call_started", () => setIsCalling(true));
webClient.on("call_ended", () => setIsVoiceEnabled(false));
webClient.on("agent_start_talking", () => setActiveTurn("agent"));
webClient.on("update", (update) => handleTranscriptUpdate(update));
```

## Usage Instructions

1. **Access the Demo**: Navigate to `/coding-demo`
2. **Select Problem**: Choose from Two Sum or Reverse String
3. **Choose Agent**: Select a voice-enabled interviewer
4. **Start Interview**: Click "Start Voice Interview"
5. **Grant Permissions**: Allow microphone access when prompted
6. **Begin Conversation**: The AI will start speaking and guide you
7. **Code & Talk**: Solve the problem while discussing with AI
8. **End Interview**: Click "End Interview" when finished

## Expected Behavior

1. **Connection Phase**: "Connecting..." status while establishing call
2. **Active Phase**: "Voice Interview Active" with conversation display
3. **AI Interaction**: Agent begins by introducing the problem
4. **Voice Guidance**: AI provides hints, asks questions, gives feedback
5. **Turn Management**: Clear indicators of who should be speaking
6. **End Phase**: Clean termination with call summary

## Troubleshooting

### **No Voice Agents Found**
- Click "Sync Voice Agents" to reload from Retell AI
- Ensure agents have voice_id configured in Retell AI
- Check console for sync errors

### **Connection Issues**
- Verify microphone permissions granted
- Check network connectivity
- Look for Retell API key configuration
- Review browser console for errors

### **Agent Not Speaking**
- Confirm agent has voice_id in Retell AI
- Check audio output volume
- Verify call registration succeeded
- Look for transcript updates indicating connection

This integration provides a fully functional voice-enabled coding interview experience, combining the power of Retell AI's voice technology with FoloUp's coding environment. 
