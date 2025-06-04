"use client";

import React, { useState, useContext, ReactNode, useEffect } from "react";
import { Interview } from "@/types/interview";
import { InterviewService } from "@/services/interviews.service";
import { useAuth } from "@/contexts/auth.context";
import { useOrganization } from "@/contexts/organization.context";

interface InterviewContextProps {
  interviews: Interview[];
  setInterviews: React.Dispatch<React.SetStateAction<Interview[]>>;
  getInterviewById: (interviewId: string) => Interview | null | any;
  interviewsLoading: boolean;
  setInterviewsLoading: (interviewsLoading: boolean) => void;
  fetchInterviews: () => void;
}

const InterviewContext = React.createContext<InterviewContextProps>({
  interviews: [],
  setInterviews: () => {},
  getInterviewById: () => {},
  interviewsLoading: false,
  setInterviewsLoading: () => {},
  fetchInterviews: () => {},
});

export const useInterviews = () => useContext(InterviewContext);

interface InterviewProviderProps {
  children: ReactNode;
}

export function InterviewProvider({ children }: InterviewProviderProps) {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const { user, loading: authLoading } = useAuth();
  const { organization, loading: orgLoading } = useOrganization();
  const [interviewsLoading, setInterviewsLoading] = useState(false);

  const fetchInterviews = async () => {
    // Don't fetch if auth or organization are still loading
    if (authLoading || orgLoading) {
      return;
    }

    // Don't fetch if we don't have both user and organization
    if (!user?.id || !organization?.id) {
      return;
    }

    try {
      setInterviewsLoading(true);
      const response = await InterviewService.getAllInterviews(
        user.id,
        organization.id,
      );
      
      setInterviews(response || []);
    } catch (error) {
      console.error('Error fetching interviews:', error);
      setInterviews([]);
    } finally {
      setInterviewsLoading(false);
    }
  };

  const getInterviewById = async (interviewId: string) => {
    const response = await InterviewService.getInterviewById(interviewId);
    return response;
  };

  useEffect(() => {
    // Only fetch when both contexts are loaded and we have the required data
    if (!authLoading && !orgLoading && user?.id && organization?.id) {
      fetchInterviews();
    }
  }, [user?.id, organization?.id, authLoading, orgLoading]);

  return (
    <InterviewContext.Provider
      value={{
        interviews,
        setInterviews,
        getInterviewById,
        interviewsLoading,
        setInterviewsLoading,
        fetchInterviews,
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
}
