import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { localStore } from '@/lib/localStore';
import { useAuth } from '@/hooks/useAuth';

export type LearningTopic = {
  id: string;
  title: string;
  icon: string;
  color: string;
};

export type LearningLesson = {
  id: string;
  topic_id: string;
  title: string;
  content: string;
  points: number;
};

const TOPICS_KEY = 'topics';
const LESSONS_KEY = 'lessons';
const LESSON_PROGRESS_KEY = 'lesson_progress';

const DEFAULT_TOPICS: LearningTopic[] = [
  { id: 'topic-climate-change', title: 'Climate Change', icon: '🌡️', color: 'green' },
  { id: 'topic-water-conservation', title: 'Water Conservation', icon: '💧', color: 'blue' },
];

const COLOR_GRADIENTS: Record<string, string> = {
  green: 'from-[hsl(152,44%,15%)] to-[hsl(153,43%,30%)]',
  blue: 'from-[hsl(201,100%,36%)] to-[hsl(193,100%,43%)]',
  orange: 'from-[hsl(27,100%,25%)] to-[hsl(30,89%,38%)]',
  purple: 'from-[hsl(264,81%,31%)] to-[hsl(267,63%,46%)]',
  gray: 'from-[hsl(210,24%,24%)] to-[hsl(208,27%,34%)]',
};

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readTopicsFromStorage(): LearningTopic[] {
  const existing = safeParseArray<LearningTopic>(localStorage.getItem(TOPICS_KEY));
  if (existing.length > 0) return existing;
  localStorage.setItem(TOPICS_KEY, JSON.stringify(DEFAULT_TOPICS));
  return DEFAULT_TOPICS;
}

export function readLessonsFromStorage(): LearningLesson[] {
  return safeParseArray<LearningLesson>(localStorage.getItem(LESSONS_KEY));
}

export function writeTopicsToStorage(topics: LearningTopic[]) {
  localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
}

export function writeLessonsToStorage(lessons: LearningLesson[]) {
  localStorage.setItem(LESSONS_KEY, JSON.stringify(lessons));
}

export function getTopicGradientClass(color: string): string {
  return COLOR_GRADIENTS[color] || COLOR_GRADIENTS.green;
}

function mapLessonForUi(lesson: LearningLesson) {
  const content = lesson.content || '';
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const estimatedMinutes = Math.max(3, Math.ceil(wordCount / 180));
  const summary = content.slice(0, 160) || 'This lesson is ready to explore.';

  return {
    id: lesson.id,
    topic: lesson.topic_id,
    topic_id: lesson.topic_id,
    title: lesson.title,
    body: content,
    summary,
    estimated_minutes: estimatedMinutes,
    eco_points_reward: Number(lesson.points || 0),
    order_index: 0,
    content_json: { body: content, summary },
    fact_boxes: [],
    key_takeaways: [],
  };
}

export const TOPIC_INFO: Record<string, { label: string; icon: string }> = DEFAULT_TOPICS.reduce(
  (acc, topic) => {
    acc[topic.id] = { label: topic.title, icon: topic.icon };
    return acc;
  },
  {} as Record<string, { label: string; icon: string }>
);

export const TOPIC_GRADIENTS: Record<string, string> = {
  climate_change: COLOR_GRADIENTS.green,
  pollution: COLOR_GRADIENTS.gray,
  waste: COLOR_GRADIENTS.green,
  energy: COLOR_GRADIENTS.orange,
  water: COLOR_GRADIENTS.blue,
  biodiversity: COLOR_GRADIENTS.purple,
};

export function useLearningTopics() {
  return useQuery({
    queryKey: ['learning-topics'],
    queryFn: async () => readTopicsFromStorage(),
  });
}

export function useLessons(topic?: string) {
  return useQuery({
    queryKey: ['lessons', topic],
    queryFn: async () => {
      let lessons = readLessonsFromStorage();
      if (topic) {
        lessons = lessons.filter((l) => l.topic_id === topic);
      }
      return lessons.map(mapLessonForUi);
    },
  });
}

export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const lesson = readLessonsFromStorage().find((l) => l.id === lessonId);
      return lesson ? mapLessonForUi(lesson) : null;
    },
    enabled: !!lessonId,
  });
}

export function useUserCompletions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lesson-completions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return localStore.query('lesson_completions' as any, (c: any) => c.user_id === user.id);
    },
    enabled: !!user,
  });
}

export function useQuizAttempts(topic?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['quiz-attempts', user?.id, topic],
    queryFn: async () => {
      if (!user) return [];
      let attempts = localStore.query('quiz_attempts' as any, (a: any) => a.user_id === user.id);
      if (topic) {
        attempts = attempts.filter((a: any) => a.topic === topic);
      }
      return attempts.sort((a: any, b: any) => b.score - a.score);
    },
    enabled: !!user,
  });
}

export function useTopicProgress() {
  const { data: topics = [] } = useLearningTopics();
  const { data: lessons = [] } = useLessons();
  const { data: completions = [] } = useUserCompletions();

  const progressByTopic: Record<string, { completed: number; total: number; percentage: number }> = {};
  const completedIds = new Set(completions.map((c: any) => c.lesson_id));

  topics.forEach((topic) => {
    const topicLessons = lessons.filter((l: any) => l.topic === topic.id);
    const completedCount = topicLessons.filter((l: any) => completedIds.has(l.id)).length;
    progressByTopic[topic.id] = {
      completed: completedCount,
      total: topicLessons.length,
      percentage: topicLessons.length > 0 ? Math.round((completedCount / topicLessons.length) * 100) : 0,
    };
  });

  return progressByTopic;
}

export function useCompleteLesson() {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ lessonId, ecoPoints }: { lessonId: string; ecoPoints: number }) => {
      if (!user) throw new Error('Not authenticated');

      const existing = localStore.query('lesson_completions' as any, (c: any) => c.user_id === user.id && c.lesson_id === lessonId)[0];
      if (existing) {
        return { alreadyCompleted: true };
      }

      localStore.insert('lesson_completions' as any, { user_id: user.id, lesson_id: lessonId });

      const lessonProgress = safeParseArray<{ user_id: string; lesson_id: string; completed: boolean }>(localStorage.getItem(LESSON_PROGRESS_KEY));
      lessonProgress.push({ user_id: user.id, lesson_id: lessonId, completed: true });
      localStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(lessonProgress));

      const profile = localStore.getById('profiles', user.id);
      if (profile) {
        localStore.update('profiles', user.id, { eco_points: (profile.eco_points || 0) + ecoPoints });
      }

      const today = new Date().toISOString().split('T')[0];
      const dailyData = localStore.query('daily_points', (d) => d.user_id === user.id && d.date === today)[0];

      if (dailyData) {
        localStore.update('daily_points', dailyData.id, { points_earned: dailyData.points_earned + ecoPoints });
      } else {
        localStore.insert('daily_points', { user_id: user.id, date: today, points_earned: ecoPoints });
      }

      return { alreadyCompleted: false, pointsAwarded: ecoPoints };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-completions'] });
      refreshProfile();
    },
  });
}

export function useSaveQuizAttempt() {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ topic, score, totalQuestions }: { topic: string; score: number; totalQuestions: number }) => {
      if (!user) throw new Error('Not authenticated');

      const pointsEarned = Math.round((score / totalQuestions) * 30 / 10) * 10;

      localStore.insert('quiz_attempts' as any, {
        user_id: user.id,
        topic,
        score,
        total_questions: totalQuestions,
        points_earned: pointsEarned,
      });

      const profile = localStore.getById('profiles', user.id);
      if (profile) {
        localStore.update('profiles', user.id, { eco_points: (profile.eco_points || 0) + pointsEarned });
      }

      const today = new Date().toISOString().split('T')[0];
      const dailyData = localStore.query('daily_points', (d) => d.user_id === user.id && d.date === today)[0];

      if (dailyData) {
        localStore.update('daily_points', dailyData.id, { points_earned: dailyData.points_earned + pointsEarned });
      } else {
        localStore.insert('daily_points', { user_id: user.id, date: today, points_earned: pointsEarned });
      }

      return { pointsEarned };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
      refreshProfile();
    },
  });
}

export function useRecommendedLessons(limit: number = 3) {
  const { data: topics = [] } = useLearningTopics();
  const { data: lessons = [] } = useLessons();
  const { data: completions = [] } = useUserCompletions();
  const { data: attempts = [] } = useQuizAttempts();

  const completedIds = new Set(completions.map((c: any) => c.lesson_id));

  const lastAttemptByTopic = new Map<string, any>();
  attempts.forEach((attempt: any) => {
    if (!lastAttemptByTopic.has(attempt.topic)) {
      lastAttemptByTopic.set(attempt.topic, attempt);
    }
  });

  const recommendations = topics
    .map((topic) => {
      const topicLessons = lessons.filter((l: any) => l.topic_id === topic.id);
      const completed = topicLessons.filter((l: any) => completedIds.has(l.id)).length;
      const completionRate = topicLessons.length ? completed / topicLessons.length : 0;

      const topicQuiz = lastAttemptByTopic.get(topic.id);
      const quizScore = topicQuiz ? (topicQuiz.score / Math.max(topicQuiz.total_questions || 1, 1)) : 0;

      // Higher priority for low completion and low quiz score.
      const priority = (1 - completionRate) * 0.65 + (1 - quizScore) * 0.35;
      const nextLesson = topicLessons.find((l: any) => !completedIds.has(l.id));

      return {
        topicId: topic.id,
        topicTitle: topic.title,
        lesson: nextLesson,
        priority,
      };
    })
    .filter((r) => !!r.lesson)
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
    .map((r) => ({
      topicId: r.topicId,
      topicTitle: r.topicTitle,
      lessonId: (r.lesson as any).id,
      lessonTitle: (r.lesson as any).title,
      priority: Number(r.priority.toFixed(3)),
    }));

  return recommendations;
}
