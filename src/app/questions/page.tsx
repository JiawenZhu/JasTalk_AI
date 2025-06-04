"use client";

import React, { useState } from "react";
import Header from "@/components/navigation/header";
import { ChevronDownIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface Question {
  id: string;
  title: string;
  company: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: "Coding" | "System Design" | "Behavioral" | "Technical";
  completed: boolean;
  description?: string;
}

const questions: Question[] = [
  {
    id: "1",
    title: "Given a binary tree, find the maximum path sum.",
    company: "Google",
    difficulty: "Hard",
    category: "Coding",
    completed: true,
  },
  {
    id: "2",
    title: "Given a robot cleaner in a room modeled as a grid, design an algorithm to clean the entire room using only the 4 given APIs.",
    company: "Google",
    difficulty: "Hard",
    category: "Coding",
    completed: true,
  },
  {
    id: "3",
    title: "Given an encoded string, return its decoded string.",
    company: "Google",
    difficulty: "Medium",
    category: "Coding",
    completed: true,
  },
  {
    id: "4",
    title: "Implement a SnapshotArray that supports pre-defined interfaces.",
    company: "Google",
    difficulty: "Medium",
    category: "Coding",
    completed: true,
  },
  {
    id: "5",
    title: "In a row of dominoes, A[i] and B[i] represent the top and bottom halves of the i-th domino. Return the minimum number of rotations so that all the values in A are the same, or all the values in B are the same.",
    company: "Google",
    difficulty: "Medium",
    category: "Coding",
    completed: false,
  },
  {
    id: "6",
    title: "Given a matrix and a target, return the number of non-empty submatrices that sum to target.",
    company: "Google",
    difficulty: "Hard",
    category: "Coding",
    completed: false,
  },
];

const companies = [
  { name: "All Companies", count: 0, icon: "🏢" },
  { name: "Google", count: 17, icon: "🔍" },
  { name: "Meta", count: 12, icon: "📘" },
  { name: "Amazon", count: 15, icon: "📦" },
];

const QuestionsPage = () => {
  const [selectedCompany, setSelectedCompany] = useState("Google");
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const filteredQuestions = selectedCompany === "All Companies" 
    ? questions 
    : questions.filter(q => q.company === selectedCompany);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800";
      case "Medium": return "bg-yellow-100 text-yellow-800";
      case "Hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Coding": return "bg-purple-100 text-purple-800";
      case "System Design": return "bg-blue-100 text-blue-800";
      case "Behavioral": return "bg-green-100 text-green-800";
      case "Technical": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Purple Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Your Current Plan: ⭐ Pro Plan</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full text-left px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200 hover:bg-indigo-100 transition-colors">
                  📊 Progress Dashboard
                </button>
                <button className="w-full text-left px-4 py-3 bg-gray-50 text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                  ❓ My Questions
                </button>
              </div>

              <h3 className="text-md font-medium text-gray-900 mt-6 mb-3">Filter by Company</h3>
              <div className="space-y-2">
                {companies.map((company) => (
                  <button
                    key={company.name}
                    onClick={() => setSelectedCompany(company.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg border transition-colors ${
                      selectedCompany === company.name
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{company.icon}</span>
                        <span className="text-sm font-medium">{company.name}</span>
                      </div>
                      {company.count > 0 && (
                        <span className="text-xs text-gray-500">{company.count}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-1/2 flex-grow">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">Choose your question</h1>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">🇺🇸 English</span>
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-gray-600">
                  Select a question from our comprehensive database to start your interview practice session.
                </p>
              </div>

              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{companies.find(c => c.name === selectedCompany)?.icon}</span>
                    <span className="font-semibold text-gray-900">{selectedCompany}</span>
                    <span className="text-sm text-gray-500">
                      {filteredQuestions.length} questions
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredQuestions.map((question) => (
                    <div
                      key={question.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        selectedQuestion === question.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedQuestion(question.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-grow">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-medium text-gray-900 leading-tight">
                              {question.title}
                            </h3>
                            {question.completed && (
                              <CheckCircleIcon className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(question.category)}`}>
                              {question.category}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                              {question.difficulty}
                            </span>
                          </div>

                          {question.completed && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs text-green-600 font-medium">✓ Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Question Selection</h2>
                <span className="text-sm text-indigo-600 font-medium">Step 1 of 4</span>
              </div>
              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-2">Progress</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "25%" }}></div>
                </div>
              </div>
              
              <div className="space-y-4 text-sm">
                <p className="text-gray-600">
                  Browse through our comprehensive question database and select one that matches your interview goals.
                </p>
                
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="font-medium text-indigo-900 mb-2">💡 Pro Tips</h3>
                  <ul className="text-indigo-800 space-y-1 text-xs">
                    <li>• Start with easier questions to build confidence</li>
                    <li>• Focus on companies you're targeting</li>
                    <li>• Practice different question types regularly</li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">🏷️ Question Categories</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span>Coding</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span>System Design</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span>Behavioral</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span>Technical</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedQuestion && (
                <div className="mt-6">
                  <button className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                    Continue to Interviewer Selection →
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-3">Interview Steps</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-medium">1</div>
                  <span className="font-medium text-indigo-600">Select Question</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs font-medium">2</div>
                  <span className="text-gray-500">Choose Interviewer</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs font-medium">3</div>
                  <span className="text-gray-500">Record Interview</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-xs font-medium">4</div>
                  <span className="text-gray-500">Review Feedback</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionsPage; 