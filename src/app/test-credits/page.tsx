"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { emailService } from '@/lib/emailService';

export default function TestCreditsPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testPauseEmail = async () => {
    setIsLoading(true);
    addResult('Testing pause email...');
    
    try {
      const emailData = {
        to: 'jiawenzhu408@gmail.com',
        username: 'jiawenzhu',
        interviewerName: 'Lisa',
        interviewTitle: 'Test Interview',
        questionsAnswered: 3,
        totalQuestions: 10,
        duration: '5m 30s',
        conversationSummary: 'Test conversation for pause',
        detailedLogs: [
          { speaker: 'user' as const, text: 'Hello, I have experience with React', timestamp: '2025-08-24T20:30:00Z' },
          { speaker: 'ai' as const, text: 'Tell me more about your React experience', timestamp: '2025-08-24T20:30:05Z' },
          { speaker: 'user' as const, text: 'I worked on several projects using hooks and functional components', timestamp: '2025-08-24T20:30:10Z' }
        ],
        resumeUrl: 'http://localhost:3000/practice/new',
                 geminiAnalysis: {
           executiveSummary: 'Good discussion about React experience with room for improvement',
           detailedLog: 'Comprehensive analysis of the interview session focusing on React fundamentals',
           keyInsights: [
             'Demonstrated basic React knowledge',
             'Could benefit from more specific examples',
             'Good communication skills shown'
           ],
           qualityAssessment: {
             score: 7,
             reasoning: 'Solid foundation with room for improvement in providing concrete examples'
           },
           discrepancyAnalysis: 'No significant discrepancies noted in the conversation',
           recommendations: [
             'Prepare specific project examples',
             'Quantify your achievements',
             'Focus on problem-solving scenarios'
           ],
           localVsGemini: {
             localCapturedTurns: 6,
             localSpeakers: ['user', 'ai'],
             analysisQuality: 'High'
           }
         }
      };

      const result = await emailService.sendInterviewPauseSummaryEmail(emailData);
      
      if (result) {
        addResult('✅ Pause email sent successfully!');
      } else {
        addResult('❌ Pause email failed to send');
      }
    } catch (error) {
      addResult(`❌ Error sending pause email: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testCompletionEmail = async () => {
    setIsLoading(true);
    addResult('Testing completion email...');
    
    try {
      const emailData = {
        to: 'jiawenzhu408@gmail.com',
        username: 'jiawenzhu',
        interviewTitle: 'Test Interview Completion',
        score: 85,
        totalQuestions: 10,
        duration: '8m 45s',
        feedback: 'Great performance! You demonstrated strong technical knowledge and communication skills.',
        improvementTips: [
          'Keep practicing with different question types',
          'Focus on providing specific examples',
          'Work on time management during responses'
        ],
        nextSteps: 'Your detailed performance analysis is available. Continue practicing to improve your interview skills!',
        geminiAnalysis: {
          analysisType: 'full_evaluation',
          executiveSummary: 'Strong performance with room for improvement in specific areas',
          detailedLog: 'Comprehensive analysis of interview performance',
          keyInsights: [
            'Good communication and technical knowledge',
            'Could benefit from more specific examples',
            'Strong foundation in core concepts'
          ],
          qualityAssessment: {
            score: 85,
            reasoning: 'Well-rounded performance with demonstrated skills'
          },
          discrepancyAnalysis: 'No significant discrepancies noted',
          recommendations: [
            'Continue building on current foundation',
            'Practice with scenario-based questions',
            'Develop more detailed project examples'
          ],
          localVsGemini: {
            localCapturedTurns: 8,
            localSpeakers: ['user', 'ai'],
            analysisQuality: 'High'
          }
        }
      };

      const result = await emailService.sendInterviewCompletionEmail(emailData);
      
      if (result) {
        addResult('✅ Completion email sent successfully!');
      } else {
        addResult('❌ Completion email failed to send');
      }
    } catch (error) {
      addResult(`❌ Error sending completion email: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testGeminiAnalysis = async () => {
    setIsLoading(true);
    addResult('Testing Gemini analysis API...');
    
    try {
      const response = await fetch('/api/gemini/analyze-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: [
            { speaker: 'ai', text: 'Hello, tell me about your experience with React.', timestamp: '2025-08-24T18:00:00Z' },
            { speaker: 'user', text: 'I have been working with React for about 2 years. I started with class components but now prefer functional components with hooks.', timestamp: '2025-08-24T18:00:05Z' }
          ],
          interviewContext: 'Technical interview for React developer position',
          analysisType: 'pause'
        })
      });

      if (response.ok) {
        const data = await response.json();
        addResult('✅ Gemini analysis API working!');
        addResult(`Analysis type: ${data.data?.analysis_type}`);
      } else {
        const errorData = await response.json();
        addResult(`❌ Gemini analysis API failed: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      addResult(`❌ Error calling Gemini analysis: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🧪 Test Interview Email Functionality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
                         <Button 
               className="bg-blue-600 hover:bg-blue-700"
               disabled={isLoading}
               onClick={testPauseEmail}
             >
               Test Pause Email
             </Button>
             <Button 
               className="bg-green-600 hover:bg-green-700"
               disabled={isLoading}
               onClick={testCompletionEmail}
             >
               Test Completion Email
             </Button>
             <Button 
               className="bg-purple-600 hover:bg-purple-700"
               disabled={isLoading}
               onClick={testGeminiAnalysis}
             >
               Test Gemini Analysis
             </Button>
             <Button 
               variant="outline"
               onClick={clearResults}
             >
               Clear Results
             </Button>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Test Results:</h3>
            <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-gray-500">No test results yet. Click a test button above.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="mb-2 font-mono text-sm">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Instructions:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
                             <li>• Click &quot;Test Pause Email&quot; to test the pause button email functionality</li>
               <li>• Click &quot;Test Completion Email&quot; to test the end button email functionality</li>
               <li>• Click &quot;Test Gemini Analysis&quot; to verify the AI analysis is working</li>
               <li>• Check your email (jiawenzhu408@gmail.com) for the test emails</li>
               <li>• If emails work here but not in the actual interview, there&apos;s a UI issue</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
