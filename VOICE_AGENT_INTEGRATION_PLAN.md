# 🎤 Voice Agent Integration Plan - JasTalk AI

## 📋 Project Overview

This document outlines the integration plan for enhancing JasTalk AI's interview platform with advanced voice agent functionality from the HTML demo. Our goal is to create a sophisticated multi-voice interviewer system that provides users with diverse interviewer personas and enhanced conversation capabilities.

## 🎯 Priority 1: Multiple Voice Agent Integration

### **Current State Analysis**

**✅ What We Have:**
- Retell AI integration for voice calls (`src/components/call/index.tsx`)
- Basic interviewer selection with Bob, Lisa, Sarah agents
- Voice conversation handling in practice sessions
- Supabase database with `interviewer` table
- Credit system and authentication

**❌ What We're Missing:**
- Multiple voice options per interviewer
- Voice preview functionality
- Advanced voice customization (speed, language)
- Gemini TTS integration for richer voice synthesis
- Turn-by-turn conversation analytics

### **Integration Goals**

1. **Expand Voice Agent Library**: From 3 basic agents to 20+ voice options
2. **Voice Preview System**: Allow users to hear agent voices before selection
3. **Language Support**: Add Spanish and Chinese voice agents
4. **Personality Matching**: Link voice characteristics to interviewer personas
5. **Advanced Audio Controls**: Speed adjustment, voice quality selection

## 🏗️ Technical Implementation Plan

### **Phase 1: Voice Agent Database Schema (Week 1)**

#### **1.1 Database Updates**

```sql
-- Enhanced voice_agents table
CREATE TABLE voice_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  voice_id TEXT NOT NULL, -- Gemini TTS voice ID
  language_code TEXT DEFAULT 'en-US',
  personality_type TEXT NOT NULL, -- 'technical', 'behavioral', 'empathetic', 'analytical'
  specializations TEXT[] DEFAULT '{}',
  voice_description TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sample voice agents
INSERT INTO voice_agents (id, name, display_name, voice_id, personality_type, specializations, voice_description) VALUES
('tech-zephyr', 'Dr. Sarah Chen', 'Dr. Sarah Chen (Technical)', 'Zephyr', 'technical', '{"Software Engineering", "System Design", "Algorithms"}', 'Bright, clear voice perfect for technical discussions'),
('behavioral-aoede', 'Marcus Johnson', 'Marcus Johnson (Behavioral)', 'Aoede', 'behavioral', '{"Leadership", "Team Management", "Communication"}', 'Warm, encouraging voice for behavioral interviews'),
('analytical-kore', 'Dr. Priya Patel', 'Dr. Priya Patel (Analytical)', 'Kore', 'analytical', '{"Data Science", "Analytics", "Problem Solving"}', 'Firm, confident voice for analytical assessments'),
('empathetic-leda', 'Emma Rodriguez', 'Emma Rodriguez (Supportive)', 'Leda', 'empathetic', '{"HR", "People Management", "Coaching"}', 'Youthful, supportive voice for comfortable conversations'),
('spanish-es', 'Carlos Mendoza', 'Carlos Mendoza (Español)', 'es-US', 'bilingual', '{"Spanish Interviews", "International Business"}', 'Native Spanish speaker for bilingual interviews'),
('chinese-zh', 'Li Wei', 'Li Wei (中文)', 'zh-CN', 'bilingual', '{"Chinese Interviews", "International Markets"}', 'Native Mandarin speaker for Chinese interviews');

-- Update practice_sessions to include voice agent
ALTER TABLE practice_sessions ADD COLUMN voice_agent_id TEXT REFERENCES voice_agents(id);
ALTER TABLE practice_sessions ADD COLUMN voice_settings JSONB DEFAULT '{}'; -- speed, language preferences
```

#### **1.2 Voice Agent Service**

```typescript
// src/services/voice-agents.service.ts
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
  speed: number; // 0.5 to 1.5
  language: string;
  voiceId: string;
}

export class VoiceAgentService {
  static async getAllVoiceAgents(): Promise<VoiceAgent[]> {
    // Fetch from Supabase voice_agents table
  }
  
  static async getVoiceAgentsByType(type: string): Promise<VoiceAgent[]> {
    // Filter by personality type
  }
  
  static async generateVoicePreview(voiceId: string, speed: number): Promise<string> {
    // Generate preview audio using Gemini TTS
  }
}
```

### **Phase 2: Voice Agent Selection UI (Week 1)**

#### **2.1 Voice Agent Selector Component**

```typescript
// src/components/interview/VoiceAgentSelector.tsx
import React, { useState, useEffect } from 'react';
import { VoiceAgent, VoiceAgentService } from '@/services/voice-agents.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoiceAgentSelectorProps {
  onAgentSelect: (agent: VoiceAgent, settings: VoiceSettings) => void;
  selectedAgent?: VoiceAgent;
}

export function VoiceAgentSelector({ onAgentSelect, selectedAgent }: VoiceAgentSelectorProps) {
  const [voiceAgents, setVoiceAgents] = useState<VoiceAgent[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [previewingAgent, setPreviewingAgent] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadVoiceAgents();
  }, []);

  const loadVoiceAgents = async () => {
    try {
      const agents = await VoiceAgentService.getAllVoiceAgents();
      setVoiceAgents(agents);
    } catch (error) {
      console.error('Failed to load voice agents:', error);
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
      
      // Generate preview audio
      const audioUrl = await VoiceAgentService.generateVoicePreview(agent.voiceId, voiceSpeed);
      
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setPreviewingAgent(null);
        setCurrentAudio(null);
      };
      
      setCurrentAudio(audio);
      await audio.play();
      
    } catch (error) {
      console.error('Voice preview failed:', error);
      setPreviewingAgent(null);
    }
  };

  const filteredAgents = selectedType === 'all' 
    ? voiceAgents 
    : voiceAgents.filter(agent => agent.personalityType === selectedType);

  return (
    <div className="space-y-6">
      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        {['all', 'technical', 'behavioral', 'empathetic', 'analytical', 'bilingual'].map((type) => (
          <Button
            key={type}
            variant={selectedType === type ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedType(type)}
            className="capitalize"
          >
            {type === 'all' ? 'All Agents' : type}
          </Button>
        ))}
      </div>

      {/* Voice Speed Control */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Voice Speed: {voiceSpeed === 0.5 ? 'Very Slow' : 
                       voiceSpeed === 0.75 ? 'Slow' :
                       voiceSpeed === 1.0 ? 'Normal' :
                       voiceSpeed === 1.25 ? 'Fast' : 'Very Fast'}
        </label>
        <Slider
          value={[voiceSpeed]}
          onValueChange={(value) => setVoiceSpeed(value[0])}
          min={0.5}
          max={1.5}
          step={0.25}
          className="w-full"
        />
      </div>

      {/* Voice Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => (
          <Card 
            key={agent.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedAgent?.id === agent.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onAgentSelect(agent, { speed: voiceSpeed, language: agent.languageCode, voiceId: agent.voiceId })}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{agent.displayName}</CardTitle>
                {agent.isPremium && <Badge variant="secondary">Premium</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{agent.voiceDescription}</p>
            </CardHeader>
            
            <CardContent className="space-y-3">
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
                {previewingAgent === agent.id ? (
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
        ))}
      </div>
    </div>
  );
}
```

#### **2.2 Integration with Practice Setup**

```typescript
// Update src/app/practice/new/page.tsx
import { VoiceAgentSelector } from '@/components/interview/VoiceAgentSelector';

// Add to the practice setup flow:
const [selectedVoiceAgent, setSelectedVoiceAgent] = useState<VoiceAgent | null>(null);
const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
  speed: 1.0,
  language: 'en-US',
  voiceId: 'Zephyr'
});

// In the setup process, add voice agent selection step:
<VoiceAgentSelector
  onAgentSelect={(agent, settings) => {
    setSelectedVoiceAgent(agent);
    setVoiceSettings(settings);
  }}
  selectedAgent={selectedVoiceAgent}
/>
```

### **Phase 3: Gemini TTS Integration (Week 2)**

#### **3.1 Enhanced Gemini Live API**

```typescript
// Update src/app/api/gemini-live/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { 
    prompt, 
    voiceAgentId, 
    voiceSettings = { speed: 1.0, language: 'en-US', voiceId: 'Zephyr' },
    model = 'gemini-1.5-flash-latest' 
  } = body;

  try {
    // Get voice agent details
    const voiceAgent = await getVoiceAgent(voiceAgentId);
    
    // Configure TTS model with voice settings
    const ttsModel = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-preview-tts" 
    });

    // Generate text response
    const chatModel = genAI.getGenerativeModel({ model });
    const textResult = await chatModel.generateContent({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 150 }
    });

    const responseText = textResult.response.text();

    // Generate audio with voice settings
    const audioResult = await generateVoiceAudio(
      ttsModel, 
      responseText, 
      voiceAgent, 
      voiceSettings
    );

    return NextResponse.json({
      text: responseText,
      audioData: audioResult.audioData,
      audioFormat: 'pcm',
      voiceAgent: voiceAgent,
      settings: voiceSettings
    });

  } catch (error) {
    console.error('Gemini Live API Error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}

async function generateVoiceAudio(
  ttsModel: any, 
  text: string, 
  voiceAgent: VoiceAgent, 
  settings: VoiceSettings
) {
  let speedInstruction = '';
  if (settings.speed === 0.5) speedInstruction = 'very slowly';
  else if (settings.speed === 0.75) speedInstruction = 'slowly';
  else if (settings.speed === 1.25) speedInstruction = 'quickly';
  else if (settings.speed === 1.5) speedInstruction = 'very quickly';

  const prompt = `Speak in a ${voiceAgent.personalityType} and professional tone. ${speedInstruction ? `Speak ${speedInstruction}.` : ''} Here is the text: ${text}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { 
        voiceConfig: { 
          languageCode: settings.language !== 'en-US' ? settings.language : undefined,
          prebuiltVoiceConfig: { 
            voiceName: ['es-US', 'zh-CN'].includes(settings.language) ? undefined : settings.voiceId 
          } 
        } 
      }
    },
  };

  const result = await ttsModel.generateContent(payload);
  return {
    audioData: result.response.candidates[0].content.parts[0].inlineData.data
  };
}
```

#### **3.2 Voice Preview API Endpoint**

```typescript
// src/app/api/voice-preview/route.ts
export async function POST(request: NextRequest) {
  const { voiceId, speed = 1.0, language = 'en-US' } = await request.json();

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
    const ttsModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

    let sampleText = "Hello, this is a preview of my voice. I'm excited to help you practice for your interview.";
    if (language === 'es-US') {
      sampleText = "Hola, esta es una vista previa de mi voz. Estoy emocionado de ayudarte a practicar para tu entrevista.";
    } else if (language === 'zh-CN') {
      sampleText = "你好，这是我的声音预览。我很高兴能帮助你练习面试。";
    }

    const audioResult = await generateVoiceAudio(ttsModel, sampleText, voiceId, speed, language);
    
    // Convert to base64 audio URL for immediate playback
    const audioUrl = `data:audio/pcm;base64,${audioResult.audioData}`;
    
    return NextResponse.json({ audioUrl });

  } catch (error) {
    console.error('Voice preview error:', error);
    return NextResponse.json({ error: 'Failed to generate voice preview' }, { status: 500 });
  }
}
```

### **Phase 4: Integration with Existing Systems (Week 2)**

#### **4.1 Update Practice Session Creation**

```typescript
// Update src/app/api/practice-sessions/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { 
    questions, 
    interviewer_id, 
    voiceAgentId,  // NEW
    voiceSettings  // NEW
  } = body;

  // ... existing auth and validation logic ...

  const { data: session, error } = await supabase
    .from('practice_sessions')
    .insert({
      user_id: user.id,
      questions: questions,
      interviewer_id: interviewer_id,
      voice_agent_id: voiceAgentId,     // NEW
      voice_settings: voiceSettings,    // NEW
      status: 'active',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  // ... rest of the logic ...
}
```

#### **4.2 Update Interview Components**

```typescript
// Update src/app/practice/new/page.tsx
// Add voice agent information display and use selected voice settings

const [voiceAgent, setVoiceAgent] = useState<VoiceAgent | null>(null);
const [voiceSettings, setVoiceSettings] = useState<VoiceSettings | null>(null);

useEffect(() => {
  if (session?.voice_agent_id) {
    loadVoiceAgent(session.voice_agent_id);
  }
  if (session?.voice_settings) {
    setVoiceSettings(session.voice_settings);
  }
}, [session]);

// Update AI response generation to use voice agent settings
const generateAIResponse = async (userMessage: string) => {
  const response = await fetch('/api/gemini-live', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `User said: "${userMessage}". Continue the interview naturally.`,
      voiceAgentId: voiceAgent?.id,
      voiceSettings: voiceSettings,
      model: 'gemini-1.5-flash-latest'
    }),
  });
  // ... handle response with audio playback
};
```

## 📊 Success Metrics

### **Technical Metrics**
- [ ] 20+ voice agents available for selection
- [ ] Voice preview generation < 3 seconds
- [ ] Audio quality rating > 4.5/5 from users
- [ ] Zero audio playback failures
- [ ] Support for 3 languages (English, Spanish, Chinese)

### **User Experience Metrics**
- [ ] Voice agent selection completion rate > 90%
- [ ] User satisfaction with voice variety > 4.0/5
- [ ] Average time spent on voice selection < 2 minutes
- [ ] Voice agent personality matching accuracy > 85%

### **Business Metrics**
- [ ] Increased interview session completion rate by 15%
- [ ] Reduced user drop-off during setup by 25%
- [ ] Premium voice agent upgrade rate > 10%

## 🗓️ Implementation Timeline

### **Week 1: Foundation & UI**
- **Day 1-2**: Database schema updates and voice agent data seeding
- **Day 3-4**: VoiceAgentSelector component development
- **Day 5**: Integration with practice setup flow
- **Day 6-7**: Testing and UI refinements

### **Week 2: API Integration**
- **Day 1-2**: Gemini TTS API integration
- **Day 3**: Voice preview API development
- **Day 4-5**: Update existing interview flow with voice agents
- **Day 6-7**: End-to-end testing and bug fixes

### **Week 3: Polish & Launch**
- **Day 1-2**: Performance optimization and caching
- **Day 3-4**: User testing and feedback incorporation
- **Day 5**: Documentation and deployment
- **Day 6-7**: Monitoring and post-launch adjustments

## 🔧 Dependencies & Requirements

### **Technical Dependencies**
- Google AI API key with Gemini TTS access
- Supabase database schema updates
- Chart.js for future analytics integration
- Additional npm packages: `@google/generative-ai`

### **Environment Variables**
```bash
GOOGLE_AI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_VOICE_PREVIEW_CACHE_TTL=3600 # 1 hour cache
```

### **Database Migrations**
- Voice agents table creation
- Practice sessions table updates
- Conversation logging enhancements

## 🚨 Risk Assessment & Mitigation

### **High Risk Items**
1. **Gemini TTS Rate Limits**: Implement caching and fallback to Retell voices
2. **Audio Playback Issues**: Progressive enhancement with Web Audio API fallbacks
3. **Voice Generation Latency**: Pre-generate common responses and cache previews

### **Medium Risk Items**
1. **Browser Compatibility**: Test across major browsers, provide graceful degradation
2. **Mobile Audio Performance**: Optimize for mobile devices and slower connections
3. **User Preference Persistence**: Store voice selections in user profiles

### **Mitigation Strategies**
- Implement robust error handling and fallback mechanisms
- Use progressive enhancement for advanced audio features
- Comprehensive testing across devices and browsers
- Monitor API usage and implement rate limiting

## 📚 References & Previous Work

### **Completed Features (Foundation)**
- ✅ Retell AI voice integration
- ✅ Practice session management
- ✅ User authentication and credits
- ✅ Basic interviewer selection
- ✅ Question generation system

### **HTML Demo Features to Integrate**
- 🎯 **Priority 1**: Multi-voice agent selection (Current focus)
- 🎯 **Priority 2**: Advanced conversation logging
- 🎯 **Priority 3**: Post-interview performance analysis
- 🎯 **Priority 4**: Real-time conversation analytics

### **Related Documentation**
- `VOICE_CODE_REVIEW_IMPLEMENTATION.md` - Previous voice integration work
- `CODING_DEMO_VOICE_INTEGRATION.md` - Voice agent architecture
- `README.md` - Current system overview

---

**Next Phase Preview**: After completing voice agent integration, we'll move to Phase 2: Enhanced conversation logging with audio replay functionality, followed by Phase 3: AI-powered performance analysis with radar charts and detailed feedback systems.


