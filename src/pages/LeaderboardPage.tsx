import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Bot } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaderboardData, TimePeriod, LeaderboardScope } from '@/hooks/useLeaderboardData';
import { getLevelForPoints } from '@/lib/types';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [period, setPeriod] = useState<TimePeriod>('all_time');

  const { data, isLoading } = useLeaderboardData(period, scope, true);
  const top3 = data?.top3 ?? [];
  const rest = data?.rest ?? [];
  const currentUserEntry = data?.currentUserEntry;
  const isInTop20 = data?.isInTop20 ?? false;

  return (
    <motion.div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6" variants={stagger} initial="hidden" animate="visible">
      <motion.h1 variants={fadeUp} className="font-display font-bold text-3xl text-jungle-deep text-center">
        Who's Saving the Planet? 🌍
      </motion.h1>

      {/* Tabs & Filters */}
      <motion.div variants={fadeUp} className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {([['global', '🌐 Global'], ['my_school', '🏫 My School']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setScope(key as LeaderboardScope)}
              className={`px-4 py-2 rounded-full text-sm font-heading font-semibold transition-all ${
                scope === key
                  ? 'bg-primary text-primary-foreground shadow-card'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {([['all_time', 'All Time'], ['this_week', 'Week'], ['this_month', 'Month']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key as TimePeriod)}
              className={`px-3 py-1.5 rounded-full text-xs font-heading font-semibold transition-all ${
                period === key
                  ? 'bg-jungle-pale text-jungle-bright'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading leaderboard...</div>
      ) : (
        <>
          {/* Podium */}
          {top3.length >= 3 && (
            <motion.div variants={fadeUp} className="flex items-end justify-center gap-4 pt-8 pb-4">
              {[top3[1], top3[0], top3[2]].map((entry, i) => {
                if (!entry) return null;
                const pos = i === 1 ? 1 : i === 0 ? 2 : 3;
                const heights = { 1: 'h-36', 2: 'h-28', 3: 'h-24' };
                const gradients = {
                  1: 'from-sun-gold/40 to-sun-gold/10 border-sun-gold/50',
                  2: 'from-muted/50 to-muted/20 border-muted-foreground/30',
                  3: 'from-earth-warm/30 to-earth-warm/10 border-earth-warm/40',
                };
                const badges = { 1: '👑', 2: '🥈', 3: '🥉' };

                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ y: 40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: (3 - pos) * 0.15, type: 'spring' }}
                    className="flex flex-col items-center"
                  >
                    <div className="text-2xl mb-2">{badges[pos as keyof typeof badges]}</div>
                    <div className={`w-16 h-16 rounded-full bg-jungle-pale border-3 ${pos === 1 ? 'border-sun-gold shadow-hover' : 'border-border'} flex items-center justify-center text-xl font-bold text-jungle-deep mb-2 relative`}>
                      {entry.avatar_emoji}
                      {entry.is_bot && <span className="absolute -bottom-1 -right-1 text-xs">🤖</span>}
                    </div>
                    <p className="text-sm font-heading font-bold text-foreground text-center max-w-[100px] truncate">{entry.full_name}</p>
                    <p className="text-xs text-jungle-bright font-mono-stat font-bold">{entry.eco_points.toLocaleString()}</p>
                    <div className={`w-24 ${heights[pos as keyof typeof heights]} mt-2 rounded-t-2xl bg-gradient-to-t border-t border-x ${gradients[pos as keyof typeof gradients]}`} />
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Ranked list 4–20 */}
          <div className="space-y-2">
            {rest.map((entry, i) => {
              const isCurrentUser = user && entry.user_id === user.id;
              return (
                <motion.div
                  key={entry.user_id}
                  variants={fadeUp}
                  className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                    isCurrentUser
                      ? 'bg-jungle-pale border-2 border-jungle-bright shadow-card'
                      : i % 2 === 0 ? 'bg-card shadow-card' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center font-mono-stat text-sm text-muted-foreground font-bold">{entry.rank}</span>
                    <div className="w-10 h-10 rounded-full bg-jungle-pale border border-border flex items-center justify-center text-sm relative">
                      {entry.avatar_emoji}
                      {entry.is_bot && <span className="absolute -bottom-1 -right-1 text-[10px]">🤖</span>}
                    </div>
                    <div>
                      <p className="text-sm font-heading font-bold text-foreground">{entry.full_name}</p>
                      <p className="text-xs text-muted-foreground">{entry.level_title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">🔥 {entry.streak_days}d</span>
                    <span className="text-sm font-mono-stat font-bold text-jungle-bright">{entry.eco_points.toLocaleString()}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* No data */}
          {top3.length === 0 && rest.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No leaderboard data for this period yet.</div>
          )}

          {/* Current user sticky card */}
          {currentUserEntry && !isInTop20 && (
            <div className="sticky bottom-20 md:bottom-4">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="rounded-2xl bg-card shadow-float p-4 border-l-4 border-l-jungle-bright flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-primary" />
                  <span className="text-sm font-heading font-bold text-foreground">Your Position</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-stat font-bold text-jungle-bright">#{currentUserEntry.rank}</span>
                  <span className="text-sm text-muted-foreground">{currentUserEntry.eco_points.toLocaleString()} pts</span>
                </div>
              </motion.div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
