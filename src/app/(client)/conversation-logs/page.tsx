'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, Play, Calendar, Clock, User, MessageSquare, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import EnhancedAnalysisView from '@/components/interview/EnhancedAnalysisView';

interface ConversationLog {
  id: string;
  callId: string;
  agentName: string;
  candidateName: string;
  summary: string | null;
  detailedSummary: string | null;
  duration: number;
  createdAt: string;
  transcript: any[];
  analysis: any;
  callCost: any;
  metadata: any;
}

interface TranscriptEntry {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

const ConversationLogsPage: React.FC = () => {
  const router = useRouter();
  const [logs, setLogs] = useState<ConversationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ConversationLog | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    fetchConversationLogs();
    
    // Load voices for speech synthesis
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        console.log('Available voices:', voices.map(v => v.name));
      };
      
      speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices(); // Call once in case voices are already loaded
    }
  }, []);

  const fetchConversationLogs = async () => {
    try {
      const response = await fetch('/api/get-conversation-logs');
      const result = await response.json();
      
      if (result.success) {
        setLogs(result.logs);
      } else {
        toast.error('Failed to fetch conversation logs');
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Error loading conversation logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const playTranscriptEntry = async (entry: TranscriptEntry) => {
    if (isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    
    try {
      // Use Web Speech API for text-to-speech playback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(entry.text);
        
        // Configure voice settings
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        // Use different voices for user vs interviewer
        const voices = speechSynthesis.getVoices();
        if (entry.role === 'model') {
          // Use a professional male voice for interviewer if available
          const interviewerVoice = voices.find(voice => 
            voice.name.includes('Alex') || voice.name.includes('Daniel') || voice.name.includes('Microsoft David')
          );
          if (interviewerVoice) utterance.voice = interviewerVoice;
        } else {
          // Use a different voice for user responses
          const userVoice = voices.find(voice => 
            voice.name.includes('Samantha') || voice.name.includes('Microsoft Zira')
          );
          if (userVoice) utterance.voice = userVoice;
        }
        
        utterance.onend = () => {
          setIsPlayingAudio(false);
        };
        
        utterance.onerror = () => {
          setIsPlayingAudio(false);
          toast.error('Failed to play audio');
        };
        
        speechSynthesis.speak(utterance);
        toast.success(`Playing: "${entry.text.substring(0, 50)}..."`);
      } else {
        toast.error('Text-to-speech not supported in this browser');
        setIsPlayingAudio(false);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      toast.error('Failed to play audio');
      setIsPlayingAudio(false);
    }
  };

  const getPerformanceColor = (analysis: any, metadata: any) => {
    // Check if this is a paused interview
    if (metadata?.interviewStatus === 'paused') {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    
    // Check if this is a completed interview with analysis
    if (metadata?.interviewStatus === 'completed' && analysis && analysis.metrics) {
      const avgScore = analysis.metrics.reduce((sum: number, metric: any) => sum + metric.score, 0) / analysis.metrics.length;
      if (avgScore >= 8) return 'bg-green-100 text-green-800 border-green-200';
      if (avgScore >= 6) return 'bg-blue-100 text-blue-800 border-blue-200';
      if (avgScore >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    // Check if this is a completed interview without analysis
    if (metadata?.interviewStatus === 'completed' && (!analysis || !analysis.metrics)) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    
    // Backward compatibility: For older logs without interviewStatus
    if (!metadata?.interviewStatus) {
      // If there's analysis data, assume it was completed successfully
      if (analysis && analysis.metrics) {
        const avgScore = analysis.metrics.reduce((sum: number, metric: any) => sum + metric.score, 0) / analysis.metrics.length;
        if (avgScore >= 8) return 'bg-green-100 text-green-800 border-green-200';
        if (avgScore >= 6) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (avgScore >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-red-100 text-red-800 border-red-200';
      }
      // If no analysis, assume it was completed but analysis failed
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    
    // Fallback for unknown status
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPerformanceText = (analysis: any, metadata: any) => {
    // Check if this is a paused interview
    if (metadata?.interviewStatus === 'paused') {
      return 'Paused';
    }
    
    // Check if this is a completed interview with analysis
    if (metadata?.interviewStatus === 'completed' && analysis && analysis.metrics) {
      const avgScore = analysis.metrics.reduce((sum: number, metric: any) => sum + metric.score, 0) / analysis.metrics.length;
      if (avgScore >= 8) return 'Excellent';
      if (avgScore >= 6) return 'Good';
      if (avgScore >= 4) return 'Fair';
      return 'Needs Improvement';
    }
    
    // Check if this is a completed interview without analysis
    if (metadata?.interviewStatus === 'completed' && (!analysis || !analysis.metrics)) {
      return 'Completed - No Analysis';
    }
    
    // Backward compatibility: For older logs without interviewStatus
    if (!metadata?.interviewStatus) {
      // If there's analysis data, show the performance rating
      if (analysis && analysis.metrics) {
        const avgScore = analysis.metrics.reduce((sum: number, metric: any) => sum + metric.score, 0) / analysis.metrics.length;
        if (avgScore >= 8) return 'Excellent';
        if (avgScore >= 6) return 'Good';
        if (avgScore >= 4) return 'Fair';
        return 'Needs Improvement';
      }
      // If no analysis, show "No Analysis" instead of "Unknown"
      return 'No Analysis';
    }
    
    // Fallback for unknown status
    return 'Unknown Status';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading conversation logs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button onClick={() => router.push('/dashboard')} variant="ghost" className="mr-4">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Conversation Logs</h1>
        </div>
        
        {/* Status Legend */}
        <div className="flex items-center space-x-4 text-sm">
          <span className="font-medium text-gray-700">Status:</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div>
            <span className="text-orange-800">Paused</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span className="text-green-800">With Analysis</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
            <span className="text-purple-800">No Analysis</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {showAnalysis && selectedLog ? (
          <motion.div
            key="analysis-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <EnhancedAnalysisView 
              log={selectedLog} 
              onBack={() => {
                setShowAnalysis(false);
                setSelectedLog(null);
              }}
            />
          </motion.div>
        ) : selectedLog ? (
          <motion.div
            key="detailed-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold">
                      Interview with {selectedLog.agentName}
                    </CardTitle>
                    <p className="text-gray-600">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  <div className="flex space-x-2">
                    {selectedLog.analysis && (
                      <Button 
                        variant="default" 
                        onClick={() => setShowAnalysis(true)}
                        className="flex items-center space-x-2"
                      >
                        <BarChart3 className="w-4 h-4" />
                        <span>View Analysis</span>
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => setSelectedLog(null)}>
                      Back to List
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Interview Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    <span className="text-sm">Duration: {formatDuration(selectedLog.duration)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-gray-500" />
                    <span className="text-sm">Exchanges: {selectedLog.transcript?.length || 0}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getPerformanceColor(selectedLog.analysis, selectedLog.metadata)} border`}>
                      {getPerformanceText(selectedLog.analysis, selectedLog.metadata)}
                    </Badge>
                  </div>
                </div>

                {/* Performance Summary */}
                {selectedLog.analysis?.summary && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Performance Summary</h3>
                    <p className="text-gray-700 leading-relaxed">{selectedLog.analysis.summary}</p>
                  </div>
                )}

                {/* Conversation Transcript */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Conversation Transcript</h3>
                  {/* Debug info */}
                  {selectedLog.transcript?.length === 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                      <p className="text-yellow-800">No transcript entries found. This might be from an older interview format.</p>
                    </div>
                  )}
                  {selectedLog.transcript && selectedLog.transcript.filter((entry: TranscriptEntry) => entry.role === 'model').length === 0 && selectedLog.transcript.length > 0 && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                      <p className="text-blue-800">Only user responses found. AI responses may not have been logged properly in this interview.</p>
                    </div>
                  )}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedLog.transcript?.map((entry: TranscriptEntry, index: number) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg flex items-start gap-3 ${
                          entry.role === 'model' ? 'bg-gray-100' : 'bg-indigo-50'
                        }`}
                      >
                        <div className="flex-shrink-0 w-20">
                          <p className={`font-bold text-sm ${
                            entry.role === 'model' ? 'text-gray-900' : 'text-indigo-900'
                          }`}>
                            {entry.role === 'model' ? 'Interviewer' : 'You'}:
                          </p>
                        </div>
                        <div className="flex-grow">
                          <p className={`${
                            entry.role === 'model' ? 'text-gray-900' : 'text-indigo-900'
                          }`}>
                            {entry.text}
                          </p>
                          {entry.timestamp && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(entry.timestamp).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playTranscriptEntry(entry)}
                          disabled={isPlayingAudio}
                          className="flex-shrink-0"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {logs.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Conversation Logs</h3>
                  <p className="text-gray-600 mb-6">You haven't completed any interviews yet.</p>
                  <Button onClick={() => router.push('/practice/new')}>
                    Start Your First Interview
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    className="cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-grow">
                            <div className="flex items-center space-x-4 mb-2">
                              <h3 className="text-lg font-semibold">
                                Interview with {log.agentName}
                              </h3>
                              <Badge className={`${getPerformanceColor(log.analysis, log.metadata)} border`}>
                                {getPerformanceText(log.analysis, log.metadata)}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(log.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatDuration(log.duration)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MessageSquare className="w-4 h-4" />
                                <span>{log.transcript?.length || 0} exchanges</span>
                              </div>
                            </div>
                            
                            {log.summary && (
                              <p className="text-gray-700 text-sm mt-2 line-clamp-2">
                                {log.summary}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0 ml-4">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConversationLogsPage;
