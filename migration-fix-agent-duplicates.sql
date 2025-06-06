-- Migration to fix Retell agent management issues
-- Add new columns for sync tracking and remove duplicates

-- Step 1: Add new columns
ALTER TABLE interviewer 
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'unknown';

-- Step 2: Add unique constraint on agent_id (will fail if duplicates exist)
-- First, let's identify and remove duplicates

-- Create a temporary table to identify the agents to keep (most recent ones)
CREATE TEMP TABLE agents_to_keep AS
SELECT DISTINCT ON (name) id, agent_id, name, created_at
FROM interviewer
ORDER BY name, created_at DESC;

-- Delete duplicate agents (keeping only the most recent ones per name)
DELETE FROM interviewer 
WHERE id NOT IN (SELECT id FROM agents_to_keep);

-- Now add the unique constraint
ALTER TABLE interviewer 
ADD CONSTRAINT interviewer_agent_id_unique UNIQUE (agent_id);

-- Step 3: Update sync status for existing agents
UPDATE interviewer SET sync_status = 'active' WHERE sync_status = 'unknown';

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_interviewer_sync_status ON interviewer(sync_status);
CREATE INDEX IF NOT EXISTS idx_interviewer_last_synced ON interviewer(last_synced_at);

-- Step 5: Display final state
SELECT 
    sync_status,
    COUNT(*) as count
FROM interviewer 
GROUP BY sync_status
ORDER BY sync_status; 
