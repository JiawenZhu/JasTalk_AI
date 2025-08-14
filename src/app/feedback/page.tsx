"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { StarIcon, CheckIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/auth.context';
import { toast } from '@/components/ui/use-toast';
import Navbar from '@/components/navbar';

export default function FeedbackPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [interviewDuration, setInterviewDuration] = useState<number>(0);

  useEffect(() => {
    // Get session data from URL params or localStorage
    const sessionIdParam = searchParams.get('sessionId');
    const durationParam = searchParams.get('duration');
    
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
    }
    
    if (durationParam) {
      setInterviewDuration(parseInt(durationParam));
    }

    // Check if user is authenticated
    if (!isAuthenticated) {
      router.push('/sign-in');
    }
  }, [isAuthenticated, router, searchParams]);

  const handleRatingClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleRatingHover = (hoverRating: number) => {
    setHoverRating(hoverRating);
  };

  const handleRatingLeave = () => {
    setHoverRating(0);
  };

  const handleSubmitFeedback = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please provide a rating before submitting feedback.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/user-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          rating,
          feedback,
          interviewDuration,
          userId: user?.id,
          userEmail: user?.email,
        }),
      });

      if (response.ok) {
        toast({
          title: "Feedback Submitted!",
          description: "Thank you for your feedback. It helps us improve our service.",
        });

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-24 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl shadow-lg p-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckIcon className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Interview Completed!
              </h1>
              <p className="text-gray-600">
                Great job! You've completed your practice interview in{' '}
                <span className="font-semibold text-blue-600">
                  {formatDuration(interviewDuration)}
                </span>
              </p>
            </div>

            {/* Rating Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                How was your experience?
              </h2>
              
              <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => handleRatingHover(star)}
                    onMouseLeave={handleRatingLeave}
                    className="p-2 transition-transform hover:scale-110"
                  >
                    {(hoverRating || rating) >= star ? (
                      <StarIcon className="w-12 h-12 text-yellow-400" />
                    ) : (
                      <StarOutlineIcon className="w-12 h-12 text-gray-300" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="text-center mt-2">
                <p className="text-sm text-gray-500">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                  {rating === 0 && "Click to rate"}
                </p>
              </div>
            </div>

            {/* Feedback Section */}
            <div className="mb-8">
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Feedback (Optional)
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us about your experience, what went well, what could be improved..."
                className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <div className="text-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmitFeedback}
                disabled={isSubmitting || rating === 0}
                className={`w-full py-4 px-8 rounded-xl font-semibold text-white shadow-lg transition-all duration-200 ${
                  isSubmitting || rating === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Submitting...</span>
                  </div>
                ) : (
                  'Submit Feedback & Continue'
                )}
              </motion.button>
            </div>

            {/* Skip Option */}
            <div className="text-center mt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700 text-sm underline"
              >
                Skip feedback and go to dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
