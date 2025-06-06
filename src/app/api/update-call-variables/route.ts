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

    // Update dynamic variables in the active Retell call
    try {
      const retellClient = new Retell({
        apiKey: process.env.RETELL_API_KEY || "",
      });

      // Update dynamic variables for the active call
      await retellClient.call.update({
        call_id: callId,
        retell_llm_dynamic_variables: stringifiedVariables
      });

      console.log(`Successfully updated Retell call ${callId} with variables:`, {
        ...stringifiedVariables,
        code_submission: stringifiedVariables.code_submission?.substring(0, 100) + '...'
      });

      return NextResponse.json({
        success: true,
        message: "Call variables updated successfully in Retell",
        callId: callId,
        updatedVariables: Object.keys(stringifiedVariables),
        timestamp: new Date().toISOString()
      });

    } catch (retellError: any) {
      console.error("Retell API error:", retellError);
      
      // In development, fall back to logging
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development fallback: Would update Retell call ${callId} with variables:`, {
          ...stringifiedVariables,
          code_submission: stringifiedVariables.code_submission?.substring(0, 100) + '...'
        });

        return NextResponse.json({
          success: true,
          message: "Call variables updated successfully (development mode)",
          callId: callId,
          updatedVariables: Object.keys(stringifiedVariables),
          timestamp: new Date().toISOString(),
          note: "Development mode - variables logged but not sent to Retell"
        });
      }

      throw retellError;
    }

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
