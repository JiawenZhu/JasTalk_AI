// Voice configuration and management functions

export interface VoiceConfig {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  language: string;
  languageCode: string;
  provider: string;
  isActive: boolean;
  geminiVoiceId?: string;
  characteristics?: string[];
  description?: string;
}

// Default voice configurations
const defaultVoices: VoiceConfig[] = [
  {
    id: 'lisa',
    name: 'Lisa',
    gender: 'female',
    language: 'English',
    languageCode: 'en-US',
    provider: 'gemini',
    isActive: true,
    geminiVoiceId: 'gemini-2.5-flash-preview-tts'
  },
  {
    id: 'alex',
    name: 'Alex',
    gender: 'male',
    language: 'English',
    languageCode: 'en-US',
    provider: 'gemini',
    isActive: true,
    geminiVoiceId: 'gemini-2.5-flash-preview-tts'
  },
  {
    id: 'frank',
    name: 'Frank',
    gender: 'male',
    language: 'English',
    languageCode: 'en-US',
    provider: 'gemini',
    isActive: true,
    geminiVoiceId: 'gemini-2.5-flash-preview-tts'
  }
];

// Map voice ID to Gemini voice configuration
export function mapVoiceIdToGeminiVoice(
  voiceId: string, 
  languageCode: string = 'en-US', 
  displayName?: string
): string {
  // Default to a standard Gemini voice for live-preview model
  const defaultVoice = 'Puck';
  
  if (!voiceId) {
    return defaultVoice;
  }

  // For gemini-2.5-flash-live-preview model, the voice IDs from the database
  // are already valid Gemini voice names, so we can return them directly
  // The voice_agents table has voice_id values like 'Puck', 'Kore', 'Fenrir', etc.
  
  // Handle special cases for international voices
  if (voiceId === 'es-US') {
    return 'es-US'; // Spanish voice
  }
  
  if (voiceId === 'zh-CN') {
    return 'zh-CN'; // Chinese voice
  }
  
  // For all other voices, return the voiceId as-is since it's already a valid Gemini voice
  // This includes: Puck, Kore, Fenrir, Leda, Zephyr, Algenib, Charon, etc.
  return voiceId;
}

// Get voice by ID
export function getVoiceById(voiceId: string): VoiceConfig | undefined {
  return defaultVoices.find(v => v.id === voiceId);
}

// Get available voices with optional filters
export function getAvailableVoices(
  language?: string, 
  provider?: string
): VoiceConfig[] {
  let voices = defaultVoices.filter(v => v.isActive);
  
  if (language) {
    voices = voices.filter(v => v.languageCode === language);
  }
  
  if (provider) {
    voices = voices.filter(v => v.provider === provider);
  }
  
  return voices;
}

// Get all available voice agents from the voice_agents table
export function getAvailableVoiceAgents(): any[] {
  // This would typically fetch from the database
  // For now, return the predefined voice agents from the migration
  return [
    {
      id: 'tech-puck',
      name: 'Dr. Sarah Chen',
      display_name: 'Dr. Sarah Chen (Technical)',
      voice_id: 'Puck',
      personality_type: 'technical',
      specializations: ['Software Engineering', 'System Design', 'Algorithms'],
      voice_description: 'Upbeat, energetic voice perfect for technical discussions'
    },
    {
      id: 'analytical-kore',
      name: 'Marcus Johnson',
      display_name: 'Marcus Johnson (Analytical)',
      voice_id: 'Kore',
      personality_type: 'analytical',
      specializations: ['Data Science', 'Analytics', 'Problem Solving'],
      voice_description: 'Firm, confident voice for analytical assessments'
    },
    {
      id: 'empathetic-leda',
      name: 'Lisa Park',
      display_name: 'Lisa Park (Youthful)',
      voice_id: 'Leda',
      personality_type: 'empathetic',
      specializations: ['Junior Roles', 'Career Guidance', 'Mentoring'],
      voice_description: 'Youthful, friendly voice perfect for entry-level interviews'
    },
    {
      id: 'analytical-algenib',
      name: 'Frank Rodriguez',
      display_name: 'Frank Rodriguez (Gravelly)',
      voice_id: 'Algenib',
      personality_type: 'analytical',
      specializations: ['Security', 'Compliance', 'Risk Management'],
      voice_description: 'Gravelly, serious voice for security-focused roles'
    },
    {
      id: 'tech-fenrir',
      name: 'Alex Thompson',
      display_name: 'Alex Thompson (Dynamic)',
      voice_id: 'Fenrir',
      personality_type: 'technical',
      specializations: ['Software Engineering', 'Startup Culture', 'Innovation'],
      voice_description: 'Excitable, dynamic voice for energetic technical discussions'
    }
  ];
}

// Get voice statistics
export function getVoiceStats() {
  const totalVoices = defaultVoices.length;
  const activeVoices = defaultVoices.filter(v => v.isActive).length;
  const maleVoices = defaultVoices.filter(v => v.gender === 'male').length;
  const femaleVoices = defaultVoices.filter(v => v.gender === 'female').length;
  
  return {
    total: totalVoices,
    active: activeVoices,
    inactive: totalVoices - activeVoices,
    male: maleVoices,
    female: femaleVoices,
    neutral: totalVoices - maleVoices - femaleVoices,
    byGender: {
      male: maleVoices,
      female: femaleVoices,
      neutral: totalVoices - maleVoices - femaleVoices
    }
  };
}

// Toggle voice status
export function toggleVoiceStatus(voiceId: string, isActive: boolean): boolean {
  const voice = defaultVoices.find(v => v.id === voiceId);
  if (voice) {
    voice.isActive = isActive;
    return true;
  }
  return false;
}

// Get voice configuration for an interviewer from the database
export function getInterviewerVoiceConfig(interviewer: any): {
  voiceName: string;
  languageCode: string;
  agentType: string;
} {
  // Default configuration
  const defaultConfig = {
    voiceName: 'gemini-2.5-flash-preview-tts',
    languageCode: 'en-US',
    agentType: 'gemini'
  };

  if (!interviewer) {
    return defaultConfig;
  }

  // Check if this is a voice_agent (has voice_id from voice_agents table)
  if (interviewer.voice_id) {
    const voiceName = mapVoiceIdToGeminiVoice(
      interviewer.voice_id,
      interviewer.language_code || 'en-US',
      interviewer.display_name || interviewer.name
    );

    return {
      voiceName,
      languageCode: interviewer.language_code || 'en-US',
      agentType: interviewer.agent_type || 'gemini'
    };
  }

  // Fallback for legacy interviewers without voice_id
  const voiceName = mapVoiceIdToGeminiVoice(
    interviewer.name,
    interviewer.languageCode || 'en-US',
    interviewer.name
  );

  return {
    voiceName,
    languageCode: interviewer.languageCode || 'en-US',
    agentType: interviewer.agent_type || 'gemini'
  };
}
