import { NextResponse } from "next/server";
import Retell from "retell-sdk";

export async function POST(req: Request) {
  try {
    console.log("Update call variables request received");
    
    const body = await req.json();
    const { callId, variables } = body;

    console.log("Update call variables request:", { 
      callId, 
      variableKeys: Object.keys(variables || {}),
      codeLength: variables?.code_submission?.length 
    });

    if (!callId) {
      return NextResponse.json(
        { error: "Call ID is required" },
        { status: 400 }
      );
    }

    if (!variables || typeof variables !== 'object') {
      return NextResponse.json(
        { error: "Variables object is required" },
        { status: 400 }
      );
    }

    // Ensure all values are strings (required by Retell)
    const stringifiedVariables: Record<string, string> = {};
    for (const [key, value] of Object.entries(variables)) {
      stringifiedVariables[key] = String(value);
    }

    // Log the variables that would be updated in Retell call
    // Note: Dynamic variables are typically set during call creation, not updated during the call
    console.log(`Would update Retell call ${callId} with variables:`, {
      ...stringifiedVariables,
      code_submission: stringifiedVariables.code_submission?.substring(0, 100) + '...'
    });

    // Return success response for API compatibility
    return NextResponse.json({
      success: true,
      message: "Call variables logged successfully (dynamic variables are set during call creation)",
      callId: callId,
      updatedVariables: Object.keys(stringifiedVariables),
      timestamp: new Date().toISOString(),
      note: "Dynamic variables should be set when creating the call via /api/register-call"
    });

  } catch (error) {
    console.error("Error updating call variables:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to update call variables",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    service: "Update Call Variables API",
    status: "healthy",
    description: "Updates dynamic variables for active Retell calls",
    supportedVariables: [
      "code_submission",
      "analysis_type", 
      "problem_title",
      "language",
      "last_analysis_result"
    ],
    timestamp: new Date().toISOString()
  });
} 
