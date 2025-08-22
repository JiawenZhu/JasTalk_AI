import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Credit deduction API called - FULL VERSION');
    
    // Debug cookies
    const cookieHeader = request.headers.get('cookie');
    console.log('🔍 Cookie header:', cookieHeader ? 'Present' : 'Missing');
    console.log('🔍 All headers:', Object.fromEntries(request.headers.entries()));
    
    const body = await request.json();
    console.log('🔍 Request body:', body);
    
    const { totalSeconds } = body;
    
    if (!totalSeconds || totalSeconds <= 0) {
      console.log('❌ Invalid totalSeconds:', totalSeconds);
      return NextResponse.json(
        { error: 'Invalid totalSeconds value' },
        { status: 400 }
      );
    }
    
    console.log(`🔍 Processing credit deduction for ${totalSeconds} seconds`);

    // Get authenticated user - try alternative cookie method
    let supabase;
    let user, authError;
    
    try {
      // Try the standard method first
      supabase = createRouteHandlerClient({ cookies });
      const authResult = await supabase.auth.getUser();
      user = authResult.data.user;
      authError = authResult.error;
      console.log('🔍 Standard auth result:', user ? 'Success' : 'Failed', authError);
    } catch (error) {
      console.log('❌ Standard auth failed, trying alternative method:', error);
      
      // Alternative: Create client with request cookies
      try {
        const cookieHeader = request.headers.get('cookie');
        console.log('🔍 Cookie header present:', !!cookieHeader);
        
        if (cookieHeader) {
          // Create a minimal cookies implementation
          const requestCookies = {
            get: (name: string) => {
              const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
              return match ? match[1] : undefined;
            }
          };
          
          supabase = createRouteHandlerClient({ 
            cookies: () => requestCookies as any 
          });
          const authResult = await supabase.auth.getUser();
          user = authResult.data.user;
          authError = authResult.error;
          console.log('🔍 Alternative auth result:', user ? 'Success' : 'Failed', authError);
        }
      } catch (altError) {
        console.log('❌ Alternative auth also failed:', altError);
        authError = altError;
      }
    }
    
    if (authError || !user || !supabase) {
      console.log('❌ All authentication methods failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`🔍 User authenticated: ${user.email}`);

    // Get current subscription - prefer pro tier, then most recent
    const { data: subscriptions, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('tier', { ascending: false }) // 'pro' comes before 'free' alphabetically
      .order('created_at', { ascending: false }); // Most recent first

    if (fetchError || !subscriptions || subscriptions.length === 0) {
      console.log('❌ Subscription fetch error:', fetchError);
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Use the first subscription (pro tier if available, otherwise most recent)
    const subscription = subscriptions[0];
    console.log(`🔍 Found ${subscriptions.length} active subscriptions, using:`, {
      id: subscription.id,
      tier: subscription.tier,
      remaining: subscription.interview_time_remaining,
      created: subscription.created_at
    });

    if (fetchError || !subscription) {
      console.log('❌ Subscription fetch error:', fetchError);
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    console.log(`🔍 Current subscription: ${subscription.interview_time_remaining} minutes`);

    const currentCredits = subscription.interview_time_remaining;
    
    // Calculate full minutes to deduct (temporarily simplified without leftover logic)
    const fullMinutesToDeduct = Math.ceil(totalSeconds / 60); // Round up to nearest minute
    
    console.log(`🔍 Calculation: ${totalSeconds}s = ${fullMinutesToDeduct} minutes to deduct`);
    
    // If requested minutes exceed available, deduct what we can (partial deduction)
    const minutesToDeduct = Math.min(currentCredits, fullMinutesToDeduct);
    if (minutesToDeduct < fullMinutesToDeduct) {
      console.log('⚠️ Partial deduction: requesting', fullMinutesToDeduct, 'but only', minutesToDeduct, 'available');
    }

    // Calculate new credits
    const newCredits = Math.max(0, currentCredits - minutesToDeduct);

    // Update only the specific subscription with new credits
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        interview_time_remaining: newCredits,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id); // Update by subscription ID, not user ID

    if (updateError) {
      console.error('❌ Error updating subscription:', updateError);
      return NextResponse.json(
        { error: 'Failed to update subscription' },
        { status: 500 }
      );
    }

    console.log(`✅ Credit deduction successful: ${minutesToDeduct} minutes deducted, ${newCredits} remaining`);

    const response = NextResponse.json({
      success: true,
      message: `Successfully deducted ${minutesToDeduct} minute(s)`,
      remainingCredits: newCredits,
      totalSecondsProcessed: totalSeconds,
      deductedMinutes: minutesToDeduct
    });

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return response;

  } catch (error) {
    console.error('❌ Error in credit deduction API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
