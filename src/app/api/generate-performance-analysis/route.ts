import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

interface ConversationEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface AnalysisRequest {
  conversationHistory: ConversationEntry[];
  interviewDuration: number;
  interviewObjective?: string;
  userName?: string;
}

// Retry utility function
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error instanceof Error && error.message.includes('status: 4') && !error.message.includes('429')) {
        throw error;
      }
      
      if (attempt === maxRetries) break;
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`🔄 Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Starting performance analysis generation...');
    const { conversationHistory, interviewDuration, interviewObjective, userName }: AnalysisRequest = await request.json();

    // Validate input data
    if (!conversationHistory || conversationHistory.length === 0) {
      console.log('❌ No conversation history provided');
      return NextResponse.json(
        { error: 'No conversation history provided' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    console.log(`📝 Processing conversation with ${conversationHistory.length} entries`);

    // Format conversation transcript
    const transcript = conversationHistory
      .map(entry => {
        const speaker = entry.role === 'model' ? 'Interviewer' : (userName || 'Candidate');
        return `${speaker}: ${entry.text}`;
      })
      .join('\n');

    console.log(`📄 Generated transcript (${transcript.length} characters)`);

    // Define the schema for structured response
    const schema = {
      type: SchemaType.OBJECT,
      properties: {
        summary: { 
          type: SchemaType.STRING,
          description: "Overall performance summary (2-3 sentences)"
        },
        metrics: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              category: { 
                type: SchemaType.STRING,
                enum: ["Technical Knowledge", "Communication Skills", "Behavioral & Soft Skills", "Time Management", "Stress & Adaptability"]
              },
              score: { 
                type: SchemaType.NUMBER,
                minimum: 0,
                maximum: 10
              },
              notes: { 
                type: SchemaType.STRING,
                description: "Specific feedback and observations (1-2 sentences)"
              }
            },
            required: ["category", "score", "notes"]
          }
        }
      },
      required: ["summary", "metrics"]
    };

    const prompt = `You are an expert interview assessor. Based on the following interview transcript, provide a comprehensive performance analysis.

Interview Context:
- Duration: ${interviewDuration} minutes
- Objective: ${interviewObjective || 'General assessment'}
- Candidate: ${userName || 'The candidate'}

Evaluation Criteria:
1. **Technical Knowledge** (0-10): Understanding of technical concepts, accuracy of responses, depth of knowledge
2. **Communication Skills** (0-10): Clarity of expression, listening skills, ability to articulate thoughts
3. **Behavioral & Soft Skills** (0-10): Problem-solving approach, teamwork mindset, adaptability, emotional intelligence
4. **Time Management** (0-10): Ability to provide concise yet complete answers, staying on topic
5. **Stress & Adaptability** (0-10): Composure under pressure, handling difficult questions, flexibility

For each category:
- Provide a score from 0-10 (where 10 is exceptional, 8-9 is strong, 6-7 is adequate, 4-5 needs improvement, 0-3 is poor)
- Give specific, constructive feedback based on observable behavior in the transcript
- Be encouraging but honest in your assessment

Interview Transcript:
${transcript}

Provide your analysis in the specified JSON format.`;

    console.log('🤖 Initializing Gemini AI model...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // Retry the API call with exponential backoff
    const result = await retryWithBackoff(async () => {
      console.log('🔄 Calling Gemini API...');
      return await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.3, // Lower temperature for more consistent scoring
        },
      });
    }, 3, 2000); // 3 retries, starting with 2 second delay

    console.log('✅ Gemini API call successful');
    const response = result.response;
    
    let analysisData;
    try {
      analysisData = JSON.parse(response.text());
      console.log('✅ Successfully parsed analysis JSON');
    } catch (parseError) {
      console.error('❌ Failed to parse analysis JSON:', parseError);
      console.log('📄 Raw response:', response.text());
      
      // Fallback: Create a basic analysis structure
      analysisData = {
        summary: `Interview completed with ${conversationHistory.length} exchanges. Unable to generate detailed analysis due to parsing error.`,
        metrics: [
          { category: "Technical Knowledge", score: 6.0, notes: "Analysis temporarily unavailable due to technical issues." },
          { category: "Communication Skills", score: 6.0, notes: "Analysis temporarily unavailable due to technical issues." },
          { category: "Behavioral & Soft Skills", score: 6.0, notes: "Analysis temporarily unavailable due to technical issues." },
          { category: "Time Management", score: 6.0, notes: "Analysis temporarily unavailable due to technical issues." },
          { category: "Stress & Adaptability", score: 6.0, notes: "Analysis temporarily unavailable due to technical issues." }
        ]
      };
    }

    // Validate that we have all 5 required categories
    const requiredCategories = [
      "Technical Knowledge",
      "Communication Skills", 
      "Behavioral & Soft Skills",
      "Time Management",
      "Stress & Adaptability"
    ];

    // Ensure all categories are present
    const providedCategories = analysisData.metrics.map((m: any) => m.category);
    const missingCategories = requiredCategories.filter(cat => !providedCategories.includes(cat));

    // Add missing categories with default scores
    missingCategories.forEach(category => {
      analysisData.metrics.push({
        category,
        score: 6.0, // Default neutral score
        notes: "Insufficient data to evaluate this category during the interview."
      });
    });

    console.log('✅ Analysis generation completed successfully');
    console.log(`📊 Analysis contains ${analysisData.metrics?.length || 0} metrics`);
    
    return NextResponse.json({
      success: true,
      analysis: analysisData,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0,
      },
      generatedAt: new Date().toISOString(),
      transcriptLength: transcript.length,
      conversationEntries: conversationHistory.length
    });

  } catch (error) {
    console.error('❌ Error generating performance analysis:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to generate performance analysis';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('429') || error.message.includes('quota')) {
        errorMessage = 'API rate limit exceeded. Please try again in a moment.';
        statusCode = 429;
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
        statusCode = 408;
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
        statusCode = 503;
      }
    }
    
    // Create a fallback analysis for critical failures
    const fallbackAnalysis = {
      summary: `Interview session completed. Analysis generation encountered technical difficulties but your interview data has been saved.`,
      metrics: [
        { category: "Technical Knowledge", score: 7.0, notes: "Please contact support to regenerate your detailed analysis." },
        { category: "Communication Skills", score: 7.0, notes: "Please contact support to regenerate your detailed analysis." },
        { category: "Behavioral & Soft Skills", score: 7.0, notes: "Please contact support to regenerate your detailed analysis." },
        { category: "Time Management", score: 7.0, notes: "Please contact support to regenerate your detailed analysis." },
        { category: "Stress & Adaptability", score: 7.0, notes: "Please contact support to regenerate your detailed analysis." }
      ]
    };
    
    // For rate limits, return fallback analysis instead of error
    if (statusCode === 429) {
      console.log('🔄 Returning fallback analysis due to rate limits');
      return NextResponse.json({
        success: true,
        analysis: fallbackAnalysis,
        usage: { promptTokens: 0, outputTokens: 0 },
        fallback: true,
        reason: 'Rate limit exceeded',
        generatedAt: new Date().toISOString()
      });
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        fallbackAnalysis: fallbackAnalysis,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}
