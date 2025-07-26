import { NextResponse } from "next/server";
import Retell from "retell-sdk";

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    // Check if Retell API key is available
    if (!process.env.RETELL_API_KEY || process.env.RETELL_API_KEY === 'your_retell_api_key') {
      return NextResponse.json(
        { 
          error: "Retell API key not configured",
          note: "Please add your RETELL_API_KEY to .env.local"
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { agentName = "Practice Interviewer", agentDescription = "AI interviewer for practice sessions" } = body;

    console.log("Creating practice agent:", agentName);

    try {
      // Create a new agent in Retell
      const agent = await retellClient.agent.create({
        agent_name: agentName,
        agent_description: agentDescription,
        voice_id: "sarah", // Using a default voice ID
        llm_websocket_url: "wss://api.retellai.com/agent/llm-stream",
        llm_retell_config: {
          model: "gpt-4",
          temperature: 0.7,
          system_prompt: `You are an AI interviewer conducting practice interviews. Your role is to:

1. Ask relevant questions based on the candidate's background and the interview type
2. Provide a professional and supportive interview experience
3. Ask follow-up questions to dig deeper into responses
4. Give constructive feedback when appropriate
5. Maintain a conversational and engaging tone

Focus on:
- Technical skills for technical interviews
- Behavioral questions for behavioral interviews
- Product thinking for product interviews
- General interview skills for practice sessions

Be encouraging and help candidates improve their interview skills.`
        }
      });

      console.log("Practice agent created successfully:", agent.agent_id);

      return NextResponse.json({
        success: true,
        agent: {
          agent_id: agent.agent_id,
          name: agent.agent_name,
          description: agent.agent_description,
          voice_id: agent.voice_id,
          created_at: agent.created_at
        },
        message: "Practice agent created successfully"
      });

    } catch (retellError: any) {
      console.error("Error creating Retell agent:", retellError);
      
      return NextResponse.json({
        error: "Failed to create agent in Retell",
        details: retellError.message || "Unknown error",
        note: "Check your Retell API key and account permissions"
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in create-practice-agent:", error);
    return NextResponse.json(
      { 
        error: "Failed to create practice agent",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 
