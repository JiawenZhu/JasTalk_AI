import { NextRequest, NextResponse } from 'next/server';
import { stripe, getCurrentStripeMode, getStripeConfig } from '@/lib/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { CREDIT_PACKAGES, dollarsToMinutes } from '@/lib/credit-packages';

export async function POST(request: NextRequest) {
  try {
    const { packageId } = await request.json();
    
    // Validate package ID
    const selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Invalid package selected' },
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
    console.log('Creating checkout session with mode:', stripeMode.mode);

    // Get the proper base URL from Stripe config
    const config = getStripeConfig();
    console.log('Using base URL:', config.baseUrl);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
              description: selectedPackage.description,
              metadata: {
                packageId: selectedPackage.id,
                credits: selectedPackage.credits.toString(),
                userId: user.id,
              },
            },
            unit_amount: Math.round(selectedPackage.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${config.baseUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.baseUrl}/premium?canceled=true`,
      metadata: {
        userId: user.id,
        packageId: selectedPackage.id,
        credits: selectedPackage.credits.toString(),
        amount: selectedPackage.price.toString(),
        stripeMode: stripeMode.mode,
      },
      // Temporarily disable automatic tax to avoid configuration issues
      // automatic_tax: { enabled: true },
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `Credit purchase: ${selectedPackage.name}`,
          metadata: {
            userId: user.id,
            packageId: selectedPackage.id,
            credits: selectedPackage.credits.toString(),
          },
        },
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to create checkout session',
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
