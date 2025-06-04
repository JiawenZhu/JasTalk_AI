"use client";

import React, { useState, useContext, ReactNode, useEffect } from "react";
import { Interviewer } from "@/types/interviewer";
import { InterviewerService } from "@/services/interviewers.service";
import { useAuth } from "@/contexts/auth.context";

interface InterviewerContextProps {
  interviewers: Interviewer[];
  setInterviewers: React.Dispatch<React.SetStateAction<Interviewer[]>>;
  createInterviewer: (payload: any) => void;
  interviewersLoading: boolean;
  setInterviewersLoading: (interviewersLoading: boolean) => void;
}

const InterviewerContext = React.createContext<InterviewerContextProps>({
  interviewers: [],
  setInterviewers: () => {},
  createInterviewer: () => {},
  interviewersLoading: false,
  setInterviewersLoading: () => {},
});

export const useInterviewers = () => useContext(InterviewerContext);

interface InterviewerProviderProps {
  children: ReactNode;
}

// Mock interviewers for development mode
const mockInterviewers: Interviewer[] = [
  {
    id: BigInt(1),
    user_id: "mock-user-id",
    created_at: new Date(),
    name: "Explorer Lisa",
    rapport: 7,
    exploration: 10,
    empathy: 7,
    speed: 5,
    image: "/interviewers/Lisa.png",
    description: "Hi! I'm Lisa, an enthusiastic and empathetic interviewer who loves to explore. With a perfect balance of empathy and rapport, I delve deep into conversations while maintaining a steady pace. Let's embark on this journey together and uncover meaningful insights!",
    audio: "Lisa.wav",
    agent_id: "mock-agent-lisa",
  },
  {
    id: BigInt(2),
    user_id: "mock-user-id",
    created_at: new Date(),
    name: "Empathetic Bob",
    rapport: 7,
    exploration: 7,
    empathy: 10,
    speed: 5,
    image: "/interviewers/Bob.png",
    description: "Hi! I'm Bob, your go-to empathetic interviewer. I excel at understanding and connecting with people on a deeper level, ensuring every conversation is insightful and meaningful. With a focus on empathy, I'm here to listen and learn from you. Let's create a genuine connection!",
    audio: "Bob.wav",
    agent_id: "mock-agent-bob",
  },
];

export function InterviewerProvider({ children }: InterviewerProviderProps) {
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const { user } = useAuth();
  const [interviewersLoading, setInterviewersLoading] = useState(true);

  const fetchInterviewers = async () => {
    try {
      setInterviewersLoading(true);
      
      // Check if we're in development mode and don't have a user
      const isSupabaseConfigured = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      if (!isSupabaseConfigured || !user?.id) {
        console.log('Development mode: Using mock interviewers');
        setInterviewers(mockInterviewers);
        setInterviewersLoading(false);
        return;
      }

      const response = await InterviewerService.getAllInterviewers(user.id);
      setInterviewers(response);
    } catch (error) {
      console.error('Error fetching interviewers:', error);
      // Fallback to mock data on error
      console.log('Error occurred, falling back to mock interviewers');
      setInterviewers(mockInterviewers);
    } finally {
      setInterviewersLoading(false);
    }
  };

  const createInterviewer = async (payload: any) => {
    try {
      // Check if we're in development mode
      const isSupabaseConfigured = Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      if (!isSupabaseConfigured || !user?.id) {
        console.log('Development mode: Cannot create real interviewers');
        return;
      }

      await InterviewerService.createInterviewer({ ...payload });
      fetchInterviewers();
    } catch (error) {
      console.error('Error creating interviewer:', error);
    }
  };

  useEffect(() => {
    fetchInterviewers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <InterviewerContext.Provider
      value={{
        interviewers,
        setInterviewers,
        createInterviewer,
        interviewersLoading,
        setInterviewersLoading,
      }}
    >
      {children}
    </InterviewerContext.Provider>
  );
}
