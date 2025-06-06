import { NextResponse } from "next/server";
import Retell from "retell-sdk";
import { createServerClient } from "@/lib/supabase";

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    const supabase = createServerClient();

    switch (action) {
      case 'status':
        return await getAgentStatus(supabase);
      case 'orphaned':
        return await getOrphanedAgents(supabase);
      case 'duplicates':
        return await getDuplicateAgents(supabase);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in agent management:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { action, agent_ids } = await req.json();
    const supabase = createServerClient();

    switch (action) {
      case 'cleanup-orphaned':
        return await cleanupOrphanedAgents(supabase, agent_ids);
      case 'force-sync':
        return await forceSyncAgent(supabase, agent_ids);
      case 'delete-duplicates':
        return await deleteDuplicateAgents(supabase, agent_ids);
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in agent management:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

async function getAgentStatus(supabase: any) {
  const { data: agents, error } = await supabase
    .from("interviewer")
    .select("*")
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const statusCounts = {
    active: agents?.filter((a: any) => a.sync_status === 'active').length || 0,
    orphaned: agents?.filter((a: any) => a.sync_status === 'orphaned').length || 0,
    unknown: agents?.filter((a: any) => !a.sync_status).length || 0,
    total: agents?.length || 0
  };

  return NextResponse.json({
    success: true,
    statusCounts,
    agents: agents?.map((agent: any) => ({
      id: agent.id,
      agent_id: agent.agent_id,
      name: agent.name,
      sync_status: agent.sync_status || 'unknown',
      last_synced_at: agent.last_synced_at,
      created_at: agent.created_at
    }))
  });
}

async function getOrphanedAgents(supabase: any) {
  const { data: orphanedAgents, error } = await supabase
    .from("interviewer")
    .select("*")
    .eq('sync_status', 'orphaned')
    .order('last_synced_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    count: orphanedAgents?.length || 0,
    agents: orphanedAgents
  });
}

async function getDuplicateAgents(supabase: any) {
  // Find agents with duplicate names
  const { data: agents, error } = await supabase
    .from("interviewer")
    .select("*")
    .order('name', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const nameGroups: { [key: string]: any[] } = {};
  agents?.forEach((agent: any) => {
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
      agents: group
    }));

  return NextResponse.json({
    success: true,
    duplicateGroups: duplicates,
    totalDuplicates: duplicates.reduce((sum, group) => sum + group.count - 1, 0)
  });
}

async function cleanupOrphanedAgents(supabase: any, agentIds?: string[]) {
  let query = supabase.from("interviewer").delete();
  
  if (agentIds && agentIds.length > 0) {
    query = query.in('agent_id', agentIds);
  } else {
    // Default: clean up orphaned agents older than 24 hours
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);
    query = query.eq('sync_status', 'orphaned').lt('last_synced_at', cutoff.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Cleaned up ${agentIds?.length || 'old orphaned'} agents`,
    deletedCount: data?.length || 0
  });
}

async function forceSyncAgent(supabase: any, agentIds: string[]) {
  if (!agentIds || agentIds.length === 0) {
    return NextResponse.json({ error: "No agent IDs provided" }, { status: 400 });
  }

  const results = [];
  
  for (const agentId of agentIds) {
    try {
      // Check if agent exists in Retell AI
      const retellAgent = await retellClient.agent.retrieve(agentId);
      
      // Update the database record
      const { error: updateError } = await supabase
        .from("interviewer")
        .update({
          name: retellAgent.agent_name,
          sync_status: 'active',
          last_synced_at: new Date().toISOString()
        })
        .eq('agent_id', agentId);

      if (updateError) {
        results.push({
          agent_id: agentId,
          success: false,
          error: updateError.message
        });
      } else {
        results.push({
          agent_id: agentId,
          success: true,
          name: retellAgent.agent_name
        });
      }
    } catch (error: any) {
      if (error.status === 404) {
        // Mark as orphaned
        await supabase
          .from("interviewer")
          .update({
            sync_status: 'orphaned',
            last_synced_at: new Date().toISOString()
          })
          .eq('agent_id', agentId);

        results.push({
          agent_id: agentId,
          success: false,
          error: "Agent not found in Retell AI - marked as orphaned"
        });
      } else {
        results.push({
          agent_id: agentId,
          success: false,
          error: error.message
        });
      }
    }
  }

  return NextResponse.json({
    success: true,
    results,
    successCount: results.filter(r => r.success).length,
    errorCount: results.filter(r => !r.success).length
  });
}

async function deleteDuplicateAgents(supabase: any, agentIds: string[]) {
  if (!agentIds || agentIds.length === 0) {
    return NextResponse.json({ error: "No agent IDs provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("interviewer")
    .delete()
    .in('agent_id', agentIds);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Deleted ${agentIds.length} duplicate agents`,
    deletedCount: data?.length || 0
  });
} 
