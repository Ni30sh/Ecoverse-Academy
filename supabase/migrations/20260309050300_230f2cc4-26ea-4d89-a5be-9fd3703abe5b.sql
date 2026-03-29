
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'school_admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Users can read their own roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Default all existing users to student role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'student'::app_role FROM auth.users
ON CONFLICT DO NOTHING;

-- Add teacher fields to missions
ALTER TABLE public.missions ADD COLUMN created_by uuid DEFAULT NULL;
ALTER TABLE public.missions ADD COLUMN expires_at timestamptz DEFAULT NULL;
ALTER TABLE public.missions ADD COLUMN school_only boolean DEFAULT false;

-- Teachers can insert missions they create
CREATE POLICY "Teachers can insert missions" ON public.missions
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'teacher') AND created_by = auth.uid());

-- Teachers can update their own missions
CREATE POLICY "Teachers can update own missions" ON public.missions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'teacher') AND created_by = auth.uid());

-- Teachers can view all submissions (for review)
CREATE POLICY "Teachers can view all submissions" ON public.mission_submissions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'));

-- Teachers can update submissions (approve/reject)
CREATE POLICY "Teachers can update all submissions" ON public.mission_submissions
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'));

-- Add feedback columns to submissions
ALTER TABLE public.mission_submissions ADD COLUMN teacher_feedback text DEFAULT NULL;
ALTER TABLE public.mission_submissions ADD COLUMN reviewed_by uuid DEFAULT NULL;

-- Teachers can insert notifications for any user (to notify students)
CREATE POLICY "Teachers can insert notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'teacher'));

-- Teachers can view all daily_points for class stats
CREATE POLICY "Teachers can view all daily points" ON public.daily_points
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'));

-- Teachers can update student profiles (for bonus points)
CREATE POLICY "Teachers can update student profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'));

-- Teachers can view all lesson completions
CREATE POLICY "Teachers can view all lesson completions" ON public.lesson_completions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'));

-- Teachers can view all quiz attempts
CREATE POLICY "Teachers can view all quiz attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'));
