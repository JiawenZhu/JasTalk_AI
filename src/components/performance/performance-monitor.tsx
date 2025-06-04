"use client";

import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PerformanceIndicator } from '@/components/ui/loading-states';
import { Zap, Activity, Clock } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  isOnline: boolean;
  connection?: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
}

interface PerformanceMonitorProps {
  showMetrics?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const PerformanceMonitor = memo(({ 
  showMetrics = false, 
  position = 'bottom-right' 
}: PerformanceMonitorProps) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    isOnline: true,
    connection: 'unknown'
  });
  const [showPanel, setShowPanel] = useState(false);

  useEffect(() => {
    let startTime = performance.now();

    const updateMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const renderTime = performance.now() - startTime;
      
      setMetrics({
        loadTime: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
        renderTime,
        isOnline: navigator.onLine,
        connection: (navigator as any)?.connection?.effectiveType || 'unknown'
      });
    };

    // Update metrics after component mount
    setTimeout(updateMetrics, 100);

    // Listen for network changes
    const handleOnline = () => setMetrics(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setMetrics(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showMetrics && process.env.NODE_ENV === 'production') {
    return null;
  }

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const getPerformanceStatus = () => {
    if (!metrics.isOnline) return 'error';
    if (metrics.renderTime < 100) return 'success';
    if (metrics.renderTime < 300) return 'loading';
    return 'error';
  };

  const getConnectionColor = () => {
    switch (metrics.connection) {
      case '4g': return 'text-green-500';
      case '3g': return 'text-yellow-500';
      case '2g':
      case 'slow-2g': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2"
      >
        {/* Performance indicator button */}
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="relative group"
        >
          <PerformanceIndicator status={getPerformanceStatus()} />
          {!metrics.isOnline && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>

        {/* Detailed metrics panel */}
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ opacity: 0, x: position.includes('right') ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: position.includes('right') ? 20 : -20 }}
              className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-[250px]"
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Performance Metrics
              </h3>
              
              <div className="space-y-3">
                {/* Render Time */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Render Time
                  </span>
                  <span className={`text-xs font-mono ${
                    metrics.renderTime < 100 
                      ? 'text-green-600' 
                      : metrics.renderTime < 300 
                      ? 'text-yellow-600' 
                      : 'text-red-600'
                  }`}>
                    {metrics.renderTime.toFixed(1)}ms
                  </span>
                </div>

                {/* Load Time */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Load Time
                  </span>
                  <span className={`text-xs font-mono ${
                    metrics.loadTime < 100 
                      ? 'text-green-600' 
                      : metrics.loadTime < 500 
                      ? 'text-yellow-600' 
                      : 'text-red-600'
                  }`}>
                    {metrics.loadTime.toFixed(1)}ms
                  </span>
                </div>

                {/* Connection Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Connection</span>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${metrics.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className={`text-xs font-mono ${getConnectionColor()}`}>
                      {metrics.isOnline ? metrics.connection?.toUpperCase() : 'OFFLINE'}
                    </span>
                  </div>
                </div>

                {/* Performance Tips */}
                {metrics.renderTime > 300 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    💡 Slow render detected. Consider reducing animations or large components.
                  </div>
                )}

                {!metrics.isOnline && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                    ⚠️ You're offline. Some features may not work properly.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor'; 