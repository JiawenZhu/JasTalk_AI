import { NextRequest, NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase-server';

// Enhanced utterance interface with Google API integration
interface EnhancedUtterance {
  interview_id: string;
  speaker: 'USER' | 'AGENT';
  text: string;
  timestamp: string;
  session_context?: string;
  google_conversation_id?: string; // Link to Google's conversation log
  turn_number?: number; // Sequential turn number in conversation
  
  // Question tracking
  question_id?: string; // Unique identifier for the question
  question_text?: string; // The actual question being asked
  question_topic?: string; // Topic/category of the question
  question_difficulty?: 'easy' | 'medium' | 'hard';
  
  // Answer tracking (for USER utterances)
  answer_to_question_id?: string; // Which question this answers
  answer_quality?: {
    completeness: number; // 0-100
    accuracy: number; // 0-100
    clarity: number; // 0-100
    technical_depth: number; // 0-100
    confidence: number; // 0-100
  };
  
  // Google Analytics integration
  google_analytics?: {
    conversation_id?: string;
    turn_number?: number;
    response_quality?: number; // 0-100
    sentiment_score?: number; // -1 to 1
    topic_tags?: string[];
    language_complexity?: 'basic' | 'intermediate' | 'advanced';
    professional_tone?: boolean;
    technical_depth?: 'surface' | 'moderate' | 'deep';
    speaking_pace?: number; // words per minute
    filler_words?: string[]; // detected filler words
    engagement_level?: 'low' | 'medium' | 'high';
  };
  
  // Metadata
  metadata?: {
    audio_duration?: number; // seconds
    word_count?: number;
    character_count?: number;
    language?: string;
    confidence_score?: number; // speech recognition confidence
  };
}

// POST /api/utterances - Log conversation utterances
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();

    const { interview_id, utterances } = body;

    // Validate interview belongs to user
    const { data: interview, error: interviewError } = await supabase
      .from('interviews')
      .select('id')
      .eq('id', interview_id)
      .eq('user_id', user.id)
      .single();

    if (interviewError || !interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Handle single utterance or batch
    const utterancesToInsert: EnhancedUtterance[] = Array.isArray(utterances) ? utterances : [utterances];
    
    // Process utterances with Google analytics integration
    const processedUtterances = utterancesToInsert.map(utterance => {
      const baseUtterance: any = {
        interview_id,
        speaker: utterance.speaker,
        text: utterance.text,
        timestamp: utterance.timestamp || new Date().toISOString(),
        word_count: utterance.text.split(' ').length,
        session_context: utterance.session_context || `interview_${interview_id}`,
        google_conversation_id: utterance.google_conversation_id || null
      };
      
      // Add Google analytics if available
      if (utterance.google_analytics) {
        baseUtterance.google_analytics = utterance.google_analytics;
      }
      
      return baseUtterance;
    });

    const { data: insertedUtterances, error } = await supabase
      .from('utterances')
      .insert(processedUtterances)
      .select();

    if (error) {
      console.error('Error inserting utterances:', error);
      return NextResponse.json({ error: 'Failed to log utterances' }, { status: 500 });
    }

    console.log(`✅ Logged ${insertedUtterances.length} utterances for interview ${interview_id}`);
    
    // Check if any utterances have Google analytics
    const hasGoogleAnalytics = processedUtterances.some(u => u.google_analytics);
    
    return NextResponse.json({ 
      utterances: insertedUtterances,
      google_analytics_enabled: hasGoogleAnalytics,
      total_utterances: insertedUtterances.length,
      message: hasGoogleAnalytics 
        ? 'Utterances logged with Google Gemini analytics integration' 
        : 'Utterances logged successfully'
    });
  } catch (error) {
    console.error('Unexpected error in POST /api/utterances:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
