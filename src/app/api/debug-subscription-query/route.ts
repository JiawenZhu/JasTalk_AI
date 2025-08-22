import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Debug endpoint not available in production' },
        { status: 403 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Debug subscription query for user:', user.id);

    // Query exactly like the user-subscription API does
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscriptions:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    // Also check for any subscriptions regardless of status
    const { data: allSubscriptions, error: allSubError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id);

    // Aggregate credits exactly like the API does
    let totalMinutes = 0;
    let totalMinutesTotal = 0;
    let bestTier = 'free';
    let primarySubscription = null;

    if (subscriptions && subscriptions.length > 0) {
      // Sum up all remaining minutes
      totalMinutes = subscriptions.reduce((sum, sub) => sum + (sub.interview_time_remaining || 0), 0);
      totalMinutesTotal = subscriptions.reduce((sum, sub) => sum + (sub.interview_time_total || 0), 0);
      
      // Determine best tier (pro > free)
      bestTier = subscriptions.some(sub => sub.tier === 'pro') ? 'pro' : 'free';
      
      // Use the most recent pro subscription as primary, or the first one if no pro
      primarySubscription = subscriptions
        .filter(sub => sub.tier === bestTier)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || subscriptions[0];
    }

    return NextResponse.json({
      success: true,
      message: 'Debug subscription query results',
      user: {
        id: user.id,
        email: user.email
      },
      query: {
        status: 'active',
        user_id: user.id
      },
      activeSubscriptions: subscriptions || [],
      allSubscriptions: allSubscriptions || [],
      aggregation: {
        totalMinutes,
        totalMinutesTotal,
        bestTier,
        primarySubscriptionId: primarySubscription?.id,
        subscriptionCount: subscriptions?.length || 0
      },
      debug: {
        subError: subError ? { message: subError.message, code: subError.code } : null,
        allSubError: allSubError ? { message: allSubError.message, code: allSubError.code } : null
      }
    });

  } catch (error) {
    console.error('Error in debug subscription query:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
