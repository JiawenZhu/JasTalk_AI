'use client';

import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Download, Share2, RotateCcw, Home, MessageCircle } from 'lucide-react';

// Chart.js imports
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface PerformanceMetric {
  category: string;
  score: number;
  notes: string;
}

interface PerformanceAnalysisData {
  summary: string;
  metrics: PerformanceMetric[];
}

interface ConversationLogEntry {
  role: 'user' | 'model';
  text: string;
  audio?: string;
  type?: 'pcm' | 'webm';
  timestamp: Date;
}

interface SessionUsage {
  inputTokens: number;
  outputTokens: number;
  ttsCharacters: number;
  duration: number; // in minutes
}

interface PerformanceAnalysisProps {
  analysisData: PerformanceAnalysisData;
  conversationLog: ConversationLogEntry[];
  sessionUsage: SessionUsage;
  onNewInterview: () => void;
  onShareResults: () => void;
  onGoHome?: () => void;
  onAskQuestions?: () => void;
  onSendEmail?: () => void;
}

const PerformanceAnalysis: React.FC<PerformanceAnalysisProps> = ({
  analysisData,
  conversationLog,
  sessionUsage,
  onNewInterview,
  onShareResults,
  onGoHome,
  onAskQuestions,
  onSendEmail,
}) => {
  const [showLog, setShowLog] = React.useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);

  // Prepare radar chart data
  const radarData = {
    labels: analysisData.metrics.map(m => m.category),
    datasets: [
      {
        label: 'Performance Score',
        data: analysisData.metrics.map(m => m.score),
        fill: true,
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        borderColor: 'rgb(79, 70, 229)',
        pointBackgroundColor: 'rgb(79, 70, 229)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(79, 70, 229)',
        pointRadius: 6,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        pointLabels: {
          font: {
            size: 14,
            weight: 'bold' as const,
          },
          color: '#374151',
        },
        suggestedMin: 0,
        suggestedMax: 10,
        ticks: {
          stepSize: 2,
          color: '#6B7280',
          backdropColor: 'transparent',
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function(context: any) {
            return `Score: ${context.parsed.r.toFixed(1)}/10`;
          },
        },
      },
    },
  };

  // Calculate pricing estimates
  const calculateCosts = () => {
    const PRICING = {
      flash_input: 0.075 / 1000000, // $ per token
      flash_output: 0.30 / 1000000, // $ per token
      tts_chars: 16 / 1000000, // $ per character
    };

    const chatCost = (sessionUsage.inputTokens * PRICING.flash_input) + (sessionUsage.outputTokens * PRICING.flash_output);
    const ttsCost = sessionUsage.ttsCharacters * PRICING.tts_chars;
    const totalCost = chatCost + ttsCost;

    return { chatCost, ttsCost, totalCost };
  };

  const { chatCost, ttsCost, totalCost } = calculateCosts();

  // Play audio from conversation log
  const playAudio = async (audioData: string, type: 'pcm' | 'webm' = 'pcm') => {
    if (isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: type === 'pcm' ? 24000 : 48000
      });
      
      const binaryData = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
      let audioBuffer;

      if (type === 'webm') {
        audioBuffer = await audioContext.decodeAudioData(binaryData.buffer);
      } else {
        // PCM processing
        if (binaryData.byteLength % 2 !== 0) {
          console.error("PCM data has an odd byte length");
          return;
        }
        const pcm16 = new Int16Array(binaryData.buffer);
        audioBuffer = audioContext.createBuffer(1, pcm16.length, 24000);
        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < pcm16.length; i++) {
          channelData[i] = pcm16[i] / 32768.0;
        }
      }

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
      
      source.onended = () => setIsPlayingAudio(false);
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlayingAudio(false);
    }
  };

  // Get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    if (score >= 4) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getOverallRating = () => {
    const avgScore = analysisData.metrics.reduce((sum, m) => sum + m.score, 0) / analysisData.metrics.length;
    if (avgScore >= 8) return { text: 'Excellent', color: 'text-green-600', emoji: '🎉' };
    if (avgScore >= 6) return { text: 'Good', color: 'text-blue-600', emoji: '👍' };
    if (avgScore >= 4) return { text: 'Fair', color: 'text-yellow-600', emoji: '📈' };
    return { text: 'Needs Improvement', color: 'text-red-600', emoji: '💪' };
  };

  const overallRating = getOverallRating();

  if (showLog) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Interview Log</h2>
          <Button variant="outline" onClick={() => setShowLog(false)}>
            Back to Analysis
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {conversationLog.map((entry, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg flex items-start gap-3 ${
                    entry.role === 'model' ? 'bg-gray-100' : 'bg-indigo-50'
                  }`}
                >
                  <div className="flex-shrink-0 w-24">
                    <p className={`font-bold ${
                      entry.role === 'model' ? 'text-gray-900' : 'text-indigo-900'
                    }`}>
                      {entry.role === 'model' ? 'Interviewer' : 'You'}:
                    </p>
                  </div>
                  <div className="flex-grow">
                    <p className={entry.role === 'model' ? 'text-gray-900' : 'text-indigo-900'}>
                      {entry.text}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {entry.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {entry.audio && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playAudio(entry.audio!, entry.type)}
                      disabled={isPlayingAudio}
                      className="flex-shrink-0"
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Overall Score */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">{overallRating.emoji}</span>
            <h2 className="text-3xl font-bold text-gray-900">Interview Complete!</h2>
          </div>
          <p className={`text-xl font-semibold ${overallRating.color}`}>
            Overall Performance: {overallRating.text}
          </p>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{analysisData.summary}</p>
        </CardContent>
      </Card>

      {/* Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Performance Radar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <div className="w-full max-w-lg">
              <Radar data={radarData} options={radarOptions} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Detailed Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left border font-semibold text-gray-700">Category</th>
                  <th className="p-3 text-center border font-semibold text-gray-700">Score</th>
                  <th className="p-3 text-left border font-semibold text-gray-700">Notes</th>
                </tr>
              </thead>
              <tbody>
                {analysisData.metrics.map((metric, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-3 border font-medium text-gray-900">
                      {metric.category}
                    </td>
                    <td className="p-3 border text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(metric.score)}`}>
                        {metric.score.toFixed(1)}/10
                      </span>
                    </td>
                    <td className="p-3 border text-gray-700">
                      {metric.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Session Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-800">Session Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">Interview Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{sessionUsage.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Exchanges:</span>
                  <span className="font-medium">{conversationLog.length}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">API Usage</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Input Tokens:</span>
                  <span className="font-medium">{sessionUsage.inputTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Output Tokens:</span>
                  <span className="font-medium">{sessionUsage.outputTokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">TTS Characters:</span>
                  <span className="font-medium">{sessionUsage.ttsCharacters.toLocaleString()}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-medium">
                  <span className="text-gray-700">Estimated Cost:</span>
                  <span className="text-gray-900">${totalCost.toFixed(5)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Email Summary Button - Prominent placement */}
        {onSendEmail && (
          <Button 
            onClick={onSendEmail} 
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200" 
            size="lg"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Summary to Email
          </Button>
        )}
        
        <Button onClick={onNewInterview} className="flex-1" size="lg">
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Another Interview
        </Button>
        <Button variant="outline" onClick={() => setShowLog(true)} className="flex-1" size="lg">
          View Interview Log
        </Button>
        {onAskQuestions && (
          <Button variant="outline" onClick={onAskQuestions} className="flex-1" size="lg">
            <MessageCircle className="w-4 h-4 mr-2" />
            Ask Questions
          </Button>
        )}
        {onGoHome && (
          <Button variant="outline" onClick={onGoHome} className="flex-1" size="lg">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        )}
        <Button variant="outline" onClick={onShareResults} size="lg">
          <Share2 className="w-4 h-4 mr-2" />
          Share Results
        </Button>
      </div>
    </div>
  );
};

export default PerformanceAnalysis;
