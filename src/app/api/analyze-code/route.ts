import { NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    console.log("Code analysis request received");
    
    const body = await req.json();
    console.log("Request body:", body);

    // Extract parameters from Retell function call
    const { 
      code, 
      language = "javascript", 
      problem_title = "coding problem",
      problem_description = "",
      analysis_type = "review" // "review", "hint", "debug"
    } = body;

    if (!code || code.trim().length === 0) {
      return NextResponse.json({
        feedback: "I notice you haven't written any code yet. Would you like me to help you get started with this problem?",
        has_issues: false,
        suggestions: ["Start by understanding the problem requirements", "Think about the algorithm approach", "Consider edge cases"]
      });
    }

    // Validate environment
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return NextResponse.json({
        feedback: "I'm having trouble analyzing your code right now. Let me know if you'd like to discuss your approach instead!",
        has_issues: false,
        suggestions: []
      });
    }

    // Generate analysis based on type
    let systemPrompt = "";
    let userPrompt = "";

    switch (analysis_type) {
      case "hint":
        systemPrompt = `You are a helpful coding interview assistant. The user is working on: ${problem_title}

Problem: ${problem_description}

Provide a gentle hint for the next step without giving away the solution. Keep it conversational and encouraging, as this will be read aloud. Limit to 2-3 sentences.`;
        
        userPrompt = `Here's my current code:
\`\`\`${language}
${code}
\`\`\`

Can you give me a hint for what to do next?`;
        break;

      case "debug":
        systemPrompt = `You are a helpful coding interview assistant helping debug code for: ${problem_title}

Problem: ${problem_description}

Look for syntax errors, logical issues, or bugs. Explain them clearly and conversationally, as this will be read aloud. Keep explanations concise but helpful.`;
        
        userPrompt = `Please help me debug this code:
\`\`\`${language}
${code}
\`\`\``;
        break;

      default: // "review"
        systemPrompt = `You are a helpful coding interview assistant reviewing code for: ${problem_title}

Problem: ${problem_description}

Provide constructive feedback on:
- Correctness and logic
- Code quality and style
- Time/space complexity
- Edge cases

Keep feedback conversational and encouraging, as this will be read aloud. Focus on 1-2 main points.`;
        
        userPrompt = `Please review my solution:
\`\`\`${language}
${code}
\`\`\``;
    }

    console.log("Generating AI feedback...");
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const feedback = completion.choices[0]?.message?.content || "I'm having trouble analyzing your code right now. Could you tell me about your approach?";

    // Analyze the code for common issues
    const hasIssues = checkForCommonIssues(code, language);
    const suggestions = generateSuggestions(code, language, analysis_type);

    console.log("Generated feedback:", feedback);

    return NextResponse.json({
      feedback: feedback.trim(),
      has_issues: hasIssues,
      suggestions: suggestions,
      analysis_type: analysis_type,
      code_length: code.length
    });

  } catch (error) {
    console.error("Error in code analysis:", error);
    
    // Return a friendly fallback response
    return NextResponse.json({
      feedback: "I'm having some trouble analyzing your code right now. Would you like to walk me through your approach instead? I'm here to help!",
      has_issues: false,
      suggestions: ["Explain your approach", "Discuss the algorithm", "Talk through test cases"],
      error: true
    });
  }
}

// Helper function to check for common code issues
function checkForCommonIssues(code: string, language: string): boolean {
  const lowerCode = code.toLowerCase();
  
  // Common issues to look for
  const issues = [
    // Syntax issues
    code.includes('}{'), // Missing separator
    code.includes(';;'), // Double semicolons
    // Logic issues
    lowerCode.includes('infinite loop'),
    lowerCode.includes('todo'),
    lowerCode.includes('fixme'),
    // Missing return statements (basic check)
    language === 'javascript' && code.includes('function') && !code.includes('return'),
  ];

  return issues.some(issue => issue);
}

// Helper function to generate context-aware suggestions
function generateSuggestions(code: string, language: string, analysisType: string): string[] {
  const suggestions = [];
  
  if (analysisType === "hint") {
    suggestions.push("Think about the algorithm step by step");
    suggestions.push("Consider what data structures might help");
    suggestions.push("Draw out an example on paper");
  } else if (analysisType === "debug") {
    suggestions.push("Check your loop conditions");
    suggestions.push("Verify variable names are correct");
    suggestions.push("Test with simple inputs first");
  } else { // review
    suggestions.push("Consider edge cases");
    suggestions.push("Think about time complexity");
    suggestions.push("Review variable naming");
  }

  // Add language-specific suggestions
  if (language === "javascript") {
    if (!code.includes("const") && !code.includes("let")) {
      suggestions.push("Consider using const or let instead of var");
    }
  }

  return suggestions.slice(0, 3); // Limit to 3 suggestions
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    service: "Code Analysis API",
    status: "healthy",
    timestamp: new Date().toISOString(),
    features: ["code_review", "hints", "debugging"]
  });
} 
