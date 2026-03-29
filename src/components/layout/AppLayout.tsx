import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Target, BookOpen, Trophy, User, Bell, LogOut } from 'lucide-react';
import { EcoPointsBadge, StreakFlame } from '@/components/game/GameUI';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/missions', icon: Target, label: 'Missions' },
  { path: '/learn', icon: BookOpen, label: 'Learn' },
  { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { profile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['nav-notifications', profile?.id],
    queryFn: async () => {
      if (!profile) return [];
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10);
      return data ?? [];
    },
    enabled: !!profile,
  });

  const unread = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id);
    queryClient.invalidateQueries({ queryKey: ['nav-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const userName = profile?.full_name || 'User';
  const avatarEmoji = profile?.avatar_emoji || '🌱';

  return (
    <div className="min-h-screen bg-gradient-warm">
      {/* Top nav bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/50 bg-card/90 backdrop-blur-xl px-4 md:px-6 h-16">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <span className="font-display font-bold text-jungle-deep text-lg">EcoQuest</span>
        </Link>

        {/* Desktop center nav */}
        {!isMobile && (
          <nav className="flex items-center gap-1 bg-muted rounded-full p-1">
            {NAV_ITEMS.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-heading font-semibold transition-all ${
                    active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-primary rounded-full shadow-card"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-3">
          <StreakFlame days={profile?.streak_days ?? 0} />
          <EcoPointsBadge points={profile?.eco_points ?? 0} size="sm" />
          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-foreground" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-coral text-white text-[10px] flex items-center justify-center font-bold">{unread}</span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-[min(20rem,calc(100vw-1rem))] rounded-2xl border border-border bg-card shadow-float p-4 z-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-bold text-foreground">Notifications</h3>
                    <button onClick={markAllRead} className="text-xs text-primary font-medium hover:underline">Mark all read</button>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No notifications yet 🌱</p>
                    ) : notifications.map(n => (
                      <div key={n.id} className={`p-3 rounded-xl text-sm transition-colors ${n.is_read ? 'bg-muted/30' : 'bg-jungle-pale/50'}`}>
                        <p className="font-bold text-foreground">{n.title}</p>
                        <p className="text-muted-foreground text-xs mt-1">{n.body}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link to="/profile" className="w-8 h-8 rounded-full bg-jungle-pale border-2 border-jungle-light flex items-center justify-center text-sm">
            {avatarEmoji}
          </Link>
          <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Sign out">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 md:pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border/30 bg-card/80 backdrop-blur-2xl h-16 px-2">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-xs transition-all ${
                  active ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {active && (
                  <motion.div layoutId="tab-dot" className="absolute -top-1 w-4 h-1 rounded-full bg-primary" />
                )}
                <item.icon className="w-5 h-5" />
                {active && <span className="font-heading font-semibold">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
