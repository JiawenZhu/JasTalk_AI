import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Debug auth route called');
    
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error in debug route:', authError);
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: authError.message,
        code: authError.status || 'unknown'
      }, { status: 401 });
    }

    if (!user) {
      console.log('❌ No user found in debug route');
      return NextResponse.json({ 
        error: 'No user found',
        details: 'User object is null or undefined'
      }, { status: 401 });
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error in debug route:', sessionError);
      return NextResponse.json({ 
        error: 'Session error',
        details: sessionError.message,
        code: sessionError.status || 'unknown'
      }, { status: 500 });
    }

    console.log('✅ Debug auth successful:', { 
      userId: user.id, 
      email: user.email,
      hasSession: !!session,
      sessionExpiresAt: session?.expires_at
    });

    return NextResponse.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      session: session ? {
        expires_at: session.expires_at,
        token_type: session.token_type
      } : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unexpected error in debug auth route:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
