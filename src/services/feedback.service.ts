import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createServerClient } from "@/lib/supabase";
import { FeedbackData } from "@/types/response";

const supabase = typeof window !== 'undefined' ? createClientComponentClient() : createServerClient();

const submitFeedback = async (feedbackData: FeedbackData) => {
  const { error, data } = await supabase
    .from("feedback")
    .insert(feedbackData)
    .select();

  if (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }

  return data;
};

export const FeedbackService = {
  submitFeedback,
};
