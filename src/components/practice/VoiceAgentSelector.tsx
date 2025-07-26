"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  MicrophoneIcon, 
  UserGroupIcon,
  StarIcon,
  ClockIcon,
  CheckIcon
} from "@heroicons/react/24/outline";
import { toast } from "@/components/ui/use-toast";

interface VoiceAgent {
  agent_id: string;
  name: string;
  description: string;
  voice_id: string;
  category: string;
  difficulty: string;
  specialties: string[];
  created_at?: string;
  updated_at?: string;
}

interface VoiceAgentSelectorProps {
  onAgentSelect: (agent: VoiceAgent) => void;
  selectedAgentId?: string;
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
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/get-retell-agents');
      const data = await response.json();

      if (data.success) {
        setAgents(data.agents);
        console.log('Voice agents loaded:', data.agents.length);
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'behavioral': return 'bg-purple-100 text-purple-800';
      case 'product': return 'bg-orange-100 text-orange-800';
      case 'general': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAgents = agents.filter(agent => {
    const matchesCategory = selectedCategory === 'all' || agent.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || agent.difficulty === selectedDifficulty;
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const categories = ['all', ...Array.from(new Set(agents.map(a => a.category)))];
  const difficulties = ['all', 'easy', 'medium', 'hard'];

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Your Interviewer</h3>
        <p className="text-sm text-gray-600">
          Select an AI interviewer that matches your practice goals
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search interviewers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <MicrophoneIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Agents List */}
      <div className="space-y-3">
        {filteredAgents.length === 0 ? (
          <div className="text-center py-8">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No interviewers found matching your criteria</p>
          </div>
        ) : (
          filteredAgents.map((agent) => (
            <motion.div
              key={agent.agent_id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onAgentSelect(agent)}
              className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                selectedAgentId === agent.agent_id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                    {selectedAgentId === agent.agent_id && (
                      <CheckIcon className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{agent.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(agent.category)}`}>
                      {agent.category}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(agent.difficulty)}`}>
                      {agent.difficulty}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {agent.specialties.slice(0, 3).map((specialty, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                    {agent.specialties.length > 3 && (
                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                        +{agent.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-gray-400">
                  <StarIcon className="w-4 h-4" />
                  <span className="text-xs">4.8</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Results Count */}
      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredAgents.length} of {agents.length} interviewers
      </div>
    </div>
  );
} 
