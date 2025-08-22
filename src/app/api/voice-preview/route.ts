import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { voiceId, speed = 1.0, language = 'en-US' } = await request.json();
    
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const ttsModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

    let sampleText = "Hello, this is a preview of my voice. I'm excited to help you practice for your interview and achieve your career goals.";
    if (language === 'es-US') {
      sampleText = "Hola, esta es una vista previa de mi voz. Estoy emocionado de ayudarte a practicar para tu entrevista y alcanzar tus metas profesionales.";
    } else if (language === 'zh-CN') {
      sampleText = "你好，这是我的声音预览。我很高兴能帮助你练习面试并实现你的职业目标。";
    }

    const payload = {
      contents: [{ 
        role: 'user' as const,
        parts: [{ text: sampleText }] 
      }],
      generationConfig: {
        responseModalities: ["AUDIO"],
        speechConfig: { 
          voiceConfig: { 
            prebuiltVoiceConfig: { 
              voiceName: language === 'es-US' ? 'puck' : voiceId 
            } 
          } 
        }
      }
    };

    const result = await ttsModel.generateContent(payload as any);
    const audioData = (result.response as any).candidates[0].content.parts[0].inlineData.data;
    
    const audioUrl = `data:audio/pcm;base64,${audioData}`;
    
    return NextResponse.json({ 
      audioUrl,
      voiceId,
      speed,
      language
    });

  } catch (error) {
    console.error('Voice preview error:', error);
    return NextResponse.json({ 
      error: 'Failed to generate voice preview',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
