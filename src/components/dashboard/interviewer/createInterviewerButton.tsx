"use client";

import { motion } from "framer-motion";
import { InterviewerService } from "@/services/interviewers.service";
import axios from "axios";
import { PlusIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

function CreateInterviewerButton() {
  const [isLoading, setIsLoading] = useState(false);

  const createInterviewers = async () => {
    try {
      setIsLoading(true);
      
      toast({
        title: "Creating Interviewers",
        description: "Setting up your AI interviewers...",
      });
      
      // Check if we're in development mode
      const isSupabaseConfigured = Boolean(
        process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
      );

      if (!isSupabaseConfigured) {
        console.log('Development mode: Cannot create real interviewers without Supabase configuration');
        toast({
          title: "Development Mode",
          description: "Interviewers would be created in production with proper configuration.",
        });
        return;
      }

      const response = await axios.get("/api/create-interviewer", {});
      console.log(response);
      await InterviewerService.getAllInterviewers();
      
      toast({
        title: "Success!",
        description: "Your AI interviewers have been created successfully.",
      });
    } catch (error) {
      console.error('Error creating interviewers:', error);
      toast({
        title: "Error",
        description: "Failed to create interviewers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={createInterviewers}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="text-center space-y-3">
        {isLoading ? (
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto">
            <SparklesIcon className="w-6 h-6" />
          </div>
        )}
        
        <div>
          <h3 className="font-semibold text-lg">
            {isLoading ? "Creating..." : "Create AI Interviewers"}
          </h3>
          <p className="text-blue-100 text-sm mt-1">
            {isLoading 
              ? "Setting up Bob and Lisa..." 
              : "Get started with professional AI interviewers"
            }
          </p>
        </div>
      </div>
    </motion.button>
  );
}

export default CreateInterviewerButton;
