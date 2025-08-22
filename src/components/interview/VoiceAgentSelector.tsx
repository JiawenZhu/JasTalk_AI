"use client";

import React, { useState, useEffect } from 'react';
import { VoiceAgent, VoiceSettings, VoiceAgentService } from '@/services/voice-agents.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, Crown, Globe, Zap, Heart, Brain, Users } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceAgentSelectorProps {
  onAgentSelect: (agent: VoiceAgent, settings: VoiceSettings) => void;
  selectedAgent?: VoiceAgent | null;
}

export function VoiceAgentSelector({ onAgentSelect, selectedAgent }: VoiceAgentSelectorProps) {
  const [voiceAgents, setVoiceAgents] = useState<VoiceAgent[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [previewingAgent, setPreviewingAgent] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  // Speed options: 0.5, 0.75, 1.0, 1.5, 2.0
  const speedOptions = [
    { value: 0.5, label: 'Very Slow' },
    { value: 0.75, label: 'Slow' },
    { value: 1.0, label: 'Normal' },
    { value: 1.5, label: 'Fast' },
    { value: 2.0, label: 'Very Fast' }
  ];

  const personalityTypes = [
    { 
      value: 'all', 
      label: 'All Agents', 
      icon: Users,
      description: 'Show all available voice agents'
    },
    { 
      value: 'technical', 
      label: 'Technical', 
      icon: Zap,
      description: 'Perfect for coding and system design interviews'
    },
    { 
      value: 'behavioral', 
      label: 'Behavioral', 
      icon: Heart,
      description: 'Ideal for culture fit and teamwork assessments'
    },
    { 
      value: 'empathetic', 
      label: 'Supportive', 
      icon: Heart,
      description: 'Encouraging and stress-free interview environment'
    },
    { 
      value: 'analytical', 
      label: 'Analytical', 
      icon: Brain,
      description: 'Great for data science and problem-solving roles'
    },
    { 
      value: 'bilingual', 
      label: 'International', 
      icon: Globe,
      description: 'Native speakers for international opportunities'
    }
  ];

  useEffect(() => {
    loadVoiceAgents();
  }, []);

  const loadVoiceAgents = async () => {
    try {
      setLoading(true);
      const agents = await VoiceAgentService.getAllVoiceAgents();
      setVoiceAgents(agents);
    } catch (error) {
      console.error('Failed to load voice agents:', error);
      toast.error('Failed to load voice agents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewVoice = async (agent: VoiceAgent) => {
    try {
      // Stop current preview if playing
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
      }

      if (previewingAgent === agent.id) {
        setPreviewingAgent(null);
        return;
      }

      setPreviewingAgent(agent.id);
      setPreviewLoading(agent.id);
      
      // Generate preview audio
      const audioUrl = await VoiceAgentService.generateVoicePreview(
        agent.voiceId, 
        voiceSpeed, 
        agent.languageCode
      );
      
      const audio = new Audio();
      audio.onended = () => {
        setPreviewingAgent(null);
        setCurrentAudio(null);
      };
      
      audio.onerror = () => {
        console.error('Audio playback failed');
        setPreviewingAgent(null);
        setCurrentAudio(null);
        toast.error('Audio playback failed. Please try again.');
      };
      
      audio.oncanplaythrough = () => {
        setPreviewLoading(null);
      };
      
      setCurrentAudio(audio);
      audio.src = audioUrl;
      await audio.play();
      
    } catch (error) {
      console.error('Voice preview failed:', error);
      setPreviewingAgent(null);
      setPreviewLoading(null);
      toast.error('Voice preview failed. Please try again.');
    }
  };

  const getPersonalityIcon = (type: string) => {
    const typeConfig = personalityTypes.find(t => t.value === type);
    return typeConfig?.icon || Users;
  };

  const filteredAgents = selectedType === 'all' 
    ? voiceAgents 
    : voiceAgents.filter(agent => agent.personalityType === selectedType);

  const currentSpeedLabel = speedOptions.find(option => option.value === voiceSpeed)?.label || 'Normal';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading voice agents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Choose Your AI Interviewer</h2>
        <p className="text-gray-600">Select a voice agent that matches your interview style and preferences</p>
      </div>

      {/* Type Filter */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {personalityTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Button
              key={type.value}
              variant={selectedType === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type.value)}
              className="flex flex-col items-center p-3 h-auto"
              title={type.description}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-xs">{type.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Voice Speed Control */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Voice Speed: {currentSpeedLabel}
          </label>
          <Volume2 className="w-4 h-4 text-gray-500" />
        </div>
        
        <div className="space-y-2">
          <Slider
            value={[voiceSpeed]}
            onValueChange={(value) => setVoiceSpeed(value[0])}
            min={0.5}
            max={2.0}
            step={0.25}
            className="w-full"
          />
          
          {/* Speed markers */}
          <div className="flex justify-between text-xs text-gray-500 px-1">
            {speedOptions.map((option) => (
              <span 
                key={option.value}
                className={`cursor-pointer hover:text-gray-700 ${
                  voiceSpeed === option.value ? 'font-medium text-primary' : ''
                }`}
                onClick={() => setVoiceSpeed(option.value)}
              >
                {option.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Voice Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => {
          const PersonalityIcon = getPersonalityIcon(agent.personalityType);
          const isSelected = selectedAgent?.id === agent.id;
          const isPreviewing = previewingAgent === agent.id;
          const isLoadingPreview = previewLoading === agent.id;
          
          return (
            <Card 
              key={agent.id}
              className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onAgentSelect(agent, { 
                speed: voiceSpeed, 
                language: agent.languageCode, 
                voiceId: agent.voiceId 
              })}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <PersonalityIcon className="w-5 h-5 text-gray-600" />
                    <CardTitle className="text-lg">{agent.displayName}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    {agent.isPremium && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                    {agent.languageCode !== 'en-US' && (
                      <Badge variant="outline" className="text-xs">
                        <Globe className="w-3 h-3 mr-1" />
                        {agent.languageCode.split('-')[0].toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{agent.voiceDescription}</p>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Personality Type Badge */}
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={VoiceAgentService.getPersonalityColor(agent.personalityType)}
                  >
                    {agent.personalityType.charAt(0).toUpperCase() + agent.personalityType.slice(1)}
                  </Badge>
                </div>

                {/* Specializations */}
                <div className="flex flex-wrap gap-1">
                  {agent.specializations.slice(0, 2).map((spec) => (
                    <Badge key={spec} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                  {agent.specializations.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{agent.specializations.length - 2} more
                    </Badge>
                  )}
                </div>

                {/* Preview Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewVoice(agent);
                  }}
                  disabled={previewingAgent !== null && previewingAgent !== agent.id}
                >
                  {isLoadingPreview ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Generating...
                    </>
                  ) : isPreviewing ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Stop Preview
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Preview Voice
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredAgents.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No voice agents found for the selected type.</p>
          <Button 
            variant="outline" 
            onClick={() => setSelectedType('all')}
            className="mt-2"
          >
            Show All Agents
          </Button>
        </div>
      )}

      {/* Selected Agent Summary */}
      {selectedAgent && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Selected: {selectedAgent.displayName}</h3>
              <p className="text-sm text-gray-600">
                {VoiceAgentService.getSpeedLabel(voiceSpeed)} speed • {selectedAgent.personalityType} style
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePreviewVoice(selectedAgent);
              }}
              disabled={previewingAgent !== null && previewingAgent !== selectedAgent.id}
            >
              <Play className="w-4 h-4 mr-1" />
              Preview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
