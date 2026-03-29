import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localStore } from '@/lib/localStore';
import { awardStudentProgress } from '@/lib/progression';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useDashboardData() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const canUseSupabaseForUser = async (targetUserId: string) => {
    const { data } = await supabase.auth.getSession();
    const sessionUserId = data.session?.user?.id;
    return !!sessionUserId && sessionUserId === targetUserId;
  };

  // Rank: count users with more eco_points + 1
  const rankQuery = useQuery({
    queryKey: ['rank', userId, profile?.eco_points],
    queryFn: async () => {
      if (!userId || !profile) return 999;
      const count = localStore.query('profiles', (p) => p.eco_points > profile.eco_points).length;
      return count + 1;
    },
    enabled: !!userId && !!profile,
  });

  // Top 5 leaderboard
  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const profiles = localStore.getAll('profiles');
      return profiles
        .sort((a, b) => b.eco_points - a.eco_points)
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          full_name: p.full_name,
          avatar_emoji: p.avatar_emoji,
          eco_points: p.eco_points,
          school_name: p.school_name,
        }));
    },
    enabled: !!userId,
  });

  // Missions (first 3 for dashboard)
  const missionsQuery = useQuery({
    queryKey: ['dashboard-missions'],
    queryFn: async () => {
      return localStore.query('missions', (m) => m.is_active).slice(0, 3);
    },
    enabled: !!userId,
  });

  // User's submissions
  const submissionsQuery = useQuery({
    queryKey: ['submissions', userId],
    queryFn: async () => {
      if (!userId) return [];
      const submissions = localStore.query('mission_submissions', (s) => s.user_id === userId);
      return submissions.map(s => ({
        ...s,
        missions: localStore.getById('missions', s.mission_id)
      }));
    },
    enabled: !!userId,
  });

  // Weekly points (last 7 days)
  const weeklyQuery = useQuery({
    queryKey: ['weekly-points', userId],
    queryFn: async () => {
      if (!userId) return [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const limitDate = sevenDaysAgo.toISOString().split('T')[0];

      const points = localStore.query('daily_points', (d) => d.user_id === userId && d.date >= limitDate);
      return points.sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!userId,
  });

  // Recent activity (last 4 approved/pending submissions)
  const activityQuery = useQuery({
    queryKey: ['activity', userId],
    queryFn: async () => {
      if (!userId) return [];
      const submissions = localStore.query('mission_submissions',
        (s) => s.user_id === userId && ['approved', 'pending', 'in_progress'].includes(s.status)
      );
      return submissions
        .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
        .slice(0, 4)
        .map(s => ({
          ...s,
          missions: localStore.getById('missions', s.mission_id)
        }));
    },
    enabled: !!userId,
  });

  // Notifications
  const notificationsQuery = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];
      const notifications = localStore.query('notifications', (n) => n.user_id === userId);
      return notifications
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);
    },
    enabled: !!userId,
  });

  const unreadCount = (notificationsQuery.data ?? []).filter(n => !n.is_read).length;

  // Accept mission mutation
  const acceptMission = useMutation({
    mutationFn: async (missionId: string) => {
      if (!userId) throw new Error('Not authenticated');

      const shouldUseSupabase = await canUseSupabaseForUser(userId);
      if (shouldUseSupabase) {
        const { error } = await supabase
          .from('mission_submissions')
          .upsert(
            {
              user_id: userId,
              mission_id: missionId,
              status: 'in_progress',
            },
            { onConflict: 'user_id,mission_id' }
          );
        if (error) throw error;
      }

      localStore.insert('mission_submissions', {
        user_id: userId,
        mission_id: missionId,
        status: 'in_progress',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      toast({ title: 'Quest accepted! 🌿', description: 'Complete it and submit proof to earn points' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  // Submit proof mutation
  const submitProof = useMutation({
    mutationFn: async ({ submissionId, photoUrl, notes, coords }: { submissionId: string; photoUrl?: string; notes?: string; coords?: { lat: number; lng: number } }) => {
      if (!userId) throw new Error('Not authenticated');

      const submission = localStore.getById('mission_submissions', submissionId);
      if (!submission) throw new Error('Submission not found');

      const mission = localStore.getById('missions', submission.mission_id);
      if (!mission) throw new Error('Mission not found');

      const shouldAutoApprove = !mission.requires_teacher_approval;

      const shouldUseSupabase = await canUseSupabaseForUser(userId);
      if (shouldUseSupabase) {
        const { error } = await supabase.rpc('submit_mission_proof', {
          p_mission_id: submission.mission_id,
          p_photo_url: photoUrl ?? null,
          p_notes: notes ?? null,
          p_location_coords: coords ?? null,
        });
        if (error) throw error;
      }

      localStore.update('mission_submissions', submissionId, {
        status: shouldAutoApprove ? 'approved' : 'pending',
        photo_url: photoUrl,
        notes,
        location_coords: coords,
        submitted_at: new Date().toISOString(),
        reviewed_at: shouldAutoApprove ? new Date().toISOString() : null,
      });

      if (shouldAutoApprove) {
        awardStudentProgress(userId, mission.eco_points_reward || 0);
        localStore.insert('notifications', {
          user_id: userId,
          title: `Mission completed! +${mission.eco_points_reward || 0} EcoPoints 🌿`,
          body: `Great work on "${mission.title}". Your reward was added instantly.`,
          type: 'mission',
          is_read: false,
        });
      }

      return {
        autoApproved: shouldAutoApprove,
        pointsAwarded: shouldAutoApprove ? (mission.eco_points_reward || 0) : 0,
      };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
      queryClient.invalidateQueries({ queryKey: ['weekly-points'] });
      queryClient.invalidateQueries({ queryKey: ['rank'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await refreshProfile();

      if (result.autoApproved) {
        toast({ title: 'Mission completed! 🎉', description: `You earned ${result.pointsAwarded} EcoPoints` });
      } else {
        toast({ title: 'Proof submitted! 📸', description: 'Your teacher will review it soon' });
      }
    },
  });

  // Auto-approve check (mocked for local)
  const checkAutoApprove = async () => {
    // Left empty for local version
  };

  // Trees planted (approved planting missions)
  const treesPlantedQuery = useQuery({
    queryKey: ['trees-planted', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const submissions = localStore.query('mission_submissions', (s) => s.user_id === userId && s.status === 'approved');
      let count = 0;
      for (const sub of submissions) {
        const mission = localStore.getById('missions', sub.mission_id);
        if (mission?.category === 'planting') count++;
      }
      return count;
    },
    enabled: !!userId,
  });

  // Real user count (for badge logic)
  const realUserCountQuery = useQuery({
    queryKey: ['real-user-count'],
    queryFn: async () => {
      return localStore.getAll('profiles').length;
    },
    enabled: !!userId,
  });

  // Mark all notifications read
  const markAllRead = async () => {
    if (!userId) return;
    const notifications = localStore.query('notifications', (n) => n.user_id === userId);
    notifications.forEach(n => {
      localStore.update('notifications', n.id, { is_read: true });
    });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return {
    profile,
    rank: rankQuery.data ?? 999,
    leaderboard: leaderboardQuery.data ?? [],
    missions: missionsQuery.data ?? [],
    submissions: submissionsQuery.data ?? [],
    weeklyPoints: weeklyQuery.data ?? [],
    activity: activityQuery.data ?? [],
    notifications: notificationsQuery.data ?? [],
    unreadCount,
    treesPlanted: treesPlantedQuery.data ?? 0,
    realUserCount: realUserCountQuery.data ?? 0,
    isLoading: !profile || missionsQuery.isLoading,
    acceptMission,
    submitProof,
    checkAutoApprove,
    markAllRead,
    refreshProfile,
  };
}