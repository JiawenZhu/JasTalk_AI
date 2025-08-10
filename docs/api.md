# Roundly.AI API Documentation

## Overview

Roundly.AI provides a comprehensive REST API for managing AI-powered voice interviews, practice sessions, and conversation logs. All API endpoints require authentication via Supabase Auth.

## Base URL

```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Authentication

All API requests require a valid Supabase authentication token. Include the token in the Authorization header:

```
Authorization: Bearer <supabase_token>
```

## API Endpoints

### Practice Sessions

#### GET `/api/practice-sessions`
Retrieve practice sessions for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of sessions to return (default: 10)
- `status` (optional): Filter by session status (`active`, `completed`, `paused`)

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "Software Engineer Interview",
      "type": "technical",
      "status": "completed",
      "score": 85,
      "duration_seconds": 1800,
      "question_count": 10,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

#### POST `/api/practice-sessions`
Create a new practice session.

**Request Body:**
```json
{
  "title": "Software Engineer Interview",
  "type": "technical",
  "questions": [
    {
      "id": "q1",
      "text": "Tell me about a challenging technical problem you solved",
      "category": "problem_solving"
    }
  ],
  "agent_id": "agent_123",
  "agent_name": "Bob"
}
```

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "title": "Software Engineer Interview",
    "status": "active",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### PUT `/api/practice-sessions`
Update a practice session (e.g., mark as completed).

**Request Body:**
```json
{
  "sessionId": "uuid",
  "status": "completed",
  "end_time": "2024-01-15T11:00:00Z"
}
```

### Conversation Logs

#### GET `/api/conversation-logs`
Retrieve conversation logs for the authenticated user.

**Query Parameters:**
- `call_id` (optional): Filter by specific call ID
- `limit` (optional): Number of logs to return (default: 10)

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "call_id": "call_123",
      "agent_id": "agent_123",
      "agent_name": "Bob",
      "candidate_name": "user@example.com",
      "duration_seconds": 1800,
      "transcript": [
        {
          "speaker": "agent",
          "content": "Hello, let's start the interview.",
          "timestamp": "0:01"
        }
      ],
      "post_call_analysis": {
        "communication_score": 85,
        "technical_score": 90,
        "overall_score": 87
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### POST `/api/conversation-logs`
Create a new conversation log entry.

**Request Body:**
```json
{
  "call_id": "call_123",
  "agent_id": "agent_123",
  "agent_name": "Bob",
  "candidate_name": "user@example.com",
  "transcript": [
    {
      "speaker": "agent",
      "content": "Hello, let's start the interview.",
      "timestamp": "0:01"
    }
  ],
  "post_call_analysis": {
    "communication_score": 85,
    "technical_score": 90
  },
  "duration_seconds": 1800
}
```

### Audio Management

#### GET `/api/retell-audio`
Retrieve audio recording URL for a specific call.

**Query Parameters:**
- `call_id` (required): The call ID to retrieve audio for

**Response:**
```json
{
  "audio_url": "https://retell-audio.s3.amazonaws.com/call_123.mp3",
  "call_id": "call_123",
  "status": "completed",
  "duration": 1800,
  "public_log_url": "https://retell.ai/logs/call_123"
}
```

**Status Codes:**
- `completed`: Audio is available for playback
- `processing`: Audio is still being processed
- `not_ready`: Call is still in progress
- `not_found`: Call not found in Retell system
- `unauthorized`: Invalid API key
- `error`: Failed to fetch audio

### Retell Integration

#### POST `/api/register-practice-call`
Register a new practice call with Retell.

**Request Body:**
```json
{
  "agent_id": "agent_123",
  "questions": [
    {
      "text": "Tell me about a challenging technical problem you solved"
    }
  ],
  "candidate_name": "Peter Lee",
  "interview_type": "technical"
}
```

**Response:**
```json
{
  "call_id": "call_123",
  "access_token": "token_456",
  "agent_id": "agent_123"
}
```

#### POST `/api/retell-webhook`
Handle Retell webhook events.

**Request Body:**
```json
{
  "event_type": "call_ended",
  "call_id": "call_123",
  "agent_id": "agent_123",
  "agent_name": "Bob",
  "transcript": [
    {
      "speaker": "agent",
      "content": "Thank you for the interview.",
      "timestamp": "29:45"
    }
  ],
  "post_call_analysis": {
    "communication_score": 85,
    "technical_score": 90
  },
  "duration_seconds": 1800
}
```

### Question Generation

#### POST `/api/generate-questions`
Generate interview questions from job description.

**Request Body:**
```json
{
  "jobDescription": "We are looking for a software engineer...",
  "questionCount": 10,
  "questionTypes": ["technical", "behavioral"],
  "difficulty": "intermediate"
}
```

**Response:**
```json
{
  "questions": [
    {
      "id": "q1",
      "text": "Tell me about a challenging technical problem you solved",
      "category": "technical",
      "difficulty": "intermediate"
    }
  ],
  "metadata": {
    "totalQuestions": 10,
    "categories": ["technical", "behavioral"],
    "estimatedDuration": "20-30 minutes"
  }
}
```

### Practice Results

#### GET `/api/practice-results`
Get detailed results for a practice session.

**Query Parameters:**
- `sessionId` (optional): Session ID
- `callId` (optional): Call ID

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "title": "Software Engineer Interview",
    "duration_seconds": 1800,
    "questions_answered": 8
  },
  "results": {
    "overall_score": 87,
    "communication_score": 85,
    "technical_score": 90,
    "problem_solving_score": 88,
    "confidence_score": 82,
    "relevance_score": 89,
    "strengths": [
      "Strong technical knowledge",
      "Clear communication"
    ],
    "areas_for_improvement": [
      "Could provide more specific examples",
      "Consider elaborating on technical decisions"
    ]
  }
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional error details",
  "status": "error_type"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Server error

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Authenticated users**: 100 requests per minute
- **Unauthenticated requests**: 10 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248600
```

## Webhooks

### Retell Webhook Events

The platform handles the following Retell webhook events:

#### `call_started`
Triggered when a call begins.

#### `call_ended`
Triggered when a call ends. Includes:
- Full transcript
- Post-call analysis
- Duration and cost information

#### `transcript_updated`
Triggered when new transcript data is available.

### Webhook Security

Webhook requests are verified using Retell's signature verification:

```typescript
const isValid = Retell.verify(
  JSON.stringify(requestBody),
  apiKey,
  signature
);
```

## SDK Integration

### JavaScript/TypeScript

```typescript
import { RoundlyAI } from '@roundly/sdk';

const client = new RoundlyAI({
  apiKey: 'your_api_key',
  baseUrl: 'https://your-domain.com/api'
});

// Create a practice session
const session = await client.practiceSessions.create({
  title: 'Technical Interview',
  type: 'technical',
  questions: [...]
});

// Get conversation logs
const logs = await client.conversationLogs.list({
  limit: 10
});
```

## Examples

### Complete Interview Flow

```javascript
// 1. Generate questions
const questions = await fetch('/api/generate-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobDescription: 'Software Engineer position...',
    questionCount: 10
  })
});

// 2. Create practice session
const session = await fetch('/api/practice-sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Technical Interview',
    questions: questions.data.questions
  })
});

// 3. Register call with Retell
const call = await fetch('/api/register-practice-call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agent_id: 'agent_123',
    questions: questions.data.questions
  })
});

// 4. After interview, get results
const results = await fetch(`/api/practice-results?sessionId=${session.id}`);

// 5. Get conversation log
const logs = await fetch(`/api/conversation-logs?call_id=${call.call_id}`);

// 6. Get audio recording
const audio = await fetch(`/api/retell-audio?call_id=${call.call_id}`);
```

## Support

For API support and questions:
- **Documentation**: [Platform Docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/JiawenZhu/Roundly.AI/issues)
- **Email**: support@roundly.ai

---

**API Version**: v1.0  
**Last Updated**: January 2024 
