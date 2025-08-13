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

    // Fetch real subscription data
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

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
        interview_time_remaining: 10, // 10 minutes for free users
        interview_time_total: 10,
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
      // Add welcome credits to new user
      const { amount = 5.00 } = body;
      
      // Convert dollars to minutes (at $0.12/minute rate)
      const minutesToAdd = Math.round((amount / 0.12) * 100) / 100;
      
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
        console.error('Error adding welcome credits:', updateError);
        return NextResponse.json({ error: 'Failed to add welcome credits' }, { status: 500 });
      }

      return NextResponse.json({ 
        subscription,
        message: `Successfully added $${amount} in welcome credits (${minutesToAdd} minutes)`
      });
    }

    if (action === 'add_purchase_credits') {
      // Manually add credits for a purchase (when webhook fails)
      const { packageId, credits, amount } = body;
      
      if (!packageId || !credits || !amount) {
        return NextResponse.json({ error: 'Missing packageId, credits, or amount' }, { status: 400 });
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
        const newCredits = currentSubscription.interview_time_remaining + parseInt(credits);
        const newTotal = currentSubscription.interview_time_total + parseInt(credits);
        
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            interview_time_remaining: newCredits,
            interview_time_total: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSubscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
          return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }
        
        return NextResponse.json({ 
          subscription: { ...currentSubscription, interview_time_remaining: newCredits, interview_time_total: newTotal },
          message: `Successfully added ${credits} credits to existing subscription`
        });
      } else {
        // Create new subscription
        const { error: createError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            tier: 'pro',
            status: 'active',
            interview_time_remaining: parseInt(credits),
            interview_time_total: parseInt(credits),
          });

        if (createError) {
          console.error('Error creating subscription:', createError);
          return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
        }
        
        return NextResponse.json({ 
          message: `Successfully created new subscription with ${credits} credits`
        });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/user-subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
