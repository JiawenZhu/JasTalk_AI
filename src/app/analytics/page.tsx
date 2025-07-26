"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

export const dynamic = 'force-dynamic';
import { 
  ArrowLeftIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth.context";

interface PerformanceData {
  totalSessions: number;
  averageScore: number;
  bestInterviewType: string;
  improvementRate: number;
  totalQuestions: number;
  completedSessions: number;
}

interface SkillData {
  name: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  improvement: number;
}

interface SessionData {
  id: string;
  title: string;
  type: string;
  score: number;
  date: string;
  questionCount: number;
}

export default function AnalyticsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'sessions'>('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    totalSessions: 12,
    averageScore: 78,
    bestInterviewType: 'Technical',
    improvementRate: 15,
    totalQuestions: 120,
    completedSessions: 10
  });

  const [skillsData, setSkillsData] = useState<SkillData[]>([
    { name: 'Problem Solving', score: 85, trend: 'up', improvement: 12 },
    { name: 'Communication', score: 72, trend: 'up', improvement: 8 },
    { name: 'Technical Knowledge', score: 88, trend: 'up', improvement: 15 },
    { name: 'System Design', score: 65, trend: 'down', improvement: -5 },
    { name: 'Behavioral', score: 79, trend: 'stable', improvement: 2 },
    { name: 'Coding', score: 82, trend: 'up', improvement: 10 }
  ]);

  const [sessionsData, setSessionsData] = useState<SessionData[]>([
    { id: '1', title: 'Software Engineer - Google', type: 'Technical', score: 85, date: '2024-01-15', questionCount: 10 },
    { id: '2', title: 'Product Manager - Meta', type: 'Behavioral', score: 78, date: '2024-01-14', questionCount: 8 },
    { id: '3', title: 'Data Scientist - Amazon', type: 'Technical', score: 82, date: '2024-01-12', questionCount: 12 },
    { id: '4', title: 'Frontend Developer - Netflix', type: 'Coding', score: 75, date: '2024-01-10', questionCount: 6 },
    { id: '5', title: 'Backend Engineer - Uber', type: 'System Design', score: 68, date: '2024-01-08', questionCount: 5 }
  ]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, router]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" />;
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />;
      default:
        return <div className="w-4 h-4"></div>;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Analytics</h1>
          <div className="w-9"></div> {/* Spacer */}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="flex">
          {[
            { id: 'overview', label: 'Overview', icon: ChartBarIcon },
            { id: 'skills', label: 'Skills', icon: StarIcon },
            { id: 'sessions', label: 'Sessions', icon: ClockIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5 mx-auto mb-1" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Time Range Selector */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex space-x-2">
                {['week', 'month', 'year'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range as any)}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                      timeRange === range
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Total Sessions</span>
                  <ChartBarIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{performanceData.totalSessions}</div>
                <div className="text-xs text-green-600 mt-1">+3 this month</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Average Score</span>
                  <StarIcon className="w-5 h-5 text-yellow-600" />
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(performanceData.averageScore)}`}>
                  {performanceData.averageScore}%
                </div>
                <div className="text-xs text-green-600 mt-1">+{performanceData.improvementRate}% improvement</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Best Type</span>
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-lg font-semibold text-gray-900">{performanceData.bestInterviewType}</div>
                <div className="text-xs text-gray-500 mt-1">Your strongest area</div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Questions</span>
                  <ClockIcon className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{performanceData.totalQuestions}</div>
                <div className="text-xs text-gray-500 mt-1">Total answered</div>
              </div>
            </div>

            {/* Progress Chart */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Score Trend</h3>
              <div className="space-y-3">
                {[85, 78, 82, 75, 68, 72, 79, 85, 88, 82, 85, 90].map((score, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500 w-8">W{index + 1}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${score}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-medium ${getScoreColor(score)}`}>
                      {score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            {skillsData.map((skill, index) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(skill.trend)}
                    <span className={`text-sm font-medium ${getTrendColor(skill.trend)}`}>
                      {skill.improvement > 0 ? '+' : ''}{skill.improvement}%
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Current Score</span>
                    <span className={`font-semibold ${getScoreColor(skill.score)}`}>
                      {skill.score}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        skill.score >= 80 ? 'bg-green-500' : skill.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${skill.score}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Grade: {getScoreGrade(skill.score)}</span>
                    <span>{skill.score}/100</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {sessionsData.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {session.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {session.type} • {session.questionCount} questions
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(session.date).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className={`text-lg font-bold ${getScoreColor(session.score)}`}>
                      {session.score}%
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      session.score >= 80 ? 'bg-green-100 text-green-600' :
                      session.score >= 60 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {getScoreGrade(session.score)}
                    </div>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      session.score >= 80 ? 'bg-green-500' : session.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${session.score}%` }}
                  ></div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
