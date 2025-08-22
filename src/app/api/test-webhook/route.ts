import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId, credits, type } = await request.json();
    
    if (!userId || !credits) {
      return NextResponse.json({ error: 'Missing userId or credits' }, { status: 400 });
    }
    
    const supabase = createAdminClient();
    
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
      
      console.log(`Test: Updating subscription for user ${userId}:`, {
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
        console.error('Test: Error updating subscription:', updateError);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }
    } else {
      // Create new subscription
      console.log(`Test: Creating new subscription for user ${userId}: ${credits} credits`);
      
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
        console.error('Test: Error creating subscription:', createError);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
      }
    }
    
    console.log(`Test: ✅ Successfully added ${credits} credits to user ${userId}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Added ${credits} credits to user ${userId}`,
      creditsAdded: parseInt(credits)
    });
    
  } catch (error) {
    console.error('Test: Error processing test webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
