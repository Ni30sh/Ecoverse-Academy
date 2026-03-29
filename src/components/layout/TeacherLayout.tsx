import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, ClipboardCheck, Users, Target, Trophy, Bell, LogOut, Menu, X, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const TEACHER_NAV = [
  { path: '/teacher', icon: LayoutDashboard, label: 'Overview' },
  { path: '/teacher/submissions', icon: ClipboardCheck, label: 'Submissions' },
  { path: '/teacher/students', icon: Users, label: 'Students' },
  { path: '/teacher/missions', icon: Target, label: 'Missions' },
  { path: '/teacher/content', icon: BookOpen, label: 'Learning Content' },
  { path: '/teacher/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { profile, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['teacher-notifications', profile?.id],
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
    queryClient.invalidateQueries({ queryKey: ['teacher-notifications'] });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/teacher') return location.pathname === '/teacher';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F0E8' }}>
      {/* Top nav bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/50 bg-card/90 backdrop-blur-xl px-4 md:px-6" style={{ height: '68px' }}>
        <div className="flex items-center gap-3">
          <Link to="/teacher" className="flex items-center gap-2">
            <span className="text-xl">🌿</span>
            <span className="font-display font-bold text-jungle-deep text-lg">EcoQuest</span>
          </Link>
          <span className="text-xs font-heading font-bold text-white px-2.5 py-1 rounded-full" style={{ backgroundColor: '#F4A261' }}>
            Teacher
          </span>
        </div>

        {/* Desktop center nav */}
        {!isMobile && (
          <nav className="flex items-center gap-1 bg-muted rounded-full p-1">
            {TEACHER_NAV.map(item => {
              const active = isActive(item.path);
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
                      layoutId="teacher-nav-pill"
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

        {/* Mobile hamburger */}
        {isMobile && (
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}

        <div className="flex items-center gap-3">
          {/* Notifications */}
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

          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-jungle-pale border-2 border-jungle-light flex items-center justify-center text-sm">
              {profile?.avatar_emoji || '🌿'}
            </span>
            {!isMobile && (
              <span className="text-sm font-heading font-semibold text-foreground">{profile?.full_name || 'Teacher'}</span>
            )}
          </div>
          <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-muted transition-colors" title="Sign out">
            <LogOut className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {isMobile && menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border bg-card shadow-card overflow-hidden z-40"
          >
            <nav className="p-4 space-y-1">
              {TEACHER_NAV.map(item => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-heading font-semibold transition-all ${
                      active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pb-6">
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
    </div>
  );
}
