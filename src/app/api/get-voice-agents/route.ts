import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const supabase = createServerClient();
    
    // Fetch active voice-enabled agents from database
    const { data: agents, error } = await supabase
      .from("interviewer")
      .select("*")
      .eq('sync_status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching voice agents:", error);
      return NextResponse.json(
        { error: "Failed to fetch voice agents" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      agents: agents || []
    });

  } catch (error) {
    console.error("Error in get-voice-agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch voice agents" },
      { status: 500 }
    );
  }
} 
