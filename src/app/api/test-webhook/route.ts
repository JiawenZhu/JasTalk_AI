import { NextRequest, NextResponse } from 'next/server';
import { getCurrentStripeMode, getStripeConfig } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing webhook configuration...');
    
    // Get current Stripe mode
    const stripeMode = getCurrentStripeMode();
    console.log('🧪 Stripe mode:', stripeMode);
    
    // Get Stripe config
    const config = getStripeConfig();
    console.log('🧪 Stripe config:', {
      hasSecretKey: !!config.secretKey,
      hasPublishableKey: !!config.publishableKey,
      hasWebhookSecret: !!config.webhookSecret,
      baseUrl: config.baseUrl,
      secretKeyPrefix: config.secretKey ? config.secretKey.substring(0, 20) + '...' : 'undefined',
      publishableKeyPrefix: config.publishableKey ? config.publishableKey.substring(0, 20) + '...' : 'undefined',
      webhookSecretPrefix: config.webhookSecret ? config.webhookSecret.substring(0, 20) + '...' : 'undefined',
    });
    
    // Check environment variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      STRIPE_MODE: process.env.STRIPE_MODE,
      STRIPE_SECRET_KEY_TEST: process.env.STRIPE_SECRET_KEY_TEST ? 'Set' : 'Not Set',
      STRIPE_SECRET_KEY_LIVE: process.env.STRIPE_SECRET_KEY_LIVE ? 'Set' : 'Not Set',
      STRIPE_WEBHOOK_SECRET_TEST: process.env.STRIPE_WEBHOOK_SECRET_TEST ? 'Set' : 'Not Set',
      STRIPE_WEBHOOK_SECRET_LIVE: process.env.STRIPE_WEBHOOK_SECRET_LIVE ? 'Set' : 'Not Set',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST ? 'Set' : 'Not Set',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE ? 'Set' : 'Not Set',
    };
    
    console.log('🧪 Environment variables:', envVars);
    
    return NextResponse.json({
      success: true,
      stripeMode,
      config: {
        hasSecretKey: !!config.secretKey,
        hasPublishableKey: !!config.publishableKey,
        hasWebhookSecret: !!config.webhookSecret,
        baseUrl: config.baseUrl,
      },
      environment: envVars,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('🧪 Error testing webhook configuration:', error);
    return NextResponse.json(
      { error: 'Failed to test webhook configuration', details: error },
      { status: 500 }
    );
  }
}
