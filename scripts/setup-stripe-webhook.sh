#!/bin/bash

# Setup Stripe Webhook for JasTalk AI
# This script creates a webhook endpoint in Stripe to automatically add credits

set -e

echo "🔧 Setting up Stripe webhook for JasTalk AI..."

# Check if we're in the right directory
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local file not found. Please run this script from the project root."
    exit 1
fi

# Load environment variables
source .env.local

# Check if we have the required environment variables
if [ -z "$STRIPE_SECRET_KEY_TEST" ]; then
    echo "❌ Error: STRIPE_SECRET_KEY_TEST not found in .env.local"
    exit 1
fi

if [ -z "$STRIPE_WEBHOOK_SECRET_TEST" ]; then
    echo "❌ Error: STRIPE_WEBHOOK_SECRET_TEST not found in .env.local"
    exit 1
fi

# Get your local server URL (assuming you're running on localhost:3001)
LOCAL_URL="http://localhost:3001"
if [ ! -z "$NEXT_PUBLIC_BASE_URL" ]; then
    LOCAL_URL="$NEXT_PUBLIC_BASE_URL"
fi

WEBHOOK_URL="$LOCAL_URL/api/stripe/webhook"

echo "📍 Webhook URL: $WEBHOOK_URL"
echo "🔑 Using test mode (STRIPE_SECRET_KEY_TEST)"

# Check if webhook already exists
echo "🔍 Checking for existing webhooks..."
EXISTING_WEBHOOK=$(curl -s -X GET "https://api.stripe.com/v1/webhook_endpoints" \
    -H "Authorization: Bearer $STRIPE_SECRET_KEY_TEST" \
    | grep -o '"url":"[^"]*"' | grep "$WEBHOOK_URL" | head -1)

if [ ! -z "$EXISTING_WEBHOOK" ]; then
    echo "✅ Webhook already exists for $WEBHOOK_URL"
    echo "🔍 Existing webhook details:"
    curl -s -X GET "https://api.stripe.com/v1/webhook_endpoints" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY_TEST" \
        | grep -A 20 -B 5 "$WEBHOOK_URL"
else
    echo "📝 Creating new webhook endpoint..."
    
    # Create webhook endpoint
    WEBHOOK_RESPONSE=$(curl -s -X POST "https://api.stripe.com/v1/webhook_endpoints" \
        -H "Authorization: Bearer $STRIPE_SECRET_KEY_TEST" \
        -H "Content-Type: application/x-www-form-urlencoded" \
        -d "url=$WEBHOOK_URL" \
        -d "enabled_events[]=checkout.session.completed" \
        -d "enabled_events[]=customer.subscription.created" \
        -d "enabled_events[]=invoice.payment_succeeded" \
        -d "enabled_events[]=customer.subscription.deleted" \
        -d "api_version=2023-10-16")

    if echo "$WEBHOOK_RESPONSE" | grep -q '"id"'; then
        WEBHOOK_ID=$(echo "$WEBHOOK_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        echo "✅ Webhook created successfully!"
        echo "🆔 Webhook ID: $WEBHOOK_ID"
        echo "🔗 Webhook URL: $WEBHOOK_URL"
        echo "📋 Enabled events: checkout.session.completed, customer.subscription.created, invoice.payment_succeeded, customer.subscription.deleted"
    else
        echo "❌ Error creating webhook:"
        echo "$WEBHOOK_RESPONSE"
        exit 1
    fi
fi

echo ""
echo "🎯 Next steps:"
echo "1. Make sure your server is running on $LOCAL_URL"
echo "2. Test a payment to verify credits are automatically added"
echo "3. Check the server logs for webhook events"
echo ""
echo "🔍 To test webhook delivery:"
echo "   - Make a test payment in Stripe test mode"
echo "   - Check your server logs for '🔔 Webhook received event' messages"
echo "   - Verify credits are added to the user's account"
echo ""
echo "📚 For production, you'll need to:"
echo "   - Use STRIPE_SECRET_KEY_LIVE instead of STRIPE_SECRET_KEY_TEST"
echo "   - Update the webhook URL to your production domain"
echo "   - Use STRIPE_WEBHOOK_SECRET_LIVE"

echo ""
echo "✅ Stripe webhook setup complete!"
