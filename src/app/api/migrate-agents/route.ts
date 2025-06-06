import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    
    console.log("Starting agent migration...");

    // Step 1: Check current schema first
    const { data: testAgent, error: schemaError } = await supabase
      .from("interviewer")
      .select("*")
      .limit(1)
      .single();

    let hasNewColumns = false;
    if (testAgent && 'last_synced_at' in testAgent && 'sync_status' in testAgent) {
      hasNewColumns = true;
      console.log("New columns already exist");
    }

    // Step 2: Get all agents to identify duplicates
    const { data: allAgents, error: fetchError } = await supabase
      .from("interviewer")
      .select("*")
      .order("name, created_at", { ascending: false });

    if (fetchError) {
      return NextResponse.json({ 
        error: "Failed to fetch agents", 
        details: fetchError.message 
      }, { status: 500 });
    }

    console.log(`Found ${allAgents?.length || 0} total agents`);

    // Step 3: Identify duplicates by name and remove them
    const nameGroups: { [key: string]: any[] } = {};
    allAgents?.forEach(agent => {
      if (!nameGroups[agent.name]) {
        nameGroups[agent.name] = [];
      }
      nameGroups[agent.name].push(agent);
    });

    const toDelete: number[] = [];
    const toKeep: any[] = [];
    const agentMappings: { [oldId: number]: number } = {}; // old agent id -> new agent id

    Object.entries(nameGroups).forEach(([name, agents]) => {
      if (agents.length > 1) {
        console.log(`Found ${agents.length} agents named "${name}"`);
        // Keep the most recent (first in array due to our sort)
        const keepAgent = agents[0];
        toKeep.push(keepAgent);
        
        // Mark others for deletion and create mapping
        agents.slice(1).forEach(agent => {
          console.log(`Marking for deletion: ${agent.name} (${agent.agent_id})`);
          toDelete.push(agent.id);
          agentMappings[agent.id] = keepAgent.id;
        });
      } else {
        toKeep.push(agents[0]);
      }
    });

    console.log(`Keeping ${toKeep.length} agents, deleting ${toDelete.length} duplicates`);

    // Step 4: Update interviews to use the kept agents before deleting duplicates
    if (toDelete.length > 0) {
      console.log("Updating interviews to use kept agents...");
      
      for (const [oldAgentId, newAgentId] of Object.entries(agentMappings)) {
        const { data: affectedInterviews, error: updateError } = await supabase
          .from("interview")
          .update({ interviewer_id: newAgentId })
          .eq('interviewer_id', parseInt(oldAgentId))
          .select('id');

        if (updateError) {
          console.error(`Error updating interviews for agent ${oldAgentId}:`, updateError);
        } else {
          console.log(`Updated ${affectedInterviews?.length || 0} interviews from agent ${oldAgentId} to ${newAgentId}`);
        }
      }

      // Step 5: Now delete the duplicate agents
      console.log("Deleting duplicate agents...");
      const { error: deleteError } = await supabase
        .from("interviewer")
        .delete()
        .in("id", toDelete);

      if (deleteError) {
        console.error("Error deleting duplicates:", deleteError);
        
        return NextResponse.json({ 
          error: "Failed to delete duplicates", 
          details: deleteError.message 
        }, { status: 500 });
      }
      console.log(`Successfully deleted ${toDelete.length} duplicate agents`);
    }

    // Step 6: If new columns don't exist, we'll need to simulate them in our sync logic
    // For now, let's just update the main schema file and inform the user
    if (!hasNewColumns) {
      console.log("Note: New columns (last_synced_at, sync_status) need to be added to database schema");
    }

    // Step 7: Get final state
    const { data: finalAgents, error: finalError } = await supabase
      .from("interviewer")
      .select("*")
      .order("created_at", { ascending: false });

    if (finalError) {
      console.error("Error fetching final state:", finalError);
    }

    console.log("Migration completed successfully");

    return NextResponse.json({
      success: true,
      message: `Migration completed: kept ${toKeep.length} agents, removed ${toDelete.length} duplicates`,
      duplicatesRemoved: toDelete.length,
      agentsKept: toKeep.length,
      hasNewColumns,
      needsSchemaUpdate: !hasNewColumns,
      finalAgents: finalAgents?.map(agent => ({
        id: agent.id,
        name: agent.name,
        agent_id: agent.agent_id,
        created_at: agent.created_at
      }))
    });

  } catch (error) {
    console.error("Migration failed:", error);
    
    return NextResponse.json(
      { 
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Check if migration is needed
    const { data: agents, error } = await supabase
      .from("interviewer")
      .select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check for duplicates
    const nameGroups: { [key: string]: any[] } = {};
    agents?.forEach(agent => {
      if (!nameGroups[agent.name]) {
        nameGroups[agent.name] = [];
      }
      nameGroups[agent.name].push(agent);
    });

    const duplicates = Object.entries(nameGroups)
      .filter(([_, group]) => group.length > 1)
      .map(([name, group]) => ({
        name,
        count: group.length,
        agents: group.map(a => ({ id: a.id, agent_id: a.agent_id, created_at: a.created_at }))
      }));

    // Check if new columns exist
    const hasNewColumns = agents?.length > 0 && 
      'last_synced_at' in agents[0] && 
      'sync_status' in agents[0];

    return NextResponse.json({
      migrationNeeded: !hasNewColumns || duplicates.length > 0,
      hasNewColumns,
      totalAgents: agents?.length || 0,
      duplicateGroups: duplicates.length,
      totalDuplicates: duplicates.reduce((sum, group) => sum + group.count - 1, 0),
      duplicateDetails: duplicates
    });

  } catch (error) {
    console.error("Error checking migration status:", error);
    
    return NextResponse.json(
      { error: "Failed to check migration status" },
      { status: 500 }
    );
  }
} 
