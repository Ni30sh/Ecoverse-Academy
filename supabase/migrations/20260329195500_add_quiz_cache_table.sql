-- Cache AI-generated quizzes for fast repeated requests.
CREATE TABLE IF NOT EXISTS public.quiz_generation_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  questions jsonb NOT NULL,
  source text NOT NULL DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (topic)
);

ALTER TABLE public.quiz_generation_cache ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read quiz cache, but not write directly.
CREATE POLICY IF NOT EXISTS "Users can view quiz cache"
ON public.quiz_generation_cache
FOR SELECT
TO authenticated
USING (true);

-- Keep updated_at current.
CREATE OR REPLACE FUNCTION public.update_quiz_cache_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_quiz_cache_updated_at_trigger ON public.quiz_generation_cache;
CREATE TRIGGER update_quiz_cache_updated_at_trigger
BEFORE UPDATE ON public.quiz_generation_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_quiz_cache_updated_at();

CREATE INDEX IF NOT EXISTS idx_quiz_generation_cache_topic ON public.quiz_generation_cache(topic);
