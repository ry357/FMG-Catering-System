import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardSkeleton from './ui/DashboardSkeleton';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/staff/dashboard'} replace />;
  }

  return children;
};

export default ProtectedRoute;
