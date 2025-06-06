import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST() {
  try {
    const supabase = createServerClient();
    
    // Create a simple test coding question
    const testQuestion = {
      title: 'Simple Addition',
      description: 'Write a function that adds two numbers and returns the result.',
      difficulty: 'Easy',
      tags: ['Math', 'Basic'],
      constraints: ['Numbers can be positive or negative', 'Return type should be number'],
      examples: [
        {
          input: 'a = 5, b = 3',
          output: '8',
          explanation: '5 + 3 = 8'
        }
      ],
      test_cases: [
        {
          input: 'a = 2, b = 3',
          expected_output: '5'
        },
        {
          input: 'a = -1, b = 1',
          expected_output: '0'
        }
      ],
      hints: ['Just use the + operator'],
      time_limit: 5,
      memory_limit: 16,
      company_origin: 'Demo',
      topic: 'Math',
      is_active: true,
      solution_template: {
        javascript: 'function add(a, b) {\n  // Your solution here\n  return a + b;\n}',
        python: 'def add(a, b):\n    # Your solution here\n    return a + b',
        java: 'public int add(int a, int b) {\n    // Your solution here\n    return a + b;\n}',
        typescript: 'function add(a: number, b: number): number {\n  // Your solution here\n  return a + b;\n}',
        cpp: 'int add(int a, int b) {\n    // Your solution here\n    return a + b;\n}',
        csharp: 'public int Add(int a, int b) {\n    // Your solution here\n    return a + b;\n}',
        go: 'func add(a int, b int) int {\n    // Your solution here\n    return a + b\n}',
        rust: 'fn add(a: i32, b: i32) -> i32 {\n    // Your solution here\n    a + b\n}'
      }
    };

    const { data, error } = await supabase
      .from('coding_question')
      .insert([testQuestion])
      .select()
      .single();

    if (error) {
      console.error('Error creating coding question:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Test coding question created successfully',
      question: {
        id: data.id,
        title: data.title,
        difficulty: data.difficulty
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
