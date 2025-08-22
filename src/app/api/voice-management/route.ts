import { NextRequest, NextResponse } from 'next/server';
import { 
  getAvailableVoices, 
  getVoiceById, 
  getVoiceStats, 
  toggleVoiceStatus,
  VoiceConfig 
} from '@/lib/voice-config';

// GET /api/voice-management - Get available voices and statistics
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const language = url.searchParams.get('language');
    const provider = url.searchParams.get('provider');
    const voiceId = url.searchParams.get('voiceId');
    const includeStats = url.searchParams.get('includeStats') === 'true';

    // Get specific voice by ID
    if (voiceId) {
      const voice = getVoiceById(voiceId);
      if (!voice) {
        return NextResponse.json({ error: 'Voice not found' }, { status: 404 });
      }
      return NextResponse.json({ voice });
    }

    // Get available voices with optional filters
    const voices = getAvailableVoices(language || undefined, provider || undefined);
    
    const response: any = { voices };
    
    // Include statistics if requested
    if (includeStats) {
      response.stats = getVoiceStats();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/voice-management:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/voice-management - Update voice status (enable/disable)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { voiceId, isActive } = body;

    if (!voiceId || typeof isActive !== 'boolean') {
      return NextResponse.json({ 
        error: 'Missing required fields: voiceId and isActive' 
      }, { status: 400 });
    }

    const success = toggleVoiceStatus(voiceId, isActive);
    
    if (!success) {
      return NextResponse.json({ error: 'Voice not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Voice ${voiceId} ${isActive ? 'activated' : 'deactivated'}` 
    });
  } catch (error) {
    console.error('Error in PUT /api/voice-management:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/voice-management - Add new voice (future functionality)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voice }: { voice: VoiceConfig } = body;

    if (!voice || !voice.id || !voice.name || !voice.gender || !voice.language) {
      return NextResponse.json({ 
        error: 'Missing required voice fields: id, name, gender, language' 
      }, { status: 400 });
    }

    // In the future, this could validate the voice configuration
    // and add it to a database instead of the in-memory array
    
    // For now, return a placeholder response
    return NextResponse.json({ 
      success: true, 
      message: 'Voice addition not yet implemented. This endpoint is prepared for future use.',
      voice: voice
    });
  } catch (error) {
    console.error('Error in POST /api/voice-management:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

