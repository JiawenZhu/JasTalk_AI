import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { packageId, userId, email } = body;

    if (!packageId || (!userId && !email)) {
      return NextResponse.json({ 
        error: 'packageId and either userId or email are required' 
      }, { status: 400 });
    }

    console.log('🧪 Testing webhook with:', { packageId, userId, email });

    // Create a test checkout session to trigger webhook
    const testSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Package',
              description: 'Test package for webhook verification',
              metadata: {
                packageId: packageId,
                minutes: '150',
                userId: userId || 'test-user',
              },
            },
            unit_amount: 1500, // $15.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3001/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3001/premium?canceled=true',
      metadata: {
        userId: userId || 'test-user',
        packageId: packageId,
        minutes: '150',
        amount: '15.00',
        stripeMode: 'test',
      },
    });

    console.log('🧪 Test checkout session created:', testSession.id);

    return NextResponse.json({
      success: true,
      message: 'Test checkout session created',
      sessionId: testSession.id,
      checkoutUrl: testSession.url,
      instructions: [
        '1. Click the checkout URL to complete the test payment',
        '2. Use Stripe test card: 4242 4242 4242 4242',
        '3. Any future expiry date and CVC',
        '4. Check your server logs for webhook events',
        '5. Verify credits are added to the user account'
      ]
    });

  } catch (error) {
    console.error('🧪 Error creating test session:', error);
    return NextResponse.json({
      error: 'Failed to create test session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

