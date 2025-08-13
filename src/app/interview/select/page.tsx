"use client";

import React from 'react';

export default function SelectInterviewPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Choose Your Interviewer
      </h1>
      <p className="text-xl text-gray-600">
        This is a test page to verify the navigation is working.
      </p>
      <div className="mt-8 p-6 bg-white rounded-lg border">
        <h2 className="text-2xl font-semibold mb-4">Demo Interviewer</h2>
        <p className="text-gray-600">
          Sarah Chen (Demo) - A friendly and encouraging interviewer who specializes in behavioral questions.
        </p>
        <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
          Try Demo (2 min)
        </button>
      </div>
    </div>
  );
}
