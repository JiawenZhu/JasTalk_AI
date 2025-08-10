"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
    totalSessions: 0,
    averageScore: 0,
    bestInterviewType: 'None',
    improvementRate: 0,
    totalQuestions: 0,
    completedSessions: 0
  });

  const [skillsData, setSkillsData] = useState<SkillData[]>([]);
  const [sessionsData, setSessionsData] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, router]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoading(true);
        
        // Fetch practice sessions
        const response = await fetch('/api/practice-sessions');
        
        if (response.ok) {
          const data = await response.json();
          const sessions = data.sessions || [];
          
          // Filter only completed sessions and transform data
          const completedSessions = sessions.filter((session: any) => session.status === 'completed');
          const transformedSessions: SessionData[] = completedSessions.map((session: any) => ({
            id: session.id,
            title: session.session_name,
            type: session.agent_name ? `${session.agent_name} Interview` : 'Practice Interview',
            score: session.score || 0,
            date: session.created_at,
            questionCount: session.total_questions || 0
          }));
          
          setSessionsData(transformedSessions);
          
          // Calculate performance data
          if (transformedSessions.length > 0) {
            const totalSessions = transformedSessions.length;
            const completedSessions = transformedSessions.filter(s => s.score > 0).length;
            const averageScore = Math.round(
              transformedSessions.reduce((sum, s) => sum + s.score, 0) / totalSessions
            );
            const totalQuestions = transformedSessions.reduce((sum, s) => sum + s.questionCount, 0);
            
            // Find best interview type
            const typeScores = transformedSessions.reduce((acc, session) => {
              const type = session.type;
              if (!acc[type]) acc[type] = { total: 0, count: 0 };
              acc[type].total += session.score;
              acc[type].count += 1;
              return acc;
            }, {} as Record<string, { total: number; count: number }>);
            
            const bestType = Object.entries(typeScores)
              .map(([type, data]) => ({ type, avg: data.total / data.count }))
              .sort((a, b) => b.avg - a.avg)[0]?.type || 'None';
            
            setPerformanceData({
              totalSessions,
              averageScore,
              bestInterviewType: bestType,
              improvementRate: 0, // Would need historical data to calculate
              totalQuestions,
              completedSessions
            });
            
            // Generate skills data based on session types
            const skillsMap = new Map<string, { scores: number[], trend: 'up' | 'down' | 'stable' }>();
            
            transformedSessions.forEach(session => {
              const skillName = session.type.replace(' Interview', '');
              if (!skillsMap.has(skillName)) {
                skillsMap.set(skillName, { scores: [], trend: 'stable' });
              }
              skillsMap.get(skillName)!.scores.push(session.score);
            });
            
            const skills: SkillData[] = Array.from(skillsMap.entries()).map(([name, data]) => {
              const avgScore = Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length);
              const recentScores = data.scores.slice(-3);
              const olderScores = data.scores.slice(0, -3);
              
              let trend: 'up' | 'down' | 'stable' = 'stable';
              let improvement = 0;
              
              if (recentScores.length > 0 && olderScores.length > 0) {
                const recentAvg = recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length;
                const olderAvg = olderScores.reduce((sum, score) => sum + score, 0) / olderScores.length;
                improvement = Math.round(recentAvg - olderAvg);
                trend = improvement > 0 ? 'up' : improvement < 0 ? 'down' : 'stable';
              }
              
              return {
                name,
                score: avgScore,
                trend,
                improvement
              };
            });
            
            setSkillsData(skills);
          } else {
            // Show empty state
            setPerformanceData({
              totalSessions: 0,
              averageScore: 0,
              bestInterviewType: 'None',
              improvementRate: 0,
              totalQuestions: 0,
              completedSessions: 0
            });
            setSkillsData([]);
          }
        } else {
          console.error('Failed to fetch analytics data');
          // Show empty state
          setSessionsData([]);
          setSkillsData([]);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
        // Show empty state
        setSessionsData([]);
        setSkillsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [isAuthenticated]);

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
            {loading ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading analytics...</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading skills data...</p>
              </div>
            ) : skillsData.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
                <StarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No skills data available</p>
                <p className="text-gray-400 text-xs mt-1">Complete some practice sessions to see your skills analysis</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading sessions data...</p>
              </div>
            ) : sessionsData.length === 0 ? (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
                <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No practice sessions yet</p>
                <p className="text-gray-400 text-xs mt-1">Start your first interview practice to see your progress</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 
