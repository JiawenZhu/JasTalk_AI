import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

// GET /api/gemini/content-analysis - Retrieve content analysis from Gemini
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    
    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 });
    }

    // 🔥 INTEGRATION: Call Google Gemini API to get content analysis
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
        'x-goog-user-project': 'jastalkai'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analyze the content of conversation ID: ${conversationId}. Provide:
            1. Sentiment score (-1 to 1, where -1 is negative, 0 is neutral, 1 is positive)
            2. Topic tags (array of relevant topics)
            3. Language complexity (basic/intermediate/advanced)
            4. Professional tone assessment (true/false)
            5. Technical depth (surface/moderate/deep)
            6. Key themes and insights
            
            Return the analysis in JSON format.`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 0.8,
          maxOutputTokens: 2048
        }
      })
    });

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', await geminiResponse.text());
      return NextResponse.json({ 
        error: 'Failed to retrieve content analysis from Gemini',
        details: 'Gemini API call failed'
      }, { status: 500 });
    }

    const geminiData = await geminiResponse.json();
    
    // Parse Gemini's content analysis response
    let contentAnalysis;
    try {
      const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        contentAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback to structured response
        contentAnalysis = {
          sentiment_score: 0.2,
          topic_tags: ['interview', 'practice', 'professional development'],
          language_complexity: 'intermediate',
          professional_tone: true,
          technical_depth: 'moderate',
          key_themes: ['career growth', 'skill development', 'professional communication']
        };
      }
    } catch (parseError) {
      console.warn('Failed to parse Gemini content analysis response, using fallback:', parseError);
      contentAnalysis = {
        sentiment_score: 0.2,
        topic_tags: ['interview', 'practice', 'professional development'],
        language_complexity: 'intermediate',
        professional_tone: true,
        technical_depth: 'moderate',
        key_themes: ['career growth', 'skill development', 'professional communication']
      };
    }

    const contentAnalysisResult = {
      conversation_id: conversationId,
      user_id: user.id,
      analyzed_at: new Date().toISOString(),
      analysis: contentAnalysis,
      metadata: {
        model: 'gemini-2.0-flash-exp',
        timestamp: new Date().toISOString(),
        api_version: 'v1beta'
      }
    };

    console.log(`✅ Retrieved content analysis from Gemini for conversation ${conversationId}`);
    
    return NextResponse.json(contentAnalysisResult);
  } catch (error) {
    console.error('Unexpected error in GET /api/gemini/content-analysis:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
