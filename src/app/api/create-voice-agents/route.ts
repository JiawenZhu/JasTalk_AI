import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'create_voice_agents_table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('Error creating voice agents table:', error);
      
      // If RPC doesn't work, try individual queries
      const sqlStatements = sqlContent.split(';').filter(stmt => stmt.trim());
      
      for (const statement of sqlStatements) {
        if (statement.trim()) {
          try {
            await supabase.from('_raw').select().limit(0); // This will fail, but we'll catch it
          } catch {
            // Fallback: we'll create the table manually
            console.log('RPC not available, table creation needs manual intervention');
          }
        }
      }
      
      return NextResponse.json({ 
        error: 'Failed to create voice agents table',
        details: error.message,
        sql: sqlContent
      }, { status: 500 });
    }
    
    // Check if table was created successfully
    const { data: voiceAgents, error: selectError } = await supabase
      .from('voice_agents')
      .select('count(*)')
      .limit(1);
    
    if (selectError) {
      return NextResponse.json({ 
        error: 'Voice agents table creation unclear',
        details: selectError.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Voice agents table created successfully',
      data: data
    });
    
  } catch (error) {
    console.error('Error in create-voice-agents API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


