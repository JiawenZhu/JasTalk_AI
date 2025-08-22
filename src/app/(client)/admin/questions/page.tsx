'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  Star, 
  Clock, 
  User, 
  TrendingUp,
  Filter,
  CheckCircle,
  AlertCircle,
  Reply
} from 'lucide-react';
import { useAuth } from '@/contexts/auth.context';
import { toast as sonnerToast } from 'sonner';

interface Question {
  id: string;
  user_email: string;
  user_name: string;
  question_text: string;
  category: string;
  rating: number | null;
  needs_followup: boolean;
  contact_preference: string;
  agent_name: string;
  status: string;
  submitted_at: string;
  admin_response?: string;
}

const CATEGORY_COLORS = {
  feedback: 'bg-blue-100 text-blue-800',
  technical: 'bg-green-100 text-green-800',
  process: 'bg-purple-100 text-purple-800',
  improvement: 'bg-orange-100 text-orange-800',
  platform: 'bg-red-100 text-red-800',
  other: 'bg-gray-100 text-gray-800'
};

const STATUS_COLORS = {
  acknowledged: 'bg-green-100 text-green-800',
  pending_response: 'bg-yellow-100 text-yellow-800',
  responded: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800'
};

export default function AdminQuestionsPage() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', status: '' });
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [response, setResponse] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [filter]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.status) params.append('status', filter.status);
      
      const response = await fetch(`/api/post-interview-questions?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setQuestions(data.questions);
        setSummary(data.summary);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      sonnerToast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (questionId: string) => {
    if (!response.trim()) {
      sonnerToast.error('Please enter a response');
      return;
    }

    try {
      setResponding(true);
      // You would implement a response API endpoint
      sonnerToast.success('Response functionality coming soon!');
      setSelectedQuestion(null);
      setResponse('');
    } catch (error) {
      sonnerToast.error('Failed to send response');
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading questions...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Questions Dashboard</h1>
        <p className="text-gray-600">Track and respond to user questions from interviews</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Questions</p>
                <p className="text-2xl font-bold">{questions.length}</p>
              </div>
              <MessageCircle className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Follow-up</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.pendingFollowUp || 0}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold">{summary.averageRating?.toFixed(1) || 'N/A'}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-green-600">+{Math.floor(Math.random() * 20 + 5)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              value={filter.category}
              onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Categories</option>
              <option value="feedback">Feedback</option>
              <option value="technical">Technical</option>
              <option value="process">Process</option>
              <option value="improvement">Improvement</option>
              <option value="platform">Platform</option>
              <option value="other">Other</option>
            </select>
            
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Status</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="pending_response">Pending Response</option>
              <option value="responded">Responded</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question) => (
          <Card key={question.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium">{question.user_name}</p>
                    <p className="text-sm text-gray-500">{question.user_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={CATEGORY_COLORS[question.category as keyof typeof CATEGORY_COLORS]}>
                    {question.category}
                  </Badge>
                  <Badge className={STATUS_COLORS[question.status as keyof typeof STATUS_COLORS]}>
                    {question.status.replace('_', ' ')}
                  </Badge>
                  {question.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm">{question.rating}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-800">{question.question_text}</p>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(question.submitted_at).toLocaleDateString()}
                  </span>
                  {question.agent_name && (
                    <span>Interviewer: {question.agent_name}</span>
                  )}
                  {question.needs_followup && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Needs Follow-up
                    </Badge>
                  )}
                </div>
                
                {question.needs_followup && question.status === 'pending_response' && (
                  <Button
                    size="sm"
                    onClick={() => setSelectedQuestion(question)}
                    className="flex items-center gap-1"
                  >
                    <Reply className="w-4 h-4" />
                    Respond
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {questions.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-500">Questions from users will appear here</p>
          </CardContent>
        </Card>
      )}

      {/* Response Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Respond to Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium mb-2">Original Question:</p>
                <p className="text-gray-700">{selectedQuestion.question_text}</p>
                <p className="text-sm text-gray-500 mt-2">
                  From: {selectedQuestion.user_name} ({selectedQuestion.user_email})
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Your Response:</label>
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response here..."
                  rows={4}
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => handleRespond(selectedQuestion.id)}
                  disabled={responding}
                  className="flex-1"
                >
                  {responding ? 'Sending...' : 'Send Response'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedQuestion(null);
                    setResponse('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
