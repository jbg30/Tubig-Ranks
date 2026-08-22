import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useUser();
  const location = useLocation();

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;
  if (user.needsEmailLink && location.pathname !== '/link-email') {
    return <Navigate to="/link-email" replace />;
  }

  return children;
}