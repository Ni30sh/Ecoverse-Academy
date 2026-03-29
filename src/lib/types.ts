export type UserRole = 'student' | 'teacher' | 'school_admin' | 'ngo_partner';
export type MissionCategory = 'planting' | 'waste' | 'energy' | 'water' | 'transport' | 'biodiversity' | 'campus';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type MissionStatus = 'available' | 'in_progress' | 'pending' | 'approved' | 'rejected' | 'ai_verified';
export type LessonTopic = 'climate_change' | 'pollution' | 'waste' | 'energy' | 'water' | 'biodiversity';
export type ContentType = 'article' | 'quiz' | 'mini_game' | 'video';
export type BadgeTrigger = { type: string; count?: number; category?: string };

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: UserRole;
  school_id: string;
  eco_points: number;
  level: number;
  level_title: string;
  streak_days: number;
  last_active_date: string;
  badges: string[];
  interests: string[];
  daily_goal: number;
}

export interface School {
  id: string;
  name: string;
  city: string;
  country: string;
  logo_url: string;
  total_eco_points: number;
  student_count: number;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: MissionCategory;
  difficulty: Difficulty;
  eco_points_reward: number;
  xp_reward: number;
  requires_photo: boolean;
  requires_location: boolean;
  requires_teacher_approval: boolean;
  icon_url: string;
  steps?: string[];
}

export interface MissionSubmission {
  id: string;
  user_id: string;
  mission_id: string;
  status: MissionStatus;
  photo_url?: string;
  notes?: string;
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

export interface Lesson {
  id: string;
  title: string;
  topic: LessonTopic;
  content_type: ContentType;
  content_json: QuizContent | ArticleContent;
  eco_points_reward: number;
  estimated_minutes: number;
  order_index: number;
}

export interface QuizContent {
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface ArticleContent {
  body: string;
  summary: string;
}

export interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  avatar_url: string;
  school_name: string;
  eco_points: number;
  rank: number;
  rank_change: number;
  badges: string[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  trigger: BadgeTrigger;
  earned?: boolean;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  type: 'certificate' | 'scholarship' | 'product' | 'coupon';
  eco_points_cost: number;
  stock: number;
  image_url: string;
  partner_name: string;
  is_active: boolean;
}

export interface EcosystemState {
  tree_count: number;
  forest_size: number;
  river_cleanliness: number;
  wildlife_count: number;
  sky_clarity: number;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'mission' | 'badge' | 'streak' | 'reward' | 'challenge';
  is_read: boolean;
  created_at: string;
}

export const LEVEL_THRESHOLDS = [
  { level: 1, title: '🌱 Seed', points: 0 },
  { level: 2, title: '🌿 Sprout', points: 200 },
  { level: 3, title: '🌲 Sapling', points: 600 },
  { level: 4, title: '🌳 Tree', points: 1200 },
  { level: 5, title: '🌲🌲 Grove', points: 2500 },
  { level: 6, title: '🌳🌳🌳 Forest', points: 5000 },
  { level: 7, title: '🌍 Eco Warrior', points: 10000 },
  { level: 8, title: '⭐ Planet Guardian', points: 25000 },
];

export function getLevelForPoints(points: number) {
  let current = LEVEL_THRESHOLDS[0];
  for (const threshold of LEVEL_THRESHOLDS) {
    if (points >= threshold.points) current = threshold;
    else break;
  }
  const nextLevel = LEVEL_THRESHOLDS.find(t => t.level === current.level + 1);
  const progress = nextLevel
    ? (points - current.points) / (nextLevel.points - current.points)
    : 1;
  return { ...current, progress, nextLevel };
}

export function getEcosystemStage(points: number): number {
  if (points >= 10000) return 6;
  if (points >= 5000) return 5;
  if (points >= 2500) return 4;
  if (points >= 1200) return 3;
  if (points >= 600) return 2;
  if (points >= 200) return 1;
  return 0;
}
