import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Cleanup endpoint not available in production' },
        { status: 403 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🧹 Starting cleanup for user:', user.id);

    // Get all active subscriptions for the user
    const { data: subscriptions, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('tier', { ascending: false }) // 'pro' comes before 'free'
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length <= 1) {
      return NextResponse.json({
        success: true,
        message: 'No duplicate subscriptions found',
        subscriptions: subscriptions || []
      });
    }

    console.log('🔍 Found multiple subscriptions:', subscriptions.map(s => ({
      id: s.id,
      tier: s.tier,
      remaining: s.interview_time_remaining,
      created: s.created_at
    })));

    // Determine which subscription to keep (prefer pro tier, then most recent)
    const primarySubscription = subscriptions[0];
    const duplicateSubscriptions = subscriptions.slice(1);

    console.log('📋 Primary subscription to keep:', {
      id: primarySubscription.id,
      tier: primarySubscription.tier,
      remaining: primarySubscription.interview_time_remaining
    });

    // Deactivate duplicate subscriptions
    const deactivationPromises = duplicateSubscriptions.map(sub => 
      supabase
        .from('user_subscriptions')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', sub.id)
    );

    const deactivationResults = await Promise.all(deactivationPromises);
    const deactivationErrors = deactivationResults.filter(result => result.error);

    if (deactivationErrors.length > 0) {
      console.error('Errors deactivating duplicates:', deactivationErrors);
      return NextResponse.json({
        error: 'Failed to deactivate some duplicate subscriptions',
        details: deactivationErrors
      }, { status: 500 });
    }

    console.log('✅ Successfully deactivated duplicate subscriptions');

    // Get the final state
    const { data: finalSubscriptions, error: finalFetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (finalFetchError) {
      console.error('Error fetching final state:', finalFetchError);
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully cleaned up duplicate subscriptions',
      primarySubscription: {
        id: primarySubscription.id,
        tier: primarySubscription.tier,
        interview_time_remaining: primarySubscription.interview_time_remaining,
        interview_time_total: primarySubscription.interview_time_total
      },
      deactivatedCount: duplicateSubscriptions.length,
      finalActiveSubscriptions: finalSubscriptions || []
    });

  } catch (error) {
    console.error('Error in cleanup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
