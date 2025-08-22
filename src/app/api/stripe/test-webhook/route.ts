import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { eventType, userId, credits, packageId } = await request.json();
    
    if (!eventType || !userId || !credits) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    console.log(`🧪 Test webhook: Simulating ${eventType} event for user ${userId}`);
    
    const supabase = createAdminClient();
    
    if (eventType === 'checkout.session.completed') {
      // Simulate one-time payment
      console.log(`🧪 Simulating one-time payment: ${credits} credits for user ${userId}`);
      
      // Check if user already has a subscription
      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      
      if (existingSubscription) {
        // Update existing subscription
        const newCredits = existingSubscription.interview_time_remaining + parseInt(credits);
        const newTotal = existingSubscription.interview_time_total + parseInt(credits);
        
        console.log(`🧪 Updating subscription for user ${userId}:`, {
          oldCredits: existingSubscription.interview_time_remaining,
          newCredits: newCredits,
          addedCredits: parseInt(credits)
        });
        
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            interview_time_remaining: newCredits,
            interview_time_total: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSubscription.id);
          
        if (updateError) {
          console.error('🧪 Error updating subscription:', updateError);
          return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }
      } else {
        // Create new subscription
        console.log(`🧪 Creating new subscription for user ${userId}: ${credits} credits`);
        
        const { error: createError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            tier: 'pro',
            status: 'active',
            interview_time_remaining: parseInt(credits),
            interview_time_total: parseInt(credits),
          });
          
        if (createError) {
          console.error('🧪 Error creating subscription:', createError);
          return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
        }
      }
      
    } else if (eventType === 'customer.subscription.created') {
      // Simulate subscription creation
      console.log(`🧪 Simulating subscription creation: ${credits} credits for user ${userId}`);
      
      const { error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier: 'pro',
          status: 'active',
          stripe_subscription_id: `test_sub_${Date.now()}`,
          interview_time_remaining: parseInt(credits),
          interview_time_total: parseInt(credits),
        });
        
      if (createError) {
        console.error('🧪 Error creating subscription:', createError);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
      }
    }
    
    console.log(`🧪 ✅ Successfully processed test webhook for user ${userId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Processed test webhook: ${eventType}`,
      eventType,
      userId,
      creditsAdded: parseInt(credits)
    });
    
  } catch (error) {
    console.error('🧪 Error processing test webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

