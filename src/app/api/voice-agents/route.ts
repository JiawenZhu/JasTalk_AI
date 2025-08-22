import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    const supabase = createAdminClient();
    
    let query = supabase
      .from('voice_agents')
      .select('*')
      .order('name');
    
    // Filter by personality type if specified
    if (type && type !== 'all') {
      query = query.eq('personality_type', type);
    }
    
    const { data: voiceAgents, error } = await query;
    
    if (error) {
      console.error('Error fetching voice agents:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch voice agents',
        details: error.message 
      }, { status: 500 });
    }
    
    // Transform to match our interface
    const transformedAgents = voiceAgents.map(agent => ({
      id: agent.id,
      name: agent.name,
      displayName: agent.display_name,
      voiceId: agent.voice_id,
      languageCode: agent.language_code,
      personalityType: agent.personality_type,
      specializations: agent.specializations || [],
      voiceDescription: agent.voice_description,
      avatarUrl: agent.avatar_url,
      isPremium: agent.is_premium
    }));
    
    return NextResponse.json({ 
      success: true,
      voice_agents: transformedAgents,
      count: transformedAgents.length
    });
    
  } catch (error) {
    console.error('Voice agents API error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
