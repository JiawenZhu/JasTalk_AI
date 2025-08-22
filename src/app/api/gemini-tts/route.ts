import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    console.log('Gemini TTS API called');
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not found in environment');
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const { text, voiceId, speed } = await request.json();
    console.log('Received request:', { text: text?.substring(0, 50) + '...', voiceId, speed });

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const ttsModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

    let speedInstruction = '';
    if (speed === 0.5) speedInstruction = 'very slowly';
    else if (speed === 0.75) speedInstruction = 'slowly';
    else if (speed === 1.5) speedInstruction = 'quickly';
    else if (speed === 2.0) speedInstruction = 'very quickly';

    const prompt = `Speak in a natural, professional, and conversational tone. ${speedInstruction ? `Speak ${speedInstruction}.` : ''} Here is the text: ${text}`;

    let payload;
    
    if (voiceId === 'es-US') {
      payload = {
        contents: [{ role: 'user' as const, parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "puck" } } }
        }
      };
    } else if (voiceId === 'zh-CN') {
      payload = {
        contents: [{ role: 'user' as const, parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "achernar" } } }
        }
      };
    } else {
      payload = {
        contents: [{ role: 'user' as const, parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceId } } }
        }
      };
    }

    console.log('Calling Gemini TTS with payload:', JSON.stringify(payload, null, 2));
    
    const result = await ttsModel.generateContent(payload as any);
    console.log('Gemini TTS response received');
    
    const audioData = (result.response as any).candidates[0].content.parts[0].inlineData.data;
    console.log('Audio data extracted, length:', audioData?.length || 0);
    
    return NextResponse.json({ 
      success: true, 
      audioData: audioData,
      voiceId: voiceId,
      speed: speed
    });

  } catch (error) {
    console.error('Gemini TTS error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate speech',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
