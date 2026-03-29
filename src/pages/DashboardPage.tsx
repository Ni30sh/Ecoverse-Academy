import { motion } from 'framer-motion';
import EcosystemViewer from '@/components/game/EcosystemViewer';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useAuth } from '@/hooks/useAuth';
import { getLevelForPoints } from '@/lib/types';
import ProofSubmissionSheet from '@/components/ProofSubmissionSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── Twemoji CDN helper ──
const twemoji = (codepoint: string) =>
  `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${codepoint}.svg`;

const TWEMOJI: Record<string, string> = {
  '🌿': '1f33f', '🔥': '1f525', '⭐': '2b50', '🏆': '1f3c6',
  '🌱': '1f331', '💧': '1f4a7', '🌳': '1f333', '♻️': '267b',
};

function TwemojiImg({ emoji, className, style }: { emoji: string; className?: string; style?: React.CSSProperties }) {
  const code = TWEMOJI[emoji];
  if (!code) return <span className={className} style={style}>{emoji}</span>;
  return <img src={twemoji(code)} alt={emoji} className={className} style={style} draggable={false} />;
}

// ── Difficulty chip colors ──
const difficultyStyles = {
  easy: 'bg-accent text-jungle-bright',
  medium: 'bg-sun-gold/10 text-sun-gold',
  hard: 'bg-coral/10 text-coral',
};

const statCardBgs = [
  'linear-gradient(135deg, #ffffff 60%, #f0fdf4 100%)',
  'linear-gradient(135deg, #ffffff 60%, #fff7ed 100%)',
  'linear-gradient(135deg, #ffffff 60%, #eff6ff 100%)',
  'linear-gradient(135deg, #ffffff 60%, #f5f3ff 100%)',
];

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

const sd = (base: number, i = 0, step = 0.07) => base + i * step;
const snappyTransition = { duration: 0.15, ease: 'easeOut' as const };

// ── Dynamic greeting ──
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', emoji: '🌞' };
  if (h < 17) return { text: 'Good afternoon', emoji: '☀️' };
  return { text: 'Good evening', emoji: '🌙' };
}

function getDateString() {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date());
}

// ── Build weekly chart from real data ──
function buildWeeklyChart(weeklyPoints: { date: string; points_earned: number }[]) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const todayDayIndex = (today.getDay() + 6) % 7; // Mon=0 ... Sun=6
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayIndex = (d.getDay() + 6) % 7;
    const found = weeklyPoints.find(wp => wp.date === dateStr);
    result.push({
      day: days[dayIndex],
      pts: found?.points_earned ?? 0,
      isToday: i === 0,
    });
  }
  const maxPts = Math.max(...result.map(r => r.pts), 1);
  return result.map(r => ({ ...r, value: (r.pts / maxPts) * 100 }));
}

const missionBgs: Record<string, string> = {
  planting: 'linear-gradient(135deg, #52B788, #1B4332)',
  waste: 'linear-gradient(135deg, #48CAE4, #0369A1)',
  transport: 'linear-gradient(135deg, #F4A261, #C2410C)',
  water: 'linear-gradient(135deg, #48CAE4, #0077B6)',
  energy: 'linear-gradient(135deg, #FCD34D, #D97706)',
  campus: 'linear-gradient(135deg, #A78BFA, #6D28D9)',
  biodiversity: 'linear-gradient(135deg, #34D399, #065F46)',
};

const badges = [
  { icon: '🌱', name: 'First Steps', bg: '#D1FAE5', earned: false, glowColor: 'rgba(52,211,153,0.35)' },
  { icon: '🔥', name: 'On Fire', bg: '#FEF3C7', earned: false, glowColor: 'rgba(244,162,97,0.35)' },
  { icon: '💧', name: 'Water Guard', bg: '#EFF6FF', earned: false, glowColor: 'rgba(72,202,228,0.35)' },
  { icon: '🌳', name: 'Tree Hugger', bg: '#D1FAE5', earned: false, glowColor: '' },
  { icon: '🏆', name: 'Top 10', bg: '#FEF3C7', earned: false, glowColor: '' },
  { icon: '♻️', name: 'Recycler', bg: '#F0FFF4', earned: false, glowColor: '' },
];

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const dashboard = useDashboardData();
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [proofSheetOpen, setProofSheetOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [selectedMission, setSelectedMission] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // On mount: check auto-approve hooks (if any)
  useEffect(() => {
    if (profile) {
      dashboard.checkAutoApprove();
    }
  }, [profile?.id]);

  // Adjusted rank: include seeded bots
  const SEEDED_POINTS = [1850, 1340, 890, 420];
  const botsAbove = SEEDED_POINTS.filter(p => p > (profile?.eco_points ?? 0)).length;
  const adjustedRank = (dashboard.rank ?? 999) + botsAbove;

  // Count-up values — must be called unconditionally (before any early return)
  const ecoCount = useCountUp(profile?.eco_points ?? 0, 1200, 500);
  const streakCount = useCountUp(profile?.streak_days ?? 0, 800, 620);
  const rankCount = useCountUp(adjustedRank, 600, 740);

  const baseTransition = mounted ? snappyTransition : { duration: 0.5 };

  if (dashboard.isLoading || !profile) {
    return (
      <div className="p-4 md:p-7 max-w-[1400px] mx-auto space-y-5">
        <Skeleton className="h-12 w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-[18px]" />)}
        </div>
        <Skeleton className="h-64 rounded-[20px]" />
      </div>
    );
  }

  const levelInfo = getLevelForPoints(profile.eco_points);
  const firstName = profile.full_name?.split(' ')[0] || 'Explorer';
  const greeting = getGreeting();
  const weeklyChart = buildWeeklyChart(dashboard.weeklyPoints);
  const totalWeeklyPts = weeklyChart.reduce((s, d) => s + d.pts, 0);
  const allZeroWeek = weeklyChart.every(d => d.pts === 0);

  // Determine ecosystem health from eco_points
  const ecosystemHealth = Math.min(100, Math.round((profile.eco_points / 10000) * 100));
  const treesPlanted = dashboard.treesPlanted;
  const co2Saved = Math.round(profile.eco_points * 0.011);

  // Get submission status for a mission
  const getSubmissionForMission = (missionId: string) => {
    return dashboard.submissions.find((s: any) => s.mission_id === missionId);
  };

  const getMissionStatus = (missionId: string) => {
    const sub = getSubmissionForMission(missionId);
    if (!sub) return 'available';
    return sub.status;
  };

  const handleMissionAction = (mission: any) => {
    const sub = getSubmissionForMission(mission.id);
    if (!sub) {
      dashboard.acceptMission.mutate(mission.id);
    } else if (sub.status === 'in_progress') {
      setSelectedSubmission(sub);
      setSelectedMission(mission);
      setProofSheetOpen(true);
    }
  };

  // Earned badges based on points
  const earnedBadges = badges.map(b => {
    let earned = false;
    if (b.name === 'First Steps' && profile.eco_points >= 50) earned = true;
    if (b.name === 'On Fire' && profile.streak_days >= 7) earned = true;
    if (b.name === 'Water Guard' && profile.eco_points >= 500) earned = true;
    if (b.name === 'Tree Hugger' && profile.eco_points >= 1200) earned = true;
    if (b.name === 'Top 10' && dashboard.realUserCount >= 10 && dashboard.rank <= 10) earned = true;
    if (b.name === 'Recycler' && profile.eco_points >= 300) earned = true;
    return { ...b, earned };
  });

  return (
    <div className="p-4 md:p-7 max-w-[1400px] mx-auto space-y-5">

      {/* ── GREETING BAR ── */}
      <motion.div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div>
          <h1 className="font-heading font-black text-2xl md:text-[26px] text-foreground">
            {greeting.text}, {firstName}! {greeting.emoji}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {profile.streak_days > 0
              ? `You're on a ${profile.streak_days}-day streak — don't break it today 🔥`
              : 'Start your streak by completing a mission today! 🌱'}
          </p>
        </div>
        <div className="shrink-0 bg-card rounded-full px-4 py-2 shadow-card text-sm font-heading font-bold text-foreground">
          📅 {getDateString()}
        </div>
      </motion.div>

      {/* ── TWO-COLUMN GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">

        {/* ══════ LEFT COLUMN ══════ */}
        <div className="space-y-5">
          {/* Ecosystem Viewer Card */}
          <motion.div
            className="rounded-3xl bg-bg-dark-panel p-4 shadow-float overflow-hidden relative"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={mounted ? snappyTransition : { duration: 0.5, delay: 0.2 }}
            style={{ animation: 'cardGlow 4s ease-in-out infinite' }}
            whileHover={{ y: -4, boxShadow: '0 10px 40px rgba(27,67,50,0.18)' }}
          >
            {[0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5].map((delay, i) => (
              <div key={i} className="absolute w-1 h-1 rounded-full animate-firefly z-10"
                style={{ background: '#FFE566', boxShadow: '0 0 6px 3px rgba(255,229,102,0.75)', top: `${15 + (i * 11) % 55}%`, left: `${10 + (i * 13) % 75}%`, animationDelay: `${delay}s`, animationDuration: `${1.8 + (i % 4) * 0.4}s` }} />
            ))}
            <span className="absolute text-sm pointer-events-none z-10 animate-leaf-drift-1" style={{ left: '25%', top: '-5%' }}>🍃</span>
            <span className="absolute text-sm pointer-events-none z-10 animate-leaf-drift-2" style={{ left: '65%', top: '-5%' }}>🍃</span>

            <EcosystemViewer ecoPoints={profile.eco_points} className="aspect-[16/10]" />

            <div className="mt-4 px-2 pb-2">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-heading font-extrabold text-base text-bg-elevated">🌳 {profile.full_name}'s Forest</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-jungle-mid/30 px-3 py-1 text-xs font-heading font-bold text-jungle-pale">
                  🌿 {levelInfo.title} · Lv {levelInfo.level}
                </span>
              </div>
              <p className="text-xs text-jungle-light/50 font-body mb-3">Growing since Day 1 · {treesPlanted} trees strong</p>

              <p className="text-[10px] font-heading font-extrabold uppercase tracking-[0.14em] text-jungle-light/60 mb-1.5">Ecosystem Health</p>
              <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full animate-shimmer"
                  style={{ background: 'linear-gradient(90deg, #40916C 0%, #74C69D 40%, #D8F3DC 50%, #74C69D 60%, #40916C 100%)', backgroundSize: '200% auto' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${ecosystemHealth}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { emoji: '🌳', label: `${treesPlanted} Trees Planted` },
                  { emoji: '💨', label: `${co2Saved}kg CO₂ Saved` },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-heading font-bold text-jungle-light">
                    <span>{s.emoji}</span>{s.label}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Mini Leaderboard */}
          <motion.div
            className="rounded-[20px] bg-card shadow-card p-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={mounted ? snappyTransition : { duration: 0.5, delay: 0.35 }}
            whileHover={{ y: -4, boxShadow: '0 10px 40px rgba(27,67,50,0.18)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-extrabold text-foreground text-sm">🏆 Class Leaderboard</h2>
              <Link to="/leaderboard" className="text-xs text-primary font-heading font-bold hover:underline transition-colors duration-[120ms]">View All →</Link>
            </div>
            <div className="space-y-1">
              {(() => {
                const SEEDED_USERS = [
                  { id: 'bot-maya', full_name: '🌍 EcoBot Maya', avatar_emoji: '🌍', eco_points: 1850, school_name: 'Green Valley Academy' },
                  { id: 'bot-arjun', full_name: '🌱 EcoBot Arjun', avatar_emoji: '🌱', eco_points: 1340, school_name: 'Sunrise School' },
                  { id: 'bot-priya', full_name: '🌿 EcoBot Priya', avatar_emoji: '🌿', eco_points: 890, school_name: 'Nordic Nature School' },
                  { id: 'bot-sam', full_name: '🌳 EcoBot Sam', avatar_emoji: '🌳', eco_points: 420, school_name: 'EcoQuest Community' },
                ];
                const combined = [...dashboard.leaderboard, ...SEEDED_USERS.filter(s => !dashboard.leaderboard.some((r: any) => r.id === s.id))];
                const sorted = combined.sort((a: any, b: any) => b.eco_points - a.eco_points).slice(0, 5);
                return sorted.map((row: any, idx: number) => {
                  const rank = idx + 1;
                  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}`;
                  const isYou = row.id === user?.id;
                  const isBot = row.id?.startsWith('bot-');
                  return (
                    <div
                      key={row.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 hover:bg-accent/30 ${isYou ? 'border-l-[4px] border-primary' : ''}`}
                      style={isYou ? { background: 'linear-gradient(90deg, #f0fff4, #ffffff)' } : {}}
                    >
                      <span className="text-sm w-6 text-center font-heading font-black">{medal}</span>
                      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-base">{row.avatar_emoji}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-heading text-xs text-foreground truncate ${isYou ? 'font-extrabold' : 'font-bold'}`}>
                          {isYou ? `${row.full_name} (You)` : row.full_name}{isBot ? ' 🤖' : ''}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">{row.school_name || 'EcoQuest'}</p>
                      </div>
                      <span className="font-heading font-black text-xs text-primary">{row.eco_points.toLocaleString()}</span>
                    </div>
                  );
                });
              })()}
            </div>
          </motion.div>
        </div>

        {/* ══════ RIGHT COLUMN ══════ */}
        <div className="space-y-5">

          {/* ── STAT CARDS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { emoji: '🌿', label: 'EcoPoints', value: ecoCount.toLocaleString(), trend: `↑ +${totalWeeklyPts} this week`, trendColor: '#40916C', borderClass: 'border-l-primary', numColor: '#1B4332' },
              { emoji: '🔥', label: 'Day Streak', value: String(streakCount), trend: profile.streak_days >= 7 ? '🏆 Personal best!' : 'Keep going!', trendColor: '#D97706', borderClass: 'border-l-sun-gold', numColor: '#C2410C' },
              { emoji: '⭐', label: 'Level', value: `Lv ${levelInfo.level}`, trend: `${levelInfo.title}`, trendColor: '#40916C', borderClass: 'border-l-sky-blue', numColor: '#1B4332' },
              { emoji: '🏆', label: 'Rank', value: `#${rankCount}`, trend: adjustedRank <= 10 ? '🔥 Top 10!' : `Out of ${dashboard.leaderboard.length + SEEDED_POINTS.length}+ users`, trendColor: '#4338CA', borderClass: 'border-l-lavender', numColor: '#4338CA' },
            ].map((card, i) => (
              <motion.div
                key={card.label}
                className={`relative rounded-[18px] shadow-card p-4 border-l-[5px] ${card.borderClass} overflow-hidden`}
                style={{ background: statCardBgs[i] }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={mounted ? snappyTransition : { duration: 0.5, delay: sd(0.2, i) }}
                whileHover={{ y: -4, boxShadow: '0 10px 40px rgba(27,67,50,0.18)' }}
                whileTap={{ scale: 0.97, transition: { duration: 0.08 } }}
              >
                <TwemojiImg emoji={card.emoji} className="absolute top-3 right-3.5 w-9 h-9 pointer-events-none" style={{ transform: 'rotate(10deg)', opacity: 0.18 }} />
                <p className="font-heading font-extrabold text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{card.label}</p>
                <p className="font-heading font-black text-[32px] leading-none mt-1" style={{ color: card.numColor }}>{card.value}</p>
                <p className="text-xs mt-1.5 font-heading font-bold" style={{ color: card.trendColor }}>{card.trend}</p>
              </motion.div>
            ))}
          </div>

          {/* ── SEASONAL CHALLENGE ── */}
          <motion.div
            className="relative rounded-[20px] overflow-hidden shadow-float"
            style={{ background: 'linear-gradient(135deg, hsl(var(--jungle-deep)) 0%, hsl(var(--jungle-mid)) 50%, hsl(var(--jungle-bright)) 100%)', padding: '22px 26px' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[80px] opacity-[0.14] pointer-events-none" style={{ animation: 'rotate-slow 12s linear infinite' }}>🌿</span>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <span className="text-4xl shrink-0">🌧️</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-heading font-extrabold uppercase tracking-[0.14em] text-jungle-light flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-jungle-light animate-live-pulse shrink-0" /> Seasonal Challenge · Active
                </p>
                <h3 className="font-heading font-extrabold text-base text-primary-foreground mt-1">Monsoon Water Save Challenge</h3>
                <div className="mt-3 h-2 rounded-full bg-white/15 overflow-hidden">
                  <motion.div className="h-full rounded-full animate-shimmer" style={{ background: 'linear-gradient(90deg, #74C69D 0%, #D8F3DC 40%, #ffffff 50%, #D8F3DC 60%, #74C69D 100%)', backgroundSize: '200% auto', boxShadow: '0 0 10px rgba(116,198,157,0.7)' }} initial={{ width: 0 }} animate={{ width: '58%' }} transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }} />
                </div>
                <p className="text-[11px] text-jungle-pale/60 mt-1.5 font-body">School progress: 580 / 1000 liters · 1.5× EcoPoints active</p>
              </div>
              <div className="shrink-0" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '10px 16px', textAlign: 'center' }}>
                <p className="font-heading font-black text-[28px] text-primary-foreground leading-none">5d</p>
                <p className="text-[11px] text-jungle-pale/60 font-body mt-0.5">remaining</p>
              </div>
            </div>
          </motion.div>

          {/* ── TODAY'S QUESTS ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-extrabold text-foreground text-sm">🎯 Today's Quests</h2>
              <Link to="/missions" className="text-xs text-primary font-heading font-bold hover:underline transition-colors duration-[120ms]">View All Missions →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {dashboard.missions.map((m: any, i: number) => {
                const status = getMissionStatus(m.id);
                const sub = getSubmissionForMission(m.id);
                const bg = missionBgs[m.category] || missionBgs.planting;
                return (
                  <motion.div
                    key={m.id}
                    className="rounded-[20px] bg-card shadow-card border border-border/30 overflow-hidden group"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={mounted ? snappyTransition : { delay: sd(0.45, i, 0.08), duration: 0.5 }}
                    whileHover={{ y: -4, boxShadow: '0 10px 40px rgba(27,67,50,0.18)' }}
                    whileTap={{ scale: 0.97, transition: { duration: 0.08 } }}
                  >
                    <div className="h-[72px] flex items-center justify-center relative" style={{ background: bg }}>
                      <span className="text-3xl animate-bob" style={{ animationDelay: `${i * 0.3}s`, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>{m.icon}</span>
                      <span className={`absolute top-2 right-2 text-[10px] font-heading font-bold px-2 py-0.5 rounded-full ${
                        status === 'approved' ? 'bg-primary text-primary-foreground' :
                        status === 'pending' ? 'bg-sun-gold/90 text-foreground' :
                        status === 'in_progress' ? 'bg-sun-gold/90 text-foreground' :
                        'bg-card text-primary'
                      }`}>
                        {status === 'approved' ? '✓ Completed' : status === 'pending' ? 'Pending Review' : status === 'in_progress' ? 'In Progress' : 'Available'}
                      </span>
                    </div>

                    <div className="p-4">
                      <h3 className="font-heading font-bold text-sm text-foreground">{m.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 font-body">{m.description}</p>

                      <div className="flex items-center gap-2 mt-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-heading font-bold ${difficultyStyles[m.difficulty as keyof typeof difficultyStyles]}`}>{m.difficulty}</span>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <span className="font-heading font-black text-sm text-primary">🌿 +{m.eco_points_reward} pts</span>
                        {status === 'approved' ? (
                          <span className="flex items-center gap-1 text-xs font-heading font-bold text-primary"><Check className="w-4 h-4" /> Done</span>
                        ) : status === 'pending' ? (
                          <span className="text-xs font-heading font-bold text-sun-gold">⏳ Under Review</span>
                        ) : (
                          <button
                            onClick={() => handleMissionAction(m)}
                            disabled={dashboard.acceptMission.isPending}
                            className="bg-primary hover:bg-primary/80 text-primary-foreground text-xs font-heading font-bold px-3 py-1.5 rounded-[10px] transition-all duration-[120ms] hover:scale-[1.04] active:scale-[0.97]"
                          >
                            {status === 'in_progress' ? 'Continue' : 'Accept'}
                          </button>
                        )}
                      </div>

                      {status === 'in_progress' && (
                        <div className="mt-3 h-[5px] rounded-full bg-muted overflow-hidden">
                          <motion.div className="h-full rounded-full animate-shimmer" style={{ background: 'linear-gradient(90deg, #40916C 0%, #74C69D 40%, #D8F3DC 50%, #74C69D 60%, #40916C 100%)', backgroundSize: '200% auto' }} initial={{ width: 0 }} animate={{ width: '30%' }} transition={{ duration: 0.8, delay: 0.8 }} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── WEEKLY CHART + ACTIVITY ── */}
          <motion.div className="grid grid-cols-1 md:grid-cols-5 gap-4" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.55 }}>
            {/* Weekly Chart */}
            <div className="md:col-span-3 rounded-[20px] bg-card shadow-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading font-extrabold text-foreground text-sm">📈 Weekly EcoPoints</h2>
                <span className="font-heading font-black text-sm text-primary">+{totalWeeklyPts} pts</span>
              </div>
              {allZeroWeek ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="text-4xl mb-3">📊</span>
                  <p className="text-sm text-muted-foreground text-center">Complete your first mission to see progress!</p>
                </div>
              ) : (
                <div className="flex items-end gap-2 px-1" style={{ height: 130 }}>
                  {weeklyChart.map((bar, i) => (
                    <div key={bar.day} className="flex-1 flex flex-col items-center relative">
                      {hoveredBar === i && bar.pts > 0 && (
                        <div className="absolute -top-8 z-20 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-heading font-bold text-white pointer-events-none" style={{ background: '#1B4332' }}>
                          {bar.pts} pts
                        </div>
                      )}
                      <div className="w-full flex items-end justify-center" style={{ height: 100 }}>
                        <div
                          className="w-full rounded-t-lg cursor-pointer"
                          onMouseEnter={() => setHoveredBar(i)}
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{
                            height: Math.max((bar.value / 100) * 100, 4),
                            background: bar.isToday ? 'linear-gradient(180deg, #74C69D, #40916C)' : '#D8F3DC',
                            boxShadow: bar.isToday ? '0 -4px 16px rgba(64,145,108,0.45)' : 'none',
                            borderRadius: '8px 8px 0 0',
                            animation: `growBar 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.06}s both`,
                            transformOrigin: 'bottom',
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-body mt-1.5">{bar.day}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Feed */}
            <div className="md:col-span-2 rounded-[20px] bg-card shadow-card p-5">
              <h2 className="font-heading font-extrabold text-foreground text-sm mb-4">⚡ Recent Activity</h2>
              {dashboard.activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="text-3xl mb-2">🌱</span>
                  <p className="text-sm text-muted-foreground text-center">Your adventure starts now — complete a mission!</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {dashboard.activity.map((a: any, i: number) => {
                    const mission = a.missions;
                    const statusLabel = a.status === 'approved' ? 'Completed' : a.status === 'pending' ? 'Submitted' : 'Started';
                    const timeAgo = formatDistanceToNow(new Date(a.submitted_at), { addSuffix: true });
                    return (
                      <div key={a.id} className={`flex items-center gap-3 py-3 hover:bg-accent/20 rounded-xl px-2 transition-all duration-150 ${i < dashboard.activity.length - 1 ? 'border-b border-border/50' : ''}`}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 bg-accent">
                          {mission?.icon || '🌱'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-bold text-xs text-foreground truncate">{statusLabel}: {mission?.title}</p>
                          <p className="text-[10px] text-muted-foreground font-body">{timeAgo}</p>
                        </div>
                        <span className="font-heading font-black text-xs text-primary shrink-0">+{mission?.eco_points_reward} pts</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── BADGE GALLERY ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.65 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-extrabold text-foreground text-sm">🏅 Your Badges</h2>
              <Link to="/profile" className="text-xs text-primary font-heading font-bold hover:underline transition-colors duration-[120ms]">View All →</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto py-4 -my-2 px-1 scrollbar-hide items-end">
              {earnedBadges.map((b, i) => (
                <motion.div
                  key={i}
                  className="shrink-0 flex flex-col items-center gap-1.5 cursor-pointer"
                  whileHover={b.earned ? { scale: 1.15, rotate: -4 } : {}}
                  transition={b.earned ? { type: 'spring', stiffness: 500, damping: 15 } : snappyTransition}
                  whileTap={b.earned ? { scale: 0.95 } : {}}
                >
                  {b.earned ? (
                    <div className="w-16 h-16 rounded-[18px] flex items-center justify-center border-2 border-white/80" style={{ background: b.bg, boxShadow: `0 4px 16px ${b.glowColor}` }}>
                      <TwemojiImg emoji={b.icon} className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center relative" style={{ background: b.bg, filter: 'grayscale(1) opacity(0.35)' }}>
                      <span className="text-sm">🔒</span>
                    </div>
                  )}
                  <p className={`text-center max-w-[64px] truncate ${b.earned ? 'text-[11px] font-heading font-bold text-foreground' : 'text-[10px] font-heading font-semibold text-muted-foreground'}`}>
                    {b.name}
                  </p>
                </motion.div>
              ))}
              <div className="shrink-0 flex items-center self-center">
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-heading font-bold cursor-pointer transition-all duration-[120ms] hover:bg-jungle-bright hover:text-white" style={{ background: '#D8F3DC', color: '#40916C' }}>
                  🔒 {earnedBadges.filter(b => !b.earned).length} more to unlock →
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* Proof Submission Sheet */}
      <ProofSubmissionSheet
        open={proofSheetOpen}
        onOpenChange={setProofSheetOpen}
        submission={selectedSubmission}
        mission={selectedMission}
        userId={user?.id || ''}
        onSubmit={(data) => dashboard.submitProof.mutate(data)}
      />
    </div>
  );
}
