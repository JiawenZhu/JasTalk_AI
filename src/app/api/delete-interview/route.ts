import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get('id');

    if (!interviewId) {
      return NextResponse.json(
        { error: "Interview ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // First, verify the user has permission to delete this interview
    const { data: interview, error: fetchError } = await supabase
      .from("interview")
      .select("id, name, organization_id, user_id")
      .eq('id', interviewId)
      .single();

    if (fetchError) {
      console.error("Error fetching interview:", fetchError);
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    if (!interview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }

    // Get current user information
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // In development mode, provide a fallback user if authentication fails
    let currentUser = user;
    if ((!user || userError) && process.env.NODE_ENV === 'development') {
      console.log('Using development fallback user due to auth error:', userError?.message);
      currentUser = {
        id: 'test-user-123',
        email: 'test@example.com',
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {}
      } as any;
    } else if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user belongs to the same organization or is the owner
    const { data: userData, error: userDataError } = await supabase
      .from("user")
      .select("organization_id")
      .eq('id', currentUser.id)
      .single();

    // In development mode, provide fallback user data
    let currentUserData = userData;
    if ((!userData || userDataError) && process.env.NODE_ENV === 'development') {
      console.log('Using development fallback user data due to error:', userDataError?.message);
      currentUserData = {
        organization_id: 'test-org-123'
      };
    } else if (userDataError || !userData) {
      console.error('User data error:', userDataError);
      return NextResponse.json(
        { error: "User data not found" },
        { status: 403 }
      );
    }

    // Verify access permissions
    const hasAccess = 
      currentUserData.organization_id === interview.organization_id ||
      currentUser.id === interview.user_id;

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have permission to delete this interview" },
        { status: 403 }
      );
    }

    // Start deletion process
    console.log(`Starting deletion of interview: ${interview.name} (${interviewId})`);
    console.log(`Interview belongs to organization: ${interview.organization_id}, user: ${interview.user_id}`);
    console.log(`Current user: ${currentUser.id}, organization: ${currentUserData.organization_id}`);

    // Step 1: Delete coding submissions for this interview
    // First get all response IDs for this interview
    const { data: responses, error: responsesError } = await supabase
      .from("response")
      .select("id")
      .eq('interview_id', interviewId);

    if (responsesError) {
      console.error("Error fetching responses:", responsesError);
      console.error("Response fetch error details:", responsesError.details, responsesError.hint);
    } else if (responses && responses.length > 0) {
      const responseIds = responses.map(r => r.id);
      
      // Delete coding submissions for these responses
      const { error: codingSubmissionsError } = await supabase
        .from("coding_submission")
        .delete()
        .in('response_id', responseIds);

      if (codingSubmissionsError) {
        console.error("Error deleting coding submissions:", codingSubmissionsError);
        console.error("Coding submissions delete error details:", codingSubmissionsError.details, codingSubmissionsError.hint);
        return NextResponse.json(
          { error: "Failed to delete coding submissions", details: codingSubmissionsError.message },
          { status: 500 }
        );
      }
      console.log(`Deleted coding submissions for ${responseIds.length} responses`);
    }

    // Step 2: Delete responses for this interview
    const { error: responsesDeleteError } = await supabase
      .from("response")
      .delete()
      .eq('interview_id', interviewId);

    if (responsesDeleteError) {
      console.error("Error deleting responses:", responsesDeleteError);
      console.error("Response delete error details:", responsesDeleteError.details, responsesDeleteError.hint);
      return NextResponse.json(
        { error: "Failed to delete interview responses", details: responsesDeleteError.message },
        { status: 500 }
      );
    }
    console.log("Deleted interview responses");

    // Step 3: Delete feedback for this interview
    const { error: feedbackDeleteError } = await supabase
      .from("feedback")
      .delete()
      .eq('interview_id', interviewId);

    if (feedbackDeleteError) {
      console.error("Error deleting feedback:", feedbackDeleteError);
      console.error("Feedback delete error details:", feedbackDeleteError.details, feedbackDeleteError.hint);
      return NextResponse.json(
        { error: "Failed to delete interview feedback", details: feedbackDeleteError.message },
        { status: 500 }
      );
    }
    console.log("Deleted interview feedback");

    // Step 4: Delete interview coding questions (CASCADE should handle this automatically)
    const { error: codingQuestionsDeleteError } = await supabase
      .from("interview_coding_question")
      .delete()
      .eq('interview_id', interviewId);

    if (codingQuestionsDeleteError) {
      console.error("Error deleting interview coding questions:", codingQuestionsDeleteError);
      // Continue even if this fails since it might be CASCADE handled
    }
    console.log("Deleted interview coding questions");

    // Step 5: Finally delete the interview itself
    const { error: interviewDeleteError } = await supabase
      .from("interview")
      .delete()
      .eq('id', interviewId);

    if (interviewDeleteError) {
      console.error("Error deleting interview:", interviewDeleteError);
      console.error("Interview delete error details:", interviewDeleteError.details, interviewDeleteError.hint);
      return NextResponse.json(
        { error: "Failed to delete interview", details: interviewDeleteError.message },
        { status: 500 }
      );
    }

    console.log(`Successfully deleted interview: ${interview.name} (${interviewId})`);

    return NextResponse.json({
      success: true,
      message: `Interview "${interview.name}" has been successfully deleted`,
      deletedInterview: {
        id: interviewId,
        name: interview.name
      }
    });

  } catch (error) {
    console.error("Error deleting interview:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { 
        error: "Failed to delete interview",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    service: "Interview Deletion API",
    status: "healthy",
    timestamp: new Date().toISOString()
  });
} 
