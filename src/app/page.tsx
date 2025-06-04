"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navigation from "@/components/Navigation";
import { CheckCircleIcon, PlayIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

interface Question {
  id: string;
  title: string;
  company: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category: "Coding" | "System Design" | "Behavioral" | "Technical";
  completed: boolean;
}

interface Interviewer {
  id: string;
  name: string;
  title: string;
  company: string;
  style: "Formal" | "Conversational" | "Challenging";
  description: string;
  avatar: string;
  experience: string;
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
];

const interviewers: Interviewer[] = [
  {
    id: "1",
    name: "Sarah Chen",
    title: "Technical Lead at Amazon",
    company: "Amazon",
    style: "Conversational",
    description: "In-depth exploration of technical knowledge",
    avatar: "👩‍💻",
    experience: "Technical"
  },
  {
    id: "2",
    name: "Michael Rodriguez",
    title: "Engineering Manager at Google",
    company: "Google",
    style: "Formal",
    description: "Follows structured interview protocols",
    avatar: "👨‍💼",
    experience: "Formal"
  },
  {
    id: "3",
    name: "Emma Johnson",
    title: "HR Director at Meta",
    company: "Meta",
    style: "Conversational",
    description: "Focuses on building rapport and understanding",
    avatar: "👩‍💼",
    experience: "Empathetic"
  },
  {
    id: "4",
    name: "David Kim",
    title: "Product Manager at Apple",
    company: "Apple",
    style: "Challenging",
    description: "Poses difficult follow-up questions",
    avatar: "👨‍💻",
    experience: "Challenging"
  },
  {
    id: "5",
    name: "Alex Thompson",
    title: "Senior Developer at Microsoft",
    company: "Microsoft",
    style: "Conversational",
    description: "In-depth exploration of technical knowledge",
    avatar: "👨‍🔬",
    experience: "Technical"
  },
];

const companies = [
  { name: "All Companies", count: 0, icon: "🏢" },
  { name: "Google", count: 17, icon: "🔍" },
  { name: "Meta", count: 12, icon: "📘" },
  { name: "Amazon", count: 15, icon: "📦" },
];

type Step = "question" | "interviewer" | "interview" | "feedback";

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>("question");
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedInterviewer, setSelectedInterviewer] = useState<Interviewer | null>(null);
  const [selectedCompany, setSelectedCompany] = useState("Google");
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

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

  const getStepNumber = (step: Step) => {
    switch (step) {
      case "question": return 1;
      case "interviewer": return 2;
      case "interview": return 3;
      case "feedback": return 4;
      default: return 1;
    }
  };

  const renderQuestionSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{
        duration: 0.95,
        ease: [0.165, 0.84, 0.44, 1],
      }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Purple Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Your Current Plan: ⭐ Pro Plan</span>
          </div>
        </div>
      </div>

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
                <h1 className="text-2xl font-bold text-[#1E2B3A]">Choose your question</h1>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">🇺🇸 English</span>
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
                      selectedQuestion?.id === question.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedQuestion(question)}
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
            
            {selectedQuestion && (
              <div className="mt-6">
                <button 
                  onClick={() => setCurrentStep("interviewer")}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
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
    </motion.div>
  );

  const renderInterviewerSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{
        duration: 0.95,
        ease: [0.165, 0.84, 0.44, 1],
      }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Purple Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Your Current Plan: ⭐ Pro Plan</span>
          </div>
        </div>
      </div>

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
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentStep("question")}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <h1 className="text-2xl font-bold text-[#1E2B3A]">Choose your interviewer</h1>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">🇺🇸 English</span>
                </div>
              </div>
              <p className="text-gray-600">
                Each interviewer has a unique personality and approach to help you practice different interview scenarios.
              </p>
              <div className="mt-4 text-sm text-blue-600">
                💡 Tip: Double-click any interviewer to start the interview immediately.
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {interviewers.map((interviewer) => (
                  <div
                    key={interviewer.id}
                    className={`border rounded-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedInterviewer?.id === interviewer.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedInterviewer(interviewer)}
                    onDoubleClick={() => {
                      setSelectedInterviewer(interviewer);
                      setCurrentStep("interview");
                    }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="text-4xl">{interviewer.avatar}</div>
                      <div className="flex-grow">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {interviewer.name}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm text-gray-500">Online</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">{interviewer.title}</p>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            interviewer.style === "Formal" 
                              ? "bg-blue-100 text-blue-800"
                              : interviewer.style === "Conversational"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}>
                            {interviewer.style}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            {interviewer.experience}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600">{interviewer.description}</p>
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
              <h2 className="text-lg font-semibold text-gray-900">Interviewer Selection</h2>
              <span className="text-sm text-indigo-600 font-medium">Step 2 of 4</span>
            </div>
            <div className="mb-6">
              <div className="text-sm text-gray-600 mb-2">Progress</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: "50%" }}></div>
              </div>
            </div>
            
            <div className="space-y-4 text-sm">
              <p className="text-gray-600">
                Choose an AI interviewer persona that matches the type of interview experience you want to practice.
              </p>
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="font-medium text-indigo-900 mb-2">🎯 Interviewer Styles</h3>
                <ul className="text-indigo-800 space-y-1 text-xs">
                  <li>• <strong>Formal:</strong> Traditional, structured approach</li>
                  <li>• <strong>Conversational:</strong> Friendly, relaxed discussion</li>
                  <li>• <strong>Challenging:</strong> Tough follow-up questions</li>
                </ul>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">🔊 Voice Features</h3>
                <ul className="text-blue-800 space-y-1 text-xs">
                  <li>• Realistic AI-generated voices</li>
                  <li>• Natural conversation flow</li>
                  <li>• Adaptive questioning style</li>
                </ul>
              </div>
            </div>

            {selectedInterviewer && (
              <div className="mt-6">
                <button 
                  onClick={() => setCurrentStep("interview")}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Start Interview →
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-medium text-gray-900 mb-3">Interview Steps</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-medium">✓</div>
                <span className="font-medium text-green-600">Select Question</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-medium">2</div>
                <span className="font-medium text-indigo-600">Choose Interviewer</span>
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
    </motion.div>
  );

  const renderInterviewInterface = () => (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{
        duration: 0.95,
        ease: [0.165, 0.84, 0.44, 1],
      }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-[#1E2B3A] mb-2">
          {selectedQuestion?.title}
        </h1>
        <div className="flex justify-center items-center space-x-4 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Real-time Interview (5:00)</span>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-2">
            <PlayIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-600">Play Question</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interview Setup */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlayIcon className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to start your interview?
              </h2>
              <p className="text-gray-600">
                We'll help you set up your camera and microphone for the best experience.
              </p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={() => setIsInterviewStarted(true)}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <PlayIcon className="w-5 h-5" />
                <span>Start Interview</span>
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                Skip Introduction
              </button>
            </div>
          </div>
        </div>

        {/* AI Interviewer Introduction */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">{selectedInterviewer?.avatar}</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{selectedInterviewer?.name} is introducing the interview</h3>
                <p className="text-sm text-gray-600">Listen to the introduction or skip to start immediately</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                <div className="w-2 h-2 bg-blue-300 rounded-full animate-pulse delay-150"></div>
              </div>
              <p className="text-sm text-gray-600 text-center">
                Audio playing: Interview introduction...
              </p>
            </div>

            <button className="w-full border border-blue-200 text-blue-700 py-2 px-4 rounded-lg font-medium hover:bg-blue-50 transition-colors">
              Skip Introduction
            </button>

            <div className="mt-4 text-xs text-blue-600 text-center">
              The introduction will automatically continue to the interview when finished. Skipping preserves your setup choices.
            </div>
          </div>
        </div>
      </div>

      {/* Video Interview Interface */}
      {isInterviewStarted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gray-800 rounded-xl overflow-hidden"
        >
          <div className="relative aspect-video">
            <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">{selectedInterviewer?.avatar}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{selectedInterviewer?.name}</h3>
                <p className="text-sm text-gray-300">{selectedInterviewer?.title}</p>
              </div>
            </div>

            {/* Timer and Status */}
            <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
              ⏱️ 02:30
            </div>
            <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm flex items-center space-x-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Speaking</span>
            </div>

            {/* User Video (Bottom Right) */}
            <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-600 rounded-lg overflow-hidden">
              <div className="w-full h-full bg-gray-500 flex items-center justify-center">
                <span className="text-white text-xs">You</span>
              </div>
              <div className="absolute bottom-1 left-1 w-4 h-4 bg-red-500 rounded-full"></div>
            </div>

            {/* Back to Interviewer Button */}
            <div className="absolute bottom-4 left-4">
              <button
                onClick={() => setCurrentStep("interviewer")}
                className="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg font-medium hover:bg-opacity-30 transition-colors flex items-center space-x-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>Back to Interviewer</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <Navigation />
      
      <AnimatePresence mode="wait">
        {currentStep === "question" && renderQuestionSelection()}
        {currentStep === "interviewer" && renderInterviewerSelection()}
        {currentStep === "interview" && renderInterviewInterface()}
      </AnimatePresence>
    </div>
  );
}
