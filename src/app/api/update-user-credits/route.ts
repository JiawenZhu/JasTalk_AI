import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Credit update request body:', body);
    
    const { totalMinutes, totalSeconds, action } = body;
    
    // Validate required fields
    if (totalMinutes === undefined || totalSeconds === undefined || !action) {
      console.error('❌ Missing required fields:', { totalMinutes, totalSeconds, action });
      return NextResponse.json(
        { error: 'Missing required fields: totalMinutes, totalSeconds, action' },
        { status: 400 }
      );
    }

    // Validate data types and ranges
    if (typeof totalMinutes !== 'number' || totalMinutes < 0) {
      console.error('❌ Invalid totalMinutes:', totalMinutes);
      return NextResponse.json(
        { error: 'totalMinutes must be a non-negative number' },
        { status: 400 }
      );
    }

    if (typeof totalSeconds !== 'number' || totalSeconds < 0) {
      console.error('❌ Invalid totalSeconds:', totalSeconds);
      return NextResponse.json(
        { error: 'totalSeconds must be a non-negative number' },
        { status: 400 }
      );
    }

    if (action !== 'set_remaining_credits') {
      console.error('❌ Invalid action:', action);
      return NextResponse.json(
        { error: 'Invalid action. Only "set_remaining_credits" is supported' },
        { status: 400 }
      );
    }

    // Get authenticated user from cookies
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const userId = user.id;
    console.log('✅ User authenticated:', userId);

    // Check if user has any subscriptions first
    const { data: existingSubs, error: checkError } = await supabase
      .from('user_subscriptions')
      .select('id, status')
      .eq('user_id', userId);

    if (checkError) {
      console.error('❌ Error checking existing subscriptions:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing subscriptions', details: checkError.message },
        { status: 500 }
      );
    }

    console.log('📊 Existing subscriptions found:', existingSubs?.length || 0);

    let updateResult;
    
    if (existingSubs && existingSubs.length > 0) {
      // Update existing active subscription
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          interview_time_remaining: totalMinutes,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('status', 'active')
        .select();

      if (error) {
        console.error('❌ Database update error:', error);
        return NextResponse.json(
          { error: 'Failed to update database', details: error.message },
          { status: 500 }
        );
      }

      updateResult = data;
    } else {
      // Create new subscription if none exists
      console.log('📝 Creating new subscription for user');
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          tier: 'free',
          status: 'active',
          interview_time_remaining: totalMinutes,
          interview_time_total: totalMinutes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('❌ Error creating new subscription:', error);
        return NextResponse.json(
          { error: 'Failed to create subscription', details: error.message },
          { status: 500 }
        );
      }

      updateResult = data;
    }

    if (!updateResult || updateResult.length === 0) {
      console.error('❌ No subscription record found or created');
      return NextResponse.json(
        { error: 'No subscription record found or created' },
        { status: 404 }
      );
    }

    console.log('✅ Credits updated in database:', {
      userId,
      totalMinutes,
      totalSeconds,
      updatedRecord: updateResult[0]
    });

    return NextResponse.json({
      success: true,
      message: 'Credits successfully synced to database',
      updatedCredits: {
        minutes: totalMinutes,
        seconds: totalSeconds % 60
      }
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
