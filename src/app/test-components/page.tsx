'use client';

import React, { useState } from 'react';
import QuestionsPanel from '@/components/interview/QuestionsPanel';
import NotesTaker from '@/components/interview/NotesTaker';
import PanelToggle from '@/components/interview/PanelToggle';

export default function TestComponentsPage() {
  const [showQuestionsPanel, setShowQuestionsPanel] = useState(false);
  const [showNotesPanel, setShowNotesPanel] = useState(false);
  const [interviewNotes, setInterviewNotes] = useState('');

  const mockQuestions = [
    { id: "q1", text: "Tell me about yourself", type: "behavioral", difficulty: "easy", category: "personal" },
    { id: "q2", text: "What are your strengths and weaknesses?", type: "behavioral", difficulty: "medium", category: "personal" },
    { id: "q3", text: "Why do you want this job?", type: "behavioral", difficulty: "medium", category: "motivation" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Component Test Page
        </h1>

        {/* Panel Toggle */}
        <div className="mb-8 flex justify-center">
          <PanelToggle
            showQuestions={showQuestionsPanel}
            showNotes={showNotesPanel}
            onToggleQuestions={() => setShowQuestionsPanel(!showQuestionsPanel)}
            onToggleNotes={() => setShowNotesPanel(!showNotesPanel)}
          />
        </div>

        {/* Test Controls */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setShowQuestionsPanel(!showQuestionsPanel)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Toggle Questions Panel
            </button>
            <button
              onClick={() => setShowNotesPanel(!showNotesPanel)}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Toggle Notes Panel
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Questions Panel: {showQuestionsPanel ? 'Visible' : 'Hidden'}</p>
            <p>Notes Panel: {showNotesPanel ? 'Visible' : 'Hidden'}</p>
          </div>
        </div>

        {/* Questions Panel */}
        <QuestionsPanel
          questions={mockQuestions}
          currentQuestionIndex={0}
          onQuestionSelect={(index) => console.log('Selected question:', index)}
          isVisible={showQuestionsPanel}
          onToggle={() => setShowQuestionsPanel(false)}
        />

        {/* Notes Taker */}
        <NotesTaker
          isVisible={showNotesPanel}
          onToggle={() => setShowNotesPanel(false)}
          initialNotes={interviewNotes}
          onNotesChange={setInterviewNotes}
        />
      </div>
    </div>
  );
}
