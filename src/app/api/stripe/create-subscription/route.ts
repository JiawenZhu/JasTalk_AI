import { NextRequest, NextResponse } from 'next/server';
import { stripe, getCurrentStripeMode, getStripeConfig } from '@/lib/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  'monthly-credits': {
    name: 'Monthly Credits Plan',
    description: 'Get 8 hours of practice time every month with full access to all features',
    priceId: {
      test: 'price_test_monthly_credits', // We'll create this in Stripe
      live: 'price_live_monthly_credits'
    },
    amount: 1500, // $15.00 in cents
    features: [
      '8 Hours (480 minutes) of Interview Practice per Month',
      'All 20+ Premium & Multilingual AI Voices',
      'Detailed Performance Analysis & Radar Chart',
      'Full Interview Log with Audio Playback',
      'Priority Support',
      '🎯 Credits = Full Access to All Features'
    ]
  }
};

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json();
    
    // Validate plan ID
    const selectedPlan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Log current Stripe mode for debugging
    const stripeMode = getCurrentStripeMode();
    console.log('Creating subscription session with mode:', stripeMode.mode);

    // Get the proper base URL from Stripe config
    const config = getStripeConfig();
    console.log('Using base URL:', config.baseUrl);

    // Determine the correct price ID based on current Stripe mode
    const isTestMode = stripeMode.mode === 'test' || !process.env.NODE_ENV || process.env.NODE_ENV !== 'production';
    
    // For now, we'll create the subscription session using price_data
    // Later you can replace this with actual price IDs from Stripe dashboard
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPlan.name,
              description: selectedPlan.description,
            },
            unit_amount: selectedPlan.amount,
            recurring: {
              interval: 'month',
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${config.baseUrl}/dashboard?subscription_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.baseUrl}/premium?subscription_canceled=true`,
      metadata: {
        userId: user.id,
        planId: planId,
        planName: selectedPlan.name,
        tier: planId, // Add tier information for credit calculation
        stripeMode: stripeMode.mode,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: planId,
          planName: selectedPlan.name,
          tier: planId, // Add tier information for credit calculation
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({ 
      sessionId: session.id,
      planName: selectedPlan.name,
      amount: selectedPlan.amount 
    });
  } catch (error) {
    console.error('Error creating subscription session:', error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to create subscription session',
          details: error.message,
          type: error.constructor.name
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
