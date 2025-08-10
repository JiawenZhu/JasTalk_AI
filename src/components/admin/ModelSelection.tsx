'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Brain, Zap, Globe, Mic, Settings } from 'lucide-react';

interface ModelConfig {
  provider: 'openai' | 'gemini';
  model: string;
  apiKey: string;
  isEnabled: boolean;
  features: {
    liveStreaming: boolean;
    realTimeInteraction: boolean;
    multimodal: boolean;
    longContext: boolean;
  };
}

const AVAILABLE_MODELS = {
  openai: [
    { id: 'gpt-5-nano', name: 'GPT-5 Nano', description: 'Latest nano model - fast and efficient' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and cost-effective' },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable model' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Balanced performance' }
  ],
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast multimodal model' },
    { id: 'gemini-2.5-flash-preview-native-audio-dialog', name: 'Gemini 2.5 Flash Native Audio', description: 'Live streaming with audio' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most powerful reasoning' },
    { id: 'gemini-2.0-flash-live-001', name: 'Gemini 2.0 Flash Live', description: 'Real-time interactions' }
  ]
};

export default function ModelSelection() {
  const [config, setConfig] = useState<ModelConfig>({
    provider: 'openai',
    model: 'gpt-5-nano',
    apiKey: '',
    isEnabled: true,
    features: {
      liveStreaming: false,
      realTimeInteraction: false,
      multimodal: false,
      longContext: false
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved configuration
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/model-config');
      if (response.ok) {
        const savedConfig = await response.json();
        setConfig(savedConfig);
      }
    } catch (error) {
      console.error('Failed to load model config:', error);
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/model-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });

      if (response.ok) {
        toast({
          title: 'Configuration Saved',
          description: 'Model configuration has been updated successfully.',
        });
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save model configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (provider: 'openai' | 'gemini') => {
    setConfig(prev => ({
      ...prev,
      provider,
      model: AVAILABLE_MODELS[provider][0].id,
      features: {
        liveStreaming: provider === 'gemini',
        realTimeInteraction: provider === 'gemini',
        multimodal: provider === 'gemini',
        longContext: provider === 'gemini'
      }
    }));
  };

  const handleModelChange = (model: string) => {
    setConfig(prev => ({
      ...prev,
      model,
      features: {
        ...prev.features,
        liveStreaming: model.includes('native-audio') || model.includes('live'),
        realTimeInteraction: model.includes('live') || model.includes('flash'),
        multimodal: model.includes('flash') || model.includes('pro'),
        longContext: model.includes('pro') || model.includes('flash')
      }
    }));
  };

  const getModelFeatures = (model: string) => {
    const features = [];
    if (model.includes('native-audio') || model.includes('live')) features.push('Live Streaming');
    if (model.includes('flash')) features.push('Fast Response');
    if (model.includes('pro')) features.push('Advanced Reasoning');
    if (model.includes('multimodal')) features.push('Multimodal');
    return features;
  };

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${
            config.provider === 'openai' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => handleProviderChange('openai')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">OpenAI</h3>
                <p className="text-sm text-gray-600">GPT models for text generation</p>
              </div>
              {config.provider === 'openai' && (
                <Badge variant="secondary">Active</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            config.provider === 'gemini' ? 'ring-2 ring-purple-500 bg-purple-50' : ''
          }`}
          onClick={() => handleProviderChange('gemini')}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Google Gemini</h3>
                <p className="text-sm text-gray-600">Live streaming & real-time interaction</p>
              </div>
              {config.provider === 'gemini' && (
                <Badge variant="secondary">Active</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Model Selection */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="model-select">Select Model</Label>
          <Select value={config.model} onValueChange={handleModelChange}>
            <SelectTrigger id="model-select">
              <SelectValue placeholder="Choose a model" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS[config.provider].map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{model.name}</span>
                    <span className="text-sm text-gray-500">{model.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Features */}
        <div className="flex flex-wrap gap-2">
          {getModelFeatures(config.model).map((feature) => (
            <Badge key={feature} variant="outline" className="flex items-center gap-1">
              {feature === 'Live Streaming' && <Mic className="h-3 w-3" />}
              {feature === 'Fast Response' && <Zap className="h-3 w-3" />}
              {feature === 'Advanced Reasoning' && <Brain className="h-3 w-3" />}
              {feature === 'Multimodal' && <Globe className="h-3 w-3" />}
              {feature}
            </Badge>
          ))}
        </div>
      </div>

      {/* API Key Configuration */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            placeholder={`Enter your ${config.provider === 'openai' ? 'OpenAI' : 'Gemini'} API key`}
            value={config.apiKey}
            onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
          />
          <p className="text-sm text-gray-500 mt-1">
            Get your API key from{' '}
            {config.provider === 'openai' ? (
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                OpenAI Platform
              </a>
            ) : (
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Google AI Studio
              </a>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="enable-model"
            checked={config.isEnabled}
            onCheckedChange={(checked) => setConfig(prev => ({ ...prev, isEnabled: checked }))}
          />
          <Label htmlFor="enable-model">Enable this model for question generation</Label>
        </div>
      </div>

      {/* Live Streaming Configuration (Gemini only) */}
      {config.provider === 'gemini' && config.model.includes('native-audio') && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-purple-600" />
              Live Streaming Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="live-streaming"
                checked={config.features.liveStreaming}
                onCheckedChange={(checked) => setConfig(prev => ({
                  ...prev,
                  features: { ...prev.features, liveStreaming: checked }
                }))}
              />
              <Label htmlFor="live-streaming">Enable live streaming for interviews</Label>
            </div>
            <p className="text-sm text-gray-600">
              Live streaming enables real-time voice interaction during interviews, 
              providing immediate responses and natural conversation flow.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveConfig} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
} 
