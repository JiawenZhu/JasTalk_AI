import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Admin endpoint not available in production' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, minutes, packageId, reason } = body;

    if (!userId || !minutes) {
      return NextResponse.json(
        { error: 'userId and minutes are required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🔄 Admin: Adding ${minutes} minutes to user ${userId}`, {
      packageId,
      reason: reason || 'Manual addition'
    });

    // Check if user already has a subscription
    const { data: existingSubscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    if (existingSubscription) {
      // Update existing subscription
      const newMinutes = existingSubscription.interview_time_remaining + parseInt(minutes);
      const newTotal = existingSubscription.interview_time_total + parseInt(minutes);
      
      console.log(`🔄 Updating subscription for user ${userId}:`, {
        oldMinutes: existingSubscription.interview_time_remaining,
        newMinutes: newMinutes,
        addedMinutes: parseInt(minutes)
      });
      
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          interview_time_remaining: newMinutes,
          interview_time_total: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubscription.id);
        
      if (updateError) {
        console.error('❌ Error updating subscription:', updateError);
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
      }

      console.log(`✅ Successfully added ${minutes} minutes to user ${userId}`);
      
      return NextResponse.json({ 
        success: true, 
        message: `Added ${minutes} minutes to user ${userId}`,
        minutesAdded: parseInt(minutes),
        userId: userId,
        oldMinutes: existingSubscription.interview_time_remaining,
        newMinutes: newMinutes,
        packageId,
        reason
      });
    } else {
      // Create new subscription
      console.log(`🔄 Creating new subscription for user ${userId}: ${minutes} minutes`);
      
      const { error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier: 'pro',
          status: 'active',
          interview_time_remaining: parseInt(minutes),
          interview_time_total: parseInt(minutes),
        });
        
      if (createError) {
        console.error('❌ Error creating subscription:', createError);
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
      }

      console.log(`✅ Successfully created subscription with ${minutes} minutes for user ${userId}`);
      
      return NextResponse.json({ 
        success: true, 
        message: `Created new subscription with ${minutes} minutes for user ${userId}`,
        minutesAdded: parseInt(minutes),
        userId: userId,
        packageId,
        reason
      });
    }
    
  } catch (error) {
    console.error('❌ Error in admin add credits:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
