import { Navigate } from 'react-router-dom';

import PathURL from '@/core/class/PathURL';
import { Role } from '@/core/enums';
import { useRole } from '@/core/hooks';
import PageNotFound from '@/features/auth/PageNotFound';
import { useApp } from '@/store';
import LoadingPage from '../LoadingPage';

type PrivateRouteProps = {
  children: React.ReactNode;
  roles?: Role[];
  isHavePermission?: boolean;
};
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles = [], isHavePermission = true }) => {
  // Check if user is logged in.
  // If yes, show route
  // Otherwise, redirect to login page
  const { role, isLoggedIn } = useRole();
  const { loading } = useApp();

  if (!isLoggedIn) return <Navigate to={`/${PathURL.login}`} />;
  // if (loading) return <LoadingPage />;
  const _isHavePermission = (roles.length === 0 || roles.includes(role)) && isHavePermission;
  if (!_isHavePermission) return <PageNotFound />;
  return <>{children}</>;
};

export default PrivateRoute;
