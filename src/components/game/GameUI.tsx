import { motion } from 'framer-motion';
import { Leaf, Flame, Star, Trophy, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

export function EcoPointsBadge({ points, size = 'default' }: { points: number; size?: 'sm' | 'default' | 'lg' }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const start = display;
    const diff = points - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(start + diff * progress));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [points]);

  const sizes = {
    sm: 'text-sm px-2.5 py-1 gap-1.5',
    default: 'text-lg px-3.5 py-1.5 gap-2',
    lg: 'text-2xl px-5 py-2.5 gap-2.5',
  };

  return (
    <motion.div
      className={`inline-flex items-center rounded-full bg-jungle-pale font-mono-stat font-bold text-jungle-bright shadow-card ${sizes[size]}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
    >
      <Leaf className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-4.5 h-4.5'} />
      {display.toLocaleString()}
    </motion.div>
  );
}

export function StreakFlame({ days }: { days: number }) {
  return (
    <div className="inline-flex items-center gap-1.5 font-mono-stat font-bold text-sun-gold">
      <Flame className="w-5 h-5 animate-pulse" />
      <span>{days}</span>
    </div>
  );
}

export function LevelBadge({ level, title }: { level: number; title: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-jungle-pale border border-jungle-light/30 px-3 py-1 text-sm font-heading font-bold text-jungle-deep">
      <Star className="w-4 h-4 text-jungle-bright" />
      <span>Lv.{level}</span>
      <span className="text-muted-foreground">{title}</span>
    </div>
  );
}

export function RankBadge({ rank }: { rank: number }) {
  return (
    <div className="inline-flex items-center gap-1 font-mono-stat font-bold text-sun-gold">
      <Trophy className="w-4 h-4" />
      <span>#{rank}</span>
    </div>
  );
}

export function ProgressRing({ progress, size = 60, strokeWidth = 4, children }: { progress: number; size?: number; strokeWidth?: number; children?: React.ReactNode }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="hsl(var(--border))" strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="hsl(var(--jungle-bright))"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeDasharray={circumference}
        />
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, borderColor = 'border-l-jungle-bright' }: { icon: React.ReactNode; label: string; value: React.ReactNode; borderColor?: string }) {
  return (
    <motion.div
      className={`rounded-2xl bg-card shadow-card p-4 border-l-4 ${borderColor}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: 'var(--shadow-hover)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <p className="font-label text-muted-foreground">{label}</p>
          <div className="text-xl font-mono-stat font-bold text-foreground">{value}</div>
        </div>
      </div>
    </motion.div>
  );
}

export function BadgeCard({ badge }: { badge: { name: string; icon: string; description: string; earned?: boolean } }) {
  return (
    <motion.div
      className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all ${
        badge.earned ? 'bg-card border-jungle-light/30 shadow-card' : 'bg-muted/50 border-border opacity-50 grayscale'
      }`}
      whileHover={badge.earned ? { scale: 1.05, boxShadow: 'var(--shadow-hover)' } : {}}
      whileTap={badge.earned ? { scale: 0.97 } : {}}
    >
      <div className="relative">
        <span className="text-3xl">{badge.icon}</span>
        {!badge.earned && <Lock className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-muted-foreground" />}
      </div>
      <p className="text-sm font-heading font-bold text-foreground">{badge.name}</p>
      <p className="text-xs text-muted-foreground">{badge.description}</p>
    </motion.div>
  );
}
