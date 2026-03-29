import type { User, School, Mission, Badge, LeaderboardEntry, Lesson, Notification, Reward } from './types';

export const MOCK_SCHOOLS: School[] = [
  { id: 's1', name: 'Green Valley Academy', city: 'Portland', country: 'USA', logo_url: '', total_eco_points: 125000, student_count: 340 },
  { id: 's2', name: 'Sunrise International', city: 'Mumbai', country: 'India', logo_url: '', total_eco_points: 98000, student_count: 520 },
  { id: 's3', name: 'Nordic Nature School', city: 'Oslo', country: 'Norway', logo_url: '', total_eco_points: 110000, student_count: 180 },
  { id: 's4', name: 'Maharana Pratap', city: 'Udaipur', country: 'India', logo_url: '', total_eco_points: 75000, student_count: 420 },
];

export const MOCK_USER: User = {
  id: 'u1',
  email: 'alex@greenvalley.edu',
  full_name: 'Alex Rivera',
  avatar_url: '',
  role: 'student',
  school_id: 's1',
  eco_points: 2750,
  level: 5,
  level_title: '🌲🌲 Grove',
  streak_days: 12,
  last_active_date: new Date().toISOString(),
  badges: ['b1', 'b2', 'b3', 'b5', 'b8'],
  interests: ['climate_change', 'biodiversity', 'water'],
  daily_goal: 2,
};

export const MOCK_MISSIONS: Mission[] = [
  { id: 'm1', title: 'Plant a Native Tree', description: 'Plant a tree native to your region in your school grounds or local park.', category: 'planting', difficulty: 'medium', eco_points_reward: 100, xp_reward: 50, requires_photo: true, requires_location: true, requires_teacher_approval: true, icon_url: '🌱', steps: ['Choose a native species', 'Find a suitable spot', 'Dig a hole twice the root ball size', 'Plant and water thoroughly', 'Take a photo with your tree'] },
  { id: 'm2', title: 'Campus Waste Audit', description: 'Count and categorize waste bins around your campus. Document what types of waste are being generated.', category: 'waste', difficulty: 'easy', eco_points_reward: 50, xp_reward: 25, requires_photo: true, requires_location: false, requires_teacher_approval: false, icon_url: '♻️', steps: ['Walk around campus', 'Count all waste bins', 'Categorize waste types', 'Take photos of findings'] },
  { id: 'm3', title: 'Energy Patrol', description: 'Identify and turn off unused lights, electronics, and appliances in your school.', category: 'energy', difficulty: 'easy', eco_points_reward: 50, xp_reward: 25, requires_photo: true, requires_location: false, requires_teacher_approval: false, icon_url: '⚡' },
  { id: 'm4', title: 'Water Conservation Challenge', description: 'Monitor and reduce water usage at home for one week. Track daily water consumption.', category: 'water', difficulty: 'hard', eco_points_reward: 200, xp_reward: 100, requires_photo: false, requires_location: false, requires_teacher_approval: true, icon_url: '💧' },
  { id: 'm5', title: 'Bike to School Week', description: 'Cycle or walk to school for 5 consecutive days instead of using motorized transport.', category: 'transport', difficulty: 'hard', eco_points_reward: 200, xp_reward: 100, requires_photo: true, requires_location: true, requires_teacher_approval: false, icon_url: '🚲' },
  { id: 'm6', title: 'Butterfly Garden', description: 'Create a small butterfly-friendly garden with native flowering plants.', category: 'biodiversity', difficulty: 'medium', eco_points_reward: 100, xp_reward: 50, requires_photo: true, requires_location: true, requires_teacher_approval: true, icon_url: '🦋' },
  { id: 'm7', title: 'Composting Station', description: 'Set up a composting station at school or home for organic waste.', category: 'waste', difficulty: 'medium', eco_points_reward: 100, xp_reward: 50, requires_photo: true, requires_location: false, requires_teacher_approval: true, icon_url: '🪱' },
  { id: 'm8', title: 'Solar Energy Report', description: 'Research and present findings on how your school could benefit from solar panels.', category: 'energy', difficulty: 'hard', eco_points_reward: 200, xp_reward: 100, requires_photo: false, requires_location: false, requires_teacher_approval: true, icon_url: '☀️' },
  { id: 'm9', title: 'Rain Water Harvesting', description: 'Design a simple rainwater collection system for school garden use.', category: 'water', difficulty: 'medium', eco_points_reward: 100, xp_reward: 50, requires_photo: true, requires_location: true, requires_teacher_approval: true, icon_url: '🌧️' },
  { id: 'm10', title: 'Campus Tree Census', description: 'Identify and catalog all tree species on your school campus.', category: 'biodiversity', difficulty: 'easy', eco_points_reward: 50, xp_reward: 25, requires_photo: true, requires_location: false, requires_teacher_approval: false, icon_url: '🌳' },
];

export const MOCK_BADGES: Badge[] = [
  { id: 'b1', name: 'First Steps', description: 'Complete your first mission', icon: '🌱', trigger: { type: 'missions_completed', count: 1 }, earned: true },
  { id: 'b2', name: 'On Fire', description: '7-day streak', icon: '🔥', trigger: { type: 'streak', count: 7 }, earned: true },
  { id: 'b3', name: 'Water Guardian', description: 'Complete 5 water missions', icon: '💧', trigger: { type: 'category_missions', count: 5, category: 'water' }, earned: true },
  { id: 'b4', name: 'Recycling Hero', description: 'Complete 5 waste missions', icon: '♻️', trigger: { type: 'category_missions', count: 5, category: 'waste' }, earned: false },
  { id: 'b5', name: 'Tree Hugger', description: 'Plant 3 trees', icon: '🌳', trigger: { type: 'trees_planted', count: 3 }, earned: true },
  { id: 'b6', name: 'Eco Scholar', description: 'Complete 10 lessons', icon: '📚', trigger: { type: 'lessons_completed', count: 10 }, earned: false },
  { id: 'b7', name: 'Top 10', description: 'Reach top 10 on leaderboard', icon: '🏆', trigger: { type: 'leaderboard_rank', count: 10 }, earned: false },
  { id: 'b8', name: 'Globe Trotter', description: 'Complete missions in 3 categories', icon: '🌍', trigger: { type: 'categories_completed', count: 3 }, earned: true },
  { id: 'b9', name: 'Quick Learner', description: 'Get 100% on a quiz', icon: '⚡', trigger: { type: 'perfect_quiz' }, earned: false },
  { id: 'b10', name: 'Team Player', description: 'Participate in a school challenge', icon: '🤝', trigger: { type: 'challenge_participated' }, earned: false },
  { id: 'b11', name: 'Early Bird', description: 'Complete a mission before 8 AM', icon: '🌅', trigger: { type: 'early_mission' }, earned: false },
  { id: 'b12', name: 'Night Owl', description: 'Study eco lessons after 9 PM', icon: '🦉', trigger: { type: 'night_lesson' }, earned: false },
];

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { user_id: 'u5', user_name: 'Priya Sharma', avatar_url: '', school_name: 'Sunrise International', eco_points: 8200, rank: 1, rank_change: 0, badges: ['b1', 'b2', 'b3'] },
  { user_id: 'u6', user_name: 'Erik Larsen', avatar_url: '', school_name: 'Nordic Nature School', eco_points: 7800, rank: 2, rank_change: 1, badges: ['b1', 'b5'] },
  { user_id: 'u7', user_name: 'Maya Chen', avatar_url: '', school_name: 'Green Valley Academy', eco_points: 6500, rank: 3, rank_change: -1, badges: ['b1', 'b8'] },
  { user_id: 'u1', user_name: 'Alex Rivera', avatar_url: '', school_name: 'Green Valley Academy', eco_points: 2750, rank: 4, rank_change: 2, badges: ['b1', 'b2'] },
  { user_id: 'u8', user_name: 'Sam Okafor', avatar_url: '', school_name: 'Green Valley Academy', eco_points: 2400, rank: 5, rank_change: 0, badges: ['b1'] },
  { user_id: 'u9', user_name: 'Lena Fischer', avatar_url: '', school_name: 'Nordic Nature School', eco_points: 2100, rank: 6, rank_change: -2, badges: ['b1'] },
  { user_id: 'u10', user_name: 'Kai Tanaka', avatar_url: '', school_name: 'Sunrise International', eco_points: 1900, rank: 7, rank_change: 1, badges: ['b1'] },
  { user_id: 'u11', user_name: 'Zara Ahmed', avatar_url: '', school_name: 'Sunrise International', eco_points: 1600, rank: 8, rank_change: 0, badges: [] },
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Mission Approved! 🌿', body: 'Your "Plant a Native Tree" mission was approved. +100 EcoPoints!', type: 'mission', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'n2', title: 'Badge Earned! 🏆', body: 'You unlocked the "Globe Trotter" badge!', type: 'badge', is_read: false, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'n3', title: 'Streak Milestone 🔥', body: '10-day streak! You\'re on fire! +50 bonus EcoPoints', type: 'streak', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'n4', title: 'New Challenge! 📣', body: 'Monsoon Water Challenge starts tomorrow. Join your school!', type: 'challenge', is_read: true, created_at: new Date(Date.now() - 172800000).toISOString() },
];

export const MOCK_LESSONS: Lesson[] = [
  {
    id: 'l1', title: 'What is Climate Change?', topic: 'climate_change', content_type: 'article',
    content_json: { body: 'Climate change refers to long-term shifts in global temperatures and weather patterns. While climate shifts can be natural, since the 1800s, human activities have been the main driver — primarily due to burning fossil fuels like coal, oil, and gas.', summary: 'Understanding the basics of climate change and its causes.' },
    eco_points_reward: 20, estimated_minutes: 10, order_index: 1,
  },
  {
    id: 'l2', title: 'Climate Change Quiz', topic: 'climate_change', content_type: 'quiz',
    content_json: { questions: [
      { question: 'What is the main greenhouse gas produced by human activity?', options: ['Oxygen', 'Carbon Dioxide', 'Nitrogen', 'Helium'], correct_index: 1, explanation: 'CO₂ from burning fossil fuels is the primary greenhouse gas driving climate change.' },
      { question: 'What global agreement aims to limit warming to 1.5°C?', options: ['Kyoto Protocol', 'Montreal Protocol', 'Paris Agreement', 'Geneva Convention'], correct_index: 2, explanation: 'The Paris Agreement (2015) set the goal of limiting global warming to 1.5°C above pre-industrial levels.' },
      { question: 'Which sector produces the most greenhouse gas emissions?', options: ['Agriculture', 'Energy', 'Transport', 'Manufacturing'], correct_index: 1, explanation: 'Energy production (electricity and heat) accounts for about 25% of global emissions.' },
    ] },
    eco_points_reward: 30, estimated_minutes: 5, order_index: 2,
  },
  {
    id: 'l3', title: 'Understanding Pollution', topic: 'pollution', content_type: 'article',
    content_json: { body: 'Pollution is the introduction of harmful materials into the environment. These harmful materials are called pollutants. They can be natural or created by human activity.', summary: 'Types and impacts of environmental pollution.' },
    eco_points_reward: 20, estimated_minutes: 8, order_index: 1,
  },
  {
    id: 'l4', title: 'Waste Reduction Strategies', topic: 'waste', content_type: 'article',
    content_json: { body: 'The waste hierarchy — Reduce, Reuse, Recycle — provides a guide for minimizing waste. Reducing consumption is the most effective strategy.', summary: 'Learn the waste hierarchy and practical reduction tips.' },
    eco_points_reward: 20, estimated_minutes: 8, order_index: 1,
  },
  {
    id: 'l5', title: 'Renewable Energy Sources', topic: 'energy', content_type: 'article',
    content_json: { body: 'Renewable energy comes from sources that are naturally replenished: solar, wind, hydro, geothermal, and biomass. These sources produce little to no greenhouse gas emissions.', summary: 'Overview of renewable energy sources and their benefits.' },
    eco_points_reward: 20, estimated_minutes: 10, order_index: 1,
  },
  {
    id: 'l6', title: 'Water Conservation', topic: 'water', content_type: 'article',
    content_json: { body: 'Fresh water makes up only 3% of Earth\'s water, and only 1% is accessible. Conservation is critical for ensuring clean water for future generations.', summary: 'Why water conservation matters and how to practice it.' },
    eco_points_reward: 20, estimated_minutes: 8, order_index: 1,
  },
];

export const MOCK_REWARDS: Reward[] = [
  { id: 'r1', title: 'Eco Warrior Certificate', description: 'Official digital certificate recognizing your environmental contributions.', type: 'certificate', eco_points_cost: 500, stock: 999, image_url: '', partner_name: 'EcoQuest', is_active: true },
  { id: 'r2', title: 'Bamboo Water Bottle', description: 'Sustainable bamboo and steel water bottle.', type: 'product', eco_points_cost: 1500, stock: 50, image_url: '', partner_name: 'EcoLife', is_active: true },
  { id: 'r3', title: 'Tree Planting Donation', description: 'We plant a real tree in your name.', type: 'product', eco_points_cost: 2000, stock: 100, image_url: '', partner_name: 'One Tree Planted', is_active: true },
  { id: 'r4', title: 'Eco Scholarship Entry', description: 'Entry into the annual EcoQuest scholarship program.', type: 'scholarship', eco_points_cost: 5000, stock: 10, image_url: '', partner_name: 'EcoQuest Foundation', is_active: true },
  { id: 'r5', title: 'Streak Freeze', description: 'Protect your streak for one missed day.', type: 'coupon', eco_points_cost: 50, stock: 999, image_url: '', partner_name: 'EcoQuest', is_active: true },
];

export const WEEKLY_POINTS = [
  { day: 'Mon', points: 120 },
  { day: 'Tue', points: 80 },
  { day: 'Wed', points: 200 },
  { day: 'Thu', points: 50 },
  { day: 'Fri', points: 150 },
  { day: 'Sat', points: 0 },
  { day: 'Sun', points: 100 },
];

export const TOPIC_INFO: Record<string, { label: string; icon: string; color: string }> = {
  climate_change: { label: 'Climate Change', icon: '🌡️', color: 'coral-bloom' },
  pollution: { label: 'Pollution & Waste', icon: '🏭', color: 'muted-foreground' },
  waste: { label: 'Waste Management', icon: '♻️', color: 'moss-green' },
  energy: { label: 'Energy', icon: '⚡', color: 'amber-sun' },
  water: { label: 'Water', icon: '💧', color: 'sky-biolume' },
  biodiversity: { label: 'Biodiversity', icon: '🦋', color: 'violet-dusk' },
};

export const CATEGORY_INFO: Record<string, { label: string; icon: string }> = {
  planting: { label: 'Planting', icon: '🌱' },
  waste: { label: 'Waste', icon: '♻️' },
  energy: { label: 'Energy', icon: '⚡' },
  water: { label: 'Water', icon: '💧' },
  transport: { label: 'Transport', icon: '🚲' },
  biodiversity: { label: 'Biodiversity', icon: '🦋' },
  campus: { label: 'Campus', icon: '🏫' },
};
