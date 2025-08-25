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

    const prompt = `You are a senior-level corporate interview assessor with extensive experience in evaluating executive and professional candidates. Your role is to provide an objective, rigorous, and evidence-based assessment of interview performance based solely on the provided transcript.

CRITICAL EVALUATION PRINCIPLES:
- Score ONLY based on OBSERVABLE EVIDENCE in the transcript
- If a candidate provides no response, insufficient response, or non-substantive responses, score accordingly (0-3 range)
- Do NOT inflate scores or provide benefit of doubt without concrete evidence
- Maintain professional objectivity and avoid leniency bias
- Each score must be justified by specific examples from the transcript

Interview Context:
- Duration: ${interviewDuration} minutes
- Objective: ${interviewObjective || 'Comprehensive professional assessment'}
- Candidate: ${userName || 'The candidate'}

EVALUATION CRITERIA & SCORING STANDARDS:

1. **Technical Knowledge** (0-10)
   - 9-10: Demonstrates exceptional depth, accuracy, and nuanced understanding
   - 7-8: Shows strong knowledge with minor gaps or inaccuracies
   - 5-6: Displays adequate knowledge with some gaps or surface-level understanding
   - 3-4: Limited knowledge with significant gaps or inaccuracies
   - 0-2: Minimal to no technical knowledge demonstrated

2. **Communication Skills** (0-10)
   - 9-10: Exceptional clarity, articulation, and professional communication
   - 7-8: Clear, well-structured responses with minor communication issues
   - 5-6: Generally understandable with some clarity or structure issues
   - 3-4: Unclear or poorly structured communication
   - 0-2: Incomprehensible or no communication demonstrated

3. **Behavioral & Soft Skills** (0-10)
   - 9-10: Demonstrates exceptional problem-solving, adaptability, and emotional intelligence
   - 7-8: Shows strong behavioral competencies with minor areas for improvement
   - 5-6: Adequate behavioral skills with some limitations
   - 3-4: Limited behavioral competencies or poor problem-solving approach
   - 0-2: Minimal to no behavioral skills demonstrated

4. **Time Management** (0-10)
   - 9-10: Exceptional ability to provide comprehensive yet concise responses
   - 7-8: Good balance of detail and conciseness
   - 5-6: Adequate time management with some verbosity or brevity
   - 3-4: Poor time management (excessively long or short responses)
   - 0-2: No time management demonstrated or responses completely off-topic

5. **Stress & Adaptability** (0-10)
   - 9-10: Exceptional composure under pressure and adaptability to challenges
   - 7-8: Maintains good composure with minor stress indicators
   - 5-6: Generally handles pressure adequately with some stress signs
   - 3-4: Shows significant stress or poor adaptability
   - 0-2: Poor stress management or no adaptability demonstrated

SCORING REQUIREMENTS:
- Each score MUST be supported by specific evidence from the transcript
- If insufficient data exists for a category, score 0-2 with explanation
- Do NOT award passing scores (5+) without substantial evidence
- Be particularly strict about awarding high scores (7+) - require exceptional performance
- For categories with no candidate responses, score 0-1 with clear justification

Interview Transcript:
${transcript}

ASSESSMENT INSTRUCTIONS:
Analyze the transcript with strict adherence to the scoring standards above. Provide objective, evidence-based scores that accurately reflect the candidate's demonstrated abilities. Each metric must include specific examples from the transcript to justify the assigned score.

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
      
      // Fallback: Create a conservative analysis structure when parsing fails
      analysisData = {
        summary: `Interview completed with ${conversationHistory.length} exchanges. Detailed analysis unavailable due to technical processing error. Conservative scoring applied.`,
        metrics: [
          { category: "Technical Knowledge", score: 2.0, notes: "Unable to assess due to technical processing error. Conservative scoring applied." },
          { category: "Communication Skills", score: 2.0, notes: "Unable to assess due to technical processing error. Conservative scoring applied." },
          { category: "Behavioral & Soft Skills", score: 2.0, notes: "Unable to assess due to technical processing error. Conservative scoring applied." },
          { category: "Time Management", score: 2.0, notes: "Unable to assess due to technical processing error. Conservative scoring applied." },
          { category: "Stress & Adaptability", score: 2.0, notes: "Unable to assess due to technical processing error. Conservative scoring applied." }
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

    // Add missing categories with conservative default scores
    missingCategories.forEach(category => {
      analysisData.metrics.push({
        category,
        score: 2.0, // Conservative default score - insufficient data
        notes: "Insufficient data to evaluate this category during the interview. Conservative scoring applied."
      });
    });

    // Validate and flag suspicious scoring patterns
    const suspiciousScores: string[] = [];
    analysisData.metrics.forEach((metric: any) => {
      // Flag scores that seem too high for incomplete interviews
      if (metric.score >= 7 && conversationHistory.length < 4) {
        suspiciousScores.push(`${metric.category}: High score (${metric.score}) for limited conversation data`);
      }
      
      // Flag scores that seem too high without substantial responses
      if (metric.score >= 8) {
        const userResponses = conversationHistory.filter(entry => entry.role === 'user');
        const substantialResponses = userResponses.filter(entry => entry.text.length > 20);
        if (substantialResponses.length < 2) {
          suspiciousScores.push(`${metric.category}: Very high score (${metric.score}) with minimal substantial responses`);
        }
      }
      
      // Ensure scores are within valid range
      if (metric.score < 0 || metric.score > 10) {
        console.warn(`⚠️ Invalid score detected: ${metric.category} = ${metric.score}, clamping to valid range`);
        metric.score = Math.max(0, Math.min(10, metric.score));
      }
    });

    // Log suspicious scoring for monitoring
    if (suspiciousScores.length > 0) {
      console.warn('⚠️ Suspicious scoring patterns detected:', suspiciousScores);
    }

    console.log('✅ Analysis generation completed successfully');
    console.log(`📊 Analysis contains ${analysisData.metrics?.length || 0} metrics`);
    if (suspiciousScores.length > 0) {
      console.log(`⚠️ ${suspiciousScores.length} suspicious scoring patterns flagged`);
    }
    
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
    
    // Create a conservative fallback analysis for critical failures
    const fallbackAnalysis = {
      summary: `Interview session completed. Analysis generation encountered technical difficulties but your interview data has been saved. Conservative scoring applied.`,
      metrics: [
        { category: "Technical Knowledge", score: 2.0, notes: "Analysis unavailable due to technical issues. Conservative scoring applied." },
        { category: "Communication Skills", score: 2.0, notes: "Analysis unavailable due to technical issues. Conservative scoring applied." },
        { category: "Behavioral & Soft Skills", score: 2.0, notes: "Analysis unavailable due to technical issues. Conservative scoring applied." },
        { category: "Time Management", score: 2.0, notes: "Analysis unavailable due to technical issues. Conservative scoring applied." },
        { category: "Stress & Adaptability", score: 2.0, notes: "Analysis unavailable due to technical issues. Conservative scoring applied." }
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
