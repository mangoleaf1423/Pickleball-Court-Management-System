import { useMemo } from 'react';

import { useApp } from '@/store';

const useRole = () => {
  const { user } = useApp();
  const isAdmin = useMemo(() => {
    return !!user?.result.user.roles.some((role) => role.name === 'ADMIN');
  }, [user]);
  const isManager = useMemo(() => {
    return !!user?.result.user.roles.some((role) => role.name === 'MANAGER');
  }, [user]);
  const isStaff = useMemo(() => {
    return !!user?.result.user.roles.some((role) => role.name === 'STAFF');
  }, [user]);
  const isPrePaidAgent = useMemo(() => {
    return user?.result.user.roles.some((role) => role.name === 'USER');
  }, [user]);

  const role = useMemo<Role>(() => {
    if (user?.result.user.roles.some((role) => role.name === 'ADMIN')) return 'ADMIN';
    if (user?.result.user.roles.some((role) => role.name === 'USER')) return 'USER';
    if (user?.result.user.roles.some((role) => role.name === 'MANAGER')) return 'MANAGER';
    if (user?.result.user.roles.some((role) => role.name === 'STAFF')) return 'STAFF';
    return 'USER';
  }, [user]);
  return { isAdmin, isManager, isStaff, isPrePaidAgent, isLoggedIn: !!user?.result.token, role };
};

export default useRole;
