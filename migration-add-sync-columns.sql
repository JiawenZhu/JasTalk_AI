-- Migration: Add sync-related columns to interviewer table
-- This adds the missing columns needed for the enhanced voice agent sync system

-- Add last_synced_at column if it doesn't exist
ALTER TABLE interviewer 
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- Add sync_status column if it doesn't exist
ALTER TABLE interviewer 
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'active';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interviewer_sync_status ON interviewer(sync_status);
CREATE INDEX IF NOT EXISTS idx_interviewer_last_synced ON interviewer(last_synced_at);

-- Update existing records to have proper sync status and timestamps
UPDATE interviewer 
SET 
  last_synced_at = COALESCE(last_synced_at, created_at, TIMEZONE('utc', NOW())),
  sync_status = COALESCE(sync_status, 'active')
WHERE last_synced_at IS NULL OR sync_status IS NULL;

-- Verify the changes
SELECT 
  id, 
  name, 
  agent_id, 
  sync_status, 
  last_synced_at,
  created_at
FROM interviewer
ORDER BY created_at DESC; 
