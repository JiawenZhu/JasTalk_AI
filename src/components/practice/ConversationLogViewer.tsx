'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon, 
  ClockIcon, 
  UserIcon, 
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  PlayIcon,
  PauseIcon,
  SpeakerWaveIcon,
  CalendarIcon,
  ChartBarIcon,
  TrashIcon,
  ArrowTopRightOnSquareIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';

interface ConversationLog {
  id: string;
  call_id: string;
  agent_id: string;
  agent_name: string;
  candidate_name: string;
  transcript: any[];
  post_call_analysis: any;
  duration_seconds: number;
  created_at: string;
  updated_at: string;
}

interface ConversationLogViewerProps {
  callId?: string;
  onClose?: () => void;
}

export default function ConversationLogViewer({ callId, onClose }: ConversationLogViewerProps) {
  const [logs, setLogs] = useState<ConversationLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<ConversationLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<'loading' | 'available' | 'unavailable'>('loading');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    loadConversationLogs();
  }, [callId]);

  useEffect(() => {
    if (selectedLog) {
      loadAudioUrl(selectedLog.call_id);
    }
  }, [selectedLog]);

  const loadConversationLogs = async () => {
    setIsLoading(true);
    try {
      const url = callId 
        ? `/api/conversation-logs?call_id=${callId}`
        : '/api/conversation-logs?limit=10';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setLogs(data.logs || []);
        if (data.logs && data.logs.length > 0) {
          setSelectedLog(data.logs[0]);
        }
      } else {
        console.error('Error loading conversation logs:', data.error);
      }
    } catch (error) {
      console.error('Error loading conversation logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAudioUrl = async (callId: string) => {
    setAudioStatus('loading');
    try {
      const response = await fetch(`/api/retell-audio?call_id=${callId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.audio_url) {
          setAudioUrl(data.audio_url);
          setAudioStatus('available');
        } else {
          setAudioUrl(null);
          setAudioStatus('unavailable');
        }
      } else {
        setAudioUrl(null);
        setAudioStatus('unavailable');
      }
    } catch (error) {
      console.error('Error loading audio URL:', error);
      setAudioUrl(null);
      setAudioStatus('unavailable');
    }
  };

  const handleLogSelect = async (log: ConversationLog) => {
    setSelectedLog(log);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCallCost = (log: ConversationLog) => {
    // Mock cost calculation - in real implementation, this would come from Retell
    const costPerMinute = 0.1; // $0.10 per minute
    const minutes = log.duration_seconds / 60;
    return (minutes * costPerMinute).toFixed(3);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading conversation logs...</p>
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Conversation Logs</h3>
          <p className="text-gray-600">No interview logs found. Complete a practice interview to see logs here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Interview Logs</h1>
              <p className="text-gray-600">Detailed conversation logs, audio recordings, and analysis from your practice interviews</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Close
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Log List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Interviews</h3>
              </div>
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    onClick={() => handleLogSelect(log)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedLog?.id === log.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {log.agent_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(log.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 flex items-center">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {formatDuration(log.duration_seconds)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Log Details */}
          <div className="lg:col-span-2">
            {selectedLog ? (
              <div className="bg-white rounded-lg shadow">
                {/* Call Header - Matching Screenshot */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900">
                        {formatDate(selectedLog.created_at)} {formatDuration(selectedLog.duration_seconds)} web_call
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>Agent: {selectedLog.agent_name}({selectedLog.agent_id?.substring(0, 8)}...)</span>
                        <span>Version: 0</span>
                        <span>Call ID: {selectedLog.call_id.substring(0, 8)}...</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>Duration: {formatDate(selectedLog.created_at)} - {formatDate(selectedLog.updated_at)}</span>
                        <span>Cost: ${getCallCost(selectedLog)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Audio Player - Matching Screenshot */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-4">
                    {/* Play/Pause Button */}
                    <button
                      onClick={togglePlayPause}
                      disabled={audioStatus !== 'available'}
                      className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isPlaying ? (
                        <PauseIcon className="w-5 h-5" />
                      ) : (
                        <PlayIcon className="w-5 h-5 ml-0.5" />
                      )}
                    </button>

                    {/* Progress Bar */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 w-8">{formatTime(currentTime)}</span>
                        <div className="flex-1 relative">
                          <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            value={currentTime}
                            onChange={handleSeek}
                            className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                            disabled={audioStatus !== 'available'}
                          />
                          <div 
                            className="absolute top-0 left-0 h-1 bg-blue-500 rounded-lg pointer-events-none"
                            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-8">{formatTime(duration)}</span>
                      </div>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center space-x-2">
                      <SpeakerWaveIcon className="w-4 h-4 text-gray-400" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    {/* More Options */}
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <EllipsisVerticalIcon className="w-4 h-4" />
                    </button>

                    {/* Download Button */}
                    <button 
                      className="p-1 text-gray-400 hover:text-gray-600"
                      disabled={audioStatus !== 'available'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Audio Status */}
                  {audioStatus === 'loading' && (
                    <div className="mt-2 text-sm text-gray-500">Loading audio...</div>
                  )}
                  {audioStatus === 'unavailable' && (
                    <div className="mt-2 text-sm text-gray-500">Audio recording not available</div>
                  )}
                </div>

                {/* View In Playground Button */}
                <div className="px-6 py-3 border-b border-gray-200">
                  <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100">
                    <span>View In Playground</span>
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Transcript Section */}
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Conversation Transcript</h3>
                  <div className="space-y-4">
                    {selectedLog.transcript && selectedLog.transcript.length > 0 ? (
                      selectedLog.transcript.map((message: any, index: number) => {
                        const speaker = message.speaker || message.role || 'user';
                        const content = message.content || message.message || message.text || '';
                        const timestamp = message.timestamp || message.time || '';
                        
                        return (
                          <div key={index} className="flex items-start space-x-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {speaker === 'agent' ? selectedLog.agent_name : selectedLog.candidate_name}:
                                </span>
                                {timestamp && (
                                  <span className="text-xs text-gray-500">
                                    {formatTime(parseFloat(timestamp) || 0)}
                                  </span>
                                )}
                              </div>
                              <div className={`p-3 rounded-lg ${
                                speaker === 'agent' 
                                  ? 'bg-gray-50 text-gray-900' 
                                  : 'bg-blue-50 text-gray-900'
                              }`}>
                                <p className="text-sm leading-relaxed">{content}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No transcript available</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hidden Audio Element */}
                {audioUrl && (
                  <audio
                    ref={audioRef}
                    src={audioUrl}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    style={{ display: 'none' }}
                  />
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Conversation</h3>
                <p className="text-gray-600">Choose an interview from the list to view its details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom CSS for slider styling */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
} 
