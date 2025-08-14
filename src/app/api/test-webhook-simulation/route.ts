import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { CREDIT_PACKAGES } from '@/lib/credit-packages';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing webhook simulation...');
    
    // Only allow this in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, packageId, credits, amount } = body;
    
    if (!userId || !packageId || !credits) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, packageId, credits' },
        { status: 400 }
      );
    }

    console.log('🧪 Simulating webhook with:', { userId, packageId, credits, amount });
    
    // Use admin client
    const supabase = createAdminClient();
    
    // Find the package
    const packageInfo = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    if (!packageInfo) {
      console.error('🧪 Invalid package ID:', packageId);
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    console.log(`🧪 Processing payment for user ${userId}: ${credits} credits for $${amount}`);

    // Try to get current subscription
    let currentSubscription = null;
    try {
      console.log('🧪 Checking for existing subscription...');
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!error && data) {
        currentSubscription = data;
        console.log(`🧪 Found existing subscription for user ${userId}:`, {
          currentCredits: data.interview_time_remaining,
          totalCredits: data.interview_time_total
        });
      } else {
        console.log('🧪 No existing subscription found, will create new one');
      }
    } catch (fetchError) {
      console.log('🧪 Error checking existing subscription:', fetchError);
    }

    if (currentSubscription) {
      // Update existing subscription
      const newCredits = currentSubscription.interview_time_remaining + parseInt(credits);
      const newTotal = currentSubscription.interview_time_total + parseInt(credits);
      
      console.log(`🧪 Updating subscription for user ${userId}:`, {
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
        console.error('🧪 Error updating subscription:', updateError);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }
    } else {
      // Create new subscription
      console.log(`🧪 Creating new subscription for user ${userId}:`, {
        initialCredits: parseInt(credits),
        packageId: packageId
      });

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

    console.log(`🧪 ✅ Successfully added ${credits} credits to user ${userId}`);
    
    // Log the final state for debugging
    try {
      const { data: finalSubscription } = await supabase
        .from('user_subscriptions')
        .select('interview_time_remaining, interview_time_total')
        .eq('user_id', userId)
        .single();
        
      if (finalSubscription) {
        console.log(`🧪 Final subscription state for user ${userId}:`, {
          remainingCredits: finalSubscription.interview_time_remaining,
          totalCredits: finalSubscription.interview_time_total,
        });
      }
    } catch (logError) {
      console.log('🧪 Error logging final state:', logError);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Added ${credits} credits to user ${userId}`,
      creditsAdded: parseInt(credits)
    });
    
  } catch (error) {
    console.error('🧪 Error in webhook simulation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
