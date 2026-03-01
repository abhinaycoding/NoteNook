-- Fix: Add ON DELETE CASCADE to all user_id foreign keys
-- Without this, deleting a user from Supabase Auth fails because
-- their data in these tables still references them.

-- Tasks
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_user_id_fkey;
ALTER TABLE tasks ADD CONSTRAINT tasks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Notes
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;
ALTER TABLE notes ADD CONSTRAINT notes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Sessions
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_user_id_fkey;
ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
