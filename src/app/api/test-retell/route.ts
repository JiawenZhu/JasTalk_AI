import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    console.log("Testing Retell SDK...");
    
    // Check if Retell API key is available
    if (!process.env.RETELL_API_KEY || process.env.RETELL_API_KEY === 'your_retell_api_key') {
      return NextResponse.json({
        error: "Retell API key not configured",
        note: "Please add your RETELL_API_KEY to .env.local"
      }, { status: 400 });
    }

    console.log("RETELL_API_KEY found:", process.env.RETELL_API_KEY.substring(0, 10) + "...");

    // Try to import Retell SDK
    let Retell;
    try {
      Retell = require("retell-sdk");
      console.log("Retell SDK imported successfully");
    } catch (importError) {
      console.error("Error importing Retell SDK:", importError);
      return NextResponse.json({
        error: "Failed to import Retell SDK",
        details: importError.message
      }, { status: 500 });
    }

    // Try to create Retell client
    let retellClient;
    try {
      retellClient = new Retell({
        apiKey: process.env.RETELL_API_KEY
      });
      console.log("Retell client created successfully");
    } catch (clientError) {
      console.error("Error creating Retell client:", clientError);
      return NextResponse.json({
        error: "Failed to create Retell client",
        details: clientError.message
      }, { status: 500 });
    }

    // Try to list agents
    try {
      console.log("Attempting to list agents...");
      const agents = await retellClient.agent.list();
      console.log("Agents fetched successfully:", agents.length);
      
      return NextResponse.json({
        success: true,
        message: "Retell SDK is working correctly",
        agentsCount: agents.length,
        firstAgent: agents[0] ? {
          agent_id: agents[0].agent_id,
          agent_name: agents[0].agent_name
        } : null
      });
    } catch (listError) {
      console.error("Error listing agents:", listError);
      return NextResponse.json({
        error: "Failed to list agents",
        details: listError.message,
        note: "This might be due to API permissions or network issues"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Unexpected error in test-retell:", error);
    return NextResponse.json({
      error: "Unexpected error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
} 
