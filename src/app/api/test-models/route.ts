import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    // Test 1: List available models
    console.log('Testing OpenAI models availability...');
    
    const modelsResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text();
      return NextResponse.json({ 
        error: `Failed to fetch models: ${modelsResponse.status}`,
        details: errorText
      }, { status: modelsResponse.status });
    }

    const modelsData = await modelsResponse.json();
    
    // Filter for GPT-5 and GPT-4 models
    const gpt5Models = modelsData.data.filter((model: any) => 
      model.id.startsWith('gpt-5')
    );
    
    const gpt4Models = modelsData.data.filter((model: any) => 
      model.id.startsWith('gpt-4')
    );

    // Test 2: Try specific models we're interested in
    const modelsToTest = [
      'gpt-4o-mini',
      'gpt-4o',
      'gpt-4-turbo'
    ];

    const modelTests = [];
    
    for (const modelId of modelsToTest) {
      try {
        console.log(`Testing model: ${modelId}`);
        
        // Try a simple completion to test if the model works
        const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelId,
            messages: [
              { role: 'user', content: 'Say "Hello" and nothing else.' }
            ],
            max_tokens: 10,
          }),
        });

        if (testResponse.ok) {
          const testData = await testResponse.json();
          modelTests.push({
            model: modelId,
            status: 'working',
            response: testData.choices[0]?.message?.content || 'No content'
          });
        } else {
          const errorText = await testResponse.text();
          modelTests.push({
            model: modelId,
            status: 'failed',
            error: `${testResponse.status}: ${errorText}`
          });
        }
      } catch (error) {
        modelTests.push({
          model: modelId,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      availableModels: {
        gpt5: gpt5Models.map((m: any) => ({ id: m.id, created: m.created })),
        gpt4: gpt4Models.map((m: any) => ({ id: m.id, created: m.created }))
      },
      modelTests,
      totalModels: modelsData.data.length
    });

  } catch (error) {
    console.error('Error testing models:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
