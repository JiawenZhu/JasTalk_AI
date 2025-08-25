"use client";

import React from 'react';
import { useCredits } from '@/contexts/credits-context';
import { Clock, AlertCircle, Loader2 } from 'lucide-react';

interface CreditsDisplayProps {
  variant?: 'compact' | 'detailed' | 'minimal';
  showIcon?: boolean;
  className?: string;
}

export default function CreditsDisplay({ 
  variant = 'detailed', 
  showIcon = true,
  className = '' 
}: CreditsDisplayProps) {
  const { state, hasCredits, isLoading, error, manualRefreshCredits } = useCredits();

  // Remove automatic refresh - let the parent context handle credit loading
  // This prevents infinite loading states and unnecessary API calls
  
  // Format credits display - Always show in minutes for consistency
  const formatCredits = () => {
    const totalMinutes = state.minutes + (state.seconds > 0 ? 1 : 0); // Round up if there are seconds
    
    if (totalMinutes === 0) {
      return '0m';
    }
    
    return `${totalMinutes}m`;
  };

  // Handle manual refresh
  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh requested by user');
    manualRefreshCredits();
  };

  // Get status color
  const getStatusColor = () => {
    if (error) {return 'text-red-600';}
    if (!hasCredits) {return 'text-red-600';}
    
    const totalMinutes = state.minutes + (state.seconds > 0 ? 1 : 0);
    if (totalMinutes < 5) {return 'text-orange-600';}
    if (totalMinutes < 15) {return 'text-yellow-600';}
    
return 'text-green-600';
  };

  // Get background color
  const getBackgroundColor = () => {
    if (error) {return 'bg-red-50';}
    if (!hasCredits) {return 'bg-red-50';}
    
    const totalMinutes = state.minutes + (state.seconds > 0 ? 1 : 0);
    if (totalMinutes < 5) {return 'bg-orange-50';}
    if (totalMinutes < 15) {return 'bg-yellow-50';}
    
return 'bg-green-50';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-50 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-50 ${className}`}>
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span className="text-red-600 text-sm">Error</span>
      </div>
    );
  }

  // No credits state
  if (!hasCredits) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-50 ${className}`}>
        {showIcon && <Clock className="w-4 h-4 text-red-500" />}
        <span className="text-red-600 text-sm font-medium">0m</span>
      </div>
    );
  }

  // Render based on variant
  switch (variant) {
    case 'minimal':
      return (
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${getBackgroundColor()} ${className}`}>
          {showIcon && <Clock className="w-3 h-3 ${getStatusColor()}" />}
          <span className={`text-xs font-medium ${getStatusColor()}`}>
            {formatCredits()}
          </span>
        </div>
      );

    case 'compact':
      return (
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${getBackgroundColor()} ${className}`}>
          {showIcon && <Clock className="w-4 h-4 ${getStatusColor()}" />}
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {formatCredits()}
          </span>
        </div>
      );

    case 'detailed':
    default:
      return (
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full ${getBackgroundColor()} ${className}`}>
          {showIcon && <Clock className="w-4 h-4 ${getStatusColor()}" />}
          <div className="flex flex-col">
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {formatCredits()}
            </span>
            <span className={`text-xs ${getStatusColor()} opacity-75`}>
              left
            </span>
          </div>
          {/* Manual refresh button */}
          <button
            className="ml-2 p-1 rounded-full hover:bg-gray-200 transition-colors"
            title="Refresh credits"
            onClick={handleManualRefresh}
          >
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      );
  }
}
