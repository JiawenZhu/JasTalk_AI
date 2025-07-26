"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeftIcon,
  PlusIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";
import { useInterviewers } from "@/contexts/interviewers.context";
import { toast } from "@/components/ui/use-toast";

interface VoiceAgent {
  agent_id: string;
  name: string;
  description: string;
  voice_id: string;
  category: string;
  difficulty: string;
  specialties: string[];
}

export const dynamic = 'force-dynamic';

export default function InterviewersPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { interviewers, interviewersLoading } = useInterviewers();
  const [contentReady, setContentReady] = useState(false);
  const [retellAgents, setRetellAgents] = useState<VoiceAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  // Set content ready after initial load
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
      return;
    }

    if (!interviewersLoading) {
      const timer = setTimeout(() => {
        setContentReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, router, interviewersLoading]);

  // Load Retell agents on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadRetellAgents();
    }
  }, [isAuthenticated]);

  // Load selected agent from localStorage on component mount
  useEffect(() => {
    const storedAgent = localStorage.getItem('selectedDashboardAgent');
    if (storedAgent) {
      try {
        const agent = JSON.parse(storedAgent);
        setSelectedAgentId(agent.agent_id);
      } catch (error) {
        console.error('Error parsing stored dashboard agent:', error);
      }
    }
  }, []);

  const loadRetellAgents = async () => {
    try {
      setAgentsLoading(true);
      const response = await fetch('/api/get-retell-agents');
      const data = await response.json();

      if (data.success) {
        setRetellAgents(data.agents);
        console.log('Retell agents loaded:', data.agents.length);
      } else {
        console.error('Failed to load Retell agents:', data.error);
        toast({
          title: "Error",
          description: "Failed to load voice agents.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading Retell agents:', error);
      toast({
        title: "Error",
        description: "Failed to load voice agents.",
        variant: "destructive",
      });
    } finally {
      setAgentsLoading(false);
    }
  };

  const handleSyncAgents = async () => {
    try {
      await loadRetellAgents();
      toast({
        title: "Agents Synced",
        description: "Updated your interviewers from Retell AI.",
      });
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "Failed to sync agents. Please try again.",
        variant: "destructive",
      });
    }
  };

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const handleSelectInterviewer = (agent: VoiceAgent) => {
    setSelectedAgentId(agent.agent_id);
    
    // Store the selected agent in localStorage for the dashboard
    localStorage.setItem('selectedDashboardAgent', JSON.stringify(agent));
    
    toast({
      title: "Interviewer Selected",
      description: `You've selected ${agent.name} for your dashboard.`,
    });
  };

  const handlePreviewVoice = (agent: VoiceAgent) => {
    // Store the selected agent in localStorage for the practice session
    localStorage.setItem('selectedPracticeAgent', JSON.stringify(agent));
    
    toast({
      title: "Voice Preview",
      description: `Starting voice preview with ${agent.name}.`,
    });

    // Navigate to practice page
    router.push('/practice/new');
  };

  function InterviewersLoader() {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Interviewers</h1>
            <p className="text-sm text-gray-500">
              {interviewers.length} AI Interviewers Available
            </p>
          </div>
          <button
            onClick={handleSyncAgents}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowPathIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: contentReady ? 1 : 0, y: contentReady ? 0 : 20 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Your AI Interviewers</h2>
              <p className="text-blue-100 text-sm">
                Professional interviewers ready to help you practice
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">{interviewers.length}</div>
              <div className="text-xs text-blue-100">Available</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-xs text-blue-100">Ready</div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: contentReady ? 1 : 0, y: contentReady ? 0 : 20 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/upload')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <PlusIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Start Practice</h3>
            <p className="text-xs text-gray-500 mt-1">Upload document & practice</p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSyncAgents}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <SparklesIcon className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Sync Agents</h3>
            <p className="text-xs text-gray-500 mt-1">Update from Retell AI</p>
          </motion.button>
        </motion.div>

        {/* Interviewers List */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: contentReady ? 1 : 0, y: contentReady ? 0 : 20 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Available Interviewers</h3>
            <span className="text-sm text-gray-500">
              {interviewers.length} of {interviewers.length}
            </span>
          </div>

          {agentsLoading ? (
            <InterviewersLoader />
          ) : retellAgents.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Voice Interviewers Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by syncing your AI interviewers from Retell AI
              </p>
              <button
                onClick={handleSyncAgents}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Sync Interviewers
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {retellAgents.map((agent, index) => (
                <motion.div
                  key={agent.agent_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-blue-600">
                          {agent.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                        <p className="text-sm text-gray-600">{agent.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {agent.category}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            {agent.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSelectInterviewer(agent)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedAgentId === agent.agent_id
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {selectedAgentId === agent.agent_id ? 'Selected' : 'Select'}
                      </button>
                      <button
                        onClick={() => handlePreviewVoice(agent)}
                        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Preview Voice
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Sync Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: contentReady ? 1 : 0, y: contentReady ? 0 : 20 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Sync Status</h4>
                <p className="text-xs text-gray-500">All agents up to date</p>
              </div>
            </div>
            <button
              onClick={handleSyncAgents}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              Sync Now
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
