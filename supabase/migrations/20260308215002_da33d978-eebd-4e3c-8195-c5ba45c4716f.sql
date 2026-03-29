
-- Create enums
CREATE TYPE public.mission_category AS ENUM ('planting', 'waste', 'energy', 'water', 'transport', 'biodiversity', 'campus');
CREATE TYPE public.mission_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE public.mission_status AS ENUM ('available', 'in_progress', 'pending', 'approved', 'rejected');
CREATE TYPE public.notification_type AS ENUM ('mission', 'badge', 'streak', 'reward', 'level_up');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_emoji TEXT NOT NULL DEFAULT '🌱',
  eco_points INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  interests TEXT[] DEFAULT '{}',
  daily_goal INTEGER NOT NULL DEFAULT 3,
  school_name TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Missions table
CREATE TABLE public.missions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category mission_category NOT NULL,
  difficulty mission_difficulty NOT NULL,
  eco_points_reward INTEGER NOT NULL DEFAULT 50,
  xp_reward INTEGER NOT NULL DEFAULT 25,
  requires_photo BOOLEAN NOT NULL DEFAULT true,
  requires_location BOOLEAN NOT NULL DEFAULT false,
  icon TEXT NOT NULL DEFAULT '🌱',
  steps TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view missions" ON public.missions FOR SELECT TO authenticated USING (true);

-- Mission submissions table
CREATE TABLE public.mission_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
  status mission_status NOT NULL DEFAULT 'in_progress',
  photo_url TEXT,
  location_coords JSONB,
  notes TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, mission_id)
);

ALTER TABLE public.mission_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own submissions" ON public.mission_submissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own submissions" ON public.mission_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own submissions" ON public.mission_submissions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'mission',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Daily points tracking
CREATE TABLE public.daily_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own daily points" ON public.daily_points FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily points" ON public.daily_points FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily points" ON public.daily_points FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for mission photos
INSERT INTO storage.buckets (id, name, public) VALUES ('mission-photos', 'mission-photos', true);

CREATE POLICY "Users can upload mission photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'mission-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Mission photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'mission-photos');

-- Auto-approve function (called from client for pending submissions > 2 min old)
CREATE OR REPLACE FUNCTION public.auto_approve_pending_submissions(p_user_id UUID)
RETURNS SETOF public.mission_submissions AS $$
DECLARE
  sub RECORD;
  mission_points INTEGER;
BEGIN
  FOR sub IN
    SELECT ms.* FROM public.mission_submissions ms
    WHERE ms.user_id = p_user_id
      AND ms.status = 'pending'
      AND ms.submitted_at < now() - interval '2 minutes'
  LOOP
    -- Get mission points
    SELECT eco_points_reward INTO mission_points FROM public.missions WHERE id = sub.mission_id;
    
    -- Update submission
    UPDATE public.mission_submissions SET status = 'approved', reviewed_at = now() WHERE id = sub.id;
    
    -- Award points
    UPDATE public.profiles SET eco_points = eco_points + mission_points WHERE id = p_user_id;
    
    -- Track daily points
    INSERT INTO public.daily_points (user_id, date, points_earned)
    VALUES (p_user_id, CURRENT_DATE, mission_points)
    ON CONFLICT (user_id, date) DO UPDATE SET points_earned = daily_points.points_earned + EXCLUDED.points_earned;
    
    -- Create notification
    INSERT INTO public.notifications (user_id, title, body, type)
    VALUES (p_user_id, 'Mission approved! +' || mission_points || ' EcoPoints 🌿', 'Your mission "' || (SELECT title FROM public.missions WHERE id = sub.mission_id) || '" has been approved!', 'mission');
    
    RETURN NEXT sub;
  END LOOP;
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Streak update function
CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS public.profiles AS $$
DECLARE
  profile_row public.profiles;
  today DATE := CURRENT_DATE;
BEGIN
  SELECT * INTO profile_row FROM public.profiles WHERE id = p_user_id;
  
  IF profile_row.last_active_date IS NULL OR profile_row.last_active_date < today - 1 THEN
    -- Reset streak
    UPDATE public.profiles SET streak_days = 1, last_active_date = today WHERE id = p_user_id RETURNING * INTO profile_row;
  ELSIF profile_row.last_active_date = today - 1 THEN
    -- Increment streak
    UPDATE public.profiles SET streak_days = streak_days + 1, last_active_date = today WHERE id = p_user_id RETURNING * INTO profile_row;
  ELSIF profile_row.last_active_date = today THEN
    -- Already active today, no change
    NULL;
  END IF;
  
  RETURN profile_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
