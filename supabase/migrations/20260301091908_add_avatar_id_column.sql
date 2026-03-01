-- Add avatar_id column to profiles table (fixes 400 errors on profile setup)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_id TEXT DEFAULT 'owl';
