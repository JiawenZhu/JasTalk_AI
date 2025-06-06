import { NextResponse } from "next/server";
import Retell from "retell-sdk";
import { createServerClient } from "@/lib/supabase";

const retellClient = new Retell({
  apiKey: process.env.RETELL_API_KEY || "",
});

interface AgentDiscrepancy {
  agent_id: string;
  name: string;
  voice_id?: string;
  status: 'missing_in_db' | 'missing_in_retell' | 'voice_mismatch' | 'orphaned';
  details: string;
  last_synced?: string;
}

interface AuditReport {
  timestamp: string;
  summary: {
    total_retell_agents: number;
    voice_enabled_retell_agents: number;
    total_database_agents: number;
    active_database_agents: number;
    orphaned_database_agents: number;
    sync_discrepancies: number;
  };
  discrepancies: AgentDiscrepancy[];
  recommendations: string[];
  health_score: number; // 0-100 based on sync quality
}

/**
 * Calculates a health score based on sync quality
 */
function calculateHealthScore(
  voiceEnabledCount: number,
  activeDbCount: number,
  discrepancyCount: number
): number {
  if (voiceEnabledCount === 0) return 100; // No agents to sync
  
  const syncRatio = activeDbCount / voiceEnabledCount;
  const discrepancyPenalty = (discrepancyCount / voiceEnabledCount) * 50;
  
  const baseScore = Math.min(syncRatio * 100, 100);
  const finalScore = Math.max(baseScore - discrepancyPenalty, 0);
  
  return Math.round(finalScore);
}

/**
 * Generates recommendations based on audit findings
 */
function generateRecommendations(discrepancies: AgentDiscrepancy[]): string[] {
  const recommendations: string[] = [];
  
  const missingInDb = discrepancies.filter(d => d.status === 'missing_in_db').length;
  const orphaned = discrepancies.filter(d => d.status === 'orphaned').length;
  const voiceMismatch = discrepancies.filter(d => d.status === 'voice_mismatch').length;
  
  if (missingInDb > 0) {
    recommendations.push(
      `Run sync operation to add ${missingInDb} voice-enabled agent(s) from Retell AI to the database.`
    );
  }
  
  if (orphaned > 0) {
    recommendations.push(
      `Review ${orphaned} orphaned agent(s) in the database. Consider removing them if they're no longer needed.`
    );
  }
  
  if (voiceMismatch > 0) {
    recommendations.push(
      `Investigate ${voiceMismatch} agent(s) with voice configuration mismatches.`
    );
  }
  
  if (discrepancies.length === 0) {
    recommendations.push("All agents are properly synchronized. No action required.");
  } else {
    recommendations.push(
      "Consider setting up automated sync webhooks to prevent future discrepancies."
    );
  }
  
  return recommendations;
}

export async function GET(req: Request) {
  try {
    console.log("Starting agent audit...");

    // Validate environment variables
    if (!process.env.RETELL_API_KEY) {
      return NextResponse.json(
        { error: "Retell API key not configured" },
        { status: 500 }
      );
    }

    const supabase = createServerClient();
    const discrepancies: AgentDiscrepancy[] = [];

    // Step 1: Fetch all agents from Retell AI
    console.log("Fetching agents from Retell AI...");
    let retellAgents: any[] = [];
    try {
      retellAgents = await retellClient.agent.list();
      console.log(`Found ${retellAgents.length} total agents in Retell AI`);
    } catch (error) {
      console.error("Failed to fetch agents from Retell AI:", error);
      return NextResponse.json(
        { error: "Failed to connect to Retell AI" },
        { status: 500 }
      );
    }

    // Filter voice-enabled agents
    const voiceEnabledAgents = retellAgents.filter(agent => agent.voice_id);
    console.log(`Found ${voiceEnabledAgents.length} voice-enabled agents in Retell AI`);

    // Step 2: Get all agents from database
    const { data: databaseAgents, error: fetchError } = await supabase
      .from("interviewer")
      .select("*");

    if (fetchError) {
      console.error("Error fetching agents from database:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch agents from database" },
        { status: 500 }
      );
    }

    console.log(`Found ${databaseAgents?.length || 0} agents in database`);

    // Create lookup maps
    const retellAgentMap = new Map(voiceEnabledAgents.map(agent => [agent.agent_id, agent]));
    const databaseAgentMap = new Map(databaseAgents?.map(agent => [agent.agent_id, agent]) || []);

    // Step 3: Find agents in Retell AI but missing from database
    for (const retellAgent of voiceEnabledAgents) {
      // Check if agent name suggests it's for interviews
      const name = retellAgent.agent_name?.toLowerCase() || '';
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
        continue; // Skip non-interview agents
      }

      const dbAgent = databaseAgentMap.get(retellAgent.agent_id);
      
      if (!dbAgent) {
        discrepancies.push({
          agent_id: retellAgent.agent_id,
          name: retellAgent.agent_name,
          voice_id: retellAgent.voice_id,
          status: 'missing_in_db',
          details: `Voice-enabled agent exists in Retell AI but not in database. Voice ID: ${retellAgent.voice_id}`
        });
      }
    }

    // Step 4: Find agents in database but missing from Retell AI or orphaned
    for (const dbAgent of databaseAgents || []) {
      const retellAgent = retellAgentMap.get(dbAgent.agent_id);
      
      if (!retellAgent) {
        discrepancies.push({
          agent_id: dbAgent.agent_id,
          name: dbAgent.name,
          status: dbAgent.sync_status === 'orphaned' ? 'orphaned' : 'missing_in_retell',
          details: dbAgent.sync_status === 'orphaned' 
            ? 'Agent marked as orphaned - no longer exists in Retell AI or lacks voice'
            : 'Agent exists in database but not found in Retell AI voice-enabled agents',
          last_synced: dbAgent.last_synced_at
        });
      } else {
        // Agent exists in both - check for voice configuration issues
        if (!retellAgent.voice_id && dbAgent.sync_status === 'active') {
          discrepancies.push({
            agent_id: dbAgent.agent_id,
            name: dbAgent.name,
            status: 'voice_mismatch',
            details: 'Agent exists in both systems but Retell agent lacks voice configuration',
            last_synced: dbAgent.last_synced_at
          });
        }
      }
    }

    // Step 5: Calculate summary statistics
    const activeDbAgents = databaseAgents?.filter(agent => agent.sync_status === 'active') || [];
    const orphanedDbAgents = databaseAgents?.filter(agent => agent.sync_status === 'orphaned') || [];

    const summary = {
      total_retell_agents: retellAgents.length,
      voice_enabled_retell_agents: voiceEnabledAgents.length,
      total_database_agents: databaseAgents?.length || 0,
      active_database_agents: activeDbAgents.length,
      orphaned_database_agents: orphanedDbAgents.length,
      sync_discrepancies: discrepancies.length
    };

    // Step 6: Generate recommendations and health score
    const recommendations = generateRecommendations(discrepancies);
    const healthScore = calculateHealthScore(
      voiceEnabledAgents.length,
      activeDbAgents.length,
      discrepancies.length
    );

    const auditReport: AuditReport = {
      timestamp: new Date().toISOString(),
      summary,
      discrepancies,
      recommendations,
      health_score: healthScore
    };

    // Log audit results
    console.log("\n=== AGENT AUDIT REPORT ===");
    console.log(`Health Score: ${healthScore}/100`);
    console.log(`Total Retell Agents: ${summary.total_retell_agents}`);
    console.log(`Voice-Enabled Retell Agents: ${summary.voice_enabled_retell_agents}`);
    console.log(`Active Database Agents: ${summary.active_database_agents}`);
    console.log(`Orphaned Database Agents: ${summary.orphaned_database_agents}`);
    console.log(`Sync Discrepancies: ${summary.sync_discrepancies}`);
    
    if (discrepancies.length > 0) {
      console.log("\nDiscrepancies Found:");
      discrepancies.forEach(d => {
        console.log(`- [${d.status.toUpperCase()}] ${d.name} (${d.agent_id}): ${d.details}`);
      });
    }
    
    console.log("\nRecommendations:");
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.log("=== END AUDIT REPORT ===\n");

    return NextResponse.json({
      success: true,
      audit_report: auditReport
    });

  } catch (error) {
    console.error("Error during agent audit:", error);
    return NextResponse.json(
      { error: "Failed to perform agent audit" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    
    if (action === 'cleanup_orphaned') {
      return await cleanupOrphanedAgents();
    }
    
    return NextResponse.json(
      { error: "Invalid action. Supported actions: cleanup_orphaned" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing audit action:", error);
    return NextResponse.json(
      { error: "Failed to process audit action" },
      { status: 500 }
    );
  }
}

async function cleanupOrphanedAgents() {
  try {
    const supabase = createServerClient();
    
    // Get orphaned agents older than 7 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    const { data: orphanedAgents, error: fetchError } = await supabase
      .from("interviewer")
      .select("*")
      .eq('sync_status', 'orphaned')
      .lt('last_synced_at', cutoffDate.toISOString());
    
    if (fetchError) {
      console.error("Error fetching orphaned agents:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }
    
    if (!orphanedAgents || orphanedAgents.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No orphaned agents older than 7 days found",
        cleaned_count: 0
      });
    }
    
    // Delete orphaned agents
    const { error: deleteError } = await supabase
      .from("interviewer")
      .delete()
      .eq('sync_status', 'orphaned')
      .lt('last_synced_at', cutoffDate.toISOString());
    
    if (deleteError) {
      console.error("Error deleting orphaned agents:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    console.log(`Cleaned up ${orphanedAgents.length} orphaned agents`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${orphanedAgents.length} orphaned agents`,
      cleaned_count: orphanedAgents.length,
      cleaned_agents: orphanedAgents.map(agent => ({
        agent_id: agent.agent_id,
        name: agent.name,
        last_synced: agent.last_synced_at
      }))
    });
    
  } catch (error) {
    console.error("Error in cleanupOrphanedAgents:", error);
    return NextResponse.json(
      { error: "Failed to cleanup orphaned agents" },
      { status: 500 }
    );
  }
} 
