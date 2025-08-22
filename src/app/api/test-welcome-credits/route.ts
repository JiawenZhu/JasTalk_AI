import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, amount = 5.00 } = body;

    if (action === 'add_welcome_credits') {
      console.log(`🧪 Testing welcome credits for user ${user.id}: $${amount}`);
      
      // Convert dollars to minutes (at $0.12/minute rate)
      const minutesToAdd = Math.ceil(amount / 0.12);
      
      const { data: subscription, error: updateError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          tier: 'free',
          status: 'active',
          interview_time_remaining: minutesToAdd,
          interview_time_total: minutesToAdd,
        })
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error adding welcome credits:', updateError);
        return NextResponse.json({ error: 'Failed to add welcome credits' }, { status: 500 });
      }

      console.log(`✅ Successfully added $${amount} in welcome credits (${minutesToAdd} minutes) for user ${user.id}`);
      
      return NextResponse.json({ 
        success: true,
        subscription,
        message: `Successfully added $${amount} in welcome credits (${minutesToAdd} minutes)`,
        creditsAdded: minutesToAdd
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error) {
    console.error('Error in test welcome credits:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
