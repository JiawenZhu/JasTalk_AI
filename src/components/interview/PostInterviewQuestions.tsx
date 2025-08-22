'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Send, MessageCircle, HelpCircle, Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';

interface PostInterviewQuestionsProps {
  isOpen: boolean;
  onClose: () => void;
  interviewId?: string;
  agentName?: string;
  onSubmit?: (data: QuestionSubmission) => void;
}

interface QuestionSubmission {
  questions: string;
  category: string;
  rating: number | null;
  needsFollowUp: boolean;
  contactPreference: string;
}

const QUESTION_CATEGORIES = [
  { id: 'feedback', label: 'About My Performance', icon: Star, color: 'bg-blue-100 text-blue-800' },
  { id: 'technical', label: 'Technical Questions', icon: HelpCircle, color: 'bg-green-100 text-green-800' },
  { id: 'process', label: 'Interview Process', icon: MessageCircle, color: 'bg-purple-100 text-purple-800' },
  { id: 'improvement', label: 'How to Improve', icon: ThumbsUp, color: 'bg-orange-100 text-orange-800' },
  { id: 'platform', label: 'Platform/Technical Issues', icon: ThumbsDown, color: 'bg-red-100 text-red-800' },
  { id: 'other', label: 'Other Questions', icon: MessageCircle, color: 'bg-gray-100 text-gray-800' }
];

const CONTACT_PREFERENCES = [
  { id: 'none', label: 'No follow-up needed' },
  { id: 'email', label: 'Email response preferred' },
  { id: 'platform', label: 'Response on platform' }
];

export default function PostInterviewQuestions({ 
  isOpen, 
  onClose, 
  interviewId, 
  agentName, 
  onSubmit 
}: PostInterviewQuestionsProps) {
  const [questions, setQuestions] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [needsFollowUp, setNeedsFollowUp] = useState(false);
  const [contactPreference, setContactPreference] = useState('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!questions.trim()) {
      sonnerToast.error('Please enter your question');
      return;
    }

    if (!selectedCategory) {
      sonnerToast.error('Please select a question category');
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData: QuestionSubmission = {
        questions: questions.trim(),
        category: selectedCategory,
        rating,
        needsFollowUp,
        contactPreference
      };

      // Submit to API
      const response = await fetch('/api/post-interview-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...submissionData,
          interviewId,
          agentName,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        sonnerToast.success('Thank you! Your questions have been recorded.');
        onSubmit?.(submissionData);
        onClose();
        
        // Reset form
        setQuestions('');
        setSelectedCategory('');
        setRating(null);
        setNeedsFollowUp(false);
        setContactPreference('none');
      } else {
        throw new Error('Failed to submit questions');
      }
    } catch (error) {
      console.error('Error submitting questions:', error);
      sonnerToast.error('Failed to submit questions. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-blue-600" />
            Do you have any questions?
          </CardTitle>
          <CardDescription>
            We'd love to help! Ask anything about your interview, performance, or how to improve.
            {agentName && ` Your interview was with ${agentName}.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Question Categories */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-3 block">
              What's your question about? *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {QUESTION_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-3 rounded-lg border text-left transition-all hover:border-blue-300 ${
                      selectedCategory === category.id 
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{category.label}</span>
                    </div>
                    <Badge className={`text-xs ${category.color}`}>
                      {category.id === 'feedback' && 'Performance insights'}
                      {category.id === 'technical' && 'Subject matter help'}
                      {category.id === 'process' && 'How interviews work'}
                      {category.id === 'improvement' && 'Next steps'}
                      {category.id === 'platform' && 'Technical support'}
                      {category.id === 'other' && 'General questions'}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Your Question *
            </label>
            <Textarea
              value={questions}
              onChange={(e) => setQuestions(e.target.value)}
              placeholder="Type your question here... Be as specific as possible so we can provide the best help!"
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              {questions.length}/500 characters
            </div>
          </div>

          {/* Interview Rating */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              How would you rate this interview experience? (Optional)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-2 rounded-lg transition-colors ${
                    rating && star <= rating 
                      ? 'text-yellow-500' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                >
                  <Star className="w-6 h-6 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Follow-up Preference */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Do you need a follow-up response?
            </label>
            <div className="space-y-2">
              {CONTACT_PREFERENCES.map((pref) => (
                <label key={pref.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="contactPreference"
                    value={pref.id}
                    checked={contactPreference === pref.id}
                    onChange={(e) => {
                      setContactPreference(e.target.value);
                      setNeedsFollowUp(e.target.value !== 'none');
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{pref.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !questions.trim() || !selectedCategory}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Question'}
            </Button>
            <Button variant="outline" onClick={onClose} className="px-6">
              Skip
            </Button>
          </div>

          {/* Privacy Note */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <strong>Privacy:</strong> Your questions help us improve the platform. 
            We may use anonymized question data for analytics but will never share personal information.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

