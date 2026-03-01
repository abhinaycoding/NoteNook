-- Fix ALL tables that reference auth.users to use ON DELETE CASCADE
-- This allows user deletion from Supabase Auth dashboard

-- study_rooms (created_by references auth.users)
DO $$ BEGIN
  ALTER TABLE study_rooms DROP CONSTRAINT IF EXISTS study_rooms_created_by_fkey;
  ALTER TABLE study_rooms ADD CONSTRAINT study_rooms_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- room_members (user_id references auth.users)
DO $$ BEGIN
  ALTER TABLE room_members DROP CONSTRAINT IF EXISTS room_members_user_id_fkey;
  ALTER TABLE room_members ADD CONSTRAINT room_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- room_tasks (created_by references auth.users)
DO $$ BEGIN
  ALTER TABLE room_tasks DROP CONSTRAINT IF EXISTS room_tasks_created_by_fkey;
  ALTER TABLE room_tasks ADD CONSTRAINT room_tasks_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- room_tasks (assigned_to references auth.users, if exists)
DO $$ BEGIN
  ALTER TABLE room_tasks DROP CONSTRAINT IF EXISTS room_tasks_assigned_to_fkey;
  ALTER TABLE room_tasks ADD CONSTRAINT room_tasks_assigned_to_fkey
    FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN undefined_table THEN NULL;
WHEN undefined_column THEN NULL;
END $$;

-- room_members (room_id references study_rooms) - cascade room deletion too
DO $$ BEGIN
  ALTER TABLE room_members DROP CONSTRAINT IF EXISTS room_members_room_id_fkey;
  ALTER TABLE room_members ADD CONSTRAINT room_members_room_id_fkey
    FOREIGN KEY (room_id) REFERENCES study_rooms(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- room_tasks (room_id references study_rooms) - cascade room deletion
DO $$ BEGIN
  ALTER TABLE room_tasks DROP CONSTRAINT IF EXISTS room_tasks_room_id_fkey;
  ALTER TABLE room_tasks ADD CONSTRAINT room_tasks_room_id_fkey
    FOREIGN KEY (room_id) REFERENCES study_rooms(id) ON DELETE CASCADE;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;
