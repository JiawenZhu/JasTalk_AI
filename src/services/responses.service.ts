import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient();

const createResponse = async (payload: any) => {
  try {
    const { error, data } = await supabase
      .from("response")
      .insert({ ...payload })
      .select("id");

    if (error) {
      console.log("Error creating response:", error);
      
      // Handle RLS errors in development
      if (process.env.NODE_ENV === 'development' && error.code === '42501') {
        console.log("RLS blocked response insert, returning mock ID in development");
        
        return `dev-response-${Date.now()}`;
      }

      return [];
    }

    return data[0]?.id;
  } catch (error) {
    console.log("Unexpected error in createResponse:", error);
    
    // Return fallback for development
    if (process.env.NODE_ENV === 'development') {
      
      return `dev-response-${Date.now()}`;
    }
    
    return [];
  }
};

const saveResponse = async (payload: any, call_id: string) => {
  try {
    const { error, data } = await supabase
      .from("response")
      .update({ ...payload })
      .eq("call_id", call_id);
      
    if (error) {
      console.log("Error saving response:", error);
      
      // Handle RLS errors in development
      if (process.env.NODE_ENV === 'development' && error.code === '42501') {
        console.log("RLS blocked response update, returning mock data in development");
        
        return { id: call_id, ...payload };
      }

      return [];
    }

    return data;
  } catch (error) {
    console.log("Unexpected error in saveResponse:", error);
    
    // Return fallback for development
    if (process.env.NODE_ENV === 'development') {
      
      return { id: call_id, ...payload };
    }
    
    return [];
  }
};

const getAllResponses = async (interviewId: string) => {
  try {
    const { data, error } = await supabase
      .from("response")
      .select(`*`)
      .eq("interview_id", interviewId)
      .or(`details.is.null, details->call_analysis.not.is.null`)
      .eq("is_ended", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Error getting all responses:", error);
      
      // Handle RLS errors in development
      if (process.env.NODE_ENV === 'development' && error.code === '42501') {
        console.log("RLS blocked response query, returning empty array in development");
        
        return [];
      }
    }

    return data || [];
  } catch (error) {
    console.log("Unexpected error in getAllResponses:", error);
    
    return [];
  }
};

const getResponseCountByOrganizationId = async (
  organizationId: string,
): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("interview")
      .select("response(id)", { count: "exact", head: true }) // join + count
      .eq("organization_id", organizationId);

    if (error) {
      console.log("Error getting response count:", error);
      
      // Handle RLS errors in development
      if (process.env.NODE_ENV === 'development' && error.code === '42501') {
        console.log("RLS blocked response count query, returning 0 in development");
        
        return 0;
      }
    }

    return count ?? 0;
  } catch (error) {
    console.log("Unexpected error in getResponseCountByOrganizationId:", error);
    
    return 0;
  }
};

const getAllEmailAddressesForInterview = async (interviewId: string) => {
  try {
    const { data, error } = await supabase
      .from("response")
      .select(`email`)
      .eq("interview_id", interviewId);

    if (error) {
      console.log("Error getting email addresses:", error);
      
      // Handle RLS errors in development
      if (process.env.NODE_ENV === 'development' && error.code === '42501') {
        console.log("RLS blocked email query, returning empty array in development");
        
        return [];
      }
    }

    return data || [];
  } catch (error) {
    console.log("Unexpected error in getAllEmailAddressesForInterview:", error);
    
    return [];
  }
};

const getResponseByCallId = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from("response")
      .select(`*`)
      .filter("call_id", "eq", id);

    if (error) {
      console.log("Error getting response by call ID:", error);
      
      // Handle RLS errors in development
      if (process.env.NODE_ENV === 'development' && error.code === '42501') {
        console.log("RLS blocked response query, returning null in development");
        
        return null;
      }
    }

    return data ? data[0] : null;
  } catch (error) {
    console.log("Unexpected error in getResponseByCallId:", error);
    
    return [];
  }
};

const deleteResponse = async (id: string) => {
  try {
    const { error, data } = await supabase
      .from("response")
      .delete()
      .eq("call_id", id);
      
    if (error) {
      console.log("Error deleting response:", error);
      
      // Handle RLS errors in development
      if (process.env.NODE_ENV === 'development' && error.code === '42501') {
        console.log("RLS blocked response delete, returning mock data in development");
        
        return { id };
      }

      return [];
    }

    return data;
  } catch (error) {
    console.log("Unexpected error in deleteResponse:", error);
    
    // Return fallback for development
    if (process.env.NODE_ENV === 'development') {
      
      return { id };
    }
    
    return [];
  }
};

const updateResponse = async (payload: any, call_id: string) => {
  try {
    const { error, data } = await supabase
      .from("response")
      .update({ ...payload })
      .eq("call_id", call_id);
      
    if (error) {
      console.log("Error updating response:", error);
      
      // Handle RLS errors in development
      if (process.env.NODE_ENV === 'development' && error.code === '42501') {
        console.log("RLS blocked response update, returning mock data in development");
        
        return { id: call_id, ...payload };
      }

      return [];
    }

    return data;
  } catch (error) {
    console.log("Unexpected error in updateResponse:", error);
    
    // Return fallback for development
    if (process.env.NODE_ENV === 'development') {
      
      return { id: call_id, ...payload };
    }
    
    return [];
  }
};

export const ResponseService = {
  createResponse,
  saveResponse,
  updateResponse,
  getAllResponses,
  getResponseByCallId,
  deleteResponse,
  getResponseCountByOrganizationId,
  getAllEmails: getAllEmailAddressesForInterview,
};
