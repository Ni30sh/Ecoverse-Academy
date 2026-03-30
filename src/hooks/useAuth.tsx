import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { localStore } from '@/lib/localStore';

export type AppRole = 'student' | 'teacher' | 'admin';

type AuthUser = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    role?: AppRole;
    school_name?: string;
  };
};

type AuthSession = {
  user: AuthUser;
  token: string;
};

interface Profile {
  id: string;
  role: AppRole;
  full_name: string;
  avatar_emoji: string;
  eco_points: number;
  streak_days: number;
  last_active_date: string | null;
  interests: string[];
  daily_goal: number;
  school_name: string;
  city: string;
  created_at: string;
}

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

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    schoolName?: string,
    requestedRole?: string
  ) => Promise<{ error: Error | null; needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserRole: (userId: string, newRole: AppRole) => Promise<{ error: Error | null }>;
  isTeacher: boolean;
  resolveDashboardPath: (inputRole?: AppRole | null) => '/student-dashboard' | '/teacher-dashboard' | '/admin-dashboard';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = 'ecoquest_users';
const USERS_MIRROR_KEY = 'users';
const SESSION_KEY = 'ecoquest_auth';
const CURRENT_USER_KEY = 'currentUser';
const DEFAULT_ADMIN_EMAIL = 'admin1@gmail.com';
const DEFAULT_ADMIN_PASSWORD = 'password';

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function makeSessionToken() {
  return `${Date.now()}_${makeId()}`;
}

function normalizeRole(value: unknown): AppRole {
  if (value === 'teacher' || value === 'admin') return value;
  return 'student';
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function readUsers(): StoredUser[] {
  const users = safeParse<StoredUser[]>(localStorage.getItem(USERS_KEY), []);
  if (!Array.isArray(users)) return [];
  return users.map((u) => ({
    ...u,
    role: normalizeRole((u as StoredUser).role),
  }));
}

function writeUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function writeUsersMirror(users: StoredUser[]) {
  const mirrorUsers = users.map((u) => ({
    user_id: u.id,
    role: u.role,
    school_name: u.school_name,
    email: u.email,
    full_name: u.full_name,
  }));
  localStorage.setItem(USERS_MIRROR_KEY, JSON.stringify(mirrorUsers));
}

function setCurrentUser(stored: StoredUser | null) {
  if (!stored) {
    localStorage.removeItem(CURRENT_USER_KEY);
    return;
  }

  localStorage.setItem(
    CURRENT_USER_KEY,
    JSON.stringify({
      user_id: stored.id,
      id: stored.id,
      email: stored.email,
      full_name: stored.full_name,
      role: stored.role,
      school_name: stored.school_name,
    })
  );
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  if (globalThis.crypto?.subtle?.digest) {
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return toBase64(new Uint8Array(digest));
  }

  // Fallback hash for environments where SubtleCrypto is unavailable.
  let hash = 2166136261;
  for (let i = 0; i < bytes.length; i += 1) {
    hash ^= bytes[i];
    hash = Math.imul(hash, 16777619);
  }
  return btoa(`fnv1a:${(hash >>> 0).toString(16)}`);
}

async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const saltBytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(saltBytes);
  } else {
    for (let i = 0; i < saltBytes.length; i += 1) {
      saltBytes[i] = Math.floor(Math.random() * 256);
    }
  }
  const salt = toBase64(saltBytes);
  const hash = await sha256(`${salt}:${password}`);
  return { hash, salt };
}

async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  if (!storedHash || !salt) return false;
  // Validate base64 salt shape before hashing to avoid malformed legacy values.
  try {
    fromBase64(salt);
  } catch {
    return false;
  }
  const computed = await sha256(`${salt}:${password}`);
  return computed === storedHash;
}

function toAuthUser(stored: StoredUser): AuthUser {
  return {
    id: stored.id,
    email: stored.email,
    user_metadata: {
      full_name: stored.full_name,
      role: stored.role,
      school_name: stored.school_name,
    },
  };
}

function toProfile(stored: StoredUser): Profile {
  const localProfile = localStore.getById('profiles', stored.id);

  return {
    id: stored.id,
    role: stored.role,
    full_name: localProfile?.full_name ?? stored.full_name,
    avatar_emoji: localProfile?.avatar_emoji ?? (stored.role === 'teacher' ? '📚' : '🌱'),
    eco_points: Number(localProfile?.eco_points ?? 0),
    streak_days: Number(localProfile?.streak_days ?? 0),
    last_active_date: localProfile?.last_active_date ?? null,
    interests: localProfile?.interests ?? [],
    daily_goal: Number(localProfile?.daily_goal ?? 2),
    school_name: localProfile?.school_name ?? stored.school_name,
    city: localProfile?.city ?? '',
    created_at: localProfile?.created_at ?? stored.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const signUpInFlightRef = useRef(false);
  const signInInFlightRef = useRef(false);

  const applyStoredUser = (stored: StoredUser | null, token?: string) => {
    if (!stored) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
      setCurrentUser(null);
      return;
    }

    const nextUser = toAuthUser(stored);
    const nextToken = token || makeSessionToken();

    setUser(nextUser);
    setSession({ user: nextUser, token: nextToken });
    setProfile(toProfile(stored));
    setRole(stored.role);
    setCurrentUser(stored);
  };

  const refreshProfile = async () => {
    const sessionRaw = localStorage.getItem(SESSION_KEY);
    const sessionData = safeParse<{ id: string; token: string } | null>(sessionRaw, null);

    if (!sessionData?.id) {
      applyStoredUser(null);
      return;
    }

    const stored = readUsers().find((u) => u.id === sessionData.id) ?? null;
    if (!stored) {
      localStorage.removeItem(SESSION_KEY);
      applyStoredUser(null);
      return;
    }

    localStore.syncAuthUsers();
    applyStoredUser(stored, sessionData.token || makeSessionToken());
  };

  const ensureDefaultAdminAccount = async () => {
    const users = readUsers();
    const existing = users.find((u) => u.email.toLowerCase() === DEFAULT_ADMIN_EMAIL);

    if (existing) {
      if (existing.role !== 'admin') {
        const updated = users.map((u) =>
          u.email.toLowerCase() === DEFAULT_ADMIN_EMAIL ? { ...u, role: 'admin' as const } : u
        );
        writeUsers(updated);
        writeUsersMirror(updated);
      } else {
        writeUsersMirror(users);
      }
      return;
    }

    const { hash, salt } = await hashPassword(DEFAULT_ADMIN_PASSWORD);
    const seededAdmin: StoredUser = {
      id: makeId(),
      full_name: 'School Administrator',
      email: DEFAULT_ADMIN_EMAIL,
      password_hash: hash,
      password_salt: salt,
      school_name: 'EcoQuest HQ',
      role: 'admin',
      created_at: new Date().toISOString(),
    };

    writeUsers([...users, seededAdmin]);
    writeUsersMirror([...users, seededAdmin]);
  };

  useEffect(() => {
    const initAuth = async () => {
      await ensureDefaultAdminAccount();
      // Sync auth users to local store
      localStore.syncAuthUsers();
      await refreshProfile();
      setLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    schoolName?: string,
    requestedRole?: string
  ) => {
    if (signUpInFlightRef.current) {
      return { error: new Error('Signup already in progress'), needsEmailConfirmation: false };
    }

    signUpInFlightRef.current = true;
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();

      if (!cleanEmail || !cleanName || !password) {
        return { error: new Error('Missing required signup fields'), needsEmailConfirmation: false };
      }

      const users = readUsers();
      if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
        return { error: new Error('User already exists with this email'), needsEmailConfirmation: false };
      }

      const { hash, salt } = await hashPassword(password);
      const effectiveRole = normalizeRole(requestedRole);
      const newUser: StoredUser = {
        id: makeId(),
        full_name: cleanName,
        email: cleanEmail,
        password_hash: hash,
        password_salt: salt,
        school_name: (schoolName || '').trim(),
        role: effectiveRole,
        created_at: new Date().toISOString(),
      };

      writeUsers([...users, newUser]);
      writeUsersMirror([...users, newUser]);

      // Sync to localStore immediately
      localStore.syncAuthUsers();

      return { error: null, needsEmailConfirmation: false };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Signup failed'), needsEmailConfirmation: false };
    } finally {
      signUpInFlightRef.current = false;
    }
  };

  const signIn = async (email: string, password: string) => {
    if (signInInFlightRef.current) {
      return { error: new Error('Login already in progress') };
    }

    signInInFlightRef.current = true;
    try {
      const cleanEmail = email.trim().toLowerCase();
      const users = readUsers();
      const found = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (!found) {
        return { error: new Error('User not found') };
      }

      const isValid = await verifyPassword(password, found.password_hash, found.password_salt);
      if (!isValid) {
        return { error: new Error('Invalid email or password') };
      }

      const token = makeSessionToken();
      localStorage.setItem(SESSION_KEY, JSON.stringify({ id: found.id, token }));
      applyStoredUser(found, token);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Login failed') };
    } finally {
      signInInFlightRef.current = false;
    }
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    applyStoredUser(null);
  };

  const updateUserRole = async (userId: string, newRole: AppRole) => {
    if (role !== 'admin') {
      return { error: new Error('Only admin can change roles') };
    }

    const users = readUsers();
    const index = users.findIndex((u) => u.id === userId);
    if (index === -1) {
      return { error: new Error('User not found') };
    }

    users[index] = { ...users[index], role: newRole };
    writeUsers(users);
    writeUsersMirror(users);

    if (user && user.id === userId) {
      applyStoredUser(users[index], session?.token);
    }

    return { error: null };
  };

  const resolveDashboardPath = (inputRole?: AppRole | null): '/student-dashboard' | '/teacher-dashboard' | '/admin-dashboard' => {
    const currentRole = inputRole ?? role;
    if (currentRole === 'teacher') return '/teacher-dashboard';
    if (currentRole === 'admin') return '/admin-dashboard';
    return '/student-dashboard';
  };

  const isTeacher = role === 'teacher';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
        updateUserRole,
        isTeacher,
        resolveDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
