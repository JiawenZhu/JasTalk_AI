import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Admin cleanup endpoint not available in production' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, action } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🧹 Starting admin cleanup for user:', userId);

    if (action === 'cleanup') {
      // Get all active subscriptions for the user
      const { data: subscriptions, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
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
        .eq('user_id', userId)
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

    } else if (action === 'status') {
      // Just get the current status
      const { data: subscriptions, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (fetchError) {
        console.error('Error fetching subscriptions:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Current subscription status',
        activeSubscriptions: subscriptions || [],
        totalActive: subscriptions?.length || 0
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "cleanup" or "status"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in admin cleanup:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
