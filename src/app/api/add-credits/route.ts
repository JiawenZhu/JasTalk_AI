import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { CREDIT_PACKAGES } from '@/lib/credit-packages';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { packageId, credits, amount } = body;
    
    if (!packageId || !credits || !amount) {
      return NextResponse.json({ error: 'Missing packageId, credits, or amount' }, { status: 400 });
    }
    
    // Find the package to validate
    const packageInfo = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    
    if (!packageInfo) {
      return NextResponse.json({ error: 'Invalid package ID' }, { status: 400 });
    }
    
    console.log(`Manually adding credits for user ${user.id}: ${credits} credits for $${amount}`);
    
    // Try to get current subscription
    let currentSubscription = null;
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (!error && data) {
        currentSubscription = data;
        console.log(`Found existing subscription for user ${user.id}:`, {
          currentCredits: data.interview_time_remaining,
          totalCredits: data.interview_time_total
        });
      }
    } catch (fetchError) {
      console.log('No existing subscription found, will create new one');
    }

    if (currentSubscription) {
      // Update existing subscription
      const newCredits = currentSubscription.interview_time_remaining + parseInt(credits);
      const newTotal = currentSubscription.interview_time_total + parseInt(credits);
      
      console.log(`Updating subscription for user ${user.id}:`, {
        oldCredits: currentSubscription.interview_time_remaining,
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
        .eq('id', currentSubscription.id);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }
      
      console.log(`✅ Successfully added ${credits} credits to user ${user.id}`);
      
      return NextResponse.json({ 
        success: true,
        subscription: { ...currentSubscription, interview_time_remaining: newCredits, interview_time_total: newTotal },
        message: `Successfully added ${credits} credits to existing subscription`
      });
    } else {
      // Create new subscription
      console.log(`Creating new subscription for user ${user.id}:`, {
        initialCredits: parseInt(credits),
        packageId: packageId
      });

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
        console.error('Error creating subscription:', createError);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
      }
      
      console.log(`✅ Successfully created new subscription with ${credits} credits for user ${user.id}`);
      
      return NextResponse.json({ 
        success: true,
        message: `Successfully created new subscription with ${credits} credits`
      });
    }
    
  } catch (error) {
    console.error('Error adding credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
