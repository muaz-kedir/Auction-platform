import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { savePostAuthRedirect } from '../utils/authRedirect';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (location.pathname.startsWith('/auction/')) {
      savePostAuthRedirect(location.pathname);
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if admin access is required
  if (requireAdmin) {
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    if (!isAdmin) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          <a href="/" className="text-primary hover:underline">Go back to home</a>
        </div>
      );
    }
  }

  return <>{children}</>;
};
