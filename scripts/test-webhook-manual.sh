#!/bin/bash

# Manual webhook test script for JasTalk AI
# This script triggers a test webhook event to verify processing

set -e

echo "🧪 Manual webhook test for JasTalk AI..."

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

echo "🔑 Using test mode (STRIPE_SECRET_KEY_TEST)"

# Create a test checkout session
echo "📝 Creating test checkout session..."
SESSION_RESPONSE=$(curl -s -X POST "https://api.stripe.com/v1/checkout/sessions" \
    -H "Authorization: Bearer $STRIPE_SECRET_KEY_TEST" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "payment_method_types[]=card" \
    -d "line_items[0][price_data][currency]=usd" \
    -d "line_items[0][price_data][product_data][name]=Test Package" \
    -d "line_items[0][price_data][product_data][description]=Test package for webhook verification" \
    -d "line_items[0][price_data][unit_amount]=1500" \
    -d "line_items[0][quantity]=1" \
    -d "mode=payment" \
    -d "success_url=http://localhost:3001/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}" \
    -d "cancel_url=http://localhost:3001/premium?canceled=true" \
    -d "metadata[userId]=test-user-$(date +%s)" \
    -d "metadata[packageId]=starter-pack" \
    -d "metadata[minutes]=150" \
    -d "metadata[amount]=15.00" \
    -d "metadata[stripeMode]=test")

if echo "$SESSION_RESPONSE" | grep -q '"id"'; then
    SESSION_ID=$(echo "$SESSION_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Test checkout session created: $SESSION_ID"
    
    # Trigger webhook event
    echo "🔔 Triggering webhook event..."
    WEBHOOK_RESPONSE=$(stripe trigger checkout.session.completed --session-id $SESSION_ID 2>&1)
    
    if echo "$WEBHOOK_RESPONSE" | grep -q "Triggered"; then
        echo "✅ Webhook event triggered successfully!"
        echo "📋 Webhook response:"
        echo "$WEBHOOK_RESPONSE"
        
        echo ""
        echo "🎯 Check your server logs for webhook processing messages:"
        echo "   - Look for '🔔 Webhook: Request received'"
        echo "   - Look for '🎯 Webhook: Processing one-time payment'"
        echo "   - Look for '✅ Successfully added X minutes to user'"
        
    else
        echo "❌ Failed to trigger webhook event:"
        echo "$WEBHOOK_RESPONSE"
    fi
else
    echo "❌ Error creating test session:"
    echo "$SESSION_RESPONSE"
    exit 1
fi

echo ""
echo "✅ Manual webhook test complete!"
