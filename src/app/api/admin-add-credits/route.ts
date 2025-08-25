import { NextRequest, NextResponse } from 'next/server';
import { SIMPLIFIED_CREDIT_PACKS, CREDIT_PACKAGES } from '@/lib/credit-packages';
import { createAdminClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, packageId, amount, sessionId, email } = body;

    if (!userId && !email) {
      return NextResponse.json({ 
        error: 'Either userId or email is required' 
      }, { status: 400 });
    }

    if (!packageId) {
      return NextResponse.json({ 
        error: 'Package ID is required' 
      }, { status: 400 });
    }

    console.log('🔧 Manual credit allocation request:', {
      userId,
      email,
      packageId,
      amount,
      sessionId
    });

    const supabase = createAdminClient();

    // Find the package information
    let packageInfo = SIMPLIFIED_CREDIT_PACKS[packageId as keyof typeof SIMPLIFIED_CREDIT_PACKS];
    if (!packageInfo) {
      packageInfo = CREDIT_PACKAGES.find(pkg => pkg.id === packageId);
    }

    if (!packageInfo || typeof packageInfo !== 'object') {
      return NextResponse.json({ 
        error: 'Invalid package ID' 
      }, { status: 400 });
    }

    // Determine minutes to add - handle both old credits and new minutes format
    const minutesToAdd = packageInfo.credits || 0;
    console.log(`🔧 Allocating ${minutesToAdd} minutes for package ${packageId}`);

    // Find user by ID or email
    let targetUserId = userId;
    if (!targetUserId && email) {
      const { data: userData, error: userError } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        return NextResponse.json({ 
          error: 'User not found with provided email' 
        }, { status: 404 });
      }

      targetUserId = userData.id;
      console.log(`🔧 Found user ID ${targetUserId} for email ${email}`);
    }

    // Check for existing subscription
    let currentSubscription = null;
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .single();

      if (!error && data) {
        currentSubscription = data;
        console.log(`🔧 Found existing subscription for user ${targetUserId}:`, {
          currentMinutes: data.interview_time_remaining,
          totalMinutes: data.interview_time_total
        });
      } else {
        console.log('🔧 No existing subscription found, will create new one');
      }
    } catch (fetchError) {
      console.log('🔧 Error checking existing subscription:', fetchError);
    }

    if (currentSubscription) {
      // Update existing subscription
      const newMinutes = currentSubscription.interview_time_remaining + minutesToAdd;
      const newTotal = currentSubscription.interview_time_total + minutesToAdd;
      
      console.log(`🔧 Updating subscription for user ${targetUserId}:`, {
        oldMinutes: currentSubscription.interview_time_remaining,
        newMinutes: newMinutes,
        addedMinutes: minutesToAdd
      });

      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          interview_time_remaining: newMinutes,
          interview_time_total: newTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentSubscription.id);

      if (updateError) {
        console.error('🔧 Error updating subscription:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update subscription',
          details: updateError.message 
        }, { status: 500 });
      }

      console.log(`🔧 ✅ Successfully updated subscription for user ${targetUserId}`);
    } else {
      // Create new subscription
      console.log(`🔧 Creating new subscription for user ${targetUserId}:`, {
        initialMinutes: minutesToAdd,
        packageId: packageId
      });

      const { error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: targetUserId,
          tier: 'pro',
          status: 'active',
          interview_time_remaining: minutesToAdd,
          interview_time_total: minutesToAdd,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createError) {
        console.error('🔧 Error creating subscription:', createError);
        return NextResponse.json({ 
          error: 'Failed to create subscription',
          details: createError.message 
        }, { status: 500 });
      }

      console.log(`🔧 ✅ Successfully created subscription for user ${targetUserId}`);
    }

    // Create invoice record if sessionId is provided
    if (sessionId) {
      try {
        const { error: invoiceError } = await supabase
          .from('user_invoices')
          .insert({
            user_id: targetUserId,
            stripe_invoice_id: sessionId,
            package_id: packageId,
            package_name: packageInfo.name,
            credits: minutesToAdd,
            amount: parseFloat(amount || '0'),
            status: 'paid',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (invoiceError) {
          console.error('🔧 Error storing invoice:', invoiceError);
        } else {
          console.log(`🔧 💾 Invoice stored for user ${targetUserId}`);
        }
      } catch (dbError) {
        console.error('🔧 Error storing invoice:', dbError);
      }
    }

    // Get final subscription state
    try {
      const { data: finalSubscription } = await supabase
        .from('user_subscriptions')
        .select('interview_time_remaining, interview_time_total, leftover_seconds')
        .eq('user_id', targetUserId)
        .single();
        
      if (finalSubscription) {
        console.log(`🔧 Final subscription state for user ${targetUserId}:`, {
          remainingMinutes: finalSubscription.interview_time_remaining,
          totalMinutes: finalSubscription.interview_time_total,
          leftoverSeconds: finalSubscription.leftover_seconds
        });
      }
    } catch (logError) {
      console.log('🔧 Error logging final state:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully allocated ${minutesToAdd} minutes to user ${targetUserId}`,
      userId: targetUserId,
      minutesAdded: minutesToAdd,
      packageInfo: {
        id: packageInfo.id,
        name: packageInfo.name,
        price: packageInfo.price
      }
    });

  } catch (error) {
    console.error('🔧 Error in manual credit allocation:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
