import Stripe from 'stripe';

// Environment-based Stripe configuration
const isProduction = process.env.NODE_ENV === 'production';
const stripeMode = process.env.STRIPE_MODE || 'test';

// Get the appropriate keys and URLs based on mode
export const getStripeConfig = () => {
  // Determine base URL based on environment
  let baseUrl: string;
  
  if (isProduction) {
    // Production environment - use production URL
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL_PRODUCTION || 'https://jastalkai-jiawenzhus-projects.vercel.app';
  } else {
    // Development environment - use localhost
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  // Always use test mode keys when STRIPE_MODE is explicitly set to 'test'
  if (stripeMode === 'test') {
    return {
      secretKey: process.env.STRIPE_SECRET_KEY_TEST!,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST!,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET_TEST!,
      baseUrl: baseUrl,
    };
  }

  // Use live mode keys whenever STRIPE_MODE is 'live'
  if (stripeMode === 'live') {
    return {
      secretKey: process.env.STRIPE_SECRET_KEY_LIVE!,
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE!,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET_LIVE!,
      baseUrl: baseUrl,
    };
  }
  
  // Default fallback to test mode
  return {
    secretKey: process.env.STRIPE_SECRET_KEY_TEST!,
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET_TEST!,
    baseUrl: baseUrl,
  };
};

// Server-side Stripe instance (lazy-loaded)
export const getStripeServer = () => {
  if (typeof window !== 'undefined') {
    throw new Error('getStripeServer should only be called on the server side');
  }
  return new Stripe(getStripeConfig().secretKey, {
    apiVersion: '2025-07-30.basil' as any,
    typescript: true,
  });
};

// Legacy export for backward compatibility (lazy-loaded)
// On the client, export a noop value to avoid module evaluation errors
export const stripe = (typeof window === 'undefined'
  ? getStripeServer()
  : (undefined as unknown as Stripe));

// Client-side Stripe instance (lazy-loaded)
export const getStripe = () => {
  if (typeof window !== 'undefined') {
    const config = getStripeConfig();
    return require('@stripe/stripe-js').loadStripe(config.publishableKey);
  }
  return null;
};

// Get webhook secret for current environment (lazy-loaded)
export const getWebhookSecret = () => getStripeConfig().webhookSecret;

// Get current Stripe mode for debugging
export const getCurrentStripeMode = () => {
  // Only run on server side
  if (typeof window !== 'undefined') {
    return {
      mode: 'client-side',
      isProduction: false,
      keys: {
        secretKey: 'client-side',
        publishableKey: 'client-side',
      }
    };
  }
  
  const config = getStripeConfig();
  return {
    mode: stripeMode,
    isProduction,
    keys: {
      secretKey: config.secretKey ? config.secretKey.substring(0, 20) + '...' : 'undefined',
      publishableKey: config.publishableKey ? config.publishableKey.substring(0, 20) + '...' : 'undefined',
    }
  };
};
