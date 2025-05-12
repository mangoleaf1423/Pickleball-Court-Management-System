import { useMemo } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useApp } from '@/store';
import LoadingPage from '../LoadingPage';

type ProtectedRouteWithServiceProps = {
  services: ServiceCode[];
};
function ProtectedRouteWithService({ services }: Readonly<ProtectedRouteWithServiceProps>) {
  const { loading, servicesEnable } = useApp();

  // const hasAccess = useMemo(
  //   () => services.some((service) => servicesEnable[service]?.enable),
  //   [services, servicesEnable]
  // );
  // if (loading) return <LoadingPage />;

  // if (!hasAccess) {
  //   return <Navigate to="/service-unavailable" replace />;
  // }

  return <Outlet />;
}

export default ProtectedRouteWithService;
