# Conversation Log Features 🎙️

## Overview

The conversation log system provides users with detailed playback and analysis of their practice interviews, similar to the Retell platform interface. Users can view transcripts, listen to audio recordings, and analyze their performance.

## Key Features

### 🎵 **Audio Playback**
- **Professional Audio Player**: Custom-built audio player with play/pause, seek, and volume controls
- **Progress Tracking**: Real-time progress bar showing current position and total duration
- **Volume Control**: Adjustable volume with visual feedback
- **Download Support**: Download audio recordings for offline review

### 📝 **Transcript Display**
- **Real-time Timestamps**: Each message shows the exact time it was spoken
- **Speaker Identification**: Clear distinction between agent and user messages
- **Formatted Layout**: Clean, readable transcript with proper spacing and styling
- **Message Context**: Background colors differentiate between speakers

### 📊 **Call Metadata**
- **Call Information**: Display call ID, agent details, and version information
- **Duration Tracking**: Show start/end times and total call duration
- **Cost Information**: Display call cost based on duration
- **Status Indicators**: Show audio availability and processing status

### 🎯 **User Interface**
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Navigation**: Easy access from dashboard with back button navigation
- **Log Selection**: Sidebar with list of recent interviews for quick selection
- **Loading States**: Proper loading indicators and error handling

## Technical Implementation

### Database Schema

```sql
CREATE TABLE conversation_logs (
  id UUID PRIMARY KEY,
  call_id TEXT NOT NULL UNIQUE,
  agent_id TEXT,
  agent_name TEXT,
  candidate_name TEXT,
  duration_seconds INTEGER,
  transcript JSONB,
  post_call_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints

#### `/api/conversation-logs`
- **GET**: Fetch conversation logs for the authenticated user
- **POST**: Create new conversation log entries

#### `/api/retell-audio`
- **GET**: Retrieve audio recording URL from Retell API
- **Parameters**: `call_id` - The unique call identifier
- **Returns**: Audio URL, status, and metadata

#### `/api/retell-webhook`
- **POST**: Handle Retell webhook events
- **Events**: `call_started`, `call_ended`, `transcript_updated`
- **Actions**: Store conversation data and update session status

### Component Structure

```
src/components/practice/
├── ConversationLogViewer.tsx    # Main conversation log interface
└── (future components)

src/app/practice/
├── logs/page.tsx               # Dedicated logs page
└── test-logs/page.tsx          # Test logs page
```

## Usage Flow

### 1. **Accessing Conversation Logs**
- Navigate to Dashboard
- Click "View Logs" button
- Or use direct URL: `/practice/logs`

### 2. **Viewing a Conversation**
- Select an interview from the sidebar
- View call metadata and audio player
- Scroll through the transcript
- Use audio controls to listen to specific parts

### 3. **Audio Playback**
- Click play button to start audio
- Use progress bar to seek to specific times
- Adjust volume as needed
- Download audio for offline review

### 4. **Transcript Navigation**
- Read through the conversation chronologically
- Use timestamps to correlate with audio
- Identify speaking patterns and response times

## Audio Integration

### Retell API Integration
```typescript
// Fetch audio from Retell
const callData = await retellClient.call.retrieve(callId);
const audioUrl = callData.recording_url;
```

### Audio Status Handling
- **Available**: Audio recording is ready for playback
- **Processing**: Audio is still being processed by Retell
- **Unavailable**: Audio recording not available
- **Error**: Failed to fetch audio from Retell

### Fallback Behavior
- Graceful degradation when audio is unavailable
- Clear status messages for users
- Mock mode for development and testing

## Styling and UI

### Audio Player Design
- **Play Button**: Black circular button with white play/pause icon
- **Progress Bar**: Blue progress indicator with seek functionality
- **Volume Control**: Horizontal slider with speaker icon
- **Controls**: Download and options buttons

### Transcript Styling
- **Agent Messages**: Gray background with agent name
- **User Messages**: Blue background with user name
- **Timestamps**: Right-aligned time indicators
- **Responsive Layout**: Adapts to different screen sizes

### Color Scheme
- **Primary**: Blue (#3b82f6) for interactive elements
- **Secondary**: Gray tones for text and backgrounds
- **Success**: Green for positive indicators
- **Warning**: Yellow for status messages

## Testing and Development

### Test Log Creation
- Use "Create Test Log" button on dashboard
- Generates sample conversation data
- Tests audio player functionality
- Validates transcript display

### Mock Mode
- Works without valid Retell API key
- Provides realistic sample data
- Allows development and testing
- Clear indication of mock status

### Error Handling
- Network error recovery
- API failure fallbacks
- User-friendly error messages
- Graceful degradation

## Future Enhancements

### Planned Features
- **Search Functionality**: Search through transcripts
- **Bookmarking**: Save important conversation moments
- **Sharing**: Share conversation logs with others
- **Analytics**: Detailed performance metrics
- **Export**: Export transcripts and audio
- **Annotations**: Add notes to specific parts of conversations

### Technical Improvements
- **Real-time Updates**: Live transcript updates during calls
- **Offline Support**: Cache audio and transcripts locally
- **Performance Optimization**: Lazy loading for large transcripts
- **Accessibility**: Screen reader support and keyboard navigation

## Configuration

### Environment Variables
```bash
# Required for audio functionality
RETELL_API_KEY=your_retell_api_key

# Optional for enhanced features
NEXT_PUBLIC_AUDIO_ENABLED=true
NEXT_PUBLIC_DOWNLOAD_ENABLED=true
```

### Database Setup
```bash
# Run migrations
npx supabase db push

# Verify tables
npx supabase db reset
```

## Troubleshooting

### Common Issues

**Audio Not Playing**
- Check Retell API key configuration
- Verify call status in Retell dashboard
- Check browser audio permissions

**Transcript Not Loading**
- Verify conversation log exists in database
- Check webhook configuration
- Review API response logs

**Performance Issues**
- Check transcript size and loading
- Verify audio file size and format
- Monitor network requests

### Debug Mode
```typescript
// Enable debug logging
console.log('Audio URL:', audioUrl);
console.log('Transcript:', transcript);
console.log('Call Status:', callStatus);
```

## Security Considerations

### Data Privacy
- User authentication required for all endpoints
- Row-level security on database tables
- Audio URL access validation
- Call ownership verification

### API Security
- Webhook signature verification
- Rate limiting on API endpoints
- Input validation and sanitization
- Error message sanitization

---

**Built with ❤️ for the future of voice AI interviews** 
