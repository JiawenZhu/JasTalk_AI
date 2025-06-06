import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";
import Retell from "retell-sdk";
import { createServerClient } from "@/lib/supabase";

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    logger.info("register-call request received");

    // Validate environment variables
    if (!process.env.RETELL_API_KEY) {
      console.error("RETELL_API_KEY is not configured");
      return NextResponse.json(
        { error: "Retell API key not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    console.log("Register call request body:", body);

    if (!body.interviewer_id) {
      return NextResponse.json(
        { error: "interviewer_id is required" },
        { status: 400 }
      );
    }

    const interviewerId = body.interviewer_id;
    console.log("Fetching interviewer with ID:", interviewerId);
    
    // Use server-side Supabase client to bypass RLS
    const supabase = createServerClient();
    const { data: interviewer, error: interviewerError } = await supabase
      .from("interviewer")
      .select("*")
      .eq("id", interviewerId)
      .single();

    if (interviewerError) {
      console.error("Error fetching interviewer:", interviewerError);
      return NextResponse.json(
        { 
          error: "Failed to fetch interviewer",
          details: interviewerError.message,
          code: interviewerError.code
        },
        { status: 500 }
      );
    }

    console.log("Retrieved interviewer:", interviewer);

    if (!interviewer) {
      return NextResponse.json(
        { error: "Interviewer not found" },
        { status: 404 }
      );
    }

    if (!interviewer.agent_id) {
      return NextResponse.json(
        { error: "Interviewer does not have an agent_id configured" },
        { status: 400 }
      );
    }

    console.log("Creating Retell web call with agent_id:", interviewer.agent_id);
    console.log("Dynamic data:", body.dynamic_data);

    try {
      const registerCallResponse = await retellClient.call.createWebCall({
        agent_id: interviewer.agent_id,
        retell_llm_dynamic_variables: body.dynamic_data || {},
      });

      console.log("Retell call created successfully:", registerCallResponse);
      logger.info("Call registered successfully");

      return NextResponse.json(
        {
          registerCallResponse,
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
        console.log("Development mode: returning mock Retell response");
        const mockResponse = {
          call_id: `mock-call-${Date.now()}`,
          access_token: `mock-token-${Date.now()}`,
          agent_id: interviewer.agent_id
        };
        
        return NextResponse.json(
          {
            registerCallResponse: mockResponse,
            note: "Mock response for development"
          },
          { status: 200 }
        );
      }

      return NextResponse.json(
        { 
          error: "Retell API call failed",
          details: retellError.message || "Unknown Retell error",
          agent_id: interviewer.agent_id
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error in register-call API:", error);
    logger.error("Error registering call:", error instanceof Error ? error.message : String(error));
    
    return NextResponse.json(
      { 
        error: "Failed to register call",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
