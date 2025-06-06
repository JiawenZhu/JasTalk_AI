# Retell Flow Integration for Voice Code Review

## Overview

This integration enables AI-powered voice code review during coding interviews. Users can write code in the coding editor and receive real-time voice feedback from AI agents through Retell AI's voice platform.

## Architecture

### 1. **Code Analysis API** (`/api/analyze-code`)
- Receives code submissions with context
- Uses OpenAI GPT-4o-mini for intelligent analysis
- Returns structured feedback for voice delivery
- Supports multiple analysis types: review, hint, debug

### 2. **Retell Function Endpoint** (`/api/retell-code-review`)
- Retell-compatible function for voice agent integration
- Calls internal analysis API and formats response
- Handles error scenarios gracefully
- Returns voice-optimized feedback

### 3. **Frontend Integration** (`coding-demo/page.tsx`)
- Automatic code review on submission during voice interviews
- Manual code review action buttons (Hint, Review, Debug)
- Real-time conversation display with AI feedback
- Integration with existing voice call system

## Features

### ✅ **AI-Powered Code Analysis**
- **Correctness Review**: Logic and algorithm analysis
- **Performance Optimization**: Time/space complexity suggestions
- **Code Quality**: Style and best practices feedback
- **Bug Detection**: Syntax and logical error identification

### ✅ **Multiple Analysis Types**
```typescript
// Hint: Gentle guidance without giving away solution
analysis_type: "hint"

// Review: Comprehensive feedback on code quality
analysis_type: "review" 

// Debug: Specific help with errors and issues
analysis_type: "debug"
```

### ✅ **Voice-Optimized Responses**
- Conversational tone suitable for speech
- Limited to 2-3 sentences for clarity
- Encouraging and constructive feedback
- Context-aware suggestions

## Implementation Details

### **API Request Format**
```json
{
  "code": "function twoSum(nums, target) {...}",
  "language": "javascript",
  "problem_title": "Two Sum",
  "problem_description": "Given an array...",
  "analysis_type": "review"
}
```

### **API Response Format**
```json
{
  "feedback": "Your solution works but has O(n²) complexity...",
  "has_issues": false,
  "suggestions": ["Consider using hash map", "Think about edge cases"],
  "analysis_type": "review",
  "code_length": 206
}
```

### **Retell Function Response**
```json
{
  "response": "Voice-optimized feedback text",
  "has_issues": false,
  "suggestions": ["Action item 1", "Action item 2"],
  "analysis_complete": true
}
```

## Retell Flow Configuration

### **1. Add Function Node in Retell Flow**

In your Retell agent flow (shown in the screenshot), add a Function Node after code submission:

```json
{
  "type": "function",
  "name": "analyze_code",
  "description": "Analyze user's code and provide feedback",
  "url": "https://yourdomain.com/api/retell-code-review",
  "parameters": {
    "code": {
      "type": "string",
      "description": "The code to analyze"
    },
    "analysis_type": {
      "type": "string", 
      "description": "Type of analysis: review, hint, or debug",
      "enum": ["review", "hint", "debug"]
    },
    "language": {
      "type": "string",
      "description": "Programming language",
      "default": "javascript"
    }
  }
}
```

### **2. Response Node Configuration**

Add a Response Node that uses the function output:

```
"I've analyzed your code. {function_output.response}"

{if function_output.has_issues}
"I noticed a few areas we could improve: {function_output.suggestions}"
{endif}

"Would you like me to explain any of these points in more detail?"
```

### **3. Conditional Logic**

Based on `analysis_type`:
- **hint**: "Here's a gentle nudge in the right direction..."
- **review**: "Let me give you some comprehensive feedback..."
- **debug**: "I can help you fix those issues..."

## User Experience Flow

### **During Voice Interview:**

1. **User writes code** in the coding environment
2. **User submits solution** → Automatic AI review
3. **User can request help**:
   - Click "💡 Ask for Hint" → AI provides gentle guidance
   - Click "📝 Review Code" → AI gives comprehensive feedback  
   - Click "🐛 Debug Help" → AI helps fix specific issues
4. **AI responds via voice** with personalized feedback
5. **Conversation continues** based on user questions

### **Example Interaction:**

**User**: *Submits Two Sum solution with nested loops*

**AI (via voice)**: "Thanks for sharing your solution! The logic is sound, but there's a more efficient approach using a hash map that could improve your time complexity from O(n²) to O(n). Would you like me to explain how that works?"

**User**: *Clicks "💡 Ask for Hint"*

**AI (via voice)**: "Think about storing the numbers you've already seen in a data structure that allows for fast lookups. What if you could check if the complement of your current number already exists?"

## Error Handling

### **Graceful Fallbacks**
- Network issues → "I'm having technical difficulties..."
- Missing code → "I notice you haven't written any code yet..."
- API errors → "Let's discuss your approach instead..."

### **Development Mode**
- Mock responses when OpenAI API unavailable
- Detailed console logging for debugging
- Fallback feedback for testing

## Setup Instructions

### **1. Environment Variables**
```bash
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### **2. Retell Agent Configuration**
1. Add function node to your agent flow
2. Configure webhook URL: `https://yourdomain.com/api/retell-code-review`
3. Set up response nodes to read function outputs
4. Test with different code examples

### **3. Testing**
```bash
# Test code analysis API
curl -X POST localhost:3000/api/analyze-code \
  -H "Content-Type: application/json" \
  -d '{"code": "function test(){}", "analysis_type": "review"}'

# Test Retell function endpoint  
curl -X POST localhost:3000/api/retell-code-review \
  -H "Content-Type: application/json" \
  -d '{"code": "function test(){}", "analysis_type": "hint"}'
```

## Benefits

### **For Interviewers**
- Consistent, objective code review
- Reduces manual feedback workload
- Scales to multiple concurrent interviews
- Provides structured evaluation criteria

### **For Candidates**
- Immediate, constructive feedback
- Learning-focused rather than just evaluative
- Natural voice interaction while coding
- Multiple types of assistance available

### **For Platform**
- Enhanced interview experience
- Differentiated product offering
- Scalable AI-powered assessments
- Rich conversation data for analytics

## Future Enhancements

1. **Multi-Language Support**: Extend beyond JavaScript to Python, Java, etc.
2. **Problem-Specific Analysis**: Customize feedback based on specific coding problems
3. **Code Execution Integration**: Combine with test results for comprehensive review
4. **Learning Path Suggestions**: Recommend specific concepts to study
5. **Voice Commands**: "Review my current code", "Give me a hint", etc.

This integration transforms static coding interviews into dynamic, interactive learning experiences powered by AI voice technology. 
