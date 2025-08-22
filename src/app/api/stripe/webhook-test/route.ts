import { NextRequest, NextResponse } from 'next/server';
import { getStripeConfig } from '@/lib/stripe';

export async function GET() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Webhook test endpoint not available in production' },
        { status: 403 }
      );
    }

    const config = getStripeConfig();
    
    return NextResponse.json({
      success: true,
      message: 'Webhook configuration test',
      config: {
        mode: process.env.STRIPE_MODE,
        isProduction: false,
        baseUrl: config.baseUrl,
        webhookEndpoint: `${config.baseUrl}/api/stripe/webhook`,
        webhookSecretConfigured: !!config.webhookSecret,
        webhookSecretLength: config.webhookSecret ? config.webhookSecret.length : 0,
        publishableKeyConfigured: !!config.publishableKey,
        secretKeyConfigured: !!config.secretKey
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        STRIPE_MODE: process.env.STRIPE_MODE,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
        NEXT_PUBLIC_BASE_URL_PRODUCTION: process.env.NEXT_PUBLIC_BASE_URL_PRODUCTION
      },
      instructions: [
        '1. Check if the webhook endpoint URL is accessible from Stripe',
        '2. Verify the webhook secret matches between Stripe and your server',
        '3. Ensure the webhook is configured for checkout.session.completed events',
        '4. Check Stripe dashboard for webhook delivery failures'
      ]
    });

  } catch (error) {
    console.error('Error in webhook test:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Webhook test endpoint not available in production' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { testType } = body;

    if (testType === 'webhook_secret') {
      // Test webhook secret verification
      const config = getStripeConfig();
      const testSignature = 'test_signature';
      
      try {
        // This will fail but we can see if the secret is valid
        const stripe = require('stripe')(config.secretKey);
        // Note: This is just a test - in real webhooks, Stripe sends the signature
        return NextResponse.json({
          success: true,
          message: 'Webhook secret test completed',
          webhookSecretConfigured: !!config.webhookSecret,
          webhookSecretLength: config.webhookSecret ? config.webhookSecret.length : 0,
          note: 'Webhook secret verification requires actual Stripe signature'
        });
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: 'Webhook secret test failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook test endpoint working',
      availableTests: ['webhook_secret']
    });

  } catch (error) {
    console.error('Error in webhook test POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
