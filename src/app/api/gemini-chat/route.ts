import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const { userMessage, systemInstruction } = await request.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const chat = chatModel.startChat({ 
      history: [
        { role: 'user', parts: [{ text: systemInstruction }] }, 
        { role: 'model', parts: [{ text: `I understand. I will now begin the interview.` }] }
      ], 
      generationConfig: { maxOutputTokens: 150 } 
    });

    const result = await chat.sendMessage(userMessage);
    const aiResponse = result.response.text();
    
    return NextResponse.json({ 
      success: true, 
      response: aiResponse,
      usage: result.response.usageMetadata
    });

  } catch (error) {
    console.error('Gemini chat error:', error);
    return NextResponse.json({ 
      error: 'Failed to get AI response',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

