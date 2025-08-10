'use client';

import '../../globals.css';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, PlayIcon, PauseIcon, SpeakerWaveIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

interface QuestionAnswer {
  id: string;
  question: string;
  answer: string;
  audioUrl: string | null;
  duration: number;
  timestamp: string;
  category: string;
  difficulty: string;
  agentName?: string;
  callId?: string;
  callDuration?: number;
  questionTimestamp?: string;
  answerTimestamp?: string;
  sessionName?: string;
  score?: number;
  practiceSessionId?: string;
}

export default function ViewLogsPage() {
  const router = useRouter();
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  // Unified call-level audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<'ready' | 'processing' | 'not_ready' | 'mock_mode' | 'not_found' | 'unauthorized' | 'error' | null>(null);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [activeTranscriptIndex, setActiveTranscriptIndex] = useState<number>(-1);
  const [headerMeta, setHeaderMeta] = useState<{ agent?: string; duration?: number | null; cost?: number | null; createdAt?: string } | null>(null);
  const [transcript, setTranscript] = useState<{ speaker: string; text: string; ts_sec: number }[]>([]);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Mock data - in real app, this would be fetched from API
  const mockQuestionAnswers: QuestionAnswer[] = [
    {
      id: '1',
      question: 'How would you approach conducting usability tests for a web application?',
      answer: 'Based on the previous conversation, you would approach conducting usability tests by recruiting users who represent your target audience, setting up specific tasks for them to complete, observing their interactions with the web application, and gathering feedback from them. You would then use this feedback to identify issues, prioritize improvements, and iteratively refine the design to improve the user experience.',
      audioUrl: '/audio/sample-response-1.mp3',
      duration: 22,
      timestamp: '2024-01-15T10:30:00Z',
      category: 'UX Design',
      difficulty: 'medium'
    },
    {
      id: '2',
      question: 'How do you translate designs from Figma to code?',
      answer: 'Based on the conversation, you would translate designs from Figma using the built-in tools to generate initial HTML code. Then, you would use tools like VS Code or other editors to make improvements, refine the code, and ensure the final design matches the Figma specifications while optimizing for performance and accessibility.',
      audioUrl: '/audio/sample-response-2.mp3',
      duration: 36,
      timestamp: '2024-01-15T10:35:00Z',
      category: 'Frontend Development',
      difficulty: 'medium'
    },
    {
      id: '3',
      question: 'What are the key principles of responsive design?',
      answer: 'The key principles of responsive design include using flexible grid layouts, implementing media queries to adapt to different screen sizes, optimizing images and media for various devices, ensuring touch-friendly interfaces for mobile devices, and maintaining consistent user experience across all platforms.',
      audioUrl: '/audio/sample-response-3.mp3',
      duration: 17,
      timestamp: '2024-01-15T10:40:00Z',
      category: 'Web Development',
      difficulty: 'easy'
    },
    {
      id: '4',
      question: 'How would you optimize a website for performance?',
      answer: 'To optimize a website for performance, I would implement several strategies including minifying CSS and JavaScript files, optimizing images and using appropriate formats, implementing lazy loading for images and content, utilizing CDNs for faster content delivery, enabling browser caching, and monitoring performance metrics using tools like Google PageSpeed Insights.',
      audioUrl: '/audio/sample-response-4.mp3',
      duration: 27,
      timestamp: '2024-01-15T10:45:00Z',
      category: 'Performance',
      difficulty: 'hard'
    }
  ];

  useEffect(() => {
    // Fetch question answers from API (and call-level meta)
    const fetchQuestionAnswers = async () => {
      try {
        setLoading(true);
        
        // First try to get specific call data
        const specificCallResponse = await fetch('/api/retell-call-data?call_id=call_d22f2f4813f15985d6d4d557ac4&agent_id=agent_9e08fe6af4631b5ee94f7f036f');
        
        if (specificCallResponse.ok) {
          const specificData = await specificCallResponse.json();

          // Header meta & audio
          setAudioUrl(specificData.audio_url || null);
          setAudioStatus(specificData.audioData?.status || (specificData.audio_url ? 'ready' : null));
          setCurrentCallId(specificData?.conversationLog?.call_id || null);
          setHeaderMeta({
            agent: specificData.agent_name,
            duration: specificData.duration_seconds ?? null,
            cost: specificData.cost_usd ?? null,
            createdAt: specificData.created_at,
          });
          // Prefer timeline from /api/retell-audio when available; otherwise use conversationLog transcript mapping
          const timeline = Array.isArray(specificData.audioData?.transcript_timeline)
            ? specificData.audioData.transcript_timeline
            : (Array.isArray(specificData.transcript) ? specificData.transcript : []);
          setTranscript(timeline);

          if (specificData.questionAnswers && specificData.questionAnswers.length > 0) {
            setQuestionAnswers(specificData.questionAnswers);
            return;
          }
        }
        
        // Fallback to general question answers API
        const response = await fetch('/api/question-answers');
        
        if (!response.ok) {
          throw new Error('Failed to fetch question answers');
        }
        
        const data = await response.json();
        setQuestionAnswers(data.questionAnswers || []);
      } catch (error) {
        console.error('Error fetching question answers:', error);
        // Fallback to mock data for development
        setQuestionAnswers(mockQuestionAnswers);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionAnswers();
  }, []);

  // Unified audio listeners
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onLoaded = () => setAudioDuration(el.duration || 0);
    const onUpdate = () => {
      setAudioProgress(el.currentTime || 0);
      // update active transcript line
      if (transcript.length > 0) {
        let i = transcript.findIndex((t, idx) => {
          const next = transcript[idx + 1];
          return el.currentTime >= t.ts_sec && (!next || el.currentTime < next.ts_sec);
        });
        if (i < 0) i = transcript.length - 1;
        setActiveTranscriptIndex(i);
      }
    };
    const onEnded = () => setActiveTranscriptIndex(-1);
    el.addEventListener('loadedmetadata', onLoaded);
    el.addEventListener('timeupdate', onUpdate);
    el.addEventListener('ended', onEnded);
    return () => {
      el.removeEventListener('loadedmetadata', onLoaded);
      el.removeEventListener('timeupdate', onUpdate);
      el.removeEventListener('ended', onEnded);
    };
  }, [transcript]);

  const handleSeekTo = (seconds: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, Math.min(seconds, audioDuration || seconds));
    el.play().catch(() => undefined);
  };

  const handleRefreshAudio = async () => {
    if (!currentCallId) return;
    try {
      const res = await fetch(`/api/retell-audio?call_id=${currentCallId}`);
      if (!res.ok) return;
      const data = await res.json();
      setAudioUrl(data.audio_url || null);
      setAudioStatus(data.status || (data.audio_url ? 'ready' : null));
      if (Array.isArray(data.transcript_timeline)) {
        setTranscript(data.transcript_timeline);
      }
      if (typeof data.duration === 'number') {
        setHeaderMeta((prev) => ({ ...(prev || {}), duration: data.duration }));
      }
    } catch {}
  };

  // Auto-poll while processing until audio becomes available
  useEffect(() => {
    if (audioStatus !== 'processing' || !currentCallId) {
      setIsPolling(false);
      return;
    }
    setIsPolling(true);
    const interval = setInterval(() => {
      handleRefreshAudio();
    }, 7000);
    return () => clearInterval(interval);
  }, [audioStatus, currentCallId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBack = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading your interview logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <button
              onClick={handleBack}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="ml-6">
              <h1 className="text-xl font-semibold text-white">Interview Logs</h1>
              <p className="text-sm text-gray-400">Your practice interview responses</p>
            </div>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/create-test-conversation', {
                    method: 'POST'
                  });
                  if (response.ok) {
                    toast({
                      title: "Test Data Created",
                      description: "Test conversation log has been created successfully.",
                    });
                    // Refresh the page to show new data
                    window.location.reload();
                  }
                } catch (error) {
                  console.error('Error creating test data:', error);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Create Test Data
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Top unified audio and meta */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white">{headerMeta?.agent || 'Interviewer'}</h2>
                <p className="text-sm text-gray-400">
                  Duration: {headerMeta?.duration ? formatTime(Math.round(headerMeta.duration)) : '--'}
                  {typeof headerMeta?.cost === 'number' ? ` • Cost: $${headerMeta.cost.toFixed(3)}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshAudio}
                  className="px-3 py-2 bg-gray-700 text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-600"
                >
                  Refresh Audio
                </button>
                {audioUrl && (
                  <button
                    onClick={() => audioRef.current?.play()}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Play
                  </button>
                )}
              </div>
            </div>
            {audioUrl ? (
              <div className="bg-gray-700 rounded-lg p-3">
                <audio ref={audioRef} controls preload="metadata">
                  {/* WAV (Retell default) */}
                  <source src={audioUrl} type="audio/wav" />
                  {/* Fallback MP3 if provided */}
                  <source src={audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                  <span>{formatTime(Math.floor(audioProgress))}</span>
                  <span>{formatTime(Math.floor(audioDuration || 0))}</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-1">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: audioDuration ? `${(audioProgress / audioDuration) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                {audioStatus === 'processing' && 'Audio is processing. Check back in a few minutes.'}
                {audioStatus === 'not_ready' && 'Call not finished yet.'}
                {audioStatus === 'mock_mode' && 'Running in mock mode - audio will be available with a valid Retell API key.'}
                {audioStatus === 'not_found' && 'Audio not found for this call.'}
                {audioStatus === 'unauthorized' && 'Audio unavailable due to API key issues.'}
                {!audioStatus && 'No audio available for this call.'}
              </div>
            )}
          </div>
          {/* Group questions by session */}
          {(() => {
            const sessions = questionAnswers.reduce((acc, qa) => {
              const sessionId = qa.practiceSessionId || 'unknown';
              if (!acc[sessionId]) {
                acc[sessionId] = {
                  sessionName: qa.sessionName || 'Practice Session',
                  agentName: qa.agentName || 'Interviewer',
                  score: qa.score,
                  timestamp: qa.timestamp,
                  questions: []
                };
              }
              acc[sessionId].questions.push(qa);
              return acc;
            }, {} as Record<string, any>);

            return Object.entries(sessions).map(([sessionId, session]) => (
              <motion.div key={sessionId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-800 rounded-lg border border-gray-700">
                {/* Session Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{session.sessionName}</h2>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-sm text-gray-400">Agent: {session.agentName}</span>
                        {session.score && (
                          <span className="text-sm text-green-400">Score: {session.score}%</span>
                        )}
                        <span className="text-sm text-gray-400">{formatTimestamp(session.timestamp)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-400">{session.questions.length} questions</span>
                    </div>
                  </div>
                </div>
                
                {/* Questions */}
                <div className="p-6 space-y-6">
                  {session.questions.map((qa: QuestionAnswer, index: number) => (
                    <div key={qa.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      {/* Transcript segment controls */}
                      {audioUrl && (
                        <div className="mb-3">
                          <button
                            onClick={() => qa.questionTimestamp ? handleSeekTo(Number(qa.questionTimestamp)) : undefined}
                            disabled={!qa.questionTimestamp}
                            className="inline-flex items-center px-3 py-1.5 bg-gray-600 text-white rounded-md text-xs mr-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-500"
                          >
                            <PlayIcon className="w-4 h-4 mr-1" /> Play from question start
                          </button>
                          <button
                            onClick={() => handleSeekTo(Number(qa.answerTimestamp ? Number(qa.answerTimestamp) : 0))}
                            className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700"
                          >
                            <PlayIcon className="w-4 h-4 mr-1" /> Play from answer
                          </button>
                        </div>
                      )}
                      
                      {/* Question and Answer */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{qa.category}</span>
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">{qa.difficulty}</span>
                            <span className="text-xs text-gray-400">Q{index + 1}</span>
                          </div>
                          <h3 className="text-base font-medium text-white mb-2">{qa.question}</h3>
                        </div>
                        <div className="bg-gray-600 rounded-lg p-3">
                          <p className="text-gray-300 leading-relaxed text-sm">{qa.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ));
          })()}

          {/* Full transcript list with click-to-seek */}
          {transcript.length > 0 && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <h3 className="text-white font-semibold mb-4">Transcription</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transcript.map((t, i) => (
                  <div
                    key={`${t.ts_sec}-${i}`}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      i === activeTranscriptIndex ? 'bg-gray-700' : 'bg-gray-750 hover:bg-gray-700'
                    }`}
                    onClick={() => handleSeekTo(Number(t.ts_sec || 0))}
                  >
                    <div className="text-xs text-gray-400 mb-1">
                      {formatTime(Math.floor(Number(t.ts_sec || 0)))} • {t.speaker === 'user' ? 'You' : 'Agent'}
                    </div>
                    <div className="text-sm text-gray-200">{t.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {questionAnswers.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <SpeakerWaveIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Interview Logs Yet</h3>
            <p className="text-gray-400 mb-6">
              Complete some practice interviews to see your responses here.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/practice/new')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 mr-3"
              >
                Start Practice Interview
              </button>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/create-test-conversation', {
                      method: 'POST'
                    });
                    if (response.ok) {
                      toast({
                        title: "Test Data Created",
                        description: "Test conversation log has been created successfully.",
                      });
                      // Refresh the page to show new data
                      window.location.reload();
                    }
                  } catch (error) {
                    console.error('Error creating test data:', error);
                  }
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
              >
                Create Test Data
              </button>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Loading Interview Logs</h3>
            <p className="text-gray-400">
              Please wait while we fetch your interview data...
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 
