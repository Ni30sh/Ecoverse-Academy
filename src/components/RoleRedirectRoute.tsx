import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function RoleRedirectRoute() {
  const { user, role, loading, resolveDashboardPath } = useAuth();

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

  return <Navigate to={resolveDashboardPath(role)} replace />;
}
