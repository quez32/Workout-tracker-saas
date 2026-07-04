import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import BottomNav from '@/components/BottomNav';

export default function ProtectedLayout() {
  const { user, token } = useAuth();

  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-full">
      <Outlet />
      <BottomNav />
    </div>
  );
}