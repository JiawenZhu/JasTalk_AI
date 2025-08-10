import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate unique IDs for this test session
    const uniqueCallId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const uniqueAgentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create test conversation log with unique call_id
    const testConversationLog = {
      call_id: uniqueCallId,
      agent_id: uniqueAgentId,
      agent_name: 'Lisa',
      candidate_name: user.email,
      transcript: [
        {
          speaker: 'agent',
          content: 'Can you describe your experience with user-centered design principles and how you\'ve applied them in a previous project?',
          timestamp: '0:05'
        },
        {
          speaker: 'user',
          content: 'I have extensive experience with user-centered design principles. In my previous project, I conducted user research through interviews and surveys to understand user needs. I then created personas and journey maps to guide the design process. Throughout development, I regularly tested prototypes with users and iterated based on their feedback.',
          timestamp: '0:15'
        },
        {
          speaker: 'agent',
          content: 'What are the key differences between WCAG 2.0 and WCAG 2.1, and how do they impact web accessibility design?',
          timestamp: '0:45'
        },
        {
          speaker: 'user',
          content: 'WCAG 2.1 builds upon WCAG 2.0 with additional success criteria focused on mobile accessibility, low vision users, and cognitive disabilities. Key additions include criteria for touch target sizes, pointer gestures, and text spacing. These changes impact design by requiring larger touch targets and more flexible text layouts.',
          timestamp: '1:20'
        },
        {
          speaker: 'agent',
          content: 'How would you approach conducting usability testing for a new web application? What steps would you take?',
          timestamp: '2:00'
        },
        {
          speaker: 'user',
          content: 'I would start by defining clear objectives and recruiting representative users. I\'d create specific tasks that align with user goals and set up a testing environment. During sessions, I\'d observe user behavior, note pain points, and gather feedback. Afterward, I\'d analyze the data to identify patterns and prioritize improvements.',
          timestamp: '2:30'
        },
        {
          speaker: 'agent',
          content: 'Can you walk us through a project where you had to translate designs from Figma into HTML and CSS? What challenges did you face?',
          timestamp: '3:15'
        },
        {
          speaker: 'user',
          content: 'In one project, I had to convert a complex Figma design with custom animations and responsive layouts. The main challenges were maintaining pixel-perfect accuracy while ensuring cross-browser compatibility. I used CSS Grid and Flexbox for layout, and carefully matched colors and typography. I also had to implement custom animations using CSS transitions.',
          timestamp: '3:45'
        },
        {
          speaker: 'agent',
          content: 'Write a simple CSS rule to center a div both vertically and horizontally within a parent container.',
          timestamp: '4:30'
        },
        {
          speaker: 'user',
          content: 'I would use flexbox: .parent { display: flex; justify-content: center; align-items: center; } or CSS Grid: .parent { display: grid; place-items: center; }. Both approaches work well for centering content.',
          timestamp: '4:45'
        }
      ],
      post_call_analysis: {
        communication_score: 85,
        technical_score: 90,
        overall_score: 87
      },
      duration_seconds: 300
    };

    // Insert the conversation log
    const { data: conversationLog, error } = await supabase
      .from('conversation_logs')
      .insert(testConversationLog)
      .select()
      .single();

    if (error) {
      console.error('Error creating test conversation log:', error);
      return NextResponse.json({ error: 'Failed to create test conversation log' }, { status: 500 });
    }

    // Create a test practice session with the questions from the image
    const testQuestions = [
      {
        id: '1',
        text: 'Can you describe your experience with user-centered design principles and how you\'ve applied them in a previous project?',
        category: 'behavioral',
        difficulty: 'medium'
      },
      {
        id: '2',
        text: 'What are the key differences between WCAG 2.0 and WCAG 2.1, and how do they impact web accessibility design?',
        category: 'technical',
        difficulty: 'medium'
      },
      {
        id: '3',
        text: 'How would you approach conducting usability testing for a new web application? What steps would you take?',
        category: 'system design',
        difficulty: 'medium'
      },
      {
        id: '4',
        text: 'Can you walk us through a project where you had to translate designs from Figma into HTML and CSS? What challenges did you face?',
        category: 'behavioral',
        difficulty: 'medium'
      },
      {
        id: '5',
        text: 'Write a simple CSS rule to center a div both vertically and horizontally within a parent container.',
        category: 'coding',
        difficulty: 'easy'
      }
    ];

    const testPracticeSession = {
      user_id: user.id,
      session_name: 'Test Interview Session',
      agent_id: uniqueAgentId,
      agent_name: 'Lisa',
      call_id: uniqueCallId,
      retell_agent_id: uniqueAgentId,
      retell_call_id: uniqueCallId,
      questions: testQuestions,
      status: 'completed',
      total_questions: testQuestions.length,
      completed_questions: testQuestions.length,
      duration_seconds: 300,
      score: 87
    };

    const { data: practiceSession, error: sessionError } = await supabase
      .from('practice_sessions')
      .insert(testPracticeSession)
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating test practice session:', sessionError);
      return NextResponse.json({ error: 'Failed to create test practice session' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      conversationLog,
      practiceSession,
      message: 'Test conversation log and practice session created successfully'
    });

  } catch (error) {
    console.error('Error in create-test-conversation API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
