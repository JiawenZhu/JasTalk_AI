import { NextRequest, NextResponse } from 'next/server';
import { getStripeConfig, getCurrentStripeMode } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    console.log('🔑 Testing webhook secret configuration...');
    
    // Get current Stripe mode
    const stripeMode = getCurrentStripeMode();
    console.log('🔑 Stripe mode:', stripeMode);
    
    // Get Stripe config
    const config = getStripeConfig();
    console.log('🔑 Stripe config:', {
      hasSecretKey: !!config.secretKey,
      hasPublishableKey: !!config.publishableKey,
      hasWebhookSecret: !!config.webhookSecret,
      baseUrl: config.baseUrl,
      webhookSecretPrefix: config.webhookSecret ? config.webhookSecret.substring(0, 20) + '...' : 'undefined',
    });
    
    // Check environment variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      STRIPE_MODE: process.env.STRIPE_MODE,
      STRIPE_WEBHOOK_SECRET_TEST: process.env.STRIPE_WEBHOOK_SECRET_TEST ? 'Set' : 'Not Set',
      STRIPE_WEBHOOK_SECRET_LIVE: process.env.STRIPE_WEBHOOK_SECRET_LIVE ? 'Set' : 'Not Set',
    };
    
    console.log('🔑 Environment variables:', envVars);
    
    return NextResponse.json({
      success: true,
      stripeMode,
      config: {
        hasSecretKey: !!config.secretKey,
        hasPublishableKey: !!config.publishableKey,
        hasWebhookSecret: !!config.webhookSecret,
        baseUrl: config.baseUrl,
        webhookSecretPrefix: config.webhookSecret ? config.webhookSecret.substring(0, 20) + '...' : 'undefined',
      },
      environment: envVars,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('🔑 Error testing webhook secret configuration:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook secret configuration', details: error },
      { status: 500 }
    );
  }
}
