import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localStore } from '@/lib/localStore';
import { awardStudentProgress } from '@/lib/progression';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useTeacherData() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id;
  const schoolName = profile?.school_name;

  const canUseSupabaseForTeacher = async () => {
    const { data } = await supabase.auth.getSession();
    const sessionUserId = data.session?.user?.id;
    return !!sessionUserId && sessionUserId === userId;
  };

  // All students (same school or all if no school set)
  const studentsQuery = useQuery({
    queryKey: ['teacher-students', schoolName],
    queryFn: async () => {
      let profiles = localStore.getAll('profiles');
      if (schoolName) {
        profiles = profiles.filter(p => p.school_name === schoolName);
      }
      return profiles
        .filter(p => p.id !== userId)
        .sort((a, b) => b.eco_points - a.eco_points);
    },
    enabled: !!userId,
  });

  // All submissions (for teacher review)
  const submissionsQuery = useQuery({
    queryKey: ['teacher-submissions'],
    queryFn: async () => {
      const submissions = localStore.getAll('mission_submissions');
      return submissions
        .map(s => ({
          ...s,
          missions: localStore.getById('missions', s.mission_id)
        }))
        .sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime());
    },
    enabled: !!userId,
  });

  // Pending count
  const pendingCount = (submissionsQuery.data ?? []).filter(s => s.status === 'pending').length;

  // Weekly approved count
  const weeklyApprovedQuery = useQuery({
    queryKey: ['teacher-weekly-approved'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const limitDate = sevenDaysAgo.toISOString();
      const submissions = localStore.query('mission_submissions',
        (s) => s.status === 'approved' && s.submitted_at >= limitDate
      );
      return submissions.length;
    },
    enabled: !!userId,
  });

  // Class total eco points
  const classTotalPoints = (studentsQuery.data ?? []).reduce((sum, s) => sum + s.eco_points, 0);

  // Active students this week
  const activeThisWeekQuery = useQuery({
    queryKey: ['teacher-active-week'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const limitDate = sevenDaysAgo.toISOString().split('T')[0];
      const points = localStore.query('daily_points', (d) => d.date >= limitDate);
      const uniqueUsers = new Set(points.map(d => d.user_id));
      return uniqueUsers.size;
    },
    enabled: !!userId,
  });

  // Class daily points for chart (last 7 days)
  const classWeeklyQuery = useQuery({
    queryKey: ['teacher-class-weekly'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const limitDate = sevenDaysAgo.toISOString().split('T')[0];
      const points = localStore.query('daily_points', (d) => d.date >= limitDate);
      
      const byDate: Record<string, number> = {};
      points.forEach(d => {
        byDate[d.date] = (byDate[d.date] || 0) + d.points_earned;
      });
      
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        const dayName = date.toLocaleDateString('en', { weekday: 'short' });
        result.push({ date: key, day: dayName, points: byDate[key] || 0 });
      }
      return result;
    },
    enabled: !!userId,
  });

  // Top 5 students this week
  const topStudentsWeekQuery = useQuery({
    queryKey: ['teacher-top-students-week'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const limitDate = sevenDaysAgo.toISOString().split('T')[0];
      const points = localStore.query('daily_points', (d) => d.date >= limitDate);
      
      const byUser: Record<string, number> = {};
      points.forEach(d => {
        byUser[d.user_id] = (byUser[d.user_id] || 0) + d.points_earned;
      });
      
      const sorted = Object.entries(byUser)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);
      
      return sorted.map(([id, weekPoints], i) => {
        const p = localStore.getById('profiles', id);
        return {
          rank: i + 1,
          user_id: id,
          full_name: p?.full_name ?? 'Unknown',
          avatar_emoji: p?.avatar_emoji ?? '🌱',
          eco_points: p?.eco_points ?? 0,
          week_points: weekPoints,
        };
      });
    },
    enabled: !!userId,
  });

  // Approve submission
  const approveSubmission = useMutation({
    mutationFn: async ({ submissionId, missionId, studentId, feedback }: { submissionId: string; missionId: string; studentId: string; feedback?: string }) => {
      const submission = localStore.getById('mission_submissions', submissionId);
      if (!submission) throw new Error('Submission not found');

      const mission = localStore.getById('missions', missionId);
      if (!mission) throw new Error('Mission not found');

      if (submission.status === 'approved') {
        const existingStudent = localStore.getById('profiles', studentId);
        return {
          studentName: existingStudent?.full_name || '',
          points: 0,
          alreadyApproved: true,
        };
      }

      const shouldUseSupabase = await canUseSupabaseForTeacher();
      if (shouldUseSupabase) {
        const { error } = await supabase.rpc('approve_mission_submission', {
          p_user_id: studentId,
          p_mission_id: missionId,
          p_feedback: feedback ?? null,
        });
        if (error) throw error;
      }

      localStore.update('mission_submissions', submissionId, {
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
        teacher_feedback: feedback || null,
      });

      const student = localStore.getById('profiles', studentId);
      if (student) {
        awardStudentProgress(studentId, mission.eco_points_reward || 0);
      }

      localStore.insert('notifications', {
        user_id: studentId,
        title: `Mission approved! +${mission.eco_points_reward} EcoPoints 🌿`,
        body: `Your mission "${mission.title}" was approved by ${profile?.full_name ?? 'your teacher'}.${feedback ? ` Feedback: ${feedback}` : ''}`,
        type: 'mission',
        is_read: false,
      });

      return {
        studentName: student?.full_name || '',
        points: mission.eco_points_reward,
        alreadyApproved: false,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-submissions'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-weekly-approved'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-class-weekly'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-top-students-week'] });
      queryClient.invalidateQueries({ queryKey: ['rank'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-points'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      if (data.alreadyApproved) {
        toast({ title: 'Already approved', description: 'Points were already awarded for this submission' });
      } else {
        toast({ title: `Approved! 🌿`, description: `Student earned ${data.points} EcoPoints` });
      }
    },
    onError: (err: Error) => {
      toast({ title: 'Error approving', description: err.message, variant: 'destructive' });
    },
  });

  // Reject submission
  const rejectSubmission = useMutation({
    mutationFn: async ({ submissionId, missionId, studentId, reason, feedback }: { submissionId: string; missionId: string; studentId: string; reason: string; feedback?: string }) => {
      localStore.update('mission_submissions', submissionId, {
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
        teacher_feedback: `${reason}${feedback ? `. ${feedback}` : ''}`,
      });

      localStore.insert('notifications', {
        user_id: studentId,
        title: 'Mission needs revision',
        body: `${reason}${feedback ? `. ${feedback}` : ''}. Try again! 💪`,
        type: 'mission',
        is_read: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-submissions'] });
      toast({ title: 'Submission rejected', description: 'Student has been notified' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error rejecting', description: err.message, variant: 'destructive' });
    },
  });

  // Award bonus points
  const awardBonusPoints = useMutation({
    mutationFn: async ({ studentId, points, reason }: { studentId: string; points: number; reason: string }) => {
      if (points > 50 || points < 1) throw new Error('Points must be 1-50');

      const student = localStore.getById('profiles', studentId);
      if (!student) throw new Error('Student not found');

      localStore.update('profiles', studentId, { eco_points: student.eco_points + points });

      const today = new Date().toISOString().split('T')[0];
      const existing = localStore.query('daily_points', (d) => d.user_id === studentId && d.date === today)[0];
      if (existing) {
        localStore.update('daily_points', existing.id, { points_earned: existing.points_earned + points });
      } else {
        localStore.insert('daily_points', { user_id: studentId, date: today, points_earned: points });
      }

      localStore.insert('notifications', {
        user_id: studentId,
        title: `You received ${points} bonus EcoPoints! 🎉`,
        body: `From ${profile?.full_name ?? 'your teacher'}. Reason: ${reason}`,
        type: 'reward',
        is_read: false,
      });

      return student.full_name;
    },
    onSuccess: (name) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-students'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-class-weekly'] });
      toast({ title: `Bonus points awarded to ${name}! 🎉` });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  // Create custom mission
  const createMission = useMutation({
    mutationFn: async (mission: {
      title: string;
      description: string;
      category: string;
      difficulty: string;
      eco_points_reward: number;
      requires_photo: boolean;
      requires_location: boolean;
      school_only: boolean;
      expires_at?: string;
    }) => {
      const xpMap: Record<string, number> = { easy: 25, medium: 50, hard: 100 };
      localStore.insert('missions', {
        ...mission,
        xp_reward: xpMap[mission.difficulty] ?? 25,
        created_by: userId,
        is_active: true,
        icon: '🌿',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-missions'] });
      toast({ title: 'Mission created! 🌿', description: 'Your students can now see it' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error creating mission', description: err.message, variant: 'destructive' });
    },
  });

  // All missions
  const missionsQuery = useQuery({
    queryKey: ['teacher-missions'],
    queryFn: async () => {
      return localStore.query('missions', (m) => m.is_active)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!userId,
  });

  // Student submission counts per mission
  const missionCompletionQuery = useQuery({
    queryKey: ['teacher-mission-completions'],
    queryFn: async () => {
      const submissions = localStore.query('mission_submissions', (s) => s.status === 'approved');
      const counts: Record<string, number> = {};
      submissions.forEach(d => {
        counts[d.mission_id] = (counts[d.mission_id] || 0) + 1;
      });
      return counts;
    },
    enabled: !!userId,
  });

  return {
    students: studentsQuery.data ?? [],
    submissions: submissionsQuery.data ?? [],
    pendingCount,
    weeklyApproved: weeklyApprovedQuery.data ?? 0,
    classTotalPoints,
    activeThisWeek: activeThisWeekQuery.data ?? 0,
    classWeekly: classWeeklyQuery.data ?? [],
    topStudentsWeek: topStudentsWeekQuery.data ?? [],
    missions: missionsQuery.data ?? [],
    missionCompletions: missionCompletionQuery.data ?? {},
    isLoading: studentsQuery.isLoading || submissionsQuery.isLoading,
    approveSubmission,
    rejectSubmission,
    awardBonusPoints,
    createMission,
  };
}