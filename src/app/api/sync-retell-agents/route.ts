import { NextResponse } from "next/server";
import Retell from "retell-sdk";
import { createServerClient } from "@/lib/supabase";

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

// Mapping of agent names to avatar images
const AVATAR_MAPPING: { [key: string]: string } = {
  "Bob": "/interviewers/Bob.png",
  "Lisa": "/interviewers/Lisa.png", 
  "Empathetic Bob": "/interviewers/Bob.png",
  "Explorer Lisa": "/interviewers/Lisa.png",
  "Conversation": "/user-icon.png",
  "Conversation Flow Agent": "/user-icon.png",
  "default": "/user-icon.png"
};

// Default descriptions for agents
const DESCRIPTION_MAPPING: { [key: string]: string } = {
  "Bob": "Hi! I'm Bob, your go-to empathetic interviewer. I excel at understanding and connecting with people on a deeper level, ensuring every conversation is insightful and meaningful.",
  "Empathetic Bob": "Hi! I'm Bob, your go-to empathetic interviewer. I excel at understanding and connecting with people on a deeper level, ensuring every conversation is insightful and meaningful.",
  "Lisa": "Hi! I'm Lisa, an enthusiastic and empathetic interviewer who loves to explore. With a perfect balance of empathy and rapport, I delve deep into conversations while maintaining a steady pace.",
  "Explorer Lisa": "Hi! I'm Lisa, an enthusiastic and empathetic interviewer who loves to explore. With a perfect balance of empathy and rapport, I delve deep into conversations while maintaining a steady pace.",
  "Conversation": "A versatile conversation flow agent designed for structured interviews and dynamic interactions.",
  "Conversation Flow Agent": "A sophisticated conversation flow agent designed for structured interviews and dynamic interactions with advanced conversation management capabilities.",
};

export async function POST(req: Request) {
  try {
    console.log("Syncing Retell agents...");

    // Validate environment variables
    if (!process.env.RETELL_API_KEY) {
      return NextResponse.json(
        { error: "Retell API key not configured" },
        { status: 500 }
      );
    }

    // Fetch all agents from Retell AI
    console.log("Fetching agents from Retell AI...");
    const retellAgents = await retellClient.agent.list();
    console.log(`Found ${retellAgents.length} agents in Retell AI`);

    // Filter agents that might be in Interview folder or relevant for interviews
    // Since Retell API doesn't seem to expose folder information, we'll sync all agents
    // that could be useful for interviews
    const interviewAgents = retellAgents.filter(agent => {
      if (!agent.agent_name) return false;
      
      const name = agent.agent_name.toLowerCase();
      return (
        name.includes('bob') || 
        name.includes('lisa') ||
        name.includes('interview') ||
        name.includes('conversation') ||
        name.includes('empathetic') ||
        name.includes('explorer') ||
        name.includes('flow') ||
        name.includes('agent') ||
        // If you want to sync all agents, you can return true here instead
        true // This will sync ALL agents - you can change this to be more selective
      );
    });

    console.log(`Found ${interviewAgents.length} interview-related agents`);

    // Get existing agents from database
    const supabase = createServerClient();
    const { data: existingAgents, error: fetchError } = await supabase
      .from("interviewer")
      .select("agent_id, name");

    if (fetchError) {
      console.error("Error fetching existing agents:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch existing agents" },
        { status: 500 }
      );
    }

    const existingAgentIds = new Set(existingAgents?.map(a => a.agent_id) || []);
    console.log("Existing agent IDs:", Array.from(existingAgentIds));

    // Sync agents to database
    const syncedAgents = [];
    const skippedAgents = [];

    for (const agent of interviewAgents) {
      try {
        if (existingAgentIds.has(agent.agent_id)) {
          console.log(`Agent ${agent.agent_name} already exists, skipping...`);
          skippedAgents.push({
            agent_id: agent.agent_id,
            name: agent.agent_name,
            reason: "Already exists"
          });
          continue;
        }

        // Determine avatar image
        const avatarImage = AVATAR_MAPPING[agent.agent_name] || 
                           AVATAR_MAPPING["default"];

        // Determine description
        const description = DESCRIPTION_MAPPING[agent.agent_name] || 
                           `${agent.agent_name} - A professional AI interviewer ready to conduct insightful conversations.`;

        // Create interviewer record
        const interviewerData = {
          agent_id: agent.agent_id,
          name: agent.agent_name,
          description: description,
          image: avatarImage,
          audio: agent.voice_id ? `${agent.agent_name.replace(/\s+/g, '')}.wav` : "default.wav",
          empathy: 7,
          exploration: 8,
          rapport: 7,
          speed: 5
        };

        const { data: newAgent, error: insertError } = await supabase
          .from("interviewer")
          .insert(interviewerData)
          .select()
          .single();

        if (insertError) {
          console.error(`Error inserting agent ${agent.agent_name}:`, insertError);
          skippedAgents.push({
            agent_id: agent.agent_id,
            name: agent.agent_name,
            reason: `Database error: ${insertError.message}`
          });
          continue;
        }

        console.log(`Successfully synced agent: ${agent.agent_name}`);
        syncedAgents.push({
          agent_id: agent.agent_id,
          name: agent.agent_name,
          id: newAgent.id,
          avatar: avatarImage
        });

      } catch (agentError) {
        console.error(`Error processing agent ${agent.agent_name}:`, agentError);
        skippedAgents.push({
          agent_id: agent.agent_id,
          name: agent.agent_name,
          reason: `Processing error: ${agentError instanceof Error ? agentError.message : 'Unknown error'}`
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Sync completed: ${syncedAgents.length} agents synced, ${skippedAgents.length} skipped`,
        synced: syncedAgents,
        skipped: skippedAgents,
        totalRetellAgents: retellAgents.length,
        filteredAgents: interviewAgents.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error syncing Retell agents:", error);
    return NextResponse.json(
      { 
        error: "Failed to sync Retell agents",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 
