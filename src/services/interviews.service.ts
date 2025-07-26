import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client lazily to avoid build-time errors
let supabaseClient: any = null;

const getSupabaseClient = () => {
  if (supabaseClient) {
    return supabaseClient;
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase configuration");
  }
  
  supabaseClient = createClient(supabaseUrl, supabaseKey);
  
  return supabaseClient;
};

const getAllInterviews = async (userId: string) => {
  try {
    const supabase = getSupabaseClient();
    const { data: clientData, error: clientError } = await supabase
      .from("interviews")
      .select(`*`)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // Handle missing table in development
    if (clientError && process.env.NODE_ENV === 'development') {
      console.log("Development mode: Using mock interviews data");
      
      return [];
    }

    return [...(clientData || [])];
  } catch (error) {
    console.log(error);

    return [];
  }
};

const getInterviewById = async (id: string) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("interviews")
      .select(`*`)
      .eq("id", id)
      .single();

    return data;
  } catch (error) {
    console.log(error);

    return null;
  }
};

const updateInterview = async (payload: any, id: string) => {
  const supabase = getSupabaseClient();
  const { error, data } = await supabase
    .from("interviews")
    .update({ ...payload })
    .eq("id", id);
  if (error) {
    console.log(error);

    return null;
  }

  return data;
};

const deleteInterview = async (id: string) => {
  const supabase = getSupabaseClient();
  const { error, data } = await supabase
    .from("interviews")
    .delete()
    .eq("id", id);
  if (error) {
    console.log(error);

    return null;
  }

  return data;
};

const getAllRespondents = async (interviewId: string) => {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("responses")
      .select(`*`)
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
  if (!payload.user_id) {
    console.error('Error: Missing user_id');
    throw new Error('Missing user_id');
  }

  const supabase = getSupabaseClient();
  const { error, data } = await supabase
    .from("interviews")
    .insert({ ...payload });
    
  if (error) {
    console.error('Database error creating interview:', error);
    
    // Handle missing table in development
    if (process.env.NODE_ENV === 'development') {
      console.log("Development mode: Using mock interview creation");
      
      return [{
        id: `mock-interview-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString()
      }];
    }
    
    throw error;
  }

  return data;
};



export const InterviewService = {
  getAllInterviews,
  getInterviewById,
  updateInterview,
  deleteInterview,
  getAllRespondents,
  createInterview,
};
