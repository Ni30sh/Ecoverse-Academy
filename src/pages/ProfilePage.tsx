import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfileData } from '@/hooks/useProfileData';
import { getLevelForPoints } from '@/lib/types';
import EcosystemViewer from '@/components/game/EcosystemViewer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Leaf, Target, Flame, Award, Lock, ChevronRight, Droplets, Recycle, Wind } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const AVATARS = ['🧑‍🌾', '👩‍🔬', '🧑‍🏫', '🌿', '🦊', '🐢'];

// ── CountUp hook ──
function useCountUp(target: number, duration = 1200, delay = 0) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current || target === 0) { setValue(target); return; }
    started.current = true;
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(target * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, duration, delay]);
  return value;
}

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const BADGES_CONFIG = [
  { icon: '🌱', name: 'First Steps', description: 'Complete your first mission', bg: '#D1FAE5', glow: 'rgba(52,211,153,0.35)', unlock: 'Complete 1 mission' },
  { icon: '🔥', name: 'On Fire', description: 'Reach a 7-day streak', bg: '#FEF3C7', glow: 'rgba(244,162,97,0.35)', unlock: 'Maintain 7-day streak' },
  { icon: '💧', name: 'Water Guardian', description: 'Complete 5 water missions', bg: '#EFF6FF', glow: 'rgba(72,202,228,0.35)', unlock: 'Complete 5 water missions' },
  { icon: '♻️', name: 'Recycling Hero', description: 'Complete 5 waste missions', bg: '#F0FFF4', glow: 'rgba(52,211,153,0.35)', unlock: 'Complete 5 waste missions' },
  { icon: '🌳', name: 'Tree Hugger', description: 'Plant 3 trees', bg: '#D1FAE5', glow: 'rgba(52,211,153,0.35)', unlock: 'Complete 3 planting missions' },
  { icon: '📚', name: 'Eco Scholar', description: 'Complete 10 lessons', bg: '#EDE9FE', glow: 'rgba(177,151,252,0.35)', unlock: 'Earn 1000+ EcoPoints' },
  { icon: '🏆', name: 'Top 10', description: 'Reach top 10 on leaderboard', bg: '#FEF3C7', glow: 'rgba(244,162,97,0.35)', unlock: 'Top 10 with 10+ real users' },
  { icon: '🌍', name: 'Globe Trotter', description: 'Missions in 3+ categories', bg: '#DBEAFE', glow: 'rgba(72,202,228,0.35)', unlock: 'Complete missions in 3 categories' },
  { icon: '⚡', name: 'Quick Learner', description: 'Score 100% on any quiz', bg: '#FEF9C3', glow: 'rgba(250,204,21,0.35)', unlock: 'Earn 500+ EcoPoints' },
  { icon: '🤝', name: 'Team Player', description: 'Join a school challenge', bg: '#FCE7F3', glow: 'rgba(236,72,153,0.35)', unlock: 'Earn 800+ EcoPoints' },
  { icon: '🌅', name: 'Early Bird', description: 'Complete a mission before 8 AM', bg: '#FFF7ED', glow: 'rgba(244,162,97,0.35)', unlock: 'Earn 400+ EcoPoints' },
  { icon: '🦉', name: 'Night Owl', description: 'Study eco lessons after 9 PM', bg: '#EDE9FE', glow: 'rgba(177,151,252,0.35)', unlock: 'Earn 600+ EcoPoints' },
];

const categoryColors: Record<string, string> = {
  planting: '#40916C',
  waste: '#48CAE4',
  water: '#0077B6',
  energy: '#D97706',
  transport: '#C2410C',
  campus: '#6D28D9',
  biodiversity: '#065F46',
};

const categoryEmojis: Record<string, string> = {
  planting: '🌱',
  waste: '♻️',
  water: '💧',
  energy: '⚡',
  transport: '🚲',
  campus: '🏫',
  biodiversity: '🦋',
};

function getMotivationalLine(level: number) {
  if (level <= 1) return 'Your journey starts with a single seed. Keep going! 🌱';
  if (level <= 3) return 'Your forest is growing. Every mission makes it stronger! 🌿';
  if (level <= 5) return "You're becoming a true Eco Warrior. The planet thanks you! 🌳";
  return 'Planet Guardian status achieved. You are extraordinary. 🌍';
}

export default function ProfilePage() {
  const { profile } = useAuth();
  const data = useProfileData();
  const [editing, setEditing] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editCity, setEditCity] = useState('');
  const [activityFilter, setActivityFilter] = useState<'all' | 'week' | 'month'>('all');
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 20;

  const submissions = data.submissionsQuery(offset, PAGE_SIZE, activityFilter);

  // Count-up values
  const ecoCount = useCountUp(profile?.eco_points ?? 0, 1200, 400);
  const missionsCount = useCountUp(data.missionsCompleted, 1200, 500);
  const streakCount = useCountUp(profile?.streak_days ?? 0, 800, 600);

  // Compute earned badges
  const earnedBadges = BADGES_CONFIG.map(b => {
    let earned = false;
    if (!profile) return { ...b, earned };
    if (b.name === 'First Steps' && data.missionsCompleted >= 1) earned = true;
    if (b.name === 'On Fire' && profile.streak_days >= 7) earned = true;
    if (b.name === 'Water Guardian' && data.waterMissions >= 5) earned = true;
    if (b.name === 'Recycling Hero' && data.wasteMissions >= 5) earned = true;
    if (b.name === 'Tree Hugger' && data.treesPlanted >= 3) earned = true;
    if (b.name === 'Eco Scholar' && profile.eco_points >= 1000) earned = true;
    if (b.name === 'Top 10' && data.realUserCount >= 10 && data.rank <= 10) earned = true;
    if (b.name === 'Globe Trotter' && data.categoriesCount >= 3) earned = true;
    if (b.name === 'Quick Learner' && profile.eco_points >= 500) earned = true;
    if (b.name === 'Team Player' && profile.eco_points >= 800) earned = true;
    if (b.name === 'Early Bird' && profile.eco_points >= 400) earned = true;
    if (b.name === 'Night Owl' && profile.eco_points >= 600) earned = true;
    return { ...b, earned };
  });

  const badgesEarned = earnedBadges.filter(b => b.earned).length;
  const badgesCount = useCountUp(badgesEarned, 800, 700);

  useEffect(() => { setOffset(0); }, [activityFilter]);

  if (!profile || data.isLoading) {
    return (
      <div className="p-4 md:p-8 max-w-[860px] mx-auto space-y-6">
        <Skeleton className="h-40 rounded-[24px]" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-[20px]" />)}
        </div>
        <Skeleton className="h-64 rounded-[24px]" />
      </div>
    );
  }

  const levelInfo = getLevelForPoints(profile.eco_points);
  const ecosystemHealth = Math.min(100, Math.round((profile.eco_points / 10000) * 100));
  const co2Saved = Math.round(profile.eco_points * 0.02);
  const waterSaved = data.waterMissions * 15;
  const wasteSorted = data.wasteMissions * 2;
  const memberSince = format(new Date(profile.created_at), 'MMM yyyy');

  const startEdit = () => {
    setEditName(profile.full_name);
    setEditSchool(profile.school_name || '');
    setEditCity(profile.city || '');
    setEditing(true);
  };

  const saveEdit = () => {
    data.updateProfile.mutate({ full_name: editName, school_name: editSchool, city: editCity });
    setEditing(false);
  };

  const submissionData = submissions.data?.data ?? [];
  const totalSubmissions = submissions.data?.count ?? 0;
  const hasMore = offset + PAGE_SIZE < totalSubmissions;

  return (
    <div className="p-4 md:p-8 max-w-[860px] mx-auto space-y-6">

      {/* ═══ SECTION 1: HERO CARD ═══ */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="rounded-[24px] bg-card shadow-[var(--shadow-card)] p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div
              className="w-24 h-24 rounded-[20px] flex items-center justify-center text-5xl"
              style={{ background: 'hsl(var(--jungle-pale))', boxShadow: '0 0 20px rgba(64,145,108,0.3)' }}
            >
              {profile.avatar_emoji}
            </div>
            <button onClick={() => setAvatarOpen(true)} className="text-sm font-heading font-semibold" style={{ color: 'hsl(var(--jungle-bright))' }}>
              Change Avatar
            </button>
          </div>

          {/* Identity */}
          <div className="flex-1 text-center md:text-left">
            <AnimatePresence mode="wait">
              {editing ? (
                <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Full Name" className="font-heading font-bold text-lg" />
                  <Input value={editSchool} onChange={e => setEditSchool(e.target.value)} placeholder="School Name" />
                  <Input value={editCity} onChange={e => setEditCity(e.target.value)} placeholder="City / Location" />
                  <div className="flex gap-2">
                    <Button onClick={saveEdit} className="font-heading font-bold rounded-xl" disabled={data.updateProfile.isPending}>Save Changes</Button>
                    <Button variant="ghost" onClick={() => setEditing(false)} className="rounded-xl">Cancel</Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h1 className="font-display font-black text-[28px] text-foreground">{profile.full_name}</h1>
                  {profile.school_name && <p className="text-sm text-muted-foreground">{profile.school_name}</p>}
                  {profile.city && <p className="text-[13px] text-muted-foreground/70">{profile.city}</p>}
                  <div className="flex flex-wrap items-center gap-2 mt-4 justify-center md:justify-start">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-heading font-bold" style={{ background: 'hsl(var(--jungle-pale))', color: 'hsl(var(--foreground))' }}>
                      {levelInfo.title.split(' ')[0]} Lv {levelInfo.level} · {levelInfo.title.split(' ').slice(1).join(' ')}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-heading font-bold" style={{ background: 'hsl(var(--jungle-pale))', color: 'hsl(var(--foreground))' }}>
                      <Leaf className="w-3.5 h-3.5" style={{ color: 'hsl(var(--jungle-bright))' }} /> {profile.eco_points.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-heading" style={{ background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}>
                      Member since {memberSince}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Edit button */}
          {!editing && (
            <Button variant="outline" onClick={startEdit} className="shrink-0 rounded-xl font-heading font-bold border-jungle-bright text-jungle-bright hover:bg-jungle-pale">
              Edit Profile
            </Button>
          )}
        </div>
      </motion.div>

      {/* Avatar Picker Dialog */}
      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Choose Your Avatar</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4 py-4">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => { data.updateAvatar.mutate(a); setAvatarOpen(false); }}
                className={`text-5xl p-4 rounded-2xl border-2 transition-all ${profile.avatar_emoji === a ? 'border-primary bg-jungle-pale scale-110 shadow-[var(--shadow-card)]' : 'border-border bg-card hover:border-primary/30'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ SECTION 2: STATS ROW ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'ECOPOINTS', value: ecoCount.toLocaleString(), trend: `↑ +${data.weeklyPoints} this week`, borderColor: '#40916C', bg: 'linear-gradient(135deg, rgba(64,145,108,0.08) 0%, #ffffff 100%)' },
          { label: 'MISSIONS DONE', value: String(missionsCount), trend: `${data.monthlyMissions} this month`, borderColor: '#48CAE4', bg: 'linear-gradient(135deg, rgba(72,202,228,0.08) 0%, #ffffff 100%)' },
          { label: 'DAY STREAK', value: String(streakCount), trend: `🏆 Best: ${profile.streak_days} days`, borderColor: '#F4A261', bg: 'linear-gradient(135deg, rgba(244,162,97,0.08) 0%, #ffffff 100%)' },
          { label: 'BADGES', value: `${badgesCount}`, trend: `${badgesEarned} of 12 unlocked`, borderColor: '#B197FC', bg: 'linear-gradient(135deg, rgba(177,151,252,0.08) 0%, #ffffff 100%)' },
        ].map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
            className="rounded-[20px] p-4 shadow-[var(--shadow-card)]"
            style={{ borderLeft: `5px solid ${s.borderColor}`, background: s.bg }}
          >
            <p className="font-display font-black text-2xl text-foreground">{s.value}</p>
            <p className="font-label text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</p>
            <p className="text-[11px] text-muted-foreground mt-2">{s.trend}</p>
          </motion.div>
        ))}
      </div>

      {/* ═══ SECTION 3: ECOSYSTEM SNAPSHOT ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-[24px] bg-card shadow-[var(--shadow-card)] p-5 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-5">
          {/* Left — Scene */}
          <div>
            <div className="rounded-2xl bg-bg-dark-panel p-4 shadow-float overflow-hidden relative">
              {[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5].map((delay, i) => (
                <div key={i} className="absolute w-1 h-1 rounded-full animate-firefly z-10"
                  style={{ background: '#FFE566', boxShadow: '0 0 6px 3px rgba(255,229,102,0.75)', top: `${15 + (i * 11) % 55}%`, left: `${10 + (i * 13) % 75}%`, animationDelay: `${delay}s`, animationDuration: `${1.8 + (i % 4) * 0.4}s` }} />
              ))}
              <span className="absolute text-sm pointer-events-none z-10 animate-leaf-drift-1" style={{ left: '25%', top: '-5%' }}>🍃</span>
              <span className="absolute text-sm pointer-events-none z-10 animate-leaf-drift-2" style={{ left: '65%', top: '-5%' }}>🍃</span>
              <EcosystemViewer ecoPoints={profile.eco_points} className="aspect-[2/1]" />
            </div>
            <p className="font-display font-extrabold text-foreground mt-3">{profile.full_name}'s Forest</p>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-heading font-bold mt-1" style={{ background: 'hsl(var(--jungle-pale))', color: 'hsl(var(--foreground))' }}>
              {levelInfo.title} · Lv {levelInfo.level}
            </span>
          </div>

          {/* Right — Stats */}
          <div className="space-y-4">
            <p className="font-label text-[10px] uppercase tracking-wider text-muted-foreground">Ecosystem Health</p>
            {/* Health bar */}
            <div className="relative h-4 rounded-full overflow-hidden" style={{ background: 'hsl(var(--muted))' }}>
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${ecosystemHealth}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{ background: 'linear-gradient(90deg, hsl(var(--jungle-bright)), hsl(var(--jungle-light)))' }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            </div>
            <p className="text-sm font-heading font-bold text-foreground">{ecosystemHealth}% healthy</p>

            {/* 2×2 mini stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '🌳', label: 'Trees Planted', value: data.treesPlanted },
                { icon: '💨', label: 'CO₂ Saved (kg)', value: co2Saved },
                { icon: '🌊', label: 'Water Saved (L)', value: waterSaved },
                { icon: '♻️', label: 'Waste Sorted (kg)', value: wasteSorted },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-3 text-center" style={{ background: 'hsl(var(--muted))' }}>
                  <span className="text-xl">{s.icon}</span>
                  <p className="font-display font-bold text-foreground text-lg mt-1">{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <p className="text-sm italic text-muted-foreground">{getMotivationalLine(levelInfo.level)}</p>
          </div>
        </div>
      </motion.div>

      {/* ═══ SECTION 4: BADGE GALLERY ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="rounded-[24px] bg-card shadow-[var(--shadow-card)] p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-extrabold text-foreground text-lg">🏅 Badge Gallery</h2>
          <p className="text-sm text-muted-foreground">{badgesEarned} of 12 earned</p>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
          {earnedBadges.map((b, i) => (
            <motion.div
              key={i}
              whileHover={b.earned ? { scale: 1.1, rotate: -2 } : { scale: 1.03 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="flex flex-col items-center gap-2 p-3 rounded-[18px] text-center"
              style={b.earned ? {
                background: b.bg,
                boxShadow: `0 4px 20px ${b.glow}`,
              } : {
                background: 'hsl(var(--muted))',
                filter: 'grayscale(1)',
                opacity: 0.35,
              }}
            >
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-[18px] flex items-center justify-center text-3xl md:text-4xl">
                {b.icon}
                {!b.earned && <Lock className="absolute bottom-0 right-0 w-4 h-4 text-muted-foreground" />}
              </div>
              <p className="text-[13px] font-heading font-bold text-foreground">{b.name}</p>
              <p className="text-[11px] text-muted-foreground leading-tight">
                {b.earned ? b.description : b.unlock}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══ SECTION 5: ACTIVITY HISTORY ═══ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="rounded-[24px] bg-card shadow-[var(--shadow-card)] p-5 md:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-extrabold text-foreground text-lg">⚡ Activity History</h2>
          <Select value={activityFilter} onValueChange={(v: any) => setActivityFilter(v)}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {submissionData.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl block mb-4">🌱</span>
            <h3 className="font-heading font-bold text-foreground text-lg mb-2">No missions completed yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Accept a quest on your dashboard to begin your journey</p>
            <Link to="/dashboard">
              <Button variant="outline" className="rounded-xl font-heading font-bold border-jungle-bright text-jungle-bright">
                Go to Dashboard <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {submissionData.map((sub: any) => {
              const mission = sub.missions;
              const category = mission?.category ?? 'planting';
              const statusColors: Record<string, string> = {
                approved: 'hsl(140, 49%, 96%)',
                pending: 'transparent',
                rejected: 'hsl(0, 100%, 97%)',
              };
              const statusBadgeColors: Record<string, { bg: string; text: string }> = {
                approved: { bg: 'hsl(var(--jungle-pale))', text: 'hsl(var(--jungle-bright))' },
                pending: { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' },
                rejected: { bg: 'hsl(0, 80%, 92%)', text: 'hsl(0, 70%, 45%)' },
                in_progress: { bg: 'hsl(var(--muted))', text: 'hsl(var(--muted-foreground))' },
              };
              const colors = statusBadgeColors[sub.status] ?? statusBadgeColors.pending;
              const pts = mission?.eco_points_reward ?? 0;

              return (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                  style={{ background: statusColors[sub.status] ?? 'transparent' }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0" style={{ background: categoryColors[category] + '22', color: categoryColors[category] }}>
                    {categoryEmojis[category] ?? '🌱'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-sm text-foreground truncate">{mission?.title ?? 'Mission'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase" style={{ background: colors.bg, color: colors.text }}>
                        {sub.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {format(new Date(sub.submitted_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <p className={`font-display font-bold text-sm shrink-0 ${sub.status === 'approved' ? 'text-jungle-bright' : sub.status === 'rejected' ? 'line-through text-muted-foreground' : 'text-muted-foreground'}`}>
                    +{pts}
                  </p>
                </div>
              );
            })}

            {hasMore && (
              <div className="text-center pt-3">
                <Button variant="ghost" onClick={() => setOffset(prev => prev + PAGE_SIZE)} className="rounded-xl font-heading font-bold text-jungle-bright">
                  Load more
                </Button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
