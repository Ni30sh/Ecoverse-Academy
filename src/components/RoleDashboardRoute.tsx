import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';

function resolveDashboardPath(role: AppRole): '/student-dashboard' | '/teacher-dashboard' | '/admin-dashboard' {
  if (role === 'teacher') return '/teacher-dashboard';
  if (role === 'admin') return '/admin-dashboard';
  return '/student-dashboard';
}

export default function RoleDashboardRoute({
  expectedRole,
  children,
}: {
  expectedRole: AppRole;
  children: React.ReactNode;
}) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-warm flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🌿</div>
          <p className="font-heading font-bold text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login-student" replace />;
  if (!role) return <Navigate to="/role-selection" replace />;
  if (role !== expectedRole) return <Navigate to={resolveDashboardPath(role)} replace />;

  return <>{children}</>;
}
