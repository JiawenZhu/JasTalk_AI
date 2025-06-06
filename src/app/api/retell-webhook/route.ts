import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import crypto from "crypto";

// Webhook verification for security
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Validates if an agent should be synced based on voice configuration
 */
function shouldSyncAgent(agentData: any): { shouldSync: boolean; reason: string } {
  // Primary requirement: Must have a voice configured
  if (!agentData.voice_id) {
    return {
      shouldSync: false,
      reason: 'No voice configured - agents without voice are not suitable for interviews'
    };
  }
  
  // Check for required fields
  if (!agentData.agent_name) {
    return {
      shouldSync: false,
      reason: 'Missing agent name'
    };
  }
  
  if (!agentData.agent_id) {
    return {
      shouldSync: false,
      reason: 'Missing agent ID'
    };
  }
  
  // Check if agent name suggests it's for interviews
  const name = agentData.agent_name.toLowerCase();
  const isInterviewAgent = (
    name.includes('bob') || 
    name.includes('lisa') ||
    name.includes('interview') ||
    name.includes('conversation') ||
    name.includes('empathetic') ||
    name.includes('explorer') ||
    name.includes('flow') ||
    name.includes('agent')
  );
  
  if (!isInterviewAgent) {
    return {
      shouldSync: false,
      reason: 'Agent name does not match interview patterns'
    };
  }
  
  return {
    shouldSync: true,
    reason: 'Agent meets all sync criteria'
  };
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-retell-signature');
    const webhookSecret = process.env.RETELL_WEBHOOK_SECRET;

    // Verify webhook signature if secret is configured
    if (webhookSecret && signature) {
      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    console.log("Received Retell webhook:", event.type, event.data?.agent_name || 'unknown');

    const supabase = createServerClient();
    
    switch (event.type) {
      case 'agent.created':
        return await handleAgentCreated(supabase, event.data);
      
      case 'agent.updated':
        return await handleAgentUpdated(supabase, event.data);
      
      case 'agent.deleted':
        return await handleAgentDeleted(supabase, event.data);
      
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
        return NextResponse.json({ success: true, message: "Event type not handled" });
    }

  } catch (error) {
    console.error("Error processing Retell webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

async function handleAgentCreated(supabase: any, agentData: any) {
  try {
    console.log(`Processing agent creation: ${agentData.agent_name}`);

    // Validate if agent should be synced
    const validation = shouldSyncAgent(agentData);
    if (!validation.shouldSync) {
      console.log(`Skipping agent ${agentData.agent_name}: ${validation.reason}`);
      return NextResponse.json({ 
        success: true, 
        message: `Agent skipped: ${validation.reason}`,
        skipped: true
      });
    }

    // Check if agent already exists
    const { data: existingAgent } = await supabase
      .from("interviewer")
      .select("id")
      .eq('agent_id', agentData.agent_id)
      .single();

    if (existingAgent) {
      console.log(`Agent ${agentData.agent_name} already exists, skipping creation`);
      return NextResponse.json({ 
        success: true, 
        message: "Agent already exists" 
      });
    }

    // Create new interviewer record
    const avatarImage = getAvatarForAgent(agentData.agent_name);
    const description = getDescriptionForAgent(agentData.agent_name);

    const interviewerData = {
      agent_id: agentData.agent_id,
      name: agentData.agent_name,
      description: description,
      image: avatarImage,
      audio: agentData.voice_id ? `${(agentData.agent_name || 'default').replace(/\s+/g, '')}.wav` : "default.wav",
      empathy: 7,
      exploration: 8,
      rapport: 7,
      speed: 5,
      last_synced_at: new Date().toISOString(),
      sync_status: 'active'
    };

    const { data: newAgent, error } = await supabase
      .from("interviewer")
      .insert(interviewerData)
      .select()
      .single();

    if (error) {
      console.error(`Error creating agent ${agentData.agent_name}:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`Successfully created voice-enabled agent: ${agentData.agent_name}`);
    return NextResponse.json({ 
      success: true, 
      message: "Voice-enabled agent created",
      agent: newAgent
    });

  } catch (error) {
    console.error("Error in handleAgentCreated:", error);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}

async function handleAgentUpdated(supabase: any, agentData: any) {
  try {
    console.log(`Processing agent update: ${agentData.agent_name}`);

    // Validate if agent should be synced
    const validation = shouldSyncAgent(agentData);
    
    const { data: existingAgent, error: fetchError } = await supabase
      .from("interviewer")
      .select("*")
      .eq('agent_id', agentData.agent_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`Error fetching agent ${agentData.agent_id}:`, fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!existingAgent) {
      if (validation.shouldSync) {
        console.log(`Agent ${agentData.agent_name} not found in database, triggering creation`);
        return await handleAgentCreated(supabase, agentData);
      } else {
        console.log(`Agent ${agentData.agent_name} not found and doesn't meet sync criteria: ${validation.reason}`);
        return NextResponse.json({ 
          success: true, 
          message: `Agent not synced: ${validation.reason}`,
          skipped: true
        });
      }
    }

    // Agent exists in database
    if (!validation.shouldSync) {
      // Agent no longer meets sync criteria (e.g., voice was removed)
      console.log(`Agent ${agentData.agent_name} no longer meets sync criteria: ${validation.reason}`);
      
      const { error: orphanError } = await supabase
        .from("interviewer")
        .update({
          sync_status: 'orphaned',
          last_synced_at: new Date().toISOString()
        })
        .eq('agent_id', agentData.agent_id);

      if (orphanError) {
        console.error(`Error marking agent ${agentData.agent_name} as orphaned:`, orphanError);
        return NextResponse.json({ error: orphanError.message }, { status: 500 });
      }

      console.log(`Marked agent as orphaned: ${agentData.agent_name} (reason: ${validation.reason})`);
      return NextResponse.json({ 
        success: true, 
        message: `Agent marked as orphaned: ${validation.reason}`,
        orphaned: true
      });
    }

    // Update existing agent
    const updateData = {
      name: agentData.agent_name,
      last_synced_at: new Date().toISOString(),
      sync_status: 'active'
    };

    const { error: updateError } = await supabase
      .from("interviewer")
      .update(updateData)
      .eq('agent_id', agentData.agent_id);

    if (updateError) {
      console.error(`Error updating agent ${agentData.agent_name}:`, updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`Successfully updated voice-enabled agent: ${agentData.agent_name}`);
    return NextResponse.json({ 
      success: true, 
      message: "Voice-enabled agent updated" 
    });

  } catch (error) {
    console.error("Error in handleAgentUpdated:", error);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}

async function handleAgentDeleted(supabase: any, agentData: any) {
  try {
    console.log(`Processing agent deletion: ${agentData.agent_id}`);

    // Mark agent as orphaned instead of deleting immediately
    const { error: updateError } = await supabase
      .from("interviewer")
      .update({
        sync_status: 'orphaned',
        last_synced_at: new Date().toISOString()
      })
      .eq('agent_id', agentData.agent_id);

    if (updateError) {
      console.error(`Error marking agent as orphaned:`, updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`Marked agent as orphaned: ${agentData.agent_id}`);
    return NextResponse.json({ 
      success: true, 
      message: "Agent marked as orphaned due to deletion from Retell AI" 
    });

  } catch (error) {
    console.error("Error in handleAgentDeleted:", error);
    return NextResponse.json({ error: "Failed to handle agent deletion" }, { status: 500 });
  }
}

function getAvatarForAgent(agentName: string): string {
  const avatarMapping: { [key: string]: string } = {
    "Bob": "/interviewers/Bob.png",
    "Lisa": "/interviewers/Lisa.png", 
    "Empathetic Bob": "/interviewers/Bob.png",
    "Explorer Lisa": "/interviewers/Lisa.png",
    "Conversation": "/user-icon.png",
    "Conversation Flow Agent": "/user-icon.png",
    "default": "/user-icon.png"
  };
  
  return avatarMapping[agentName] || avatarMapping["default"];
}

function getDescriptionForAgent(agentName: string): string {
  const descriptionMapping: { [key: string]: string } = {
    "Bob": "Hi! I'm Bob, your go-to empathetic interviewer. I excel at understanding and connecting with people on a deeper level, ensuring every conversation is insightful and meaningful.",
    "Empathetic Bob": "Hi! I'm Bob, your go-to empathetic interviewer. I excel at understanding and connecting with people on a deeper level, ensuring every conversation is insightful and meaningful.",
    "Lisa": "Hi! I'm Lisa, an enthusiastic and empathetic interviewer who loves to explore. With a perfect balance of empathy and rapport, I delve deep into conversations while maintaining a steady pace.",
    "Explorer Lisa": "Hi! I'm Lisa, an enthusiastic and empathetic interviewer who loves to explore. With a perfect balance of empathy and rapport, I delve deep into conversations while maintaining a steady pace.",
    "Conversation": "A versatile conversation flow agent designed for structured interviews and dynamic interactions.",
    "Conversation Flow Agent": "A sophisticated conversation flow agent designed for structured interviews and dynamic interactions with advanced conversation management capabilities.",
  };
  
  return descriptionMapping[agentName] || 
         `${agentName || 'Unknown Agent'} - A professional AI interviewer ready to conduct insightful conversations.`;
} 
