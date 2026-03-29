import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SCHOOL_OPTIONS = ['MPGI', 'PSIT', 'KGI', 'KIT', 'AKTU', 'CSJMU'] as const;
const USERS_KEY = 'ecoquest_users';

type PublicStoredUser = {
  id: string;
  full_name: string;
  email: string;
  school_name: string;
  role: AppRole;
};

function readUsers(): PublicStoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function normalizeRole(value: string | undefined): AppRole {
  if (value === 'teacher' || value === 'admin') return value;
  return 'student';
}

const roleConfig: Record<AppRole, { emoji: string; title: string; subtitle: string; gradient: string }> = {
  student: {
    emoji: '🌱',
    title: 'Student',
    subtitle: 'Continue your eco-journey',
    gradient: 'from-emerald-50 via-background to-background',
  },
  teacher: {
    emoji: '📚',
    title: 'Teacher',
    subtitle: 'Access your classroom dashboard',
    gradient: 'from-blue-50 via-background to-background',
  },
  admin: {
    emoji: '⚙️',
    title: 'Administrator',
    subtitle: 'System administration panel',
    gradient: 'from-violet-50 via-background to-background',
  },
};

function RoleLoginPageInternal({ expectedRole }: { expectedRole: AppRole }) {
  const navigate = useNavigate();
  const { signIn, signOut, loading: authLoading, user, role, resolveDashboardPath } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!authLoading && user && role) {
    return <Navigate to={resolveDashboardPath(role)} replace />;
  }

  const config = roleConfig[expectedRole];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();
    const record = readUsers().find((u) => u.email.toLowerCase() === cleanEmail);
    if (!record) {
      toast({ title: 'Login failed', description: 'User not found', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await signIn(cleanEmail, password);
    if (error) {
      setLoading(false);
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
      return;
    }

    if (record.role !== expectedRole) {
      await signOut();
      setLoading(false);
      toast({ title: 'Login failed', description: 'Unauthorized role access', variant: 'destructive' });
      return;
    }

    navigate(resolveDashboardPath(record.role), { replace: true });
    setLoading(false);
    toast({ title: 'Login successful', description: `${config.title} account authenticated.` });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.gradient}`}>
      <div className="min-h-screen flex flex-col lg:flex-row">
        <div className="hidden lg:flex flex-1 items-center justify-center p-12">
          <div className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.9 }} className="text-8xl mb-6">
              {config.emoji}
            </motion.div>
            <h2 className="font-display font-bold text-3xl text-foreground mb-3">{config.title} Login</h2>
            <p className="text-muted-foreground max-w-sm">{config.subtitle}</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
            <Link to="/role-selection" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to roles
            </Link>

            <div className="flex items-center gap-2 mb-8">
              <span className="text-2xl">🌿</span>
              <span className="font-display font-bold text-jungle-deep text-xl">EcoQuest</span>
            </div>

            <h1 className="font-display font-bold text-3xl text-jungle-deep mb-2">{config.title} Login</h1>
            <p className="text-muted-foreground mb-8">Enter your email and password</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="rounded-xl" required />
              </div>
              <Button type="submit" className="w-full rounded-xl font-heading font-bold shadow-card" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Log In
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Need an account?{' '}
              <Link to={`/${expectedRole}/signup`} className="text-primary hover:underline font-semibold">
                Sign Up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function RoleSignupPageInternal({ pageRole }: { pageRole: AppRole }) {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    school_name: '',
    role: pageRole as AppRole,
  });

  const config = roleConfig[pageRole];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    const { error } = await signUp(
      form.email,
      form.password,
      form.full_name,
      form.school_name,
      form.role
    );
    setLoading(false);

    if (error) {
      toast({ title: 'Signup failed', description: error.message, variant: 'destructive' });
      return;
    }

    toast({
      title: 'Signup complete',
      description: `${roleConfig[form.role].title} account created successfully.`,
    });

    navigate(`/login-${form.role}`);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.gradient}`}>
      <div className="min-h-screen flex flex-col lg:flex-row">
        <div className="hidden lg:flex flex-1 items-center justify-center p-12">
          <div className="text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.9 }} className="text-8xl mb-6">
              {config.emoji}
            </motion.div>
            <h2 className="font-display font-bold text-3xl text-foreground mb-3">{config.title} Signup</h2>
            <p className="text-muted-foreground max-w-sm">Create your account. Role assignment is system controlled.</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
            <Link to="/role-selection" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to roles
            </Link>

            <div className="flex items-center gap-2 mb-8">
              <span className="text-2xl">🌿</span>
              <span className="font-display font-bold text-jungle-deep text-xl">EcoQuest</span>
            </div>

            <h1 className="font-display font-bold text-3xl text-jungle-deep mb-2">Create Account</h1>
            <p className="text-muted-foreground mb-8">Full name, email, password, school, and role are required.</p>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Your full name"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup_email">Email</Label>
                <Input
                  id="signup_email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="your@email.com"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup_password">Password</Label>
                <Input
                  id="signup_password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="rounded-xl"
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label>School Name</Label>
                <Select value={form.school_name} onValueChange={(value) => setForm({ ...form, school_name: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select your school" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_OPTIONS.map((school) => (
                      <SelectItem key={school} value={school}>
                        {school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value as AppRole })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select account role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full rounded-xl font-heading font-bold shadow-card" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link to={`/login-${pageRole}`} className="text-primary hover:underline font-semibold">
                Log In
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function SignupPage() {
  return <RoleSignupPageInternal pageRole="student" />;
}

export function LoginStudentPage() {
  return <RoleLoginPageInternal expectedRole="student" />;
}

export function LoginTeacherPage() {
  return <RoleLoginPageInternal expectedRole="teacher" />;
}

export function LoginAdminPage() {
  return <RoleLoginPageInternal expectedRole="admin" />;
}

export function RoleSignupPage() {
  const { role } = useParams<{ role: string }>();
  const pageRole = useMemo(() => normalizeRole(role), [role]);
  return <RoleSignupPageInternal pageRole={pageRole} />;
}
