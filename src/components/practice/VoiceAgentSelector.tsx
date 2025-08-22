"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { 
  MicrophoneIcon, 
  UserGroupIcon,
  StarIcon,
  ClockIcon,
  CheckIcon,
  PlayIcon,
  SpeakerWaveIcon
} from "@heroicons/react/24/outline";
import { toast } from "@/components/ui/use-toast";

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

interface VoiceAgentSelectorProps {
  onAgentSelect: (agent: VoiceAgent) => void;
  selectedAgentId: string | null;
  className?: string;
}

export default function VoiceAgentSelector({ 
  onAgentSelect, 
  selectedAgentId,
  className = "" 
}: VoiceAgentSelectorProps) {
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [speedControl, setSpeedControl] = useState(1.0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/voice-agents');
      const data = await response.json();

      if (data.success) {
        setAgents(data.voice_agents);
        console.log('Voice agents loaded:', data.voice_agents.length);
      } else {
        console.error('Failed to load agents:', data.error);
        toast({
          title: "Error",
          description: "Failed to load voice agents.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading agents:', error);
      toast({
        title: "Error",
        description: "Failed to load voice agents.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPersonalityColor = (personality: string) => {
    switch (personality.toLowerCase()) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'analytical': return 'bg-green-100 text-green-800';
      case 'empathetic': return 'bg-purple-100 text-purple-800';
      case 'behavioral': return 'bg-orange-100 text-orange-800';
      case 'bilingual': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesCategory = selectedCategory === 'all' || agent.personalityType === selectedCategory;
    const matchesSearch = agent.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.voiceDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.specializations.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

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

  const categories = [
    { id: 'all', name: 'All Personalities' },
    { id: 'technical', name: 'Technical' },
    { id: 'analytical', name: 'Analytical' },
    { id: 'empathetic', name: 'Empathetic' },
    { id: 'behavioral', name: 'Behavioral' },
    { id: 'bilingual', name: 'Bilingual' }
  ];

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <MicrophoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search interviewers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Speed Control */}
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
      </div>

      {/* Agents List */}
      <div className="space-y-3">
        {filteredAgents.map((agent) => (
          <motion.div
            key={agent.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-shadow ${
              selectedAgentId === agent.id
                ? 'border-green-500 ring-2 ring-green-200'
                : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  {agent.avatarUrl ? (
                    <img src={agent.avatarUrl} alt={agent.displayName} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold text-blue-600">
                      {agent.displayName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{agent.displayName}</h3>
                  <p className="text-sm text-gray-600">{agent.voiceDescription}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPersonalityColor(agent.personalityType)}`}>
                      {agent.personalityType}
                    </span>
                    {agent.isPremium && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Premium
                      </span>
                    )}
                    {agent.languageCode && agent.languageCode !== 'en-US' && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                        {agent.languageCode === 'es-US' ? 'Spanish' : 'Chinese'}
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
                onClick={() => onAgentSelect(agent)}
              >
                {selectedAgentId === agent.id ? 'Selected' : 'Select'}
              </button>
              
              <button
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
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
                    <PlayIcon className="w-4 h-4" />
                    <span>Preview Voice</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No interviewers found matching your criteria.
        </div>
      )}
    </div>
  );
} 
