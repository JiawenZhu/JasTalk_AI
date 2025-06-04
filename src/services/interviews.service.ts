import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const getAllInterviews = async (userId: string, organizationId: string) => {
  try {
    const { data: clientData, error: clientError } = await supabase
      .from("interview")
      .select(`*`)
      .or(`organization_id.eq.${organizationId},user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    return [...(clientData || [])];
  } catch (error) {
    console.log(error);

    return [];
  }
};

const getInterviewById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from("interview")
      .select(`*`)
      .or(`id.eq.${id},readable_slug.eq.${id}`);

    return data ? data[0] : null;
  } catch (error) {
    console.log(error);

    return [];
  }
};

const updateInterview = async (payload: any, id: string) => {
  const { error, data } = await supabase
    .from("interview")
    .update({ ...payload })
    .eq("id", id);
  if (error) {
    console.log(error);

    return [];
  }

  return data;
};

const deleteInterview = async (id: string) => {
  const { error, data } = await supabase
    .from("interview")
    .delete()
    .eq("id", id);
  if (error) {
    console.log(error);

    return [];
  }

  return data;
};

const getAllRespondents = async (interviewId: string) => {
  try {
    const { data, error } = await supabase
      .from("interview")
      .select(`respondents`)
      .eq("interview_id", interviewId);

    return data || [];
  } catch (error) {
    console.log(error);

    return [];
  }
};

const createInterview = async (payload: any) => {
  console.log('Creating interview with payload:', payload);
  
  // Validate required fields
  if (!payload.organization_id) {
    console.error('Error: Missing organization_id');
    throw new Error('Missing organization_id');
  }
  
  if (!payload.user_id) {
    console.error('Error: Missing user_id');
    throw new Error('Missing user_id');
  }

  const { error, data } = await supabase
    .from("interview")
    .insert({ ...payload });
    
  if (error) {
    console.error('Database error creating interview:', error);
    throw error;
  }

  return data;
};

const deactivateInterviewsByOrgId = async (organizationId: string) => {
  try {
    const { error } = await supabase
      .from("interview")
      .update({ is_active: false })
      .eq("organization_id", organizationId)
      .eq("is_active", true); // Optional: only update if currently active

    if (error) {
      console.error("Failed to deactivate interviews:", error);
    }
  } catch (error) {
    console.error("Unexpected error disabling interviews:", error);
  }
};

export const InterviewService = {
  getAllInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
  getAllRespondents,
  createInterview,
  deactivateInterviewsByOrgId,
};
