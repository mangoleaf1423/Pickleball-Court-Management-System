import { useMemo } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useApp } from '@/store';
import LoadingPage from '../LoadingPage';

type ProtectedRouteWithQuotaTypeProps = {
  service: ServiceCode;
  quotaType: QuotaServiceType;
};
function ProtectedRouteWithQuotaType({ service, quotaType }: Readonly<ProtectedRouteWithQuotaTypeProps>) {
  const { loading, servicesEnable } = useApp();

  const hasAccess = useMemo(
    () => servicesEnable[service].quotaTypes.includes(quotaType),
    [quotaType, service, servicesEnable]
  );
  if (loading) return <LoadingPage />;

  if (!hasAccess) {
    return <Navigate to="/service-unavailable" replace />;
  }

  return <Outlet />;
}

export default ProtectedRouteWithQuotaType;
