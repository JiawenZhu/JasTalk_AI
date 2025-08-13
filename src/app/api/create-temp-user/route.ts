import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

interface TempUserRequest {
  expiresIn?: number; // Hours until auto-deletion (default: 24)
  purpose?: string; // Optional purpose for tracking
}

interface TempUserResponse {
  success: boolean;
  tempUser: {
    id: string;
    username: string;
    email: string;
    password: string;
    expiresAt: string;
    purpose?: string;
  };
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TempUserRequest = await request.json();
    const { expiresIn = 24, purpose = 'temporary_access' } = body;

    // Validate expiration time (max 7 days for security)
    if (expiresIn < 1 || expiresIn > 168) {
      return NextResponse.json({ 
        error: 'Expiration time must be between 1 and 168 hours (7 days)' 
      }, { status: 400 });
    }

    const supabase = createServerClient();

    // Generate unique temporary user credentials
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const username = `temp_user_${timestamp}_${randomSuffix}`;
    const email = `${username}@temp.jastalk.ai`;
    const password = `temp_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
    
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (expiresIn * 60 * 60 * 1000));

    console.log('🔧 Creating temporary user:', {
      username,
      email,
      expiresIn: `${expiresIn}h`,
      expiresAt: expiresAt.toISOString()
    });

    // Create the temporary user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        is_temp_user: true,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        purpose,
        auto_delete: true
      }
    });

    if (authError) {
      console.error('❌ Error creating temporary user in auth:', authError);
      return NextResponse.json({ 
        error: 'Failed to create temporary user',
        details: authError.message 
      }, { status: 500 });
    }

    // Create temporary user record in database for tracking
    const { data: tempUserRecord, error: dbError } = await supabase
      .from('temp_users')
      .insert({
        user_id: authUser.user.id,
        username,
        email,
        purpose,
        created_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'active'
      })
      .select()
      .single();

    if (dbError) {
      console.error('❌ Error creating temp user record in database:', dbError);
      // Try to clean up the auth user if database insert fails
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id);
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup auth user after database error:', cleanupError);
      }
      
      return NextResponse.json({ 
        error: 'Failed to create temporary user record',
        details: dbError.message 
      }, { status: 500 });
    }

    // Schedule automatic deletion
    await scheduleTempUserDeletion(authUser.user.id, expiresAt);

    const response: TempUserResponse = {
      success: true,
      tempUser: {
        id: authUser.user.id,
        username,
        email,
        password,
        expiresAt: expiresAt.toISOString(),
        purpose
      },
      message: `Temporary user created successfully. Will be automatically deleted in ${expiresIn} hours.`
    };

    console.log('✅ Temporary user created successfully:', {
      userId: authUser.user.id,
      username,
      expiresAt: expiresAt.toISOString()
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error in create-temp-user API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function scheduleTempUserDeletion(userId: string, expiresAt: Date) {
  try {
    // Calculate delay in milliseconds
    const delay = expiresAt.getTime() - Date.now();
    
    if (delay <= 0) {
      // If already expired, delete immediately
      await deleteTempUser(userId);
      return;
    }

    // Schedule deletion using setTimeout (for development) or a proper job queue
    setTimeout(async () => {
      await deleteTempUser(userId);
    }, delay);

    console.log(`⏰ Scheduled deletion of temp user ${userId} in ${Math.round(delay / 1000 / 60)} minutes`);
    
  } catch (error) {
    console.error('❌ Error scheduling temp user deletion:', error);
  }
}

async function deleteTempUser(userId: string) {
  try {
    const supabase = createServerClient();
    
    console.log(`🗑️ Deleting temporary user: ${userId}`);
    
    // Delete from database first
    const { error: dbError } = await supabase
      .from('temp_users')
      .delete()
      .eq('user_id', userId);

    if (dbError) {
      console.error('❌ Error deleting temp user from database:', dbError);
    }

    // Delete from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('❌ Error deleting temp user from auth:', authError);
    } else {
      console.log(`✅ Successfully deleted temporary user: ${userId}`);
    }

  } catch (error) {
    console.error('❌ Error in deleteTempUser:', error);
  }
}
