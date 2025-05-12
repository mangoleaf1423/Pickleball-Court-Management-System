import { Navigate, Outlet } from 'react-router-dom';

import PathURL from '@/core/class/PathURL';
import { useRole } from '@/core/hooks';
import PageNotFound from '@/features/auth/PageNotFound';

type PrivateRouteProps = {
  roles?: Role[];
};
const PrivateRoute: React.FC<PrivateRouteProps> = ({ roles }) => {
  // Check if user is logged in.
  // If yes, show route
  // Otherwise, redirect to login page
  const { isLoggedIn, role } = useRole();
  const haveAccess = roles?.includes(role);

  if (!isLoggedIn) return <Navigate to={`/${PathURL.login}`} />;
  if (!haveAccess) return <PageNotFound />;
  return <Outlet />;
};

export default PrivateRoute;
