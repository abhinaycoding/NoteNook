-- Run this in the Supabase SQL Editor to initialize your database schema!

-- 1. Profiles Table (Extended from Auth)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  student_type TEXT, -- e.g., 'High School', 'University', 'Competitive Exam'
  target_exam TEXT,  -- e.g., 'JEE', 'NEET', 'UPSC'
  goals TEXT,
  is_pro BOOLEAN DEFAULT false,
  stripe_customer_id TEXT
);

-- Note: We want to trigger a profile creation automatically when a new user signs up in Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Trigger to call the function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 2. Tasks Table (The Ledger)
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  due_date TEXT,
  completed BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Notes Table (Archives)
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT, -- Stored as markdown
  subject TEXT,
  folder TEXT DEFAULT 'Uncategorized',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Timer Sessions (Chronos History)
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  duration_seconds INTEGER NOT NULL,
  completed BOOLEAN DEFAULT true, -- Did they finish the full timer?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING ( auth.uid() = id );

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING ( auth.uid() = id );

-- Tasks: Users can CRUD only their own tasks
CREATE POLICY "Users can fully manage their own tasks"
  ON tasks FOR ALL
  USING ( auth.uid() = user_id );

-- Notes: Users can CRUD only their own notes
CREATE POLICY "Users can fully manage their own notes"
  ON notes FOR ALL
  USING ( auth.uid() = user_id );

-- Sessions: Users can CRUD only their own sessions
CREATE POLICY "Users can fully manage their own sessions"
  ON sessions FOR ALL
  USING ( auth.uid() = user_id );
