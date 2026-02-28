-- Run this in your Supabase SQL Editor

-- It looks like 'priority' already exists. We will safely add 'deadline_at' 
-- and ensure 'priority' just has the correct default value without throwing an error.

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- If you need to make sure priority has the right default, you can run this:
ALTER TABLE tasks 
ALTER COLUMN priority SET DEFAULT 'medium';
