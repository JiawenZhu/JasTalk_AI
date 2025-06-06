'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface UseDeleteInterviewProps {
  onSuccess?: (interviewId: string, interviewName: string) => void;
  onError?: (error: string) => void;
}

interface DeleteInterviewResult {
  success: boolean;
  message: string;
  deletedInterview?: {
    id: string;
    name: string;
  };
}

export function useDeleteInterview({ onSuccess, onError }: UseDeleteInterviewProps = {}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteInterview = async (interviewId: string, interviewName: string): Promise<boolean> => {
    if (!interviewId || !interviewName) {
      const error = "Invalid interview data provided";
      setDeleteError(error);
      onError?.(error);
      return false;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/delete-interview?id=${encodeURIComponent(interviewId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result: DeleteInterviewResult = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to delete interview');
      }

      if (result.success) {
        // Show success toast
        toast.success(result.message || `Interview "${interviewName}" has been successfully deleted`, {
          position: "bottom-right",
          duration: 4000,
        });

        // Call success callback
        onSuccess?.(interviewId, interviewName);
        
        return true;
      } else {
        throw new Error(result.message || 'Failed to delete interview');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Error deleting interview:', error);
      
      setDeleteError(errorMessage);
      
      // Show error toast
      toast.error(`Failed to delete interview: ${errorMessage}`, {
        position: "bottom-right",
        duration: 5000,
      });

      // Call error callback
      onError?.(errorMessage);
      
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const clearError = () => setDeleteError(null);

  return {
    deleteInterview,
    isDeleting,
    deleteError,
    clearError,
  };
} 
