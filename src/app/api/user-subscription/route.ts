import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all active subscriptions to aggregate total credits
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscriptions:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    // Aggregate credits from all active subscriptions
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

    console.log('🔍 User subscription API - Credit aggregation:', {
      userId: user.id,
      totalSubscriptions: subscriptions?.length || 0,
      subscriptions: subscriptions?.map(s => ({ 
        id: s.id, 
        tier: s.tier, 
        remaining: s.interview_time_remaining,
        total: s.interview_time_total,
        created: s.created_at
      })),
      aggregatedCredits: {
        totalMinutes,
        totalMinutesTotal,
        bestTier,
        primarySubscriptionId: primarySubscription?.id
      }
    });

    // Create a unified subscription object with aggregated credits
    const subscription = primarySubscription ? {
      ...primarySubscription,
      interview_time_remaining: totalMinutes,
      interview_time_total: totalMinutesTotal,
      tier: bestTier
    } : null;

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    // Fetch user's invoices
    let invoices = [];
    try {
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('user_invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!invoiceError && invoiceData) {
        invoices = invoiceData;
      }
    } catch (invoiceError) {
      console.log('No invoices table found yet, skipping invoices');
    }

    // If no subscription found, return free tier
    if (!subscription) {
      const freeSubscription = {
        id: 'free-tier',
        user_id: user.id,
        tier: 'free',
        status: 'active',
        interview_time_remaining: 0, // No free credits by default
        interview_time_total: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        expires_at: null
      };

      return NextResponse.json({ 
        subscription: freeSubscription,
        invoices: invoices
      });
    }

    // Add invoices to subscription data
    const subscriptionWithInvoices = {
      ...subscription,
      invoices: invoices
    };

    return NextResponse.json({ 
      subscription: subscriptionWithInvoices
    });
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, duration_minutes } = body;

    if (action === 'upgrade_to_pro') {
      // Upgrade user to pro tier
      const { data: subscription, error: updateError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          tier: 'pro',
          status: 'active',
          interview_time_remaining: 0, // Pro users pay per session
          interview_time_total: 0,
        })
        .select()
        .single();

      if (updateError) {
        console.error('Error upgrading to pro:', updateError);
        return NextResponse.json({ error: 'Failed to upgrade subscription' }, { status: 500 });
      }

      return NextResponse.json({ subscription });
    }

    if (action === 'start_pro_session') {
      // Start a pro user session
      const cost = duration_minutes * 0.12; // $0.12/minute (was $20/hour)
      
      const { data: session, error: sessionError } = await supabase
        .from('pro_user_sessions')
        .insert({
          user_id: user.id,
          duration_minutes,
          cost,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating pro session:', sessionError);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }

      return NextResponse.json({ session });
    }

    if (action === 'start_free_session') {
      // Start a free user session
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('interview_time_remaining')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subError) {
        console.error('Error fetching subscription:', subError);
        return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
      }

      if (!subscription || subscription.interview_time_remaining < duration_minutes) {
        return NextResponse.json({ 
          error: 'Insufficient free time remaining',
          time_remaining: subscription?.interview_time_remaining || 0
        }, { status: 400 });
      }

      // Create free session
      const { data: session, error: sessionError } = await supabase
        .from('free_user_sessions')
        .insert({
          user_id: user.id,
          duration_minutes,
          time_remaining: subscription.interview_time_remaining - duration_minutes,
          status: 'active',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating free session:', sessionError);
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }

      // Update remaining time
      await supabase
        .from('user_subscriptions')
        .update({ 
          interview_time_remaining: subscription.interview_time_remaining - duration_minutes 
        })
        .eq('user_id', user.id);

      return NextResponse.json({ session });
    }

    if (action === 'add_welcome_credits') {
      // Add welcome minutes to new user
      // All users get 42 minutes by default
      const { minutes = 42 } = body;
      
      // Use minutes directly - no more rate conversion
      const minutesToAdd = minutes;
      
      const { data: subscription, error: updateError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          tier: 'free',
          status: 'active',
          interview_time_remaining: minutesToAdd,
          interview_time_total: minutesToAdd,
        })
        .select()
        .single();

      if (updateError) {
        console.error('Error adding welcome minutes:', updateError);
        return NextResponse.json({ error: 'Failed to add welcome minutes' }, { status: 500 });
      }

      return NextResponse.json({ 
        subscription,
        message: `Successfully added ${minutesToAdd} welcome minutes`
      });
    }

    if (action === 'add_purchase_credits') {
      // Manually add minutes for a purchase (when webhook fails)
      const { packageId, minutes } = body;
      
      if (!packageId || !minutes) {
        return NextResponse.json({ error: 'Missing packageId or minutes' }, { status: 400 });
      }
      
      // Find the package to validate
      const { CREDIT_PACKAGES } = await import('@/lib/credit-packages');
      const packageInfo = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
      
      if (!packageInfo) {
        return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 });
      }
      
      // Try to get current subscription
      let currentSubscription = null;
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (!error && data) {
          currentSubscription = data;
        }
      } catch (fetchError) {
        console.log('No existing subscription found, will create new one');
      }

      if (currentSubscription) {
        // Update existing subscription
        const newMinutes = currentSubscription.interview_time_remaining + parseInt(minutes);
        const newTotal = currentSubscription.interview_time_total + parseInt(minutes);
        
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            interview_time_remaining: newMinutes,
            interview_time_total: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSubscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }
        
        return NextResponse.json({ 
          subscription: { ...currentSubscription, interview_time_remaining: newMinutes, interview_time_total: newTotal },
          message: `Successfully added ${minutes} minutes to existing subscription`
        });
      } else {
        // Create new subscription
        const { error: createError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            tier: 'pro',
            status: 'active',
            interview_time_remaining: parseInt(minutes),
            interview_time_total: parseInt(minutes),
          });

        if (createError) {
          console.error('Error creating subscription:', createError);
          return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
        }
        
        return NextResponse.json({ 
          message: `Successfully created new subscription with ${minutes} minutes`
        });
      }
    }

    if (action === 'deduct_minutes') {
      // Deduct minutes from user's account
      const { minutes } = body;
      
      if (!minutes || minutes <= 0) {
        return NextResponse.json({ error: 'Invalid minutes amount' }, { status: 400 });
      }
      
      // Try to get current subscription
      let currentSubscription = null;
      try {
        const { data, error } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .single();

        if (!error && data) {
          currentSubscription = data;
        }
      } catch (fetchError) {
        console.log('No existing subscription found');
      }

      if (currentSubscription) {
        // Check if user has enough minutes
        if (currentSubscription.interview_time_remaining < minutes) {
          return NextResponse.json({ 
            error: 'Insufficient minutes',
            available: currentSubscription.interview_time_remaining,
            requested: minutes
          }, { status: 400 });
        }

        // Update existing subscription
        const newMinutes = currentSubscription.interview_time_remaining - minutes;
        
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            interview_time_remaining: newMinutes,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSubscription.id);

        if (updateError) {
          console.error('Error deducting minutes:', updateError);
          return NextResponse.json({ error: 'Failed to deduct minutes' }, { status: 500 });
        }
        
        return NextResponse.json({ 
          success: true,
          message: `Successfully deducted ${minutes} minutes`,
          remainingMinutes: newMinutes,
          deductedMinutes: minutes
        });
      } else {
        return NextResponse.json({ 
          error: 'No active subscription found',
          available: 0,
          requested: minutes
        }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/user-subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
