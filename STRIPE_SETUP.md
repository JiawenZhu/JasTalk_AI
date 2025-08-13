# Stripe Integration Setup Guide

## Overview
This guide will help you set up Stripe payments for the JasTalk AI credit system. Users can purchase credits that are converted to interview practice time.

## Prerequisites
1. A Stripe account (https://stripe.com)
2. Node.js and npm installed
3. Access to your project's environment variables

## Step 1: Install Dependencies
```bash
npm install stripe @stripe/stripe-js
```

## Step 2: Set Up Stripe Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create a new account or sign in to existing account
3. Switch to test mode for development (toggle in dashboard)

## Step 3: Get API Keys
1. In Stripe Dashboard, go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

## Step 4: Set Up Webhook
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://your-domain.com/api/stripe/webhook`
4. Select events: `checkout.session.completed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 5: Environment Variables
Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# Application URL (for webhook success/cancel URLs)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

## Step 6: Test the Integration
1. Start your development server
2. Go to `/premium` page
3. Select a credit package
4. Click "Purchase Credits"
5. Complete test payment with Stripe test card: `4242 4242 4242 4242`

## Credit Packages
The system includes three credit packages:

| Package | Credits | Price | Description |
|---------|---------|-------|-------------|
| Basic | 50 min | $6.00 | 50 minutes of interview practice |
| Pro | 100 min | $12.00 | 100 minutes of interview practice |
| Enterprise | 250 min | $25.00 | 250 minutes of interview practice |

## How It Works
1. User selects a credit package on `/premium` page
2. System creates Stripe checkout session
3. User completes payment on Stripe's secure checkout page
4. Stripe sends webhook to `/api/stripe/webhook`
5. System adds credits to user's account
6. User is redirected back with success message

## Security Features
- Webhook signature verification
- User authentication required
- Secure API endpoints
- No sensitive data stored locally

## Production Deployment
1. Switch to live mode in Stripe Dashboard
2. Update environment variables with live keys
3. Update webhook endpoint URL
4. Test with real payment methods

## Troubleshooting
- **Webhook not working**: Check webhook endpoint URL and secret
- **Payment fails**: Verify API keys and Stripe account status
- **Credits not added**: Check webhook logs and database connection

## Support
For Stripe-specific issues, contact Stripe Support.
For application issues, check the application logs and database.
