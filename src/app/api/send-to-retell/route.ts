import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    console.log("Send to Retell request received");
    
    const body = await req.json();
    const { callId, message, analysisType } = body;

    console.log("Send to Retell request:", { callId, messageLength: message?.length, analysisType });

    if (!callId) {
      return NextResponse.json(
        { error: "Call ID is required" },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // In a full Retell integration, you would use the Retell API to send a message
    // to the active call. For now, we'll simulate this functionality.
    
    // TODO: Replace with actual Retell API call
    // Example of what this would look like:
    /*
    const retellClient = new Retell({
      apiKey: process.env.RETELL_API_KEY || "",
    });

    // Send message to active call
    await retellClient.call.sendMessage({
      call_id: callId,
      message: message
    });
    */

    console.log(`Would send to Retell call ${callId}: ${message.substring(0, 100)}...`);

    // For development/demo purposes, just log and return success
    return NextResponse.json({
      success: true,
      message: "Message sent to Retell AI",
      callId: callId,
      sentMessage: message,
      analysisType: analysisType,
      timestamp: new Date().toISOString(),
      note: "In development mode - message would be spoken by Retell AI in production"
    });

  } catch (error) {
    console.error("Error sending message to Retell:", error);
    
    return NextResponse.json(
      { 
        error: "Failed to send message to Retell",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    service: "Send to Retell API",
    status: "healthy",
    description: "Sends analysis results to Retell AI for voice delivery",
    timestamp: new Date().toISOString()
  });
} 
