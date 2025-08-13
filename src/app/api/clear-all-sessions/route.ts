import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`🗑️ Clearing all practice sessions for user: ${user.id} (${user.email})`);

    // Delete all practice sessions for the current user
    const { data: deletedSessions, error: deleteError } = await supabase
      .from('practice_sessions')
      .delete()
      .eq('user_id', user.id)
      .select('id');

    if (deleteError) {
      console.error('❌ Error deleting practice sessions:', deleteError);
      return NextResponse.json({ error: 'Failed to delete sessions' }, { status: 500 });
    }

    const deletedCount = deletedSessions?.length || 0;
    console.log(`✅ Successfully deleted ${deletedCount} practice sessions for user ${user.id}`);

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${deletedCount} practice sessions`,
      deletedCount 
    });

  } catch (error) {
    console.error('❌ Unexpected error in clear-all-sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST method to clear all practice sessions',
    method: 'POST'
  });
}
