# Gemini Live Integration for Jastalk_AI

## Overview

This integration adds Google's Gemini Live API support to Jastalk_AI, creating a tiered interview system where:

- **Free Users**: Access Gemini Live agents (text-based, real-time AI interviews)
- **Pro Users**: Access both Gemini Live agents and Retell voice agents (full voice capabilities)

## Architecture

### Agent Types

1. **Gemini Agents** (`agent_type: 'gemini'`)
   - Text-based conversations
   - Real-time AI responses
   - Powered by Google's Gemini models
   - Available to all users (free tier)

2. **Retell Agents** (`agent_type: 'retell'`)
   - Full voice-enabled interviews
   - Advanced personality customization
   - Pro subscription required

### Database Schema

The `interviewers` table has been extended with:

```sql
ALTER TABLE public.interviewers 
ADD COLUMN agent_type text DEFAULT 'gemini' CHECK (agent_type IN ('retell', 'gemini')),
ADD COLUMN subscription_required text DEFAULT 'free' CHECK (subscription_required IN ('free', 'pro')),
ADD COLUMN is_active boolean DEFAULT true,
ADD COLUMN gemini_config jsonb DEFAULT '{"model": "gemini-2.0-flash-exp", ...}'::jsonb;
```

## API Endpoints

### 1. Get Available Agents
```
GET /api/get-gemini-agents
```
Returns available interviewers filtered by user's subscription tier.

### 2. Gemini Live Chat
```
POST /api/gemini-live
```
Handles real-time interview conversations with Gemini agents.

**Request Body:**
```json
{
  "interviewer_id": "string",
  "user_message": "string",
  "session_id": "string",
  "interview_context": {
    "job_description": "string",
    "interview_type": "string",
    "difficulty": "string",
    "focus_areas": ["string"]
  }
}
```

**Response:**
```json
{
  "response": "string",
  "session_id": "string",
  "timestamp": "string",
  "metadata": {
    "model_used": "string",
    "response_time_ms": "number"
  }
}
```

## Components

### 1. GeminiLiveInterview
Main interview interface component that handles:
- Real-time chat with Gemini agents
- Message history
- Session management
- Error handling

### 2. SelectInterviewPage
Agent selection page that:
- Shows available agents based on subscription
- Filters by agent type and capabilities
- Handles upgrade prompts for Pro features

### 3. GeminiLiveInterviewPage
Full interview page that:
- Manages interview sessions
- Shows results and transcripts
- Provides download and sharing options

## Features

### Free Tier (Gemini Agents)
- ✅ Text-based AI interviews
- ✅ Real-time responses
- ✅ Multiple interviewer personalities
- ✅ Interview context awareness
- ✅ Session logging
- ✅ Transcript download

### Pro Tier (Retell + Gemini)
- ✅ Everything in Free tier
- ✅ Voice-enabled interviews
- ✅ Advanced personality customization
- ✅ Full voice synthesis
- ✅ Premium interviewer personas

## Configuration

### Environment Variables
```bash
# Required for Gemini integration
GEMINI_API_KEY=your_gemini_api_key_here

# Existing variables
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Gemini Agent Configuration
Each Gemini agent can be customized via the `gemini_config` JSON field:

```json
{
  "model": "gemini-2.0-flash-exp",
  "voice": "default",
  "personality": "Professional and encouraging",
  "interview_style": "Structured but conversational"
}
```

## Usage Flow

1. **User visits** `/practice/new`
2. **Selects an agent** (filtered by subscription)
3. **Starts interview** (redirected to appropriate type)
4. **Conducts interview** (text or voice)
5. **Views results** (transcript, analytics)
6. **Downloads/ shares** results

## Security & Access Control

- **Authentication required** for all interview endpoints
- **Subscription validation** before agent access
- **Rate limiting** on Gemini API calls
- **Input sanitization** for user messages
- **Safe content filtering** via Gemini safety settings

## Error Handling

- **API failures**: Graceful fallback to mock responses
- **Subscription limits**: Clear upgrade prompts
- **Network issues**: Retry logic and user feedback
- **Invalid inputs**: Validation and helpful error messages

## Performance

- **Real-time responses**: Optimized for <2s response times
- **Efficient caching**: Session data and agent configs
- **Database indexing**: Fast queries on agent type and subscription
- **Lazy loading**: Components load only when needed

## Monitoring & Analytics

- **Session tracking**: Duration, message count, agent used
- **Performance metrics**: Response times, API call success rates
- **User engagement**: Interview completion rates, feature usage
- **Error tracking**: Failed API calls, subscription issues

## Future Enhancements

### Planned Features
- [ ] Multi-modal support (image + text)
- [ ] Advanced personality training
- [ ] Interview difficulty progression
- [ ] Real-time feedback scoring
- [ ] Integration with practice sessions

### Technical Improvements
- [ ] WebSocket support for real-time updates
- [ ] Advanced caching strategies
- [ ] A/B testing for agent personalities
- [ ] Machine learning for response optimization

## Troubleshooting

### Common Issues

1. **Gemini API errors**
   - Check `GEMINI_API_KEY` environment variable
   - Verify API quota and rate limits
   - Check model availability

2. **Subscription validation failures**
   - Ensure user profile has correct `subscription_tier`
   - Check database migration completion
   - Verify agent configuration

3. **Performance issues**
   - Monitor Gemini API response times
   - Check database query performance
   - Review client-side rendering

### Debug Mode
Enable detailed logging by setting:
```bash
NODE_ENV=development
DEBUG=gemini:*
```

## Deployment

### Prerequisites
1. Run database migration: `supabase/migrations/20250127000000_add_gemini_support.sql`
2. Set `GEMINI_API_KEY` environment variable
3. Update Supabase RLS policies if needed

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] API endpoints tested
- [ ] Rate limiting configured
- [ ] Monitoring alerts set up
- [ ] Error tracking enabled

## Support

For technical support or feature requests:
- Check the troubleshooting section above
- Review API documentation
- Contact the development team
- Submit issues via GitHub

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Maintainer**: Jastalk_AI Development Team
