import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/auth.context';

interface Utterance {
  speaker: 'USER' | 'AGENT';
  text: string;
  timestamp: string;
  duration_seconds?: number;
  confidence_score?: number;
  question?: string;
  questionIndex?: number;
  startTime?: number;
  endTime?: number;
}

interface LoggingStats {
  totalUtterances: number;
  successfulLogs: number;
  failedLogs: number;
  pendingLogs: number;
  lastLogTime: string | null;
}

export function useContinuousLogging(interviewId: string) {
  const { session } = useAuth();
  const [utteranceBuffer, setUtteranceBuffer] = useState<Utterance[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const [loggingStats, setLoggingStats] = useState<LoggingStats>({
    totalUtterances: 0,
    successfulLogs: 0,
    failedLogs: 0,
    pendingLogs: 0,
    lastLogTime: null
  });
  
  const bufferTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryQueueRef = useRef<Utterance[]>([]);

  // Helper to get auth headers
  const getAuthHeaders = useCallback((): { [key: string]: string } => {
    if (!session?.access_token) {
      console.warn('No session access token available for API call.');
      return {
        'Content-Type': 'application/json'
      };
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };
  }, [session]);

  // Log utterance to API
  const logUtterancesToAPI = useCallback(async (utterances: Utterance[]): Promise<boolean> => {
    if (utterances.length === 0) return true;

    try {
      console.log(`📝 Logging ${utterances.length} utterances to API...`);
      
      const response = await fetch('/api/utterances', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          interview_id: interviewId,
          utterances
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to log utterances: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`✅ Successfully logged ${utterances.length} utterances:`, result);
      
      // Update stats
      setLoggingStats(prev => ({
        ...prev,
        successfulLogs: prev.successfulLogs + utterances.length,
        lastLogTime: new Date().toISOString()
      }));

      return true;
    } catch (error) {
      console.error('❌ Failed to log utterances to API:', error);
      
      // Update stats
      setLoggingStats(prev => ({
        ...prev,
        failedLogs: prev.failedLogs + utterances.length
      }));

      // Add to retry queue
      retryQueueRef.current.push(...utterances);
      
      return false;
    }
  }, [interviewId, getAuthHeaders]);

  // Store utterances in localStorage as backup
  const storeBackupUtterances = useCallback((utterances: Utterance[]) => {
    try {
      const key = `interview_backup_${interviewId}`;
      const existing = localStorage.getItem(key);
      const existingUtterances = existing ? JSON.parse(existing) : [];
      
      const updatedUtterances = [...existingUtterances, ...utterances];
      localStorage.setItem(key, JSON.stringify(updatedUtterances));
      
      console.log(`💾 Stored ${utterances.length} utterances in localStorage backup`);
    } catch (error) {
      console.error('❌ Failed to store backup utterances:', error);
    }
  }, [interviewId]);

  // Flush buffer to API
  const flushBuffer = useCallback(async () => {
    if (utteranceBuffer.length === 0 || isLogging) return;

    setIsLogging(true);
    setLoggingStats(prev => ({ ...prev, pendingLogs: utteranceBuffer.length }));

    try {
      const success = await logUtterancesToAPI(utteranceBuffer);
      
      if (success) {
        setUtteranceBuffer([]);
        console.log('✅ Buffer flushed successfully');
      } else {
        // If API fails, store in backup
        storeBackupUtterances(utteranceBuffer);
        setUtteranceBuffer([]);
      }
    } catch (error) {
      console.error('❌ Error flushing buffer:', error);
      storeBackupUtterances(utteranceBuffer);
      setUtteranceBuffer([]);
    } finally {
      setIsLogging(false);
      setLoggingStats(prev => ({ ...prev, pendingLogs: 0 }));
    }
  }, [utteranceBuffer, isLogging, logUtterancesToAPI, storeBackupUtterances]);

  // Log single utterance (adds to buffer)
  const logUtterance = useCallback(async (utterance: Utterance) => {
    console.log('📝 Adding utterance to buffer:', {
      speaker: utterance.speaker,
      textLength: utterance.text.length,
      bufferSize: utteranceBuffer.length
    });

    // Add to buffer
    setUtteranceBuffer(prev => [...prev, utterance]);
    
    // Update stats
    setLoggingStats(prev => ({
      ...prev,
      totalUtterances: prev.totalUtterances + 1
    }));

    // Clear existing timeout
    if (bufferTimeoutRef.current) {
      clearTimeout(bufferTimeoutRef.current);
    }

    // Set new timeout for auto-flush
    bufferTimeoutRef.current = setTimeout(() => {
      flushBuffer();
    }, 2000); // Auto-flush after 2 seconds of inactivity

    // Immediate flush if buffer is getting large or utterance is substantial
    if (utteranceBuffer.length >= 3 || utterance.text.length > 200) {
      flushBuffer();
    }
  }, [utteranceBuffer, flushBuffer]);

  // Retry failed logs
  const retryFailedLogs = useCallback(async () => {
    if (retryQueueRef.current.length === 0) return;

    console.log(`🔄 Retrying ${retryQueueRef.current.length} failed utterances...`);
    
    const utterancesToRetry = [...retryQueueRef.current];
    retryQueueRef.current = [];

    const success = await logUtterancesToAPI(utterancesToRetry);
    
    if (!success) {
      // Put them back in retry queue for next attempt
      retryQueueRef.current.push(...utterancesToRetry);
    }
  }, [logUtterancesToAPI]);

  // Recover backup utterances from localStorage
  const recoverBackupUtterances = useCallback(async () => {
    try {
      const key = `interview_backup_${interviewId}`;
      const backup = localStorage.getItem(key);
      
      if (backup) {
        const backupUtterances = JSON.parse(backup);
        console.log(`🔄 Recovering ${backupUtterances.length} backup utterances...`);
        
        if (backupUtterances.length > 0) {
          const success = await logUtterancesToAPI(backupUtterances);
          
          if (success) {
            localStorage.removeItem(key);
            console.log('✅ Backup utterances recovered and logged successfully');
          } else {
            console.log('⚠️ Backup recovery failed, will retry later');
          }
        }
      }
    } catch (error) {
      console.error('❌ Error recovering backup utterances:', error);
    }
  }, [interviewId, logUtterancesToAPI]);

  // Auto-retry failed logs every 30 seconds
  useEffect(() => {
    const retryInterval = setInterval(retryFailedLogs, 30000);
    return () => clearInterval(retryInterval);
  }, [retryFailedLogs]);

  // Recover backup utterances on mount
  useEffect(() => {
    recoverBackupUtterances();
  }, [recoverBackupUtterances]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (bufferTimeoutRef.current) {
        clearTimeout(bufferTimeoutRef.current);
      }
      // Final flush attempt
      flushBuffer();
    };
  }, [flushBuffer]);

  return {
    // Actions
    logUtterance,
    flushBuffer,
    retryFailedLogs,
    recoverBackupUtterances,
    
    // State
    isLogging,
    bufferSize: utteranceBuffer.length,
    loggingStats,
    
    // Utils
    hasPendingLogs: utteranceBuffer.length > 0 || retryQueueRef.current.length > 0
  };
}
