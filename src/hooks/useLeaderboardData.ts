import { useQuery } from '@tanstack/react-query';
import { localStore } from '@/lib/localStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { getLevelForPoints } from '@/lib/types';

export type TimePeriod = 'all_time' | 'this_week' | 'this_month';
export type LeaderboardScope = 'global' | 'my_school';

export interface LeaderboardEntry {
  user_id: string;
  full_name: string;
  avatar_emoji: string;
  school_name: string;
  eco_points: number;
  streak_days: number;
  rank: number;
  level_title: string;
  missions_completed?: number;
  is_bot?: boolean;
}

const ECO_BOTS: Omit<LeaderboardEntry, 'rank' | 'level_title'>[] = [
  { user_id: 'bot-maya', full_name: 'Maya 🌿', avatar_emoji: '🌿', school_name: 'EcoBot Academy', eco_points: 1850, streak_days: 12, is_bot: true },
  { user_id: 'bot-arjun', full_name: 'Arjun 🌱', avatar_emoji: '🌱', school_name: 'EcoBot Academy', eco_points: 1340, streak_days: 8, is_bot: true },
  { user_id: 'bot-priya', full_name: 'Priya 🍃', avatar_emoji: '🍃', school_name: 'EcoBot Academy', eco_points: 890, streak_days: 5, is_bot: true },
  { user_id: 'bot-sam', full_name: 'Sam 🌳', avatar_emoji: '🌳', school_name: 'EcoBot Academy', eco_points: 420, streak_days: 3, is_bot: true },
];

function getStartOfWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day;
  const sunday = new Date(now.getFullYear(), now.getMonth(), diff);
  return sunday.toISOString().split('T')[0];
}

function getStartOfMonth(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

async function fetchAllTimeLeaderboard(schoolFilter?: string) {
  let profiles = localStore.getAll('profiles');

  if (schoolFilter) {
    profiles = profiles.filter(p => p.school_name === schoolFilter);
  }

  return profiles
    .sort((a, b) => b.eco_points - a.eco_points)
    .slice(0, 50)
    .map(p => ({
      user_id: p.id,
      full_name: p.full_name,
      avatar_emoji: p.avatar_emoji,
      school_name: p.school_name ?? '',
      eco_points: p.eco_points || 0,
      streak_days: p.streak_days || 0,
    }));
}

async function fetchTimePeriodLeaderboard(period: 'this_week' | 'this_month', schoolFilter?: string) {
  const startDate = period === 'this_week' ? getStartOfWeek() : getStartOfMonth();

  const pointsData = localStore.query('daily_points', (d) => d.date >= startDate);

  const userPoints = new Map<string, number>();
  for (const row of pointsData) {
    userPoints.set(row.user_id, (userPoints.get(row.user_id) ?? 0) + row.points_earned);
  }

  if (userPoints.size === 0) return [];

  const userIds = Array.from(userPoints.keys());
  let profiles = localStore.query('profiles', (p) => userIds.includes(p.id));

  if (schoolFilter) {
    profiles = profiles.filter(p => p.school_name === schoolFilter);
  }

  return profiles
    .map(p => ({
      user_id: p.id,
      full_name: p.full_name,
      avatar_emoji: p.avatar_emoji,
      school_name: p.school_name ?? '',
      eco_points: userPoints.get(p.id) ?? 0,
      streak_days: p.streak_days || 0,
    }))
    .sort((a, b) => b.eco_points - a.eco_points);
}

function rankEntries(
  entries: Omit<LeaderboardEntry, 'rank' | 'level_title'>[],
  injectBots: boolean
): LeaderboardEntry[] {
  let combined = [...entries];

  if (injectBots) {
    combined = [...combined, ...ECO_BOTS];
    combined.sort((a, b) => b.eco_points - a.eco_points);
  }

  return combined.map((e, i) => ({
    ...e,
    rank: i + 1,
    level_title: getLevelForPoints(e.eco_points).title,
  }));
}

export function useLeaderboardData(
  period: TimePeriod,
  scope: LeaderboardScope,
  injectBots: boolean = true
) {
  const { user, profile } = useAuth();
  const schoolName = profile?.school_name ?? '';

  const schoolFilter = scope === 'my_school' ? schoolName : undefined;
  const shouldInjectBots = injectBots && scope === 'global';

  return useQuery({
    queryKey: ['leaderboard', period, scope, schoolFilter, shouldInjectBots],
    queryFn: async () => {
      let raw: Omit<LeaderboardEntry, 'rank' | 'level_title'>[];

      if (period === 'all_time') {
        raw = await fetchAllTimeLeaderboard(schoolFilter);
      } else {
        raw = await fetchTimePeriodLeaderboard(period, schoolFilter);
      }

      const ranked = rankEntries(raw, shouldInjectBots);
      const top3 = ranked.slice(0, 3);
      const rest = ranked.slice(3, 20);
      const currentUserEntry = user ? ranked.find(e => e.user_id === user.id) : undefined;
      const isInTop20 = currentUserEntry ? currentUserEntry.rank <= 20 : false;

      return { entries: ranked, top3, rest, currentUserEntry, isInTop20 };
    },
    enabled: scope === 'global' || !!schoolName,
  });
}

export function useTeacherLeaderboardData(period: TimePeriod) {
  const { profile } = useAuth();
  const schoolName = profile?.school_name ?? '';

  return useQuery({
    queryKey: ['teacher-leaderboard', period, schoolName],
    queryFn: async () => {
      const { data: roleRows, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'student');

      if (roleError) throw roleError;

      const studentIds = (roleRows ?? []).map(r => r.user_id);
      if (studentIds.length === 0) {
        return {
          entries: [],
          top3: [],
          rest: [],
          totalPoints: 0,
          totalStudents: 0,
          pointsChart: [],
          weeklyGrowth: [],
        };
      }

      let studentsQuery = supabase
        .from('profiles')
        .select('id, full_name, eco_points, school_name')
        .in('id', studentIds);

      if (schoolName) {
        studentsQuery = studentsQuery.eq('school_name', schoolName);
      }

      const { data: students, error: studentError } = await studentsQuery;
      if (studentError) throw studentError;

      const scopedStudents = students ?? [];
      if (scopedStudents.length === 0) {
        return {
          entries: [],
          top3: [],
          rest: [],
          totalPoints: 0,
          totalStudents: 0,
          pointsChart: [],
          weeklyGrowth: [],
        };
      }

      const scopedStudentIds = scopedStudents.map(s => s.id);

      const { data: submissions, error: submissionError } = await supabase
        .from('mission_submissions')
        .select('user_id, status, submitted_at')
        .in('user_id', scopedStudentIds);

      if (submissionError) throw submissionError;

      const submissionsByStudent = new Map<string, number>();
      (submissions ?? []).forEach((sub) => {
        if (sub.status === 'approved') {
          submissionsByStudent.set(sub.user_id, (submissionsByStudent.get(sub.user_id) ?? 0) + 1);
        }
      });

      let pointsForPeriod = new Map<string, number>();
      if (period === 'all_time') {
        pointsForPeriod = new Map(scopedStudents.map(s => [s.id, s.eco_points ?? 0]));
      } else {
        const startDate = period === 'this_week' ? getStartOfWeek() : getStartOfMonth();
        const { data: periodPoints, error: periodError } = await supabase
          .from('daily_points')
          .select('user_id, date, points_earned')
          .in('user_id', scopedStudentIds)
          .gte('date', startDate);

        if (periodError) throw periodError;

        (periodPoints ?? []).forEach((row) => {
          pointsForPeriod.set(row.user_id, (pointsForPeriod.get(row.user_id) ?? 0) + (row.points_earned ?? 0));
        });
      }

      const sortedStudents = [...scopedStudents].sort((a, b) => (pointsForPeriod.get(b.id) ?? 0) - (pointsForPeriod.get(a.id) ?? 0));

      const entries: LeaderboardEntry[] = sortedStudents.map((s, index) => {
        const points = pointsForPeriod.get(s.id) ?? 0;
        return {
          user_id: s.id,
          full_name: s.full_name || 'Unnamed Student',
          avatar_emoji: '🌱',
          school_name: s.school_name ?? '',
          eco_points: points,
          streak_days: 0,
          rank: index + 1,
          level_title: getLevelForPoints(points).title,
          missions_completed: submissionsByStudent.get(s.id) ?? 0,
        };
      });

      const totalPoints = entries.reduce((sum, s) => sum + s.eco_points, 0);

      const pointsChart = entries.slice(0, 10).map((s) => ({
        name: s.full_name,
        points: s.eco_points,
      }));

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const weekStart = sevenDaysAgo.toISOString().split('T')[0];
      const { data: weeklyRows, error: weeklyError } = await supabase
        .from('daily_points')
        .select('date, points_earned, user_id')
        .in('user_id', scopedStudentIds)
        .gte('date', weekStart);

      if (weeklyError) throw weeklyError;

      const byDate: Record<string, number> = {};
      (weeklyRows ?? []).forEach((row) => {
        byDate[row.date] = (byDate[row.date] ?? 0) + (row.points_earned ?? 0);
      });

      const weeklyGrowth = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateKey = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        return {
          day: label,
          points: byDate[dateKey] ?? 0,
        };
      });

      const lowPerformers = entries
        .slice()
        .sort((a, b) => a.eco_points - b.eco_points)
        .slice(0, 3)
        .map((s) => ({ user_id: s.user_id, full_name: s.full_name, points: s.eco_points }));

      const topPerformer = entries[0]
        ? { user_id: entries[0].user_id, full_name: entries[0].full_name, points: entries[0].eco_points }
        : null;

      const trendDirection = weeklyGrowth.length >= 2
        ? weeklyGrowth[weeklyGrowth.length - 1].points >= weeklyGrowth[0].points
          ? 'up'
          : 'down'
        : 'flat';

      return {
        entries,
        top3: entries.slice(0, 3),
        rest: entries.slice(3),
        totalPoints,
        totalStudents: entries.length,
        pointsChart,
        weeklyGrowth,
        insights: {
          topPerformer,
          lowPerformers,
          trendDirection,
          averagePoints: entries.length ? Math.round(totalPoints / entries.length) : 0,
        },
      };
    },
    enabled: !!schoolName,
  });
}