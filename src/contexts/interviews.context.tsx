"use client";

import React, { useState, useContext, ReactNode, useEffect } from "react";
import { Interview } from "@/types/interview";
import { InterviewService } from "@/services/interviews.service";
import { useAuth } from "@/contexts/auth.context";


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
  const [interviewsLoading, setInterviewsLoading] = useState(false);

  const fetchInterviews = async () => {
    // Don't fetch if auth is still loading
    if (authLoading) {
      return;
    }

    // Don't fetch if we don't have user
    if (!user?.id) {
      return;
    }

    try {
      setInterviewsLoading(true);
      const response = await InterviewService.getAllInterviews(user.id);
      
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
    // Only fetch when auth is loaded and we have the required data
    if (!authLoading && user?.id) {
      fetchInterviews();
    }
  }, [user?.id, authLoading]);

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
