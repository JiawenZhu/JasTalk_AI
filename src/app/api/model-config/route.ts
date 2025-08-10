import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

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

export async function GET() {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you can implement your own admin check)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get model configuration from environment or database
    const defaultConfig: ModelConfig = {
      provider: 'openai',
      model: 'gpt-5-nano',
      apiKey: process.env.OPENAI_API_KEY || '',
      isEnabled: true,
      features: {
        liveStreaming: false,
        realTimeInteraction: false,
        multimodal: false,
        longContext: false
      }
    };

    // Try to get from database if available
    try {
      const { data: configData } = await supabase
        .from('model_configurations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (configData) {
        return NextResponse.json(configData.config);
      }
    } catch (error) {
      // Table might not exist, return default config
      console.log('No saved configuration found, using default');
    }

    return NextResponse.json(defaultConfig);
  } catch (error) {
    console.error('Error getting model config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const config: ModelConfig = await request.json();

    // Validate configuration
    if (!config.provider || !config.model) {
      return NextResponse.json({ error: 'Invalid configuration' }, { status: 400 });
    }

    // Save to database
    try {
      const { error: upsertError } = await supabase
        .from('model_configurations')
        .upsert({
          user_id: user.id,
          config: config,
          updated_at: new Date().toISOString()
        });

      if (upsertError) {
        // If table doesn't exist, create it
        if (upsertError.code === '42P01') {
          await supabase.rpc('create_model_configurations_table');
          
          // Retry the insert
          const { error: retryError } = await supabase
            .from('model_configurations')
            .insert({
              user_id: user.id,
              config: config,
              updated_at: new Date().toISOString()
            });

          if (retryError) {
            throw retryError;
          }
        } else {
          throw upsertError;
        }
      }

      return NextResponse.json({ success: true, config });
    } catch (error) {
      console.error('Error saving model config:', error);
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating model config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
