"use client";

import { motion } from "framer-motion";
import { Loader2, Zap, BarChart3 } from "lucide-react";
import { memo } from "react";

// Optimized spinner with reduced motion
export const OptimizedSpinner = memo(() => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    className="inline-block"
  >
    <Loader2 className="h-4 w-4" />
  </motion.div>
));

OptimizedSpinner.displayName = "OptimizedSpinner";

// Improved skeleton loader with shimmer effect and stable dimensions
export const SkeletonLoader = memo(({ 
  className = "",
  shimmer = true 
}: { 
  className?: string;
  shimmer?: boolean;
}) => (
  <div 
    className={`bg-gray-200 rounded ${shimmer ? 'skeleton-shimmer' : 'animate-pulse'} ${className}`} 
    style={{ minHeight: '1rem' }} // Prevent zero height
  />
));

SkeletonLoader.displayName = "SkeletonLoader";

// Enhanced card skeleton that matches InterviewCard dimensions exactly
export const InterviewCardSkeleton = memo(() => (
  <div className="h-60 w-56 ml-1 mr-3 mt-4 flex-none rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
    {/* Header area with exact spacing */}
    <div className="p-4 space-y-3">
      {/* Icon placeholder */}
      <div className="flex justify-between items-start">
        <SkeletonLoader className="h-8 w-8 rounded-lg" />
        <SkeletonLoader className="h-4 w-4 rounded" />
      </div>
      
      {/* Title placeholder */}
      <div className="space-y-2">
        <SkeletonLoader className="h-5 w-3/4" />
        <SkeletonLoader className="h-3 w-1/2" />
      </div>
    </div>
    
    {/* Content area */}
    <div className="px-4 pb-4 space-y-2">
      <SkeletonLoader className="h-3 w-full" />
      <SkeletonLoader className="h-3 w-2/3" />
    </div>
    
    {/* Footer area */}
    <div className="mt-auto p-4 border-t border-gray-100">
      <SkeletonLoader className="h-6 w-20" />
    </div>
  </div>
));

InterviewCardSkeleton.displayName = "InterviewCardSkeleton";

// General card skeleton for dashboard
export const CardSkeleton = memo(() => (
  <div className="p-6 border rounded-lg shadow-sm space-y-4 bg-white">
    <div className="flex items-center space-x-4">
      <SkeletonLoader className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <SkeletonLoader className="h-4 w-3/4" />
        <SkeletonLoader className="h-3 w-1/2" />
      </div>
    </div>
    <SkeletonLoader className="h-20 w-full" />
  </div>
));

CardSkeleton.displayName = "CardSkeleton";

// Performance indicator
export const PerformanceIndicator = memo(({ 
  status = "loading" 
}: { 
  status?: "loading" | "success" | "error" 
}) => {
  const variants = {
    loading: { 
      icon: Loader2, 
      color: "text-blue-500", 
      bgColor: "bg-blue-50",
      animate: { rotate: 360 }
    },
    success: { 
      icon: Zap, 
      color: "text-green-500", 
      bgColor: "bg-green-50",
      animate: { scale: [1, 1.2, 1] }
    },
    error: { 
      icon: BarChart3, 
      color: "text-red-500", 
      bgColor: "bg-red-50",
      animate: { shake: [0, -1, 1, -1, 0] }
    }
  };

  const { icon: Icon, color, bgColor, animate } = variants[status];

  return (
    <motion.div 
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${bgColor}`}
      animate={animate}
      transition={{ 
        duration: status === "loading" ? 1 : 0.3,
        repeat: status === "loading" ? Infinity : 0,
        ease: status === "loading" ? "linear" : "easeInOut"
      }}
    >
      <Icon className={`h-4 w-4 ${color}`} />
    </motion.div>
  );
});

PerformanceIndicator.displayName = "PerformanceIndicator";

// Enhanced lazy loading wrapper with stable dimensions
export const LazyWrapper = memo(({ 
  children, 
  fallback = <OptimizedSpinner />,
  minHeight = "200px",
  className = ""
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: string;
  className?: string;
}) => (
  <div 
    style={{ minHeight }} 
    className={`flex items-center justify-center bg-gray-50/50 ${className}`}
  >
    {children || fallback}
  </div>
));

LazyWrapper.displayName = "LazyWrapper";

// Image skeleton with aspect ratio preservation
export const ImageSkeleton = memo(({ 
  aspectRatio = "aspect-square",
  className = ""
}: {
  aspectRatio?: string;
  className?: string;
}) => (
  <div className={`${aspectRatio} ${className} bg-gray-200 skeleton-shimmer rounded`} />
));

ImageSkeleton.displayName = "ImageSkeleton"; 