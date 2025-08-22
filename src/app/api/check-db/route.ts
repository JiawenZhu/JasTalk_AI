import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Check if user_subscriptions table exists and get its structure
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('Table check error:', tableError);
      return NextResponse.json({ 
        error: 'Database table issue', 
        details: tableError,
        tableExists: false
      }, { status: 500 });
    }

    // Get sample data
    const { data: sampleData, error: sampleError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(5);

    // Get column count by trying to select all columns
    const { data: allColumns, error: columnsError } = await supabase
      .from('user_subscriptions')
      .select('id, user_id, tier, status, interview_time_remaining, interview_time_total, created_at, updated_at, expires_at, stripe_subscription_id, stripe_customer_id, current_period_start, current_period_end, cancelled_at')
      .limit(1);

    return NextResponse.json({
      success: true,
      tableExists: true,
      tableCheck: tableCheck,
      columnCount: allColumns ? Object.keys(allColumns[0] || {}).length : 'unknown',
      sampleData: sampleData,
      sampleError: sampleError,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error checking database:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
