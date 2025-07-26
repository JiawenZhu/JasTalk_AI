import { NextRequest, NextResponse } from "next/server";
import { Retell } from "retell-sdk";
import { logger } from "@/lib/logger";

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Received practice call request:", body);

    // Check if Retell API key is available and not a placeholder
    if (!process.env.RETELL_API_KEY || process.env.RETELL_API_KEY === 'your_retell_api_key') {
      console.log("No valid RETELL_API_KEY found, using mock mode");
      return NextResponse.json(
        { 
          error: "Retell API key not configured",
          note: "Mock response for development - no valid RETELL_API_KEY found"
        },
        { status: 200 } // Return 200 to allow mock mode to work
      );
    }

    // Use the provided agent_id or fall back to default practice agent
    const practiceAgentId = body.agent_id || process.env.PRACTICE_AGENT_ID || "default-practice-agent-id";
    
    console.log("Creating Retell web call for practice interview with agent_id:", practiceAgentId);
    console.log("Questions:", body.questions);

    // Format questions for the agent prompt
    const formattedQuestions = body.questions.map((q: any, index: number) => 
      `${index + 1}. ${q.text}`
    ).join('\n');

    // Dynamic variables for the practice interview
    const dynamicData = {
      name: body.candidate_name || "Candidate", // For {{name}} in Retell prompts
      candidate_name: body.candidate_name || "Candidate", // For {{candidate_name}} in Retell prompts
      interview_type: body.interview_type || "practice",
      questions: formattedQuestions,
      total_questions: body.questions.length.toString(),
      focus_areas: body.focus_areas || "general interview skills",
      duration: body.duration || "15-20 minutes"
    };

    console.log("Dynamic data for practice interview:", dynamicData);

    try {
      const registerCallResponse = await retellClient.call.createWebCall({
        agent_id: practiceAgentId,
        retell_llm_dynamic_variables: dynamicData,
      });

      console.log("Practice call created successfully:", registerCallResponse);
      logger.info("Practice call registered successfully");

      return NextResponse.json(
        {
          registerCallResponse,
          practice_session: {
            agent_id: practiceAgentId,
            questions: body.questions,
            dynamic_data: dynamicData
          },
          note: "Real Retell call created"
        },
        { status: 200 }
      );
    } catch (retellError: any) {
      console.error("Retell API error:", retellError);
      console.error("Retell error details:", {
        message: retellError.message,
        status: retellError.status,
        statusText: retellError.statusText,
        response: retellError.response?.data || retellError.response
      });

      // In development, return a mock response to allow testing
      if (process.env.NODE_ENV === 'development') {
        console.log("Development mode: returning mock Retell response for practice call");
        const mockResponse = {
          call_id: `mock-practice-call-${Date.now()}`,
          access_token: `mock-practice-token-${Date.now()}`,
          agent_id: practiceAgentId
        };
        
        return NextResponse.json(
          {
            registerCallResponse: mockResponse,
            practice_session: {
              agent_id: practiceAgentId,
              questions: body.questions,
              dynamic_data: dynamicData
            },
            note: "Mock response for development - Retell API error"
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { 
          error: "Retell API call failed",
          details: retellError.message || "Unknown Retell error",
          agent_id: practiceAgentId
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error in register-practice-call:", error);
    logger.error("register-practice-call error:", error);
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 
