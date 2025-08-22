import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Test endpoint not available in production' },
        { status: 403 }
      );
    }

    const { totalMinutes, totalSeconds, action, testUserId } = await request.json();
    
    if (!totalMinutes || totalSeconds === undefined || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: totalMinutes, totalSeconds, action' },
        { status: 400 }
      );
    }

    if (action !== 'set_remaining_credits') {
      return NextResponse.json(
        { error: 'Invalid action. Only "set_remaining_credits" is supported' },
        { status: 400 }
      );
    }

    // Use test user ID if provided, otherwise use an existing user from the system
    const userId = testUserId || '61212566-99d9-4474-af98-7bf0ab49b184';

    // Create Supabase client with service role key for testing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, check if the test user exists in user_subscriptions
    let { data: existingSubscription, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('🔍 Checking for existing subscription:', { userId, existingSubscription, fetchError });

    let result;
    if (fetchError && fetchError.code === 'PGRST116') {
      // No subscription found, create a new one
      console.log('📝 No existing subscription found, creating new one...');
      const { data: newSubscription, error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier: 'free',
          status: 'active',
          interview_time_remaining: totalMinutes,
          interview_time_total: totalMinutes + 100, // Add some buffer
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating test subscription:', createError);
        return NextResponse.json(
          { error: 'Failed to create test subscription', details: createError.message },
          { status: 500 }
        );
      }
      result = newSubscription;
    } else if (fetchError) {
      // Some other error occurred
      console.error('Error fetching subscription:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch subscription', details: fetchError.message },
        { status: 500 }
      );
    } else {
      // Update existing subscription
      console.log('📝 Updating existing subscription:', existingSubscription);
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          interview_time_remaining: totalMinutes,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active')
        .select()
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update database', details: updateError.message },
          { status: 500 }
        );
      }
      result = updatedSubscription;
    }

    console.log('✅ Test credits updated in database:', {
      userId,
      totalMinutes,
      totalSeconds,
      updatedRecord: result
    });

    return NextResponse.json({
      success: true,
      message: 'Test credits successfully synced to database',
      updatedCredits: {
        minutes: totalMinutes,
        seconds: totalSeconds % 60
      },
      subscription: result
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
