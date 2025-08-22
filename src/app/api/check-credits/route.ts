import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subError);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }

    // Check if user_subscriptions table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_subscriptions')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('Table check error:', tableError);
      return NextResponse.json({ 
        error: 'Database table issue', 
        details: tableError,
        tableExists: false
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      userId: user.id,
      email: user.email,
      subscription: subscription || null,
      tableExists: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error checking credits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

