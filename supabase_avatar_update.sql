-- Run this in your Supabase SQL Editor to support Avatars/Personas
-- and better room presence metadata.

-- 1. Add avatar_id to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_id TEXT DEFAULT 'default';

-- 2. Add avatar_id to room_members (for denormalized quick access in presence)
ALTER TABLE room_members 
ADD COLUMN IF NOT EXISTS avatar_id TEXT DEFAULT 'default';

-- 3. Update the handle_new_user function to include a default avatar if needed
-- (Optional, since we already have a DEFAULT 'default' on the column)
