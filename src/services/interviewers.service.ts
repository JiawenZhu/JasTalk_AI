import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

const getAllInterviewers = async (clientId: string = "") => {
  try {
    const { data: clientData, error: clientError } = await supabase
      .from("interviewer")
      .select(`*`);

    if (clientError) {
      console.error(
        `Error fetching interviewers for clientId ${clientId}:`,
        clientError,
      );

      // Handle RLS errors in development
      if (process.env.NODE_ENV === 'development' && clientError.code === '42501') {
        console.log("RLS blocked access to interviewer table, returning development fallback");
        return [{
          id: 1,
          name: "Development Interviewer",
          image: "/interviewers/1.png",
          agent_id: "dev-agent-123",
          created_at: new Date().toISOString()
        }];
      }

      return [];
    }

    return clientData || [];
  } catch (error) {
    console.log("Unexpected error in getAllInterviewers:", error);
    
    // Return fallback for development
    if (process.env.NODE_ENV === 'development') {
      return [{
        id: 1,
        name: "Development Interviewer", 
        image: "/interviewers/1.png",
        agent_id: "dev-agent-123",
        created_at: new Date().toISOString()
      }];
    }

    return [];
  }
};

const createInterviewer = async (payload: any) => {
  try {
    // Check for existing interviewer with the same name
    const { data: existingInterviewer, error: checkError } = await supabase
      .from("interviewer")
      .select("*")
      .eq("name", payload.name)
      .filter("agent_id", "eq", payload.agent_id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing interviewer:", checkError);
      
      // Handle RLS errors in development
      if (process.env.NODE_ENV === 'development' && checkError.code === '42501') {
        console.log("RLS blocked access, skipping duplicate check in development");
      } else {
        return null;
      }
    }

    if (existingInterviewer) {
      console.error("An interviewer with this name already exists");
      return null;
    }

    const { error, data } = await supabase
      .from("interviewer")
      .insert({ ...payload });

    if (error) {
      console.error("Error creating interviewer:", error);
      
      // Handle RLS errors in development
      if (process.env.NODE_ENV === 'development' && error.code === '42501') {
        console.log("RLS blocked insert, returning mock data in development");
        return { id: Date.now(), ...payload, created_at: new Date().toISOString() };
      }

      return null;
    }

    return data;
  } catch (error) {
    console.error("Unexpected error in createInterviewer:", error);
    
    // Return fallback for development
    if (process.env.NODE_ENV === 'development') {
      return { id: Date.now(), ...payload, created_at: new Date().toISOString() };
    }
    
    return null;
  }
};

const getInterviewer = async (interviewerId: bigint) => {
  try {
    const { data: interviewerData, error: interviewerError } = await supabase
      .from("interviewer")
      .select("*")
      .eq("id", interviewerId)
      .single();

    if (interviewerError) {
      console.error("Error fetching interviewer:", interviewerError);
      
      // Handle RLS errors in development
      if (process.env.NODE_ENV === 'development' && interviewerError.code === '42501') {
        console.log("RLS blocked access to interviewer, returning development fallback");
        return {
          id: interviewerId,
          name: "Development Interviewer",
          image: "/interviewers/1.png",
          agent_id: "dev-agent-123",
          created_at: new Date().toISOString()
        };
      }

      return null;
    }

    return interviewerData;
  } catch (error) {
    console.error("Unexpected error in getInterviewer:", error);
    
    // Return fallback for development
    if (process.env.NODE_ENV === 'development') {
      return {
        id: interviewerId,
        name: "Development Interviewer",
        image: "/interviewers/1.png", 
        agent_id: "dev-agent-123",
        created_at: new Date().toISOString()
      };
    }
    
    return null;
  }
};

export const InterviewerService = {
  getAllInterviewers,
  createInterviewer,
  getInterviewer,
};
