import { NextRequest, NextResponse } from 'next/server';
import { stripe, getCurrentStripeMode, getStripeConfig } from '@/lib/stripe';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { CREDIT_PACKAGES, SIMPLIFIED_CREDIT_PACKS } from '@/lib/credit-packages';

export async function POST(request: NextRequest) {
  try {
    const { packageId } = await request.json();
    
    // Check if it's a new simplified pack or legacy pack
    let selectedPackage;
    
    if (SIMPLIFIED_CREDIT_PACKS[packageId as keyof typeof SIMPLIFIED_CREDIT_PACKS]) {
      selectedPackage = SIMPLIFIED_CREDIT_PACKS[packageId as keyof typeof SIMPLIFIED_CREDIT_PACKS];
    } else {
      // Fallback to legacy packages for backward compatibility
      selectedPackage = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    }
    
    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Invalid package selected' },
        { status: 400 }
      );
    }

    // Helper function to get minutes from package (handles both new and legacy formats)
    const getPackageMinutes = (pkg: any): number => {
      if ('minutes' in pkg) return pkg.minutes;
      if ('credits' in pkg) return pkg.credits;
      return 0;
    };

    const packageMinutes = getPackageMinutes(selectedPackage);

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
                minutes: packageMinutes.toString(),
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
        minutes: packageMinutes.toString(),
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
            minutes: packageMinutes.toString(),
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
