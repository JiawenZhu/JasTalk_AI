import { NextResponse } from "next/server";

const Retell = require("retell-sdk");

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function GET(req: Request) {
  try {
    // Check if Retell API key is available
    if (!process.env.RETELL_API_KEY || process.env.RETELL_API_KEY === 'your_retell_api_key') {
      console.log("No valid RETELL_API_KEY found, returning mock agents");
      
      // Return mock agents for development
      const mockAgents = [
        {
          agent_id: "mock-interviewer-1",
          name: "Sarah - Technical Interviewer",
          description: "Experienced software engineer specializing in technical interviews",
          voice_id: "sarah-voice",
          category: "technical",
          difficulty: "medium",
          specialties: ["system design", "algorithms", "coding"]
        },
        {
          agent_id: "mock-interviewer-2", 
          name: "Mike - Behavioral Interviewer",
          description: "HR professional focused on behavioral and leadership questions",
          voice_id: "mike-voice",
          category: "behavioral",
          difficulty: "easy",
          specialties: ["leadership", "teamwork", "communication"]
        },
        {
          agent_id: "mock-interviewer-3",
          name: "Lisa - Senior Engineer",
          description: "Senior software engineer with 10+ years of experience",
          voice_id: "lisa-voice", 
          category: "technical",
          difficulty: "hard",
          specialties: ["architecture", "scalability", "best practices"]
        },
        {
          agent_id: "mock-interviewer-4",
          name: "David - Product Manager",
          description: "Product manager specializing in product strategy and execution",
          voice_id: "david-voice",
          category: "product",
          difficulty: "medium", 
          specialties: ["product strategy", "user research", "metrics"]
        }
      ];

      return NextResponse.json({
        success: true,
        agents: mockAgents,
        note: "Mock agents for development - no valid RETELL_API_KEY found"
      });
    }

    // Fetch real agents from Retell API
    console.log("Fetching agents from Retell API");
    
    try {
      console.log("Attempting to fetch agents from Retell API...");
      const agents = await retellClient.agent.list();
      
      console.log("Retell agents fetched successfully:", agents.length);
      console.log("First agent sample:", agents[0]);
      
      // Transform agents to a more user-friendly format
      const formattedAgents = agents.map((agent: any) => ({
        agent_id: agent.agent_id,
        name: agent.agent_name || `Agent ${agent.agent_id}`,
        description: agent.agent_description || "AI interviewer for practice sessions",
        voice_id: agent.voice_id || "default-voice",
        category: agent.category || "general",
        difficulty: agent.difficulty || "medium",
        specialties: agent.specialties || ["general interview skills"],
        created_at: agent.created_at,
        updated_at: agent.updated_at
      }));

      return NextResponse.json({
        success: true,
        agents: formattedAgents,
        total: agents.length
      });

    } catch (retellError: any) {
      console.error("Error fetching Retell agents:", retellError);
      console.error("Error details:", {
        message: retellError.message,
        status: retellError.status,
        response: retellError.response
      });
      
      // Return mock agents if Retell API fails
      const mockAgents = [
        {
          agent_id: "fallback-interviewer-1",
          name: "Practice Interviewer",
          description: "General practice interviewer for all types of questions",
          voice_id: "default-voice",
          category: "general",
          difficulty: "medium",
          specialties: ["general interview skills"]
        }
      ];

      return NextResponse.json({
        success: true,
        agents: mockAgents,
        note: "Fallback agents - Retell API error occurred"
      });
    }

  } catch (error) {
    console.error("Error in get-retell-agents:", error);
    
return NextResponse.json(
      { 
        error: "Failed to fetch agents",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 
