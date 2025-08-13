import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

interface CleanupResponse {
  success: boolean;
  cleanedUp: number;
  message: string;
  details: {
    expired: number;
    deleted: number;
    errors: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication for admin access
    // const supabase = createServerClient();
    // const { data: { user }, error: userError } = await supabase.auth.getUser();
    // if (userError || !user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('🧹 Starting cleanup of expired temporary users...');
    
    const supabase = createServerClient();
    
    // Get all expired temp users
    const { data: expiredUsers, error: fetchError } = await supabase
      .from('temp_users')
      .select('*')
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'active');

    if (fetchError) {
      console.error('❌ Error fetching expired users:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch expired users',
        details: fetchError.message 
      }, { status: 500 });
    }

    if (!expiredUsers || expiredUsers.length === 0) {
      console.log('✅ No expired temporary users found');
      return NextResponse.json({
        success: true,
        cleanedUp: 0,
        message: 'No expired temporary users found',
        details: { expired: 0, deleted: 0, errors: [] }
      });
    }

    console.log(`📊 Found ${expiredUsers.length} expired temporary users`);

    let deletedCount = 0;
    const errors: string[] = [];

    // Process each expired user
    for (const expiredUser of expiredUsers) {
      try {
        console.log(`🗑️ Deleting expired user: ${expiredUser.username} (${expiredUser.user_id})`);
        
        // Delete from auth first
        const { error: authError } = await supabase.auth.admin.deleteUser(expiredUser.user_id);
        
        if (authError) {
          console.error(`❌ Failed to delete user ${expiredUser.user_id} from auth:`, authError);
          errors.push(`Auth deletion failed for ${expiredUser.username}: ${authError.message}`);
          continue;
        }

        // Mark as deleted in database
        const { error: dbError } = await supabase
          .from('temp_users')
          .update({ 
            status: 'deleted', 
            deleted_at: new Date().toISOString() 
          })
          .eq('user_id', expiredUser.user_id);

        if (dbError) {
          console.error(`❌ Failed to update status for user ${expiredUser.user_id}:`, dbError);
          errors.push(`Database update failed for ${expiredUser.username}: ${dbError.message}`);
        } else {
          deletedCount++;
          console.log(`✅ Successfully deleted expired user: ${expiredUser.username}`);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error processing expired user ${expiredUser.username}:`, error);
        errors.push(`Processing error for ${expiredUser.username}: ${errorMessage}`);
      }
    }

    const response: CleanupResponse = {
      success: true,
      cleanedUp: deletedCount,
      message: `Cleanup completed. Deleted ${deletedCount} expired temporary users.`,
      details: {
        expired: expiredUsers.length,
        deleted: deletedCount,
        errors
      }
    };

    console.log(`✅ Cleanup completed: ${deletedCount}/${expiredUsers.length} users deleted`);
    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length} errors occurred during cleanup`);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in cleanup-temp-users API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also support GET for manual cleanup triggers
export async function GET() {
  return POST(new NextRequest('http://localhost/api/cleanup-temp-users', { method: 'POST' }));
}
