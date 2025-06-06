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

interface SyncAuditLog {
  agent_id: string;
  name: string;
  voice_id?: string;
  status: 'synced' | 'skipped' | 'error';
  reason: string;
  missing_fields?: string[];
  timestamp: string;
}

interface SyncResult {
  created: Array<{ agent_id: string; name: string; reason: string }>;
  updated: Array<{ agent_id: string; name: string; reason: string }>;
  skipped: Array<{ agent_id: string; name: string; reason: string }>;
  orphaned: Array<{ agent_id: string; name: string; reason: string }>;
  errors: Array<{ agent_id?: string; name?: string; error: string }>;
  audit_logs: SyncAuditLog[];
  discrepancies: {
    retell_voice_enabled: number;
    database_agents: number;
    unsynced_agents: Array<{ agent_id: string; name: string; voice_id?: string }>;
  };
  totalRetellAgents: number;
  totalDatabaseAgents: number;
}

/**
 * Validates if an agent should be synced based on voice configuration
 */
function shouldSyncAgent(agent: any): { shouldSync: boolean; reason: string; missingFields: string[] } {
  const missingFields: string[] = [];
  
  // Check for required fields
  if (!agent.agent_name) {
    missingFields.push('agent_name');
  }
  
  if (!agent.agent_id) {
    missingFields.push('agent_id');
  }
  
  // Primary requirement: Must have a voice configured
  if (!agent.voice_id) {
    return {
      shouldSync: false,
      reason: 'No voice configured - agents without voice are not suitable for interviews',
      missingFields: [...missingFields, 'voice_id']
    };
  }
  
  if (missingFields.length > 0) {
    return {
      shouldSync: false,
      reason: `Missing required fields: ${missingFields.join(', ')}`,
      missingFields
    };
  }
  
  // Check if agent name suggests it's for interviews
  const name = agent.agent_name.toLowerCase();
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
      reason: 'Agent name does not match interview patterns',
      missingFields: []
    };
  }
  
  return {
    shouldSync: true,
    reason: 'Agent meets all sync criteria',
    missingFields: []
  };
}

/**
 * Creates an audit log entry
 */
function createAuditLog(
  agent: any, 
  status: 'synced' | 'skipped' | 'error', 
  reason: string, 
  missingFields?: string[]
): SyncAuditLog {
  return {
    agent_id: agent.agent_id || 'unknown',
    name: agent.agent_name || 'unknown',
    voice_id: agent.voice_id,
    status,
    reason,
    missing_fields: missingFields,
    timestamp: new Date().toISOString()
  };
}

export async function POST(req: Request) {
  try {
    console.log("Starting enhanced voice-enabled agent sync...");

    // Validate environment variables
    if (!process.env.RETELL_API_KEY) {
      return NextResponse.json(
        { error: "Retell API key not configured" },
        { status: 500 }
      );
    }

    const supabase = createServerClient();
    const syncResult: SyncResult = {
      created: [],
      updated: [],
      skipped: [],
      orphaned: [],
      errors: [],
      audit_logs: [],
      discrepancies: {
        retell_voice_enabled: 0,
        database_agents: 0,
        unsynced_agents: []
      },
      totalRetellAgents: 0,
      totalDatabaseAgents: 0
    };

    // Step 1: Fetch all agents from Retell AI
    console.log("Fetching agents from Retell AI...");
    let retellAgents: any[] = [];
    try {
      retellAgents = await retellClient.agent.list();
      syncResult.totalRetellAgents = retellAgents.length;
      console.log(`Found ${retellAgents.length} total agents in Retell AI`);
    } catch (error) {
      console.error("Failed to fetch agents from Retell AI:", error);
      
return NextResponse.json(
        { error: "Failed to connect to Retell AI" },
        { status: 500 }
      );
    }

    // Step 2: Filter agents that have voice configured
    const voiceEnabledAgents = retellAgents.filter(agent => agent.voice_id);
    syncResult.discrepancies.retell_voice_enabled = voiceEnabledAgents.length;
    console.log(`Found ${voiceEnabledAgents.length} voice-enabled agents in Retell AI`);

    // Step 3: Get all existing agents from database
    const { data: existingAgents, error: fetchError } = await supabase
      .from("interviewer")
      .select("*");

    if (fetchError) {
      console.error("Error fetching existing agents:", fetchError);
      
return NextResponse.json(
        { error: "Failed to fetch existing agents from database" },
        { status: 500 }
      );
    }

    syncResult.totalDatabaseAgents = existingAgents?.length || 0;
    syncResult.discrepancies.database_agents = syncResult.totalDatabaseAgents;
    console.log(`Found ${syncResult.totalDatabaseAgents} agents in database`);

    // Create maps for efficient lookup
    const databaseAgentMap = new Map(existingAgents?.map(agent => [agent.agent_id, agent]) || []);

    // Step 4: Process all Retell agents and create audit logs
    for (const retellAgent of retellAgents) {
      const validation = shouldSyncAgent(retellAgent);
      
      if (!validation.shouldSync) {
        // Log skipped agents
        syncResult.audit_logs.push(createAuditLog(
          retellAgent, 
          'skipped', 
          validation.reason, 
          validation.missingFields
        ));
        
        syncResult.skipped.push({
          agent_id: retellAgent.agent_id || 'unknown',
          name: retellAgent.agent_name || 'unknown',
          reason: validation.reason
        });
        
        continue;
      }

      // Agent should be synced - process it
      try {
        const existingAgent = databaseAgentMap.get(retellAgent.agent_id);
        
        if (existingAgent) {
          // Update existing agent
          const updateData = {
            name: retellAgent.agent_name,
            last_synced_at: new Date().toISOString(),
            sync_status: 'active'
          };

          const { error: updateError } = await supabase
            .from("interviewer")
            .update(updateData)
            .eq('agent_id', retellAgent.agent_id);

          if (updateError) {
            console.error(`Error updating agent ${retellAgent.agent_name}:`, updateError);
            syncResult.errors.push({
              agent_id: retellAgent.agent_id,
              name: retellAgent.agent_name,
              error: `Update failed: ${updateError.message}`
            });
            
            syncResult.audit_logs.push(createAuditLog(
              retellAgent, 
              'error', 
              `Update failed: ${updateError.message}`
            ));
          } else {
            console.log(`Updated agent: ${retellAgent.agent_name}`);
            syncResult.updated.push({
              agent_id: retellAgent.agent_id,
              name: retellAgent.agent_name,
              reason: "Synced from Retell AI"
            });
            
            syncResult.audit_logs.push(createAuditLog(
              retellAgent, 
              'synced', 
              'Successfully updated existing agent'
            ));
          }
        } else {
          // Check for duplicate by name to prevent creating multiple agents with same name
          const { data: duplicateCheck } = await supabase
            .from("interviewer")
            .select("id, agent_id, name")
            .eq('name', retellAgent.agent_name)
            .single();

          if (duplicateCheck) {
            console.log(`Agent with name "${retellAgent.agent_name}" already exists with different agent_id. Skipping to prevent duplicates.`);
            syncResult.errors.push({
              agent_id: retellAgent.agent_id,
              name: retellAgent.agent_name,
              error: `Duplicate name detected - agent exists with different ID: ${duplicateCheck.agent_id}`
            });
            
            syncResult.audit_logs.push(createAuditLog(
              retellAgent, 
              'error', 
              `Duplicate name detected - agent exists with different ID: ${duplicateCheck.agent_id}`
            ));
            continue;
          }

          // Create new agent
          const avatarImage = AVATAR_MAPPING[retellAgent.agent_name || 'default'] || 
                             AVATAR_MAPPING["default"];

          const description = DESCRIPTION_MAPPING[retellAgent.agent_name || 'default'] || 
                             `${retellAgent.agent_name || 'Unknown Agent'} - A professional AI interviewer ready to conduct insightful conversations.`;

          const interviewerData = {
            agent_id: retellAgent.agent_id,
            name: retellAgent.agent_name,
            description: description,
            image: avatarImage,
            audio: retellAgent.voice_id ? `${(retellAgent.agent_name || 'default').replace(/\s+/g, '')}.wav` : "default.wav",
            empathy: 7,
            exploration: 8,
            rapport: 7,
            speed: 5,
            last_synced_at: new Date().toISOString(),
            sync_status: 'active'
          };

          const { data: newAgent, error: insertError } = await supabase
            .from("interviewer")
            .insert(interviewerData)
            .select()
            .single();

          if (insertError) {
            console.error(`Error creating agent ${retellAgent.agent_name}:`, insertError);
            syncResult.errors.push({
              agent_id: retellAgent.agent_id,
              name: retellAgent.agent_name,
              error: `Creation failed: ${insertError.message}`
            });
            
            syncResult.audit_logs.push(createAuditLog(
              retellAgent, 
              'error', 
              `Creation failed: ${insertError.message}`
            ));
          } else {
            console.log(`Created new agent: ${retellAgent.agent_name}`);
            syncResult.created.push({
              agent_id: retellAgent.agent_id,
              name: retellAgent.agent_name,
              reason: "New voice-enabled agent from Retell AI"
            });
            
            syncResult.audit_logs.push(createAuditLog(
              retellAgent, 
              'synced', 
              'Successfully created new agent'
            ));
          }
        }
      } catch (error) {
        console.error(`Error processing agent ${retellAgent.agent_name}:`, error);
        syncResult.errors.push({
          agent_id: retellAgent.agent_id,
          name: retellAgent.agent_name,
          error: `Processing failed: ${error}`
        });
        
        syncResult.audit_logs.push(createAuditLog(
          retellAgent, 
          'error', 
          `Processing failed: ${error}`
        ));
      }
    }

    // Step 5: Identify orphaned agents (exist in database but not in Retell AI)
    const retellAgentIds = new Set(voiceEnabledAgents.map(agent => agent.agent_id));
    
    for (const dbAgent of existingAgents || []) {
      if (!retellAgentIds.has(dbAgent.agent_id)) {
        // Mark as orphaned
        const { error: orphanError } = await supabase
          .from("interviewer")
          .update({
            sync_status: 'orphaned',
            last_synced_at: new Date().toISOString()
          })
          .eq('agent_id', dbAgent.agent_id);

        if (orphanError) {
          console.error(`Error marking agent ${dbAgent.name} as orphaned:`, orphanError);
          syncResult.errors.push({
            agent_id: dbAgent.agent_id,
            name: dbAgent.name,
            error: `Failed to mark as orphaned: ${orphanError.message}`
          });
        } else {
          console.log(`Marked agent as orphaned: ${dbAgent.name}`);
          syncResult.orphaned.push({
            agent_id: dbAgent.agent_id,
            name: dbAgent.name,
            reason: "Agent no longer exists in Retell AI or lacks voice configuration"
          });
        }
      }
    }

    // Step 6: Identify unsynced agents for discrepancy report
    const syncedAgentIds = new Set([
      ...syncResult.created.map(a => a.agent_id),
      ...syncResult.updated.map(a => a.agent_id)
    ]);

    syncResult.discrepancies.unsynced_agents = voiceEnabledAgents
      .filter(agent => !syncedAgentIds.has(agent.agent_id))
      .map(agent => ({
        agent_id: agent.agent_id,
        name: agent.agent_name,
        voice_id: agent.voice_id
      }));

    // Step 7: Log audit results to console
    console.log("\n=== SYNC AUDIT REPORT ===");
    console.log(`Total Retell Agents: ${syncResult.totalRetellAgents}`);
    console.log(`Voice-Enabled Agents: ${syncResult.discrepancies.retell_voice_enabled}`);
    console.log(`Database Agents: ${syncResult.discrepancies.database_agents}`);
    console.log(`Created: ${syncResult.created.length}`);
    console.log(`Updated: ${syncResult.updated.length}`);
    console.log(`Skipped: ${syncResult.skipped.length}`);
    console.log(`Orphaned: ${syncResult.orphaned.length}`);
    console.log(`Errors: ${syncResult.errors.length}`);
    console.log(`Unsynced Voice Agents: ${syncResult.discrepancies.unsynced_agents.length}`);
    
    if (syncResult.discrepancies.unsynced_agents.length > 0) {
      console.log("\nUnsynced Voice-Enabled Agents:");
      syncResult.discrepancies.unsynced_agents.forEach(agent => {
        console.log(`- ${agent.name} (ID: ${agent.agent_id}, Voice: ${agent.voice_id})`);
      });
    }
    
    console.log("\nDetailed Audit Logs:");
    syncResult.audit_logs.forEach(log => {
      console.log(`[${log.status.toUpperCase()}] ${log.name} (${log.agent_id}): ${log.reason}`);
      if (log.missing_fields && log.missing_fields.length > 0) {
        console.log(`  Missing fields: ${log.missing_fields.join(', ')}`);
      }
    });
    console.log("=== END AUDIT REPORT ===\n");

    return NextResponse.json({
      success: true,
      message: "Enhanced voice-enabled agent sync completed",
      ...syncResult
    });

  } catch (error) {
    console.error("Error in enhanced agent sync:", error);
    
return NextResponse.json(
      { error: "Failed to sync agents" },
      { status: 500 }
    );
  }
} 
