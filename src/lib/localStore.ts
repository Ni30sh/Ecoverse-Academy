import { Mission, MissionSubmission, User, LeaderboardEntry, Notification } from './types';

const STORE_KEY = 'ecoquest_db';

export interface Database {
  profiles: any[];
  missions: any[];
  mission_submissions: any[];
  daily_points: any[];
  notifications: any[];
  lessons: any[];
  lesson_completions: any[];
  quiz_attempts: any[];
}

const initialData: Database = {
  profiles: [
    {
      id: 'student1',
      full_name: 'Alex Student',
      email: 'alex@example.com',
      school_name: 'MPGI',
      role: 'student',
      eco_points: 120,
      avatar_emoji: '🌱',
      city: 'Kanpur',
      created_at: new Date().toISOString(),
    },
    {
      id: 'teacher1',
      full_name: 'Ms. Johnson',
      email: 'teacher@example.com',
      school_name: 'MPGI',
      role: 'teacher',
      eco_points: 0,
      avatar_emoji: '📚',
      city: 'Kanpur',
      created_at: new Date().toISOString(),
    }
  ],
  missions: [
    {
      id: 'm1',
      title: 'Plant a Seedling',
      description: 'Plant a new seedling in your garden or local park.',
      category: 'planting',
      difficulty: 'easy',
      eco_points_reward: 50,
      xp_reward: 25,
      requires_photo: true,
      requires_location: false,
      requires_teacher_approval: true,
      icon: '🌱',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'm2',
      title: 'Recycle 5 Plastic Bottles',
      description: 'Collect and recycle 5 plastic bottles.',
      category: 'waste',
      difficulty: 'easy',
      eco_points_reward: 30,
      xp_reward: 15,
      requires_photo: true,
      requires_location: false,
      requires_teacher_approval: true,
      icon: '♻️',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'm3',
      title: 'Bike to School',
      description: 'Use a bicycle to commute to school instead of a car.',
      category: 'transport',
      difficulty: 'medium',
      eco_points_reward: 100,
      xp_reward: 50,
      requires_photo: true,
      requires_location: true,
      requires_teacher_approval: true,
      icon: '🚲',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'm4',
      title: 'Save Water: Shorter Showers',
      description: 'Take a shower that is 5 minutes or less.',
      category: 'water',
      difficulty: 'easy',
      eco_points_reward: 20,
      xp_reward: 10,
      requires_photo: false,
      requires_location: false,
      requires_teacher_approval: false,
      icon: '💧',
      is_active: true,
      created_at: new Date().toISOString(),
    },
    {
      id: 'm5',
      title: 'Energy: Turn off Lights',
      description: 'Turn off all unused lights in your house for 24 hours.',
      category: 'energy',
      difficulty: 'easy',
      eco_points_reward: 25,
      xp_reward: 15,
      requires_photo: false,
      requires_location: false,
      requires_teacher_approval: true,
      icon: '💡',
      is_active: true,
      created_at: new Date().toISOString(),
    }
  ],
  mission_submissions: [
    {
      id: 'sub1',
      user_id: 'student1',
      mission_id: 'm1',
      status: 'approved',
      submitted_at: new Date().toISOString(),
      reviewed_by: 'teacher1',
    },
    {
      id: 'sub2',
      user_id: 'student1',
      mission_id: 'm2',
      status: 'pending',
      photo_url: 'dummy-photo-url',
      submitted_at: new Date().toISOString(),
    }
  ],
  daily_points: [],
  notifications: [],
  lessons: [
    { id: 'l1', title: 'Intro to Climate Change', topic: 'climate_change', order_index: 1, content_type: 'article', eco_points_reward: 10 },
    { id: 'l2', title: 'Greenhouse Gases', topic: 'climate_change', order_index: 2, content_type: 'article', eco_points_reward: 15 },
  ],
  lesson_completions: [],
  quiz_attempts: []
};

function getDb(): Database {
  const data = localStorage.getItem(STORE_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      // Backfill arrays if migrating from older version
      return { ...initialData, ...parsed };
    } catch {
      return initialData;
    }
  }
  // Initialize with initialData and save
  localStorage.setItem(STORE_KEY, JSON.stringify(initialData));
  return initialData;
}

function saveDb(db: Database) {
  localStorage.setItem(STORE_KEY, JSON.stringify(db));
}

export const localStore = {
  getAll: (table: keyof Database) => {
    return getDb()[table];
  },

  getById: (table: keyof Database, id: string) => {
    return getDb()[table].find((item: any) => item.id === id);
  },

  insert: (table: keyof Database, data: any) => {
    const db = getDb();
    const newItem = {
      ...data,
      id: data.id || Math.random().toString(36).substring(2, 9),
      created_at: data.created_at || new Date().toISOString()
    };
    db[table].push(newItem);
    saveDb(db);
    return newItem;
  },

  update: (table: keyof Database, id: string, data: any) => {
    const db = getDb();
    const index = db[table].findIndex((item: any) => item.id === id);
    if (index === -1) return null;

    db[table][index] = { ...db[table][index], ...data };
    saveDb(db);
    return db[table][index];
  },

  remove: (table: keyof Database, id: string) => {
    const db = getDb();
    const index = db[table].findIndex((item: any) => item.id === id);
    if (index === -1) return false;

    db[table].splice(index, 1);
    saveDb(db);
    return true;
  },

  query: (table: keyof Database, filterFn: (item: any) => boolean) => {
    return getDb()[table].filter(filterFn);
  },

  // Helper to sync profiles created by fake auth
  syncAuthUsers: () => {
    const authUsersStr = localStorage.getItem('ecoquest_users');
    if (!authUsersStr) return;
    try {
      const authUsers = JSON.parse(authUsersStr);
      const db = getDb();
      let modified = false;

      authUsers.forEach((authUser: any) => {
        if (!db.profiles.find((p: any) => p.id === authUser.id)) {
          db.profiles.push({
            id: authUser.id,
            full_name: authUser.full_name,
            email: authUser.email,
            school_name: authUser.school_name,
            role: authUser.role,
            eco_points: 0,
            avatar_emoji: authUser.role === 'teacher' ? '📚' : '🌱',
            city: '',
            created_at: authUser.created_at || new Date().toISOString(),
          });
          modified = true;
        }
      });

      if (modified) {
        saveDb(db);
      }
    } catch(e) {}
  }
};
