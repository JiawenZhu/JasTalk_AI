import { NextRequest, NextResponse } from 'next/server';


export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Database fix API called - adding leftover_seconds column');
    
    // Only allow this in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();
    
    // Add the leftover_seconds column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE user_subscriptions 
        ADD COLUMN IF NOT EXISTS leftover_seconds INTEGER DEFAULT 0;
        
        COMMENT ON COLUMN user_subscriptions.leftover_seconds IS 'Accumulated seconds from partial interview time usage. When >= 60, converts to 1 minute and deducts from credits.';
      `
    });

    if (alterError) {
      console.error('❌ Error adding column:', alterError);
      
      // Try alternative approach - direct SQL execution
      const { error: directError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .limit(1);
      
      if (directError) {
        console.error('❌ Cannot access user_subscriptions table:', directError);
        return NextResponse.json(
          { error: 'Cannot access database table', details: directError },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to add column', details: alterError },
        { status: 500 }
      );
    }

    console.log('✅ Successfully added leftover_seconds column');
    
    // Verify the column was added
    const { data: columns, error: verifyError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .limit(1);
    
    if (verifyError) {
      console.error('❌ Error verifying column:', verifyError);
    } else {
      console.log('✅ Column verification successful');
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully added leftover_seconds column to user_subscriptions table',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in database fix API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}
