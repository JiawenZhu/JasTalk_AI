import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createServerClient } from "@/lib/supabase";

const supabase = typeof window !== 'undefined' ? createClientComponentClient() : createServerClient();

const updateOrganization = async (payload: any, id: string) => {
  try {
    const { error, data } = await supabase
      .from("organization")
      .update({ ...payload })
      .eq("id", id);
    
    if (error) {
      console.log("Error updating organization:", error);
      // In development, return a mock response if RLS blocks access
      if (process.env.NODE_ENV === 'development' && error.code === '42501') {
        return { id, ...payload };
      }
      return [];
    }

    return data;
  } catch (error) {
    console.log("Unexpected error updating organization:", error);
    return [];
  }
};

const getClientById = async (
  id: string,
  email?: string | null,
  organization_id?: string | null,
) => {
  try {
    const { data, error } = await supabase
      .from("user")
      .select(`*`)
      .filter("id", "eq", id);

    // Handle RLS errors in development
    if (error && process.env.NODE_ENV === 'development' && error.code === '42501') {
      console.log("RLS blocked access to user table, returning development fallback");
      return {
        id,
        email,
        organization_id,
        created_at: new Date().toISOString()
      };
    }

    if (error) {
      console.log("Error fetching user:", error);
      return [];
    }

    if (!data || (data.length === 0 && email)) {
      const { error: insertError, data: insertData } = await supabase
        .from("user")
        .insert({ id: id, email: email, organization_id: organization_id });

      if (insertError) {
        console.log("Error inserting user:", insertError);
        // Return fallback for development
        if (process.env.NODE_ENV === 'development') {
          return {
            id,
            email,
            organization_id,
            created_at: new Date().toISOString()
          };
        }
        return [];
      }

      return insertData ? insertData[0] : null;
    }

    if (data[0]?.organization_id !== organization_id) {
      const { error: updateError, data: updateData } = await supabase
        .from("user")
        .update({ organization_id: organization_id })
        .eq("id", id);

      if (updateError) {
        console.log("Error updating user organization:", updateError);
        return data[0]; // Return existing data if update fails
      }

      return updateData ? updateData[0] : data[0];
    }

    return data ? data[0] : null;
  } catch (error) {
    console.log("Unexpected error in getClientById:", error);
    // Return fallback for development
    if (process.env.NODE_ENV === 'development') {
      return {
        id,
        email,
        organization_id,
        created_at: new Date().toISOString()
      };
    }
    return [];
  }
};

const getOrganizationById = async (
  organization_id?: string,
  organization_name?: string,
) => {
  try {
    const { data, error } = await supabase
      .from("organization")
      .select(`*`)
      .filter("id", "eq", organization_id);

    // Handle RLS errors in development
    if (error && process.env.NODE_ENV === 'development' && error.code === '42501') {
      console.log("RLS blocked access to organization table, returning development fallback");
      return {
        id: organization_id,
        name: organization_name || 'Development Organization',
        plan: 'free',
        allowed_responses_count: 10,
        created_at: new Date().toISOString()
      };
    }

    if (error) {
      console.log("Error fetching organization:", error);
      return [];
    }

    if (!data || data.length === 0) {
      const { error: insertError, data: insertData } = await supabase
        .from("organization")
        .insert({ id: organization_id, name: organization_name });

      if (insertError) {
        console.log("Error inserting organization:", insertError);
        // Return fallback for development - table might not exist
        if (process.env.NODE_ENV === 'development') {
          console.log("Development mode: Using mock organization data");
          return {
            id: organization_id,
            name: organization_name || 'Development Organization',
            plan: 'free',
            allowed_responses_count: 10,
            created_at: new Date().toISOString()
          };
        }
        return [];
      }

      return insertData ? insertData[0] : null;
    }

    if (organization_name && data[0]?.name !== organization_name) {
      const { error: updateError, data: updateData } = await supabase
        .from("organization")
        .update({ name: organization_name })
        .eq("id", organization_id);

      if (updateError) {
        console.log("Error updating organization name:", updateError);
        return data[0]; // Return existing data if update fails
      }

      return updateData ? updateData[0] : data[0];
    }

    return data ? data[0] : null;
  } catch (error) {
    console.log("Unexpected error in getOrganizationById:", error);
    // Return fallback for development
    if (process.env.NODE_ENV === 'development') {
      return {
        id: organization_id,
        name: organization_name || 'Development Organization',
        plan: 'free',
        allowed_responses_count: 10,
        created_at: new Date().toISOString()
      };
    }
    return [];
  }
};

export const ClientService = {
  updateOrganization,
  getClientById,
  getOrganizationById,
};
