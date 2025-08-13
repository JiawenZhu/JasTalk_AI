import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get user authentication
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription tier
    let userSubscriptionTier = 'free';
    try {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single();
      
      if (userProfile?.subscription_tier) {
        userSubscriptionTier = userProfile.subscription_tier;
      }
    } catch (error) {
      console.log('User profile not found, defaulting to free tier');
    }

    // Get available interviewers based on subscription
    let query = supabase
      .from('interviewers')
      .select('*')
      .eq('is_active', true);

    // Filter by subscription requirements
    if (userSubscriptionTier === 'free') {
      query = query.eq('subscription_required', 'free');
    }
    // Pro users can access both free and pro interviewers
    // else if (userSubscriptionTier === 'pro') {
    //   // No additional filtering needed - pro users can access all
    // }

    const { data: interviewers, error: interviewersError } = await query;

    if (interviewersError) {
      console.error('Error fetching interviewers:', interviewersError);
      return NextResponse.json({ error: 'Failed to fetch interviewers' }, { status: 500 });
    }

    // Transform the data to include agent type information
    const agents = interviewers?.map(interviewer => ({
      id: interviewer.id,
      name: interviewer.name,
      description: interviewer.description,
      image: interviewer.avatar_url || interviewer.image,
      agent_type: interviewer.agent_type || 'gemini',
      subscription_required: interviewer.subscription_required || 'free',
      is_available: true,
      capabilities: {
        voice: interviewer.agent_type === 'retell',
        text: true,
        real_time: true,
        personality_customization: interviewer.agent_type === 'retell'
      },
      gemini_config: interviewer.gemini_config || {
        model: 'gemini-2.0-flash-exp',
        voice: 'default',
        personality: 'Professional and encouraging',
        interview_style: 'Structured but conversational'
      }
    })) || [];

    return NextResponse.json({ 
      agents,
      user_subscription: userSubscriptionTier,
      available_agent_types: userSubscriptionTier === 'pro' ? ['gemini', 'retell'] : ['gemini']
    });

  } catch (error) {
    console.error('Error in get Gemini agents API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
