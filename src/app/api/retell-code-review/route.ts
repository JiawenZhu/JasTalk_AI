import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("Retell code review function called");
    
    const body = await req.json();
    console.log("Retell function request:", body);

    // Retell function calls include the parameters in the request
    const { 
      code, 
      analysis_type = "review",
      language = "javascript"
    } = body;

    console.log("Code analysis request:", { 
      code: code?.substring(0, 100) + "...", 
      analysis_type, 
      language 
    });

    // Call our internal code analysis API
    const analysisResponse = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/api/analyze-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        language,
        analysis_type,
        problem_title: "Two Sum", // Could be dynamic based on context
        problem_description: "Given an array of integers and a target, return indices that add up to target"
      }),
    });

    if (!analysisResponse.ok) {
      throw new Error(`Analysis API error: ${analysisResponse.status}`);
    }

    const analysisResult = await analysisResponse.json();
    console.log("Analysis result:", analysisResult);

    // Format response for Retell
    const retellResponse = {
      response: analysisResult.feedback,
      has_issues: analysisResult.has_issues || false,
      suggestions: analysisResult.suggestions || [],
      analysis_complete: true
    };

    console.log("Sending response to Retell:", retellResponse);

    return NextResponse.json(retellResponse);

  } catch (error) {
    console.error("Error in Retell code review function:", error);
    
    // Return a safe fallback response that Retell can read
    return NextResponse.json({
      response: "I'm having some technical difficulties analyzing your code right now. Could you walk me through your approach instead? I'd love to hear your thinking!",
      has_issues: false,
      suggestions: ["Explain your approach", "Discuss the algorithm", "Talk about edge cases"],
      analysis_complete: false,
      error: true
    });
  }
}

// Health check for the function
export async function GET() {
  return NextResponse.json({
    function: "retell-code-review",
    status: "healthy",
    description: "Retell function for AI-powered code review",
    parameters: {
      code: "string - The code to analyze",
      analysis_type: "string - 'review', 'hint', or 'debug'",
      language: "string - Programming language (default: javascript)"
    },
    timestamp: new Date().toISOString()
  });
} 
