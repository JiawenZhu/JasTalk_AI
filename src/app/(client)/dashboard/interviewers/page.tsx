"use client";

import React, { useEffect, useState, useRef } from "react";
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
import { useDispatch } from 'react-redux';
import { setSelectedInterviewer } from '@/store/interviewerSlice';

interface VoiceAgent {
  id: string;
  name: string;
  displayName: string;
  voiceId: string;
  languageCode: string;
  personalityType: string;
  specializations: string[];
  voiceDescription: string;
  avatarUrl?: string;
  isPremium: boolean;
}

export const dynamic = 'force-dynamic';

export default function InterviewersPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { interviewers, interviewersLoading } = useInterviewers();
  const [contentReady, setContentReady] = useState(false);
  const [voiceAgents, setVoiceAgents] = useState<VoiceAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const dispatch = useDispatch();

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

  // Load voice agents on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadVoiceAgents();
    }
  }, [isAuthenticated]);

  // Load selected agent from localStorage on component mount
  useEffect(() => {
    const storedAgent = localStorage.getItem('selectedDashboardAgent');
    if (storedAgent) {
      try {
        const agent = JSON.parse(storedAgent);
        setSelectedAgentId(agent.id);
      } catch (error) {
        console.error('Error parsing stored dashboard agent:', error);
      }
    }
  }, []);

  const loadVoiceAgents = async () => {
    try {
      setAgentsLoading(true);
      console.log('Loading voice agents...');
      const response = await fetch('/api/voice-agents');
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (data.success) {
        setVoiceAgents(data.voice_agents);
        console.log('Voice agents loaded:', data.voice_agents.length);
      } else {
        console.error('Failed to load voice agents:', data.error);
        toast({
          title: "Error",
          description: "Failed to load voice agents.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading voice agents:', error);
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
      await loadVoiceAgents();
      toast({
        title: "Agents Synced",
        description: "Updated your voice agents list.",
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
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [speedControl, setSpeedControl] = useState(1.0);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleSelectInterviewer = (agent: VoiceAgent) => {
    setSelectedAgentId(agent.id);
    
    // Store the selected agent in localStorage for the dashboard
    localStorage.setItem('selectedDashboardAgent', JSON.stringify(agent));
    // Sync to Redux
    dispatch(setSelectedInterviewer(agent));
    
    toast({
      title: "Interviewer Selected",
      description: `You've selected ${agent.displayName} for your dashboard.`,
    });
  };

  const handlePreviewVoice = async (agent: VoiceAgent) => {
    if (previewingVoice === agent.id) return;
    
    try {
      setPreviewingVoice(agent.id);
      
      const response = await fetch('/api/voice-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voiceId: agent.voiceId,
          speed: speedControl,
          language: agent.languageCode || 'en-US'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const data = await response.json();
      
      // Play the audio preview
      await playAudioPreview(data.audioUrl);
      
      toast({
        title: "Voice Preview",
        description: `Playing voice preview for ${agent.displayName}.`,
      });
      
    } catch (error) {
      console.error('Voice preview error:', error);
      toast({
        title: "Preview Error",
        description: "Could not generate voice preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPreviewingVoice(null);
    }
  };

  const playAudioPreview = async (audioUrl: string) => {
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      if (arrayBuffer.byteLength % 2 !== 0) {
        console.error("PCM data has an odd byte length and cannot be played:", arrayBuffer.byteLength);
        return;
      }

      const pcm16 = new Int16Array(arrayBuffer);
      const audioBuffer = audioContextRef.current.createBuffer(1, pcm16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start();
      
      return new Promise(resolve => {
        source.onended = resolve;
      });
    } catch (error) {
      console.error('Error playing audio preview:', error);
    }
  };

  function InterviewersLoader() {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
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
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
            onClick={() => router.back()}
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Interviewers</h1>
            <p className="text-sm text-gray-500">
              {agentsLoading ? 0 : voiceAgents.length} AI Interviewers Available
            </p>
          </div>
          <button
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={handleSyncAgents}
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
              <div className="text-2xl font-bold">{agentsLoading ? 0 : voiceAgents.length}</div>
              <div className="text-xs text-blue-100">Available</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-xs text-blue-100">Ready</div>
            </div>
          </div>
        </motion.div>

        {/* Speed Control */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: contentReady ? 1 : 0, y: contentReady ? 0 : 20 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700">Voice Speed:</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.25"
              value={speedControl}
              onChange={(e) => setSpeedControl(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-gray-600 min-w-[60px]">
              {speedControl === 0.5 ? '0.5x' : 
               speedControl === 0.75 ? '0.75x' : 
               speedControl === 1.0 ? '1.0x' : 
               speedControl === 1.25 ? '1.25x' : 
               speedControl === 1.5 ? '1.5x' : '2.0x'}
            </span>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: contentReady ? 1 : 0, y: contentReady ? 0 : 20 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left hover:shadow-md transition-shadow"
            onClick={() => router.push('/upload')}
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <PlusIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Start Practice</h3>
            <p className="text-xs text-gray-500 mt-1">Upload document & practice</p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-left hover:shadow-md transition-shadow"
            onClick={handleSyncAgents}
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <SparklesIcon className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Sync Agents</h3>
            <p className="text-xs text-gray-500 mt-1">Refresh interviewers list</p>
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
              {agentsLoading ? 0 : voiceAgents.length} of {agentsLoading ? 0 : voiceAgents.length}
            </span>
          </div>

          {agentsLoading ? (
            <InterviewersLoader />
          ) : voiceAgents.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Voice Interviewers Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by syncing your AI interviewers
              </p>
              <button
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                onClick={handleSyncAgents}
              >
                Sync Interviewers
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {voiceAgents.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-blue-600">
                          {agent.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{agent.displayName}</h3>
                        <p className="text-sm text-gray-600">{agent.voiceDescription}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {agent.personalityType}
                          </span>
                          {agent.isPremium && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                              Premium
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedAgentId === agent.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      onClick={() => handleSelectInterviewer(agent)}
                    >
                      {selectedAgentId === agent.id ? 'Selected' : 'Select'}
                    </button>
                    <button
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-2 ${
                        previewingVoice === agent.id
                          ? 'bg-blue-400 text-white cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      onClick={() => handlePreviewVoice(agent)}
                      disabled={previewingVoice === agent.id}
                    >
                      {previewingVoice === agent.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Playing...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Preview Voice</span>
                        </>
                      )}
                    </button>
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
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div>
                <h4 className="font-medium text-gray-900 text-sm">Sync Status</h4>
                <p className="text-xs text-gray-500">All agents up to date</p>
              </div>
            </div>
            <button
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
              onClick={handleSyncAgents}
            >
              Sync Now
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
