import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // This will be upgraded to WebSocket by the client
  return NextResponse.json({ message: 'WebSocket endpoint' });
}

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const { text, voiceId, sessionId } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use Gemini Live API for real-time streaming
    const liveModel = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-latest",
      generationConfig: {
        maxOutputTokens: 150,
      }
    });

    // Create a streaming chat session
    const chat = liveModel.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `You are an expert interviewer. Keep responses under 30 words and ask follow-up questions.` }]
        },
        {
          role: "model", 
          parts: [{ text: "I understand. I'm ready to conduct the interview." }]
        }
      ]
    });

    // Send the message and get streaming response
    const result = await chat.sendMessage(text);
    const response = await result.response;
    const responseText = response.text();

    return NextResponse.json({ 
      success: true, 
      response: responseText,
      sessionId: sessionId
    });

  } catch (error) {
    console.error('Gemini Live API error:', error);
    return NextResponse.json({ 
      error: 'Failed to get AI response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
