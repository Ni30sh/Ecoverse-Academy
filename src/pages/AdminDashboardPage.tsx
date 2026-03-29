import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  BarChart3,
  Users,
  Shield,
  Target,
  FileCheck,
  PieChart as PieChartIcon,
  Settings,
  Search,
  ChevronDown,
  UserCheck,
  UserCog,
  UserMinus,
  Download,
  Trash2,
  LineChart as LineChartIcon,
  Activity,
  GraduationCap,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  Leaf,
  Sun,
  Moon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { localStore } from '@/lib/localStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type StoredUser = {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  password_salt: string;
  school_name: string;
  role: AppRole;
  created_at: string;
};

type Submission = {
  id: string;
  status?: 'approved' | 'pending' | 'rejected';
  submitted_at?: string;
};

type MissionItem = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  eco_points_reward?: number;
  is_active?: boolean;
  created_at?: string;
};

type QuestItem = {
  id: string;
  mission_id: string;
  status?: 'in_progress' | 'pending' | 'approved' | 'rejected';
  submitted_at?: string;
};

type ActivityItem = {
  id: string;
  type: 'signup' | 'role-change' | 'submission' | 'delete';
  message: string;
  created_at: string;
};

const USERS_KEY = 'ecoquest_users';
const SUBMISSIONS_KEY = 'ecoquest_submissions';
const ACTIVITY_KEY = 'ecoquest_admin_activity';

const ROLE_COLORS: Record<AppRole, string> = {
  student: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  teacher: 'bg-sky-100 text-sky-700 border-sky-200',
  admin: 'bg-violet-100 text-violet-700 border-violet-200',
};

const PIE_COLORS = ['#86efac', '#93c5fd', '#c4b5fd'];
const THEME_KEY = 'theme';

type ThemeMode = 'light' | 'dark' | 'eco';

const SIDEBAR_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: Home },
  { key: 'users', label: 'Users', icon: Users },
  { key: 'roles', label: 'Roles', icon: Shield },
  { key: 'missions', label: 'Missions', icon: Target },
  { key: 'submissions', label: 'Submissions', icon: FileCheck },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
] as const;

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return (JSON.parse(raw) as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function readUsers(): StoredUser[] {
  return safeParse<StoredUser[]>(localStorage.getItem(USERS_KEY), []);
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSubmissions(): Submission[] {
  return safeParse<Submission[]>(localStorage.getItem(SUBMISSIONS_KEY), []);
}

function readMissions(): MissionItem[] {
  return localStore.getAll('missions') as MissionItem[];
}

function readQuestSubmissions(): QuestItem[] {
  return localStore.getAll('mission_submissions') as QuestItem[];
}

function readActivity(): ActivityItem[] {
  return safeParse<ActivityItem[]>(localStorage.getItem(ACTIVITY_KEY), []);
}

function writeActivity(items: ActivityItem[]) {
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(items.slice(0, 100)));
}

function appendActivity(item: Omit<ActivityItem, 'id' | 'created_at'>) {
  const entries = readActivity();
  const next: ActivityItem = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    created_at: new Date().toISOString(),
    ...item,
  };
  writeActivity([next, ...entries]);
}

function roleLabel(role: AppRole): string {
  if (role === 'teacher') return 'Teacher';
  if (role === 'admin') return 'Administrator';
  return 'Student';
}

function formatDate(input: string): string {
  if (!input) return '-';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString();
}

function generateUserGrowth(users: StoredUser[]) {
  const map: Record<string, number> = {};
  users.forEach((u) => {
    const key = (u.created_at || new Date().toISOString()).slice(0, 10);
    map[key] = (map[key] || 0) + 1;
  });

  const points: Array<{ date: string; users: number }> = [];
  let running = 0;
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    running += map[key] || 0;
    points.push({ date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), users: running });
  }
  return points;
}

function generateSubmissionBars(submissions: Submission[]) {
  const map: Record<string, number> = {};
  submissions.forEach((s) => {
    const key = (s.submitted_at || new Date().toISOString()).slice(0, 10);
    map[key] = (map[key] || 0) + 1;
  });

  const points: Array<{ day: string; count: number }> = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    points.push({ day: d.toLocaleDateString('en', { weekday: 'short' }), count: map[key] || 0 });
  }
  return points;
}

function downloadCsv(rows: StoredUser[]) {
  const headers = ['Name', 'Email', 'Role', 'School', 'Joined'];
  const lines = rows.map((u) => [u.full_name, u.email, u.role, u.school_name || '-', formatDate(u.created_at)]);
  const csv = [headers, ...lines]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ecoquest-users-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminDashboardPage() {
  const { role, user, profile, signOut, updateUserRole } = useAuth();
  const { toast } = useToast();

  const [activeNav, setActiveNav] = useState<(typeof SIDEBAR_ITEMS)[number]['key']>('dashboard');
  const [globalSearch, setGlobalSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AppRole>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingRoleFor, setUpdatingRoleFor] = useState<string | null>(null);
  const [deletingUserFor, setDeletingUserFor] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>('eco');

  const [users, setUsers] = useState<StoredUser[]>(() => readUsers());
  const [missions, setMissions] = useState<MissionItem[]>(() => readMissions());
  const [questSubmissions, setQuestSubmissions] = useState<QuestItem[]>(() => readQuestSubmissions());

  const submissions = useMemo(() => readSubmissions(), []);
  const activity = useMemo(() => readActivity(), []);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY);
    const nextTheme: ThemeMode = saved === 'light' || saved === 'dark' || saved === 'eco' ? saved : 'eco';
    setTheme(nextTheme);
    document.documentElement.className = nextTheme;
  }, []);

  useEffect(() => {
    if (activeNav === 'missions') {
      setMissions(readMissions());
      setQuestSubmissions(readQuestSubmissions());
    }
  }, [activeNav]);

  const applyTheme = (nextTheme: ThemeMode) => {
    setTheme(nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    document.documentElement.className = nextTheme;
  };

  const themeStyles = {
    pageBg: theme === 'dark' ? 'bg-slate-900' : theme === 'light' ? 'bg-gray-50' : 'bg-green-50',
    navBg: theme === 'dark' ? 'bg-slate-900/95' : 'bg-white/95',
    navBorder: theme === 'dark' ? 'border-slate-700' : 'border-gray-200',
    textPrimary: theme === 'dark' ? 'text-gray-200' : 'text-gray-800',
    textSecondary: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    textMuted: theme === 'dark' ? 'text-gray-400' : 'text-gray-600',
    inputBg: theme === 'dark' ? 'bg-slate-800 border-slate-700 text-gray-200' : 'bg-gray-50 border-gray-200',
    panelBg: theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200',
    sideActive: theme === 'dark' ? 'bg-emerald-900/40 text-emerald-300 font-bold' : 'bg-emerald-50 text-emerald-700 font-bold',
    sideIdle: theme === 'dark' ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100',
    kpiCard: theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200',
    tableHeadBg: theme === 'dark' ? 'bg-slate-700 text-gray-300' : 'bg-gray-50 text-gray-600',
    tableRowBorder: theme === 'dark' ? 'border-slate-700' : 'border-gray-100',
    tableRowHover: theme === 'dark' ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50/80',
    chartGrid: theme === 'dark' ? '#334155' : '#e5e7eb',
    chartLine: theme === 'dark' ? '#38bdf8' : '#0ea5e9',
    chartBar: theme === 'dark' ? '#2dd4bf' : '#14b8a6',
    iconMuted: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    btnHover: theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-gray-100',
  };

  const schools = useMemo(() => {
    const set = new Set(users.map((u) => u.school_name).filter(Boolean));
    return Array.from(set).sort();
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = globalSearch.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery =
        !query || u.full_name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesSchool = schoolFilter === 'all' || (u.school_name || '-') === schoolFilter;
      return matchesQuery && matchesRole && matchesSchool;
    });
  }, [users, globalSearch, roleFilter, schoolFilter]);

  const pageSize = 8;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pagedUsers = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);

  const totalUsers = users.length;
  const activeStudents = users.filter((u) => u.role === 'student').length;
  const teachers = users.filter((u) => u.role === 'teacher').length;
  const totalSubmissions = submissions.length;
  const approvedCount = submissions.filter((s) => s.status === 'approved').length;
  const approvalRate = totalSubmissions ? Math.round((approvedCount / totalSubmissions) * 100) : 0;

  const rolePie = useMemo(
    () => [
      { name: 'Students', value: users.filter((u) => u.role === 'student').length },
      { name: 'Teachers', value: users.filter((u) => u.role === 'teacher').length },
      { name: 'Admins', value: users.filter((u) => u.role === 'admin').length },
    ],
    [users]
  );

  const userGrowthData = useMemo(() => generateUserGrowth(users), [users]);
  const submissionsData = useMemo(() => generateSubmissionBars(submissions), [submissions]);

  const recentActivity = useMemo(() => {
    const signupItems = users
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5)
      .map((u) => ({
        id: `signup_${u.id}`,
        type: 'signup' as const,
        message: `New user signup: ${u.full_name}`,
        created_at: u.created_at,
      }));

    const submissionItems = submissions
      .slice(0, 5)
      .map((s, index) => ({
        id: `submission_${s.id || index}`,
        type: 'submission' as const,
        message: `Submission ${s.status || 'pending'} recorded`,
        created_at: s.submitted_at || new Date().toISOString(),
      }));

    return [...activity, ...signupItems, ...submissionItems]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 8);
  }, [activity, users, submissions]);

  const isAdmin = role === 'admin';

  const updateRoleLocal = async (userId: string, nextRole: AppRole) => {
    if (!isAdmin) {
      toast({ title: 'Unauthorized', description: 'Only admin can change roles.', variant: 'destructive' });
      return;
    }

    setUpdatingRoleFor(userId);
    const previous = users.find((u) => u.id === userId);
    const result = await updateUserRole(userId, nextRole);

    if (result.error) {
      setUpdatingRoleFor(null);
      toast({ title: 'Role update failed', description: result.error.message, variant: 'destructive' });
      return;
    }

    const updated = readUsers();
    setUsers(updated);
    appendActivity({
      type: 'role-change',
      message: `Role changed: ${previous?.full_name || 'User'} -> ${roleLabel(nextRole)}`,
    });
    setUpdatingRoleFor(null);
    toast({ title: 'Role updated', description: `User is now ${roleLabel(nextRole)}.` });
  };

  const deleteUser = (target: StoredUser) => {
    if (!isAdmin) return;
    if (target.id === user?.id) {
      toast({ title: 'Action blocked', description: 'You cannot delete your own admin account.', variant: 'destructive' });
      return;
    }

    setDeletingUserFor(target.id);
    const updated = users.filter((u) => u.id !== target.id);
    writeUsers(updated);
    setUsers(updated);
    appendActivity({ type: 'delete', message: `User deleted: ${target.full_name}` });
    setDeletingUserFor(null);
    toast({ title: 'User removed', description: `${target.full_name} was deleted.` });
  };

  const toggleMissionStatus = (missionId: string) => {
    const target = missions.find((m) => m.id === missionId);
    if (!target) return;

    localStore.update('missions', missionId, { is_active: !(target.is_active ?? true) });
    const updatedMissions = readMissions();
    setMissions(updatedMissions);
    appendActivity({
      type: 'role-change',
      message: `Mission ${target.is_active ? 'disabled' : 'enabled'}: ${target.title}`,
    });
    toast({ title: 'Mission updated', description: `${target.title} is now ${target.is_active ? 'inactive' : 'active'}.` });
  };

  const removeMission = (missionId: string) => {
    const target = missions.find((m) => m.id === missionId);
    if (!target) return;

    localStore.remove('missions', missionId);
    const updatedMissions = readMissions();
    setMissions(updatedMissions);
    setQuestSubmissions(readQuestSubmissions());
    appendActivity({
      type: 'delete',
      message: `Mission removed: ${target.title}`,
    });
    toast({ title: 'Mission removed', description: `${target.title} was removed from quests.` });
  };

  const missionRows = useMemo(() => {
    return missions
      .slice()
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .map((mission) => {
        const quests = questSubmissions.filter((q) => q.mission_id === mission.id);
        return {
          ...mission,
          questsCount: quests.length,
          pendingCount: quests.filter((q) => q.status === 'pending').length,
          approvedCount: quests.filter((q) => q.status === 'approved').length,
          inProgressCount: quests.filter((q) => q.status === 'in_progress').length,
        };
      });
  }, [missions, questSubmissions]);

  const navTitle =
    activeNav === 'missions'
      ? 'Missions Workspace'
      : activeNav === 'users'
      ? 'Users Workspace'
      : activeNav === 'roles'
      ? 'Roles Workspace'
      : activeNav === 'submissions'
      ? 'Submissions Workspace'
      : activeNav === 'analytics'
      ? 'Analytics Workspace'
      : activeNav === 'settings'
      ? 'Settings Workspace'
      : 'Admin Dashboard';

  const navSubtitle =
    activeNav === 'missions'
      ? 'View all missions and quest activity, then manage mission availability from one place.'
      : activeNav === 'users'
      ? 'Manage all users in one place with search, filters, and account actions.'
      : activeNav === 'roles'
      ? 'Review role distribution and update user roles from the admin workspace.'
      : activeNav === 'submissions'
      ? 'Track submission trends and inspect submission statuses from a single queue.'
      : activeNav === 'analytics'
      ? 'Monitor core platform growth metrics and performance charts.'
      : activeNav === 'settings'
      ? 'Control workspace preferences and admin maintenance actions.'
      : 'Monitor users, roles, submissions, and platform activity.';

  const submissionStatusRows = useMemo(() => {
    return submissions
      .slice()
      .sort((a, b) => new Date(b.submitted_at || 0).getTime() - new Date(a.submitted_at || 0).getTime())
      .slice(0, 25);
  }, [submissions]);

  const resetAdminFilters = () => {
    setGlobalSearch('');
    setRoleFilter('all');
    setSchoolFilter('all');
    setCurrentPage(1);
    toast({ title: 'Filters reset', description: 'Workspace filters were reset.' });
  };

  const clearAdminActivity = () => {
    writeActivity([]);
    appendActivity({ type: 'delete', message: 'Activity log cleared by admin' });
    toast({ title: 'Activity cleared', description: 'Admin activity log has been cleared.' });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <Card className="max-w-lg w-full shadow-card">
          <CardHeader>
            <CardTitle className="text-2xl">Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Only administrators can access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeStyles.pageBg}`}>
      <header className={`sticky top-0 z-50 border-b backdrop-blur transition-colors duration-300 ${themeStyles.navBorder} ${themeStyles.navBg}`}>
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 font-display text-xl font-bold ${themeStyles.textPrimary}`}>
              <span>🌍</span>
              <span>EcoQuest</span>
            </div>
            <div className="relative hidden md:block w-80">
              <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${themeStyles.iconMuted}`} />
              <Input
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Global search users, emails..."
                className={`pl-9 rounded-xl transition-colors duration-300 ${themeStyles.inputBg}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={`rounded-xl gap-2 transition-all duration-200 ${themeStyles.btnHover}`}>
                  {theme === 'light' ? <Sun className="h-4 w-4" /> : theme === 'dark' ? <Moon className="h-4 w-4" /> : <Leaf className="h-4 w-4" />}
                  <span className="hidden md:inline capitalize">{theme}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => applyTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => applyTheme('eco')}>
                  <Leaf className="mr-2 h-4 w-4" /> Eco
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="icon" className={`relative rounded-xl transition-all duration-200 ${themeStyles.btnHover}`}>
              <Bell className="h-4 w-4" />
              {recentActivity.length > 0 && (
                <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-coral px-1 text-[10px] leading-4 text-white">
                  {Math.min(9, recentActivity.length)}
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={`rounded-xl gap-2 transition-all duration-200 ${themeStyles.btnHover}`}>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-jungle-pale">{profile?.avatar_emoji || '🛡️'}</span>
                  <span className="hidden md:inline">{profile?.full_name || 'Admin'}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Admin Profile</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Signed in as {profile?.email || 'admin'}</DropdownMenuItem>
                <DropdownMenuItem>Role: Administrator</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px] gap-6 px-4 py-6 md:px-8">
        <aside className={`sticky top-24 hidden h-[calc(100vh-7rem)] w-64 shrink-0 rounded-2xl border p-4 shadow-sm transition-colors duration-300 lg:block ${themeStyles.panelBg}`}>
          <p className={`px-3 pb-3 text-xs font-semibold uppercase tracking-wider ${themeStyles.textSecondary}`}>Admin Workspace</p>
          <nav className="space-y-1">
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeNav === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveNav(item.key)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition-all duration-200 ${
                    active ? themeStyles.sideActive : themeStyles.sideIdle
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 space-y-8">
          <section className="mb-6">
            <h1 className={`text-2xl font-bold ${themeStyles.textPrimary}`}>{navTitle}</h1>
            <p className={`mt-1 text-sm ${themeStyles.textSecondary}`}>{navSubtitle}</p>
          </section>

          {activeNav === 'missions' ? (
            <>
              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
              >
                <Card className={`rounded-xl border shadow-sm ${themeStyles.kpiCard}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm font-semibold ${themeStyles.textSecondary}`}>Total Missions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${themeStyles.textPrimary}`}>{missions.length}</div>
                  </CardContent>
                </Card>

                <Card className={`rounded-xl border shadow-sm ${themeStyles.kpiCard}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm font-semibold ${themeStyles.textSecondary}`}>Active Missions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${themeStyles.textPrimary}`}>
                      {missions.filter((m) => m.is_active !== false).length}
                    </div>
                  </CardContent>
                </Card>

                <Card className={`rounded-xl border shadow-sm ${themeStyles.kpiCard}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm font-semibold ${themeStyles.textSecondary}`}>Pending Quests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${themeStyles.textPrimary}`}>
                      {questSubmissions.filter((q) => q.status === 'pending').length}
                    </div>
                  </CardContent>
                </Card>

                <Card className={`rounded-xl border shadow-sm ${themeStyles.kpiCard}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm font-semibold ${themeStyles.textSecondary}`}>Approved Quests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${themeStyles.textPrimary}`}>
                      {questSubmissions.filter((q) => q.status === 'approved').length}
                    </div>
                  </CardContent>
                </Card>
              </motion.section>

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
              >
                <Card className={`rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
                  <CardHeader>
                    <CardTitle className={`text-xl ${themeStyles.textPrimary}`}>All Missions And Quests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`overflow-x-auto rounded-xl border transition-colors duration-300 ${themeStyles.panelBg}`}>
                      <table className="w-full min-w-[980px] text-sm">
                        <thead className={`${themeStyles.tableHeadBg} text-left`}>
                          <tr>
                            <th className="px-4 py-3 font-semibold">Mission</th>
                            <th className="px-4 py-3 font-semibold">Category</th>
                            <th className="px-4 py-3 font-semibold">Difficulty</th>
                            <th className="px-4 py-3 font-semibold">EcoPoints</th>
                            <th className="px-4 py-3 font-semibold">Quest Pipeline</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {missionRows.length === 0 && (
                            <tr>
                              <td className="px-4 py-8 text-center text-gray-500" colSpan={7}>
                                No missions available.
                              </td>
                            </tr>
                          )}

                          {missionRows.map((mission) => (
                            <tr key={mission.id} className={`border-t transition-all duration-200 ${themeStyles.tableRowBorder} ${themeStyles.tableRowHover}`}>
                              <td className="px-4 py-3">
                                <p className={`font-semibold ${themeStyles.textPrimary}`}>{mission.title}</p>
                                <p className={`text-xs ${themeStyles.textSecondary}`}>{mission.description || 'No description'}</p>
                              </td>
                              <td className={`px-4 py-3 ${themeStyles.textMuted}`}>{mission.category || '-'}</td>
                              <td className={`px-4 py-3 capitalize ${themeStyles.textMuted}`}>{mission.difficulty || '-'}</td>
                              <td className={`px-4 py-3 ${themeStyles.textMuted}`}>+{mission.eco_points_reward || 0}</td>
                              <td className={`px-4 py-3 ${themeStyles.textMuted}`}>
                                {mission.questsCount} total · {mission.inProgressCount} in progress · {mission.pendingCount} pending · {mission.approvedCount} approved
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={mission.is_active === false ? 'bg-gray-200 text-gray-700 border-gray-300' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}>
                                  {mission.is_active === false ? 'Inactive' : 'Active'}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className={`h-8 rounded-lg transition-all duration-200 ${themeStyles.btnHover}`}
                                    onClick={() => toggleMissionStatus(mission.id)}
                                  >
                                    {mission.is_active === false ? 'Enable' : 'Disable'}
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="destructive" className="h-8 rounded-lg transition-all duration-200">
                                        <Trash2 className="mr-1 h-3 w-3" /> Remove
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove mission?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This removes the mission from admin mission management. Existing quest records stay in submissions history.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => removeMission(mission.id)}>Confirm Remove</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.section>
            </>
          ) : (
            <>
              {activeNav === 'dashboard' && (
                <>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
          >
            {[
              { title: 'Total Users', value: totalUsers, icon: Users, trend: '+8.2%', up: true },
              { title: 'Active Students', value: activeStudents, icon: GraduationCap, trend: '+5.1%', up: true },
              { title: 'Teachers', value: teachers, icon: UserCheck, trend: '+1.3%', up: true },
              { title: 'Total Submissions', value: totalSubmissions, icon: FileCheck, trend: '+12.4%', up: true },
              { title: 'Approval Rate', value: `${approvalRate}%`, icon: CheckCircle2, trend: '-1.8%', up: false },
            ].map((kpi) => (
              <Card key={kpi.title} className={`rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${themeStyles.kpiCard}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className={`text-sm font-semibold ${themeStyles.textSecondary}`}>{kpi.title}</CardTitle>
                    <kpi.icon className={`h-4 w-4 ${themeStyles.iconMuted}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${themeStyles.textPrimary}`}>{kpi.value}</div>
                  <p className={`mt-1 flex items-center gap-1 text-xs ${kpi.up ? 'text-emerald-600' : 'text-coral'}`}>
                    {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {kpi.trend} vs last week
                  </p>
                </CardContent>
              </Card>
            ))}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-3"
          >
            <Card className={`xl:col-span-2 rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 text-xl ${themeStyles.textPrimary}`}>
                  <LineChartIcon className="h-4 w-4" /> User Growth
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.chartGrid} />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke={themeStyles.chartLine} strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className={`rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 text-xl ${themeStyles.textPrimary}`}>
                  <PieChartIcon className="h-4 w-4" /> Role Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="h-72 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={rolePie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90}>
                      {rolePie.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className={`mt-2 grid grid-cols-1 gap-1 text-xs ${themeStyles.textMuted}`}>
                  {rolePie.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                      <span>{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="grid grid-cols-1 gap-4 2xl:grid-cols-3"
          >
            <Card className={`2xl:col-span-2 rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className={`text-xl ${themeStyles.textPrimary}`}>Users Management</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className={`rounded-xl transition-all duration-200 ${themeStyles.btnHover}`} onClick={() => downloadCsv(filteredUsers)}>
                      <Download className="mr-2 h-4 w-4" /> Export CSV
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div className="relative md:col-span-1">
                    <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${themeStyles.iconMuted}`} />
                    <Input
                      value={globalSearch}
                      onChange={(e) => {
                        setCurrentPage(1);
                        setGlobalSearch(e.target.value);
                      }}
                      placeholder="Search by name or email"
                      className={`rounded-xl pl-9 transition-colors duration-300 ${themeStyles.inputBg}`}
                    />
                  </div>

                  <Select
                    value={roleFilter}
                    onValueChange={(value: 'all' | AppRole) => {
                      setCurrentPage(1);
                      setRoleFilter(value);
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={schoolFilter}
                    onValueChange={(value) => {
                      setCurrentPage(1);
                      setSchoolFilter(value);
                    }}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Filter by school" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All schools</SelectItem>
                      {schools.map((school) => (
                        <SelectItem key={school} value={school}>
                          {school}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent>
                <div className={`overflow-x-auto rounded-xl border transition-colors duration-300 ${themeStyles.panelBg}`}>
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className={`${themeStyles.tableHeadBg} text-left`}>
                      <tr>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold">Email</th>
                        <th className="px-4 py-3 font-semibold">Role</th>
                        <th className="px-4 py-3 font-semibold">School</th>
                        <th className="px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedUsers.length === 0 && (
                        <tr>
                          <td className="px-4 py-8 text-center text-gray-500" colSpan={5}>
                            No users found for selected filters.
                          </td>
                        </tr>
                      )}

                      {pagedUsers.map((u) => (
                        <tr key={u.id} className={`border-t transition-all duration-200 ${themeStyles.tableRowBorder} ${themeStyles.tableRowHover}`}>
                          <td className={`px-4 py-3 text-base font-medium ${themeStyles.textPrimary}`}>{u.full_name}</td>
                          <td className={`px-4 py-3 text-base ${themeStyles.textMuted}`}>{u.email}</td>
                          <td className="px-4 py-3">
                            <Badge className={`${ROLE_COLORS[u.role]} border`}>{roleLabel(u.role)}</Badge>
                          </td>
                          <td className={`px-4 py-3 text-base ${themeStyles.textMuted}`}>{u.school_name || '-'}</td>
                          <td className="px-4 py-3">
                            {isAdmin ? (
                              <div className="flex flex-wrap gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`h-8 rounded-lg transition-all duration-200 ${themeStyles.btnHover}`}
                                  disabled={updatingRoleFor === u.id || u.role === 'teacher'}
                                  onClick={() => updateRoleLocal(u.id, 'teacher')}
                                >
                                  <UserCheck className="mr-1 h-3 w-3" /> Make Teacher
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`h-8 rounded-lg transition-all duration-200 ${themeStyles.btnHover}`}
                                  disabled={updatingRoleFor === u.id || u.role === 'admin'}
                                  onClick={() => updateRoleLocal(u.id, 'admin')}
                                >
                                  <UserCog className="mr-1 h-3 w-3" /> Make Admin
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`h-8 rounded-lg transition-all duration-200 ${themeStyles.btnHover}`}
                                  disabled={updatingRoleFor === u.id || u.role === 'student'}
                                  onClick={() => updateRoleLocal(u.id, 'student')}
                                >
                                  <UserMinus className="mr-1 h-3 w-3" /> Make Student
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive" className="h-8 rounded-lg transition-all duration-200" disabled={deletingUserFor === u.id}>
                                      <Trash2 className="mr-1 h-3 w-3" /> Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete user account?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. The selected user will be removed permanently.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteUser(u)}>Confirm Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            ) : (
                              <span className={themeStyles.iconMuted}>-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={`mt-4 flex items-center justify-between text-sm ${themeStyles.textMuted}`}>
                  <p>
                    Showing {(safePage - 1) * pageSize + 1} - {Math.min(safePage * pageSize, filteredUsers.length)} of {filteredUsers.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className={`rounded-lg transition-all duration-200 ${themeStyles.btnHover}`} disabled={safePage <= 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                      Prev
                    </Button>
                    <span>
                      Page {safePage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`rounded-lg transition-all duration-200 ${themeStyles.btnHover}`}
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card className={`rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 text-xl ${themeStyles.textPrimary}`}>
                    <Activity className="h-4 w-4" /> Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentActivity.length === 0 && <p className={`text-sm ${themeStyles.textSecondary}`}>No recent activity.</p>}
                  {recentActivity.map((item) => (
                    <div key={item.id} className={`rounded-xl border p-3 transition-colors duration-300 ${theme === 'dark' ? 'border-slate-700 bg-slate-700/30' : 'border-gray-200 bg-gray-50'}`}>
                      <p className={`text-sm font-medium ${themeStyles.textPrimary}`}>{item.message}</p>
                      <p className={`mt-1 text-xs ${themeStyles.textSecondary}`}>{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className={`rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
                <CardHeader>
                  <CardTitle className={`text-xl ${themeStyles.textPrimary}`}>Submissions Per Day</CardTitle>
                </CardHeader>
                <CardContent className="h-64 p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={submissionsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.chartGrid} />
                      <XAxis dataKey="day" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill={themeStyles.chartBar} radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </motion.section>
                </>
              )}

              {activeNav === 'users' && (
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                >
                  <Card className={`rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
                    <CardHeader className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <CardTitle className={`text-xl ${themeStyles.textPrimary}`}>Users Management</CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Button variant="outline" className={`rounded-xl transition-all duration-200 ${themeStyles.btnHover}`} onClick={() => downloadCsv(filteredUsers)}>
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                          </Button>
                          <Button variant="outline" className={`rounded-xl transition-all duration-200 ${themeStyles.btnHover}`} onClick={resetAdminFilters}>
                            Reset Filters
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <div className="relative md:col-span-1">
                          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${themeStyles.iconMuted}`} />
                          <Input
                            value={globalSearch}
                            onChange={(e) => {
                              setCurrentPage(1);
                              setGlobalSearch(e.target.value);
                            }}
                            placeholder="Search by name or email"
                            className={`rounded-xl pl-9 transition-colors duration-300 ${themeStyles.inputBg}`}
                          />
                        </div>

                        <Select
                          value={roleFilter}
                          onValueChange={(value: 'all' | AppRole) => {
                            setCurrentPage(1);
                            setRoleFilter(value);
                          }}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Filter by role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="admin">Administrator</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select
                          value={schoolFilter}
                          onValueChange={(value) => {
                            setCurrentPage(1);
                            setSchoolFilter(value);
                          }}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Filter by school" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All schools</SelectItem>
                            {schools.map((school) => (
                              <SelectItem key={school} value={school}>
                                {school}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className={`overflow-x-auto rounded-xl border transition-colors duration-300 ${themeStyles.panelBg}`}>
                        <table className="w-full min-w-[760px] text-sm">
                          <thead className={`${themeStyles.tableHeadBg} text-left`}>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Name</th>
                              <th className="px-4 py-3 font-semibold">Email</th>
                              <th className="px-4 py-3 font-semibold">Role</th>
                              <th className="px-4 py-3 font-semibold">School</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pagedUsers.length === 0 && (
                              <tr>
                                <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>
                                  No users found for selected filters.
                                </td>
                              </tr>
                            )}

                            {pagedUsers.map((u) => (
                              <tr key={u.id} className={`border-t transition-all duration-200 ${themeStyles.tableRowBorder} ${themeStyles.tableRowHover}`}>
                                <td className={`px-4 py-3 text-base font-medium ${themeStyles.textPrimary}`}>{u.full_name}</td>
                                <td className={`px-4 py-3 text-base ${themeStyles.textMuted}`}>{u.email}</td>
                                <td className="px-4 py-3">
                                  <Badge className={`${ROLE_COLORS[u.role]} border`}>{roleLabel(u.role)}</Badge>
                                </td>
                                <td className={`px-4 py-3 text-base ${themeStyles.textMuted}`}>{u.school_name || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.section>
              )}

              {activeNav === 'roles' && (
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 gap-4 xl:grid-cols-3"
                >
                  <Card className={`rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
                    <CardHeader>
                      <CardTitle className={`text-xl ${themeStyles.textPrimary}`}>Role Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {rolePie.map((item, idx) => (
                        <div key={item.name} className="flex items-center justify-between rounded-lg border px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                            <span className={themeStyles.textPrimary}>{item.name}</span>
                          </div>
                          <span className={`font-semibold ${themeStyles.textPrimary}`}>{item.value}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className={`xl:col-span-2 rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
                    <CardHeader>
                      <CardTitle className={`text-xl ${themeStyles.textPrimary}`}>Role Access Control</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`overflow-x-auto rounded-xl border transition-colors duration-300 ${themeStyles.panelBg}`}>
                        <table className="w-full min-w-[860px] text-sm">
                          <thead className={`${themeStyles.tableHeadBg} text-left`}>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Name</th>
                              <th className="px-4 py-3 font-semibold">Current Role</th>
                              <th className="px-4 py-3 font-semibold">Change Role</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((u) => (
                              <tr key={u.id} className={`border-t transition-all duration-200 ${themeStyles.tableRowBorder} ${themeStyles.tableRowHover}`}>
                                <td className={`px-4 py-3 text-base font-medium ${themeStyles.textPrimary}`}>{u.full_name}</td>
                                <td className="px-4 py-3">
                                  <Badge className={`${ROLE_COLORS[u.role]} border`}>{roleLabel(u.role)}</Badge>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-1.5">
                                    <Button size="sm" variant="outline" className={`h-8 rounded-lg transition-all duration-200 ${themeStyles.btnHover}`} disabled={updatingRoleFor === u.id || u.role === 'teacher'} onClick={() => updateRoleLocal(u.id, 'teacher')}>
                                      Teacher
                                    </Button>
                                    <Button size="sm" variant="outline" className={`h-8 rounded-lg transition-all duration-200 ${themeStyles.btnHover}`} disabled={updatingRoleFor === u.id || u.role === 'admin'} onClick={() => updateRoleLocal(u.id, 'admin')}>
                                      Admin
                                    </Button>
                                    <Button size="sm" variant="outline" className={`h-8 rounded-lg transition-all duration-200 ${themeStyles.btnHover}`} disabled={updatingRoleFor === u.id || u.role === 'student'} onClick={() => updateRoleLocal(u.id, 'student')}>
                                      Student
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </motion.section>
              )}

              {activeNav === 'submissions' && (
                <>
                  <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-3"
                  >
                    <Card className={`rounded-xl border shadow-sm ${themeStyles.kpiCard}`}>
                      <CardHeader className="pb-2"><CardTitle className={`text-sm font-semibold ${themeStyles.textSecondary}`}>Pending</CardTitle></CardHeader>
                      <CardContent><div className={`text-2xl font-bold ${themeStyles.textPrimary}`}>{submissions.filter((s) => s.status === 'pending').length}</div></CardContent>
                    </Card>
                    <Card className={`rounded-xl border shadow-sm ${themeStyles.kpiCard}`}>
                      <CardHeader className="pb-2"><CardTitle className={`text-sm font-semibold ${themeStyles.textSecondary}`}>Approved</CardTitle></CardHeader>
                      <CardContent><div className={`text-2xl font-bold ${themeStyles.textPrimary}`}>{submissions.filter((s) => s.status === 'approved').length}</div></CardContent>
                    </Card>
                    <Card className={`rounded-xl border shadow-sm ${themeStyles.kpiCard}`}>
                      <CardHeader className="pb-2"><CardTitle className={`text-sm font-semibold ${themeStyles.textSecondary}`}>Rejected</CardTitle></CardHeader>
                      <CardContent><div className={`text-2xl font-bold ${themeStyles.textPrimary}`}>{submissions.filter((s) => s.status === 'rejected').length}</div></CardContent>
                    </Card>
                  </motion.section>

                  <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 }}
                    className="grid grid-cols-1 gap-4 xl:grid-cols-2"
                  >
                    <Card className={`rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
                      <CardHeader>
                        <CardTitle className={`text-xl ${themeStyles.textPrimary}`}>Submissions Per Day</CardTitle>
                      </CardHeader>
                      <CardContent className="h-72 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={submissionsData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.chartGrid} />
                            <XAxis dataKey="day" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="count" fill={themeStyles.chartBar} radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className={`rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
                      <CardHeader>
                        <CardTitle className={`text-xl ${themeStyles.textPrimary}`}>Submission Records</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className={`overflow-x-auto rounded-xl border transition-colors duration-300 ${themeStyles.panelBg}`}>
                          <table className="w-full min-w-[520px] text-sm">
                            <thead className={`${themeStyles.tableHeadBg} text-left`}>
                              <tr>
                                <th className="px-4 py-3 font-semibold">Submission ID</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 font-semibold">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {submissionStatusRows.length === 0 && (
                                <tr>
                                  <td className="px-4 py-8 text-center text-gray-500" colSpan={3}>No submissions found.</td>
                                </tr>
                              )}
                              {submissionStatusRows.map((s) => (
                                <tr key={s.id} className={`border-t ${themeStyles.tableRowBorder}`}>
                                  <td className={`px-4 py-3 ${themeStyles.textPrimary}`}>{s.id}</td>
                                  <td className="px-4 py-3">
                                    <Badge className={s.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : s.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}>
                                      {s.status || 'pending'}
                                    </Badge>
                                  </td>
                                  <td className={`px-4 py-3 ${themeStyles.textMuted}`}>{formatDate(s.submitted_at || '')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.section>
                </>
              )}

              {activeNav === 'analytics' && (
                <>
                  <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                    className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
                  >
                    {[{ title: 'Total Users', value: totalUsers }, { title: 'Students', value: activeStudents }, { title: 'Teachers', value: teachers }, { title: 'Submissions', value: totalSubmissions }, { title: 'Approval Rate', value: `${approvalRate}%` }].map((kpi) => (
                      <Card key={kpi.title} className={`rounded-xl border shadow-sm ${themeStyles.kpiCard}`}>
                        <CardHeader className="pb-2"><CardTitle className={`text-sm font-semibold ${themeStyles.textSecondary}`}>{kpi.title}</CardTitle></CardHeader>
                        <CardContent><div className={`text-2xl font-bold ${themeStyles.textPrimary}`}>{kpi.value}</div></CardContent>
                      </Card>
                    ))}
                  </motion.section>

                  <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.05 }}
                    className="grid grid-cols-1 gap-4 xl:grid-cols-3"
                  >
                    <Card className={`xl:col-span-2 rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
                      <CardHeader>
                        <CardTitle className={`flex items-center gap-2 text-xl ${themeStyles.textPrimary}`}>
                          <LineChartIcon className="h-4 w-4" /> User Growth
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-72 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={userGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={themeStyles.chartGrid} />
                            <XAxis dataKey="date" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Line type="monotone" dataKey="users" stroke={themeStyles.chartLine} strokeWidth={2.5} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className={`rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
                      <CardHeader>
                        <CardTitle className={`flex items-center gap-2 text-xl ${themeStyles.textPrimary}`}>
                          <PieChartIcon className="h-4 w-4" /> Role Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="h-72 p-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={rolePie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90}>
                              {rolePie.map((entry, index) => (
                                <Cell key={`${entry.name}-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </motion.section>
                </>
              )}

              {activeNav === 'settings' && (
                <motion.section
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 gap-4 xl:grid-cols-2"
                >
                  <Card className={`rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
                    <CardHeader>
                      <CardTitle className={`text-xl ${themeStyles.textPrimary}`}>Theme & Appearance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className={`text-sm ${themeStyles.textSecondary}`}>Current theme: {theme}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className={`rounded-xl ${themeStyles.btnHover}`} onClick={() => applyTheme('light')}>Light</Button>
                        <Button variant="outline" className={`rounded-xl ${themeStyles.btnHover}`} onClick={() => applyTheme('dark')}>Dark</Button>
                        <Button variant="outline" className={`rounded-xl ${themeStyles.btnHover}`} onClick={() => applyTheme('eco')}>Eco</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`rounded-xl border shadow-sm transition-colors duration-300 ${themeStyles.panelBg}`}>
                    <CardHeader>
                      <CardTitle className={`text-xl ${themeStyles.textPrimary}`}>Workspace Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className={`w-full justify-start rounded-xl ${themeStyles.btnHover}`} onClick={() => downloadCsv(filteredUsers)}>
                        <Download className="mr-2 h-4 w-4" /> Export Users CSV
                      </Button>
                      <Button variant="outline" className={`w-full justify-start rounded-xl ${themeStyles.btnHover}`} onClick={resetAdminFilters}>
                        Reset Admin Filters
                      </Button>
                      <Button variant="destructive" className="w-full justify-start rounded-xl" onClick={clearAdminActivity}>
                        <Trash2 className="mr-2 h-4 w-4" /> Clear Activity Log
                      </Button>
                    </CardContent>
                  </Card>
                </motion.section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
