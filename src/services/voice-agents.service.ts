export interface VoiceAgent {
  id: string;
  name: string;
  displayName: string;
  voiceId: string;
  languageCode: string;
  personalityType: 'technical' | 'behavioral' | 'empathetic' | 'analytical' | 'bilingual';
  specializations: string[];
  voiceDescription: string;
  avatarUrl?: string;
  isPremium: boolean;
}

export interface VoiceSettings {
  speed: number; // 0.5, 0.75, 1.0, 1.5, 2.0
  language: string;
  voiceId: string;
}

export class VoiceAgentService {
  static async getAllVoiceAgents(): Promise<VoiceAgent[]> {
    try {
      const response = await fetch('/api/voice-agents');
      if (!response.ok) {
        throw new Error('Failed to fetch voice agents');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching voice agents:', error);
      return [];
    }
  }
  
  static async getVoiceAgentsByType(type: string): Promise<VoiceAgent[]> {
    try {
      const response = await fetch(`/api/voice-agents?type=${type}`);
      if (!response.ok) {
        throw new Error('Failed to fetch voice agents by type');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching voice agents by type:', error);
      return [];
    }
  }
  
  static async generateVoicePreview(voiceId: string, speed: number, language: string = 'en-US'): Promise<string> {
    try {
      const response = await fetch('/api/voice-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voiceId,
          speed,
          language
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate voice preview');
      }
      
      const data = await response.json();
      return data.audioUrl;
    } catch (error) {
      console.error('Error generating voice preview:', error);
      throw error;
    }
  }

  static getSpeedLabel(speed: number): string {
    switch (speed) {
      case 0.5: return 'Very Slow';
      case 0.75: return 'Slow';
      case 1.0: return 'Normal';
      case 1.5: return 'Fast';
      case 2.0: return 'Very Fast';
      default: return 'Normal';
    }
  }

  static getPersonalityColor(type: string): string {
    switch (type) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'behavioral': return 'bg-green-100 text-green-800';
      case 'empathetic': return 'bg-purple-100 text-purple-800';
      case 'analytical': return 'bg-orange-100 text-orange-800';
      case 'bilingual': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}


