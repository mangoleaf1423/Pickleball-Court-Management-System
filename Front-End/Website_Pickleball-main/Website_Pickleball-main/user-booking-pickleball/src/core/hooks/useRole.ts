import { useMemo } from 'react';

import { useApp } from '@/store';

const useRole = () => {
  const { user } = useApp();
  const isAdmin = useMemo(() => {
    return !!user?.result.user.roles.some((role) => role.name === 'ADMIN');
  }, [user]);
  const isPrePaidAgent = useMemo(() => {
    return user?.result.user.roles.some((role) => role.name === 'USER');
  }, [user]);

  const role = useMemo<Role>(() => {
    if (user?.result.user.roles.some((role) => role.name === 'ADMIN')) return 'ADMIN';
    if (user?.result.user.roles.some((role) => role.name === 'USER')) return 'USER';
    return 'USER';
  }, [user]);
  return { isAdmin, isPrePaidAgent, isLoggedIn: !!user?.result.token, role };
};

export default useRole;
