# Retell Dynamic Variables Setup for Code Analysis 🎯

## 🎪 The Better Solution

Instead of sending messages back to Retell, we use **dynamic variables** to make the submitted code visible to the agent in real-time. This follows [Retell's recommended approach](https://docs.retellai.com/build/dynamic-variables) for providing context to agents.

## 🔧 How Dynamic Variables Work

### **Concept**
- Variables use double curly braces: `{{variable_name}}`
- Updated in real-time during the call
- Agent can reference them naturally in conversation
- All values must be strings

### **Our Implementation**
When user clicks analysis buttons, we update these variables:
- `{{code_submission}}` - The actual code from Monaco editor
- `{{analysis_type}}` - Type of analysis (review/hint/debug)
- `{{problem_title}}` - Current coding problem title
- `{{language}}` - Programming language used
- `{{last_analysis_result}}` - AI-generated feedback

## 🎭 Agent Configuration

### **1. Update Agent Prompt**

In your Retell agent's system prompt, add:

```
You are an experienced software engineer conducting a technical interview.

CONTEXT AVAILABLE:
- Current coding problem: {{problem_title}}
- Programming language: {{language}}
- User's submitted code: {{code_submission}}
- Last analysis result: {{last_analysis_result}}
- Analysis type requested: {{analysis_type}}

INSTRUCTIONS:
When the user submits code for analysis, you can see their actual code in {{code_submission}}.

Provide feedback based on:
- Code quality and efficiency
- Algorithm complexity (time/space)
- Best practices and readability
- Bug identification and fixes
- Hints and guidance without giving away the solution

Example responses:
- For {{analysis_type}} = "review": "Looking at your {{language}} code, I can see you're using [specific approach]. Let me provide some feedback..."
- For {{analysis_type}} = "hint": "I notice you're working on {{problem_title}}. Here's a hint without spoiling the solution..."
- For {{analysis_type}} = "debug": "I can see an issue in your code at line X where..."

Always reference the actual code when possible and provide constructive, encouraging feedback.
```

### **2. Enhanced Conversation Flow**

Update your agent's conversation flow to handle code submissions:

```
# Greeting State
"Hello! I'm here to help you with the {{problem_title}} coding challenge. Feel free to write your solution and ask for help anytime."

# Code Analysis State  
{if code_submission}
"I can see you've written some {{language}} code. Let me take a look..."

{if analysis_type == "review"}
"Looking at your solution for {{problem_title}}, here's my analysis: {{last_analysis_result}}"

{elif analysis_type == "hint"}  
"I can see you're working on this problem. Here's a helpful hint: {{last_analysis_result}}"

{elif analysis_type == "debug"}
"I noticed some issues in your code. Let me help you debug: {{last_analysis_result}}"

"Would you like me to explain any of these points in more detail?"

{else}
"I don't see any code yet. Please write your solution and click one of the analysis buttons when you're ready for feedback."
{endif}
```

### **3. Function Call Integration** (Optional)

If you want the agent to trigger analysis proactively, add a function:

```json
{
  "name": "analyze_user_code",
  "description": "Analyze the user's submitted code",
  "parameters": {
    "analysis_type": {
      "type": "string",
      "enum": ["review", "hint", "debug"],
      "description": "Type of analysis to perform"
    }
  }
}
```

## 🧪 Testing Your Setup

### **1. Test Variable Updates**

```bash
curl -X POST "http://localhost:3000/api/update-call-variables" \
  -H "Content-Type: application/json" \
  -d '{
    "callId": "test-call-123",
    "variables": {
      "code_submission": "function twoSum(nums, target) { return [0, 1]; }",
      "analysis_type": "review",
      "problem_title": "Two Sum",
      "language": "javascript"
    }
  }'
```

### **2. Verify Agent Response**

Start a voice call and:
1. Write code in the Monaco editor
2. Click "📝 Review Code"
3. Verify agent says: *"Looking at your JavaScript code for Two Sum..."*

## 🎯 Expected User Experience

### **Before Code Submission**
**Agent**: "Hello! I'm here to help you with the Two Sum coding challenge. Feel free to write your solution and ask for help anytime."

### **After Code Submission**
**User**: Writes Two Sum solution → Clicks "📝 Review Code"

**Agent**: "I can see you've written some JavaScript code for the Two Sum problem. Looking at your solution, you're using a hash map approach which gives you O(n) time complexity - that's excellent! I notice you could improve variable naming for better readability. Would you like me to explain any specific part of your implementation?"

### **Follow-up Conversation**
**User**: "Can you help me optimize this?"

**Agent**: "Absolutely! Looking at your current code in {{code_submission}}, the algorithm is already optimal at O(n). However, we could improve readability by using more descriptive variable names..."

## 🔄 Integration Flow

```
User writes code in Monaco Editor
           ↓
Click "Review Code" button  
           ↓
POST /api/update-call-variables
{
  callId: "96a7c811",
  variables: {
    code_submission: "function solution(nums, target) { ... }",
    analysis_type: "review",
    language: "javascript"
  }
}
           ↓
Retell agent now has access to:
- {{code_submission}} = actual user code
- {{analysis_type}} = "review"
- {{language}} = "javascript"
           ↓
Agent responds naturally:
"Looking at your JavaScript code, I can see you're using a hash map..."
```

## 📋 Implementation Checklist

### **Backend APIs** ✅
- [x] `/api/update-call-variables` - Updates dynamic variables
- [x] `/api/analyze-code` - Generates AI analysis  
- [x] Real-time code capture from Monaco editor

### **Frontend Integration** ✅
- [x] Code submission buttons update variables
- [x] Real-time code tracking
- [x] Error handling and fallbacks

### **Retell Agent Configuration** 📝
- [ ] Update agent prompt with variable references
- [ ] Test variable access in agent responses
- [ ] Configure conversation flow for code analysis

### **Production Setup** 🚀
- [ ] Add Retell API key to environment
- [ ] Replace TODO in `/api/update-call-variables/route.ts`
- [ ] Deploy and test end-to-end

## 🎉 Benefits of This Approach

### **For Users**
- Agent can see and reference actual code
- Natural conversation about specific implementation
- Real-time code sharing during voice calls

### **For Agents**  
- Direct access to user's code via `{{code_submission}}`
- Context about problem and analysis type
- Can provide specific, targeted feedback

### **For Platform**
- Cleaner integration with Retell's architecture
- Follows Retell's recommended patterns
- More reliable than message-based approaches

## 🔮 Example Agent Responses

With your Two Sum solution:

```javascript
function solution(nums, target) {
  const map = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.hasOwnProperty(complement)) {
      return [map[complement], i];
    }
    map[nums[i]] = i;
  }
  return [];
}
```

**Agent would say**:
> "I can see your JavaScript solution for the Two Sum problem! You're using a hash map which is perfect - this gives you O(n) time complexity instead of the O(n²) brute force approach. I like how you're storing the complement and checking for it. One small suggestion: consider renaming `map` to something more descriptive like `indexMap` or `seenNumbers` to make the code even more readable. Your edge case handling is solid too! Would you like me to walk through the algorithm step by step?"

**The agent literally sees your code and can discuss it specifically!** 🎤✨ 
