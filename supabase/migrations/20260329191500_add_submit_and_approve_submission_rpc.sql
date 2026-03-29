-- Submit mission proof and optionally auto-approve for missions without teacher review.
CREATE OR REPLACE FUNCTION public.submit_mission_proof(
  p_mission_id uuid,
  p_photo_url text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_location_coords jsonb DEFAULT NULL
)
RETURNS public.mission_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_submission public.mission_submissions;
  v_mission public.missions;
  v_points integer := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_mission FROM public.missions WHERE id = p_mission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission not found';
  END IF;

  INSERT INTO public.mission_submissions (
    user_id,
    mission_id,
    status,
    photo_url,
    notes,
    location_coords,
    submitted_at,
    reviewed_at
  )
  VALUES (
    v_user_id,
    p_mission_id,
    CASE WHEN COALESCE(v_mission.requires_teacher_approval, true) THEN 'pending'::public.mission_status ELSE 'approved'::public.mission_status END,
    p_photo_url,
    p_notes,
    p_location_coords,
    now(),
    CASE WHEN COALESCE(v_mission.requires_teacher_approval, true) THEN NULL ELSE now() END
  )
  ON CONFLICT (user_id, mission_id) DO UPDATE
  SET
    status = CASE WHEN COALESCE(v_mission.requires_teacher_approval, true) THEN 'pending'::public.mission_status ELSE 'approved'::public.mission_status END,
    photo_url = EXCLUDED.photo_url,
    notes = EXCLUDED.notes,
    location_coords = EXCLUDED.location_coords,
    submitted_at = now(),
    reviewed_at = CASE WHEN COALESCE(v_mission.requires_teacher_approval, true) THEN NULL ELSE now() END
  RETURNING * INTO v_submission;

  IF NOT COALESCE(v_mission.requires_teacher_approval, true) THEN
    v_points := COALESCE(v_mission.eco_points_reward, 0);

    UPDATE public.profiles
    SET
      eco_points = eco_points + v_points,
      last_active_date = CURRENT_DATE
    WHERE id = v_user_id;

    INSERT INTO public.daily_points (user_id, date, points_earned)
    VALUES (v_user_id, CURRENT_DATE, v_points)
    ON CONFLICT (user_id, date)
    DO UPDATE SET points_earned = public.daily_points.points_earned + EXCLUDED.points_earned;

    PERFORM public.update_streak(v_user_id);

    INSERT INTO public.notifications (user_id, title, body, type)
    VALUES (
      v_user_id,
      'Mission completed! +' || v_points || ' EcoPoints 🌿',
      'Great work on "' || v_mission.title || '". Your reward was added instantly.',
      'mission'
    );
  END IF;

  RETURN v_submission;
END;
$$;

-- Teacher approval RPC to ensure points/streak/notifications are applied atomically.
CREATE OR REPLACE FUNCTION public.approve_mission_submission(
  p_user_id uuid,
  p_mission_id uuid,
  p_feedback text DEFAULT NULL
)
RETURNS public.mission_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reviewer_id uuid := auth.uid();
  v_submission public.mission_submissions;
  v_mission public.missions;
  v_points integer := 0;
BEGIN
  IF v_reviewer_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (
    public.has_role(v_reviewer_id, 'teacher'::public.app_role)
    OR public.has_role(v_reviewer_id, 'school_admin'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Not authorized to approve submissions';
  END IF;

  SELECT * INTO v_mission FROM public.missions WHERE id = p_mission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission not found';
  END IF;

  SELECT * INTO v_submission
  FROM public.mission_submissions
  WHERE user_id = p_user_id AND mission_id = p_mission_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  IF v_submission.status <> 'approved'::public.mission_status THEN
    UPDATE public.mission_submissions
    SET
      status = 'approved'::public.mission_status,
      reviewed_at = now(),
      reviewed_by = v_reviewer_id,
      teacher_feedback = p_feedback
    WHERE id = v_submission.id
    RETURNING * INTO v_submission;

    v_points := COALESCE(v_mission.eco_points_reward, 0);

    UPDATE public.profiles
    SET
      eco_points = eco_points + v_points,
      last_active_date = CURRENT_DATE
    WHERE id = p_user_id;

    INSERT INTO public.daily_points (user_id, date, points_earned)
    VALUES (p_user_id, CURRENT_DATE, v_points)
    ON CONFLICT (user_id, date)
    DO UPDATE SET points_earned = public.daily_points.points_earned + EXCLUDED.points_earned;

    PERFORM public.update_streak(p_user_id);

    INSERT INTO public.notifications (user_id, title, body, type)
    VALUES (
      p_user_id,
      'Mission approved! +' || v_points || ' EcoPoints 🌿',
      'Your mission "' || v_mission.title || '" was approved by your teacher.',
      'mission'
    );
  END IF;

  RETURN v_submission;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_mission_proof(uuid, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_mission_submission(uuid, uuid, text) TO authenticated;
