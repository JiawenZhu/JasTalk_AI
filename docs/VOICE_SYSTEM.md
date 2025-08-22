# Scalable Voice Configuration System

## Overview

The JasTalk AI platform now uses a completely scalable voice configuration system that allows for easy addition of new voices without code changes to the core interview logic.

## Architecture

### 1. Voice Configuration (`src/lib/voice-config.ts`)
- **Centralized voice definitions** with full metadata
- **Type-safe interfaces** for voice configuration
- **Expandable mapping systems** for names and characteristics
- **Utility functions** for voice management

### 2. Voice Mapping Logic
- **Priority-based selection**: Name mapping → Language → Gender → Characteristics
- **Intelligent fallbacks** for unknown combinations
- **Characteristic matching** algorithm for best voice selection

### 3. API Management (`src/app/api/voice-management/route.ts`)
- **GET**: Retrieve available voices with optional filters
- **PUT**: Enable/disable voices dynamically
- **POST**: Add new voices (prepared for future database integration)

## Voice Configuration Structure

```typescript
interface VoiceConfig {
  id: string;           // Unique identifier (e.g., 'charon')
  name: string;         // Display name (e.g., 'Charon')
  gender: 'male' | 'female' | 'neutral';
  language: string;     // Language code (e.g., 'en-US')
  characteristics: string[];  // Voice traits ['dynamic', 'energetic']
  description: string;  // Human-readable description
  provider: 'gemini' | 'elevenlabs' | 'azure' | 'custom';
  isActive: boolean;    // Whether voice is available for use
}
```

## Current Voice Inventory

### Male Voices (6 + 1 Spanish)
- **Charon**: Dynamic and energetic
- **Fenrir**: Bright and clear
- **Gacrux**: Professional and authoritative
- **Iapetus**: Friendly and warm
- **Orus**: Calm and steady
- **Rasalgethi**: Confident and strong
- **Puck**: Spanish male voice

### Female Voices (9)
- **Aoede**: Supportive and caring
- **Kore**: Professional and intelligent
- **Leda**: Friendly and warm
- **Callirrhoe**: Empathetic and gentle
- **Autonoe**: Gentle and calming
- **Despina**: Confident and energetic
- **Erinome**: Confident and dynamic
- **Laomedeia**: Wise and experienced
- **Vindemiatrix**: Creative and artistic

## Adding New Voices

### 1. Simple Addition (Gemini Voices)
Add to `GEMINI_VOICES` array in `src/lib/voice-config.ts`:

```typescript
{
  id: 'newVoiceId',
  name: 'New Voice Name',
  gender: 'female',
  language: 'en-US',
  characteristics: ['calm', 'professional'],
  description: 'Description of the voice',
  provider: 'gemini',
  isActive: true
}
```

### 2. Name-Specific Mapping (Optional)
Add to `SPECIFIC_NAME_MAPPINGS`:

```typescript
'newName': 'newVoiceId',
```

### 3. Gender Detection (Optional)
Add names to `GENDER_NAME_MAPPING`:

```typescript
female: [...existingNames, 'newFemaleName'],
male: [...existingNames, 'newMaleName']
```

## Voice Selection Priority

1. **Specific Name Mapping** (Highest Priority)
   - Direct name-to-voice assignments
   - Example: "Alex" → "charon"

2. **Language-Specific Voices**
   - Spanish → "puck"
   - Future: French, German, etc.

3. **Gender Detection**
   - Name analysis for gender
   - Filter available voices by gender

4. **Characteristic Matching**
   - Match interviewer traits to voice characteristics
   - Algorithm finds best match score

5. **Default Fallback** (Lowest Priority)
   - Female: "aoede"
   - Male: "charon"

## API Usage

### Get All Available Voices
```bash
GET /api/voice-management
```

### Get Voices with Statistics
```bash
GET /api/voice-management?includeStats=true
```

### Get Specific Voice
```bash
GET /api/voice-management?voiceId=charon
```

### Filter by Language
```bash
GET /api/voice-management?language=en-US
```

### Enable/Disable Voice
```bash
PUT /api/voice-management
Content-Type: application/json

{
  "voiceId": "charon",
  "isActive": false
}
```

## Future Expansion Plans

### 1. Multiple Providers
- **ElevenLabs**: Premium AI voices
- **Azure Cognitive Services**: Enterprise voices
- **Custom Models**: Proprietary voice clones

### 2. Database Integration
- Move voice configurations to database
- Dynamic voice management through admin interface
- A/B testing for voice effectiveness

### 3. Advanced Features
- **Voice Cloning**: Custom interviewer voices
- **Emotion Simulation**: Dynamic emotional tone
- **Accent Varieties**: Regional variations
- **Speed/Pitch Control**: Real-time voice modulation

### 4. Analytics Integration
- Track voice performance metrics
- User preference analysis
- Automated voice recommendations

## Debugging & Monitoring

### Voice Selection Debugging
The system logs detailed voice mapping decisions:

```javascript
console.log('🎵 Voice mapping decision:', {
  agentName: "Emma Rodriguez",
  voiceId: "supportive",
  mappedVoice: "aoede",
  voiceDetails: {
    name: "Aoede",
    gender: "female",
    characteristics: ["supportive", "caring", "empathetic"]
  },
  systemStats: {
    totalVoices: 16,
    activeVoices: 16,
    genderDistribution: { male: 7, female: 9, neutral: 0 }
  }
});
```

### Voice Statistics
Get real-time voice system statistics:

```typescript
import { getVoiceStats } from '@/lib/voice-config';

const stats = getVoiceStats();
// Returns: total, active, byGender, byLanguage, byProvider
```

## Best Practices

### 1. Voice Configuration
- **Descriptive IDs**: Use meaningful voice identifiers
- **Rich Characteristics**: Provide multiple traits for better matching
- **Accurate Metadata**: Ensure gender and language are correct

### 2. Name Mapping
- **Common Variations**: Include nicknames and variations
- **Cultural Sensitivity**: Consider international name variations
- **Regular Updates**: Add new popular names periodically

### 3. Characteristic Matching
- **Broad Categories**: Use general traits (professional, friendly, calm)
- **Specific Descriptors**: Include specific voice qualities
- **Balanced Distribution**: Ensure good variety across characteristics

### 4. Testing New Voices
- **Preview Functionality**: Test voices before activation
- **User Feedback**: Collect user preferences
- **A/B Testing**: Compare voice effectiveness

## Migration Guide

### From Old System
The old hardcoded voice mapping has been completely replaced. No changes needed to existing interviews - they will automatically use the new system.

### Breaking Changes
None. The new system is backward compatible and maintains all existing voice assignments.

### Performance Impact
- **Minimal overhead**: Voice selection algorithms are optimized
- **Memory efficient**: Voice configurations are loaded once
- **Fast lookup**: O(1) for specific mappings, O(n) for characteristic matching

---

This scalable system ensures that adding new voices is as simple as updating a configuration file, with no changes needed to the core interview logic.

