import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localStore } from '@/lib/localStore';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useProfileData() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = user?.id;

  // Missions completed (approved)
  const missionsCompletedQuery = useQuery({
    queryKey: ['profile-missions-completed', userId],
    queryFn: async () => {
      if (!userId) return 0;
      return localStore.query('mission_submissions', (s) => s.user_id === userId && s.status === 'approved').length;
    },
    enabled: !!userId,
  });

  // Trees planted (approved planting missions)
  const treesPlantedQuery = useQuery({
    queryKey: ['profile-trees-planted', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const submissions = localStore.query('mission_submissions', (s) => s.user_id === userId && s.status === 'approved');
      let count = 0;
      for (const s of submissions) {
        const m = localStore.getById('missions', s.mission_id);
        if (m?.category === 'planting') count++;
      }
      return count;
    },
    enabled: !!userId,
  });

  // Water missions (approved)
  const waterMissionsQuery = useQuery({
    queryKey: ['profile-water-missions', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const submissions = localStore.query('mission_submissions', (s) => s.user_id === userId && s.status === 'approved');
      let count = 0;
      for (const s of submissions) {
        const m = localStore.getById('missions', s.mission_id);
        if (m?.category === 'water') count++;
      }
      return count;
    },
    enabled: !!userId,
  });

  // Waste missions (approved)
  const wasteMissionsQuery = useQuery({
    queryKey: ['profile-waste-missions', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const submissions = localStore.query('mission_submissions', (s) => s.user_id === userId && s.status === 'approved');
      let count = 0;
      for (const s of submissions) {
        const m = localStore.getById('missions', s.mission_id);
        if (m?.category === 'waste') count++;
      }
      return count;
    },
    enabled: !!userId,
  });

  // Category counts for badge logic (Globe Trotter)
  const categoriesQuery = useQuery({
    queryKey: ['profile-categories', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const submissions = localStore.query('mission_submissions', (s) => s.user_id === userId && s.status === 'approved');
      const cats = new Set();
      for (const s of submissions) {
        const m = localStore.getById('missions', s.mission_id);
        if (m?.category) cats.add(m.category);
      }
      return cats.size;
    },
    enabled: !!userId,
  });

  // Weekly points for trend
  const weeklyPointsQuery = useQuery({
    queryKey: ['profile-weekly-points', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const limit = sevenDaysAgo.toISOString().split('T')[0];
      const points = localStore.query('daily_points', (d) => d.user_id === userId && d.date >= limit);
      return points.reduce((sum, d) => sum + d.points_earned, 0);
    },
    enabled: !!userId,
  });

  // Monthly missions for trend
  const monthlyMissionsQuery = useQuery({
    queryKey: ['profile-monthly-missions', userId],
    queryFn: async () => {
      if (!userId) return 0;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const limit = startOfMonth.toISOString();
      return localStore.query('mission_submissions', (s) => s.user_id === userId && s.status === 'approved' && (s.submitted_at || '') >= limit).length;
    },
    enabled: !!userId,
  });

  // Real user count for badge logic
  const realUserCountQuery = useQuery({
    queryKey: ['profile-real-user-count'],
    queryFn: async () => {
      return localStore.getAll('profiles').length;
    },
    enabled: !!userId,
  });

  // Rank among real users
  const rankQuery = useQuery({
    queryKey: ['profile-rank', userId, profile?.eco_points],
    queryFn: async () => {
      if (!userId || !profile) return 999;
      return localStore.query('profiles', (p) => p.eco_points > profile.eco_points).length + 1;
    },
    enabled: !!userId && !!profile,
  });

  // Submissions with mission data (paginated)
  const submissionsQuery = (offset: number, limit: number, filter: 'all' | 'week' | 'month') => {
    let gte: string | undefined;
    if (filter === 'week') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      gte = d.toISOString();
    } else if (filter === 'month') {
      const d = new Date(); d.setDate(1); d.setHours(0,0,0,0);
      gte = d.toISOString();
    }
    return useQuery({
      queryKey: ['profile-submissions', userId, offset, limit, filter],
      queryFn: async () => {
        if (!userId) return { data: [], count: 0 };
        let submissions = localStore.query('mission_submissions', (s) => s.user_id === userId);
        if (gte) {
          submissions = submissions.filter(s => (s.submitted_at || '') >= gte!);
        }
        submissions = submissions.sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime());

        const paginated = submissions.slice(offset, offset + limit).map(s => ({
          ...s,
          missions: localStore.getById('missions', s.mission_id)
        }));

        return { data: paginated, count: submissions.length };
      },
      enabled: !!userId,
    });
  };

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (updates: { full_name?: string; school_name?: string; city?: string }) => {
      if (!userId) throw new Error('Not authenticated');
      localStore.update('profiles', userId, updates);
    },
    onSuccess: async () => {
      await refreshProfile();
      toast({ title: 'Profile updated! 🌿' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  // Update avatar mutation
  const updateAvatar = useMutation({
    mutationFn: async (avatar_emoji: string) => {
      if (!userId) throw new Error('Not authenticated');
      localStore.update('profiles', userId, { avatar_emoji });
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      toast({ title: 'Avatar updated! ✨' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  return {
    missionsCompleted: missionsCompletedQuery.data ?? 0,
    treesPlanted: treesPlantedQuery.data ?? 0,
    waterMissions: waterMissionsQuery.data ?? 0,
    wasteMissions: wasteMissionsQuery.data ?? 0,
    categoriesCount: categoriesQuery.data ?? 0,
    weeklyPoints: weeklyPointsQuery.data ?? 0,
    monthlyMissions: monthlyMissionsQuery.data ?? 0,
    realUserCount: realUserCountQuery.data ?? 0,
    rank: rankQuery.data ?? 999,
    submissionsQuery,
    updateProfile,
    updateAvatar,
    isLoading: missionsCompletedQuery.isLoading,
  };
}