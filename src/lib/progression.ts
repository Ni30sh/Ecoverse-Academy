import { localStore } from './localStore';

function toDateOnly(value: string) {
  return value.split('T')[0];
}

function previousDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function calculateStreakDays(userId: string) {
  const dates = localStore
    .query('daily_points', (d) => d.user_id === userId)
    .map((d) => toDateOnly(d.date))
    .filter(Boolean);

  const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b.localeCompare(a));
  if (!uniqueDates.length) return 0;

  const today = new Date().toISOString().split('T')[0];
  let cursor = uniqueDates[0] === today ? today : uniqueDates[0];
  let streak = 0;

  while (uniqueDates.includes(cursor)) {
    streak += 1;
    cursor = previousDate(cursor);
  }

  return streak;
}

export function awardStudentProgress(userId: string, points: number) {
  const student = localStore.getById('profiles', userId);
  if (!student) {
    throw new Error('Student not found');
  }

  const safePoints = Number(points) || 0;
  const today = new Date().toISOString().split('T')[0];

  localStore.update('profiles', userId, {
    eco_points: (student.eco_points || 0) + safePoints,
    last_active_date: today,
  });

  const existing = localStore.query('daily_points', (d) => d.user_id === userId && d.date === today)[0];
  if (existing) {
    localStore.update('daily_points', existing.id, { points_earned: (existing.points_earned || 0) + safePoints });
  } else {
    localStore.insert('daily_points', { user_id: userId, date: today, points_earned: safePoints });
  }

  const streakDays = calculateStreakDays(userId);
  localStore.update('profiles', userId, { streak_days: streakDays, last_active_date: today });

  return { streakDays, pointsAwarded: safePoints };
}
