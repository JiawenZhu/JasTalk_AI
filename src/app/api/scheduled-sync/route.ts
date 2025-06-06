import { NextResponse } from "next/server";

/**
 * Scheduled sync endpoint that can be called by cron jobs or external schedulers
 * This endpoint triggers the enhanced voice-enabled agent sync
 */
export async function POST(req: Request) {
  try {
    console.log("Starting scheduled agent sync...");

    // Verify authorization (optional - add your own auth logic)
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.SYNC_AUTH_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      console.error("Unauthorized scheduled sync attempt");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the base URL for internal API calls
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Call the sync endpoint
    const syncResponse = await fetch(`${baseUrl}/api/sync-retell-agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!syncResponse.ok) {
      const errorData = await syncResponse.json();
      console.error("Sync failed:", errorData);
      return NextResponse.json(
        { 
          error: "Scheduled sync failed",
          details: errorData 
        },
        { status: 500 }
      );
    }

    const syncResult = await syncResponse.json();
    
    console.log("Scheduled sync completed successfully");
    console.log(`Created: ${syncResult.created?.length || 0}`);
    console.log(`Updated: ${syncResult.updated?.length || 0}`);
    console.log(`Skipped: ${syncResult.skipped?.length || 0}`);
    console.log(`Orphaned: ${syncResult.orphaned?.length || 0}`);
    console.log(`Errors: ${syncResult.errors?.length || 0}`);

    // Optionally run audit after sync
    const auditResponse = await fetch(`${baseUrl}/api/audit-agents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let auditResult = null;
    if (auditResponse.ok) {
      auditResult = await auditResponse.json();
      console.log(`Post-sync health score: ${auditResult.audit_report?.health_score || 'unknown'}/100`);
    }

    return NextResponse.json({
      success: true,
      message: "Scheduled sync completed",
      sync_result: syncResult,
      audit_result: auditResult?.audit_report || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in scheduled sync:", error);
    return NextResponse.json(
      { 
        error: "Scheduled sync failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check sync status and schedule information
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    if (action === 'status') {
      // Return sync status information
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      
      const auditResponse = await fetch(`${baseUrl}/api/audit-agents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!auditResponse.ok) {
        return NextResponse.json(
          { error: "Failed to get sync status" },
          { status: 500 }
        );
      }

      const auditResult = await auditResponse.json();
      
      return NextResponse.json({
        success: true,
        status: {
          last_check: new Date().toISOString(),
          health_score: auditResult.audit_report?.health_score || 0,
          discrepancies: auditResult.audit_report?.discrepancies?.length || 0,
          recommendations: auditResult.audit_report?.recommendations || []
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: "Scheduled sync endpoint",
      endpoints: {
        "POST /api/scheduled-sync": "Trigger scheduled sync",
        "GET /api/scheduled-sync?action=status": "Get sync status"
      },
      environment: {
        auth_required: !!process.env.SYNC_AUTH_TOKEN,
        base_url: process.env.NEXTAUTH_URL || 'http://localhost:3000'
      }
    });

  } catch (error) {
    console.error("Error in scheduled sync GET:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 
