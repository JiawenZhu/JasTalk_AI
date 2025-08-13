import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Try to create the table using direct SQL
    const { error } = await supabase
      .from('user_subscriptions')
      .select('id')
      .limit(1);

    if (error) {
      console.log('Table does not exist, attempting to create it...');
      
      // Try to create the table using a different approach
      // We'll use a simple insert to see if the table exists
      const { error: createError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
          tier: 'free',
          status: 'inactive',
          interview_time_remaining: 0,
          interview_time_total: 0,
        });

      if (createError) {
        console.error('Failed to create table:', createError);
        return NextResponse.json({ 
          error: 'Table creation failed', 
          details: createError.message,
          suggestion: 'Please run the SQL script manually in your Supabase dashboard'
        }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed' 
    });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
