import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { credits, packageId } = await request.json();
    
    if (!credits) {
      return NextResponse.json({ error: 'Missing credits amount' }, { status: 400 });
    }
    
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`🔄 Manually adding ${credits} credits to user ${user.id}`);

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      // Update existing subscription
      const newCredits = existingSubscription.interview_time_remaining + parseInt(credits);
      const newTotal = existingSubscription.interview_time_total + parseInt(credits);
      
      console.log(`🔄 Updating subscription for user ${user.id}:`, {
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
        console.error('❌ Error updating subscription:', updateError);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }
    } else {
      // Create new subscription
      console.log(`🔄 Creating new subscription for user ${user.id}: ${credits} credits`);
      
      const { error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          tier: 'pro',
          status: 'active',
          interview_time_remaining: parseInt(credits),
          interview_time_total: parseInt(credits),
        });
        
      if (createError) {
        console.error('❌ Error creating subscription:', createError);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
      }
    }
    
    console.log(`✅ Successfully added ${credits} credits to user ${user.id}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Added ${credits} credits to your account`,
      creditsAdded: parseInt(credits),
      userId: user.id
    });
    
  } catch (error) {
    console.error('❌ Error adding credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
