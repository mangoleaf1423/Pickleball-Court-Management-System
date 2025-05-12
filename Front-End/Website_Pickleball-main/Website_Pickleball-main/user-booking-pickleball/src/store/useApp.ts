import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import { LocalStorageKeyEnum } from '@/core/enums';
import { Language, SessionUser } from '@/core/types';
import { StorageHelper } from '@/utils/helpers';
import Auth from '@/utils/helpers/auth.helper';

type RoleType = {
  enable: boolean;
  permissions?: string[];
}

type RoleEnableType = {
  [key: string]: RoleType;
}

const initRolesEnable: RoleEnableType = {
  ADMIN: {
    enable: false
  },
  USER: {
    enable: false
  },
  MANAGER: {
    enable: false
  },
  VIEWER: {
    enable: false
  }
};

type RoleOutput = {
  code: string;
  permission: string;
}

type AppType = {
  user?: SessionUser;
  collapsed: boolean;
  language: Language;
  loading: boolean;
  loadedRole: boolean;
  rolesEnable: RoleEnableType;
};

type AppAction = {
  setCollapsed: (collapsed: boolean) => void;
  setUser: (user?: SessionUser) => void;
  setLanguage: (language: Language) => void;
  setLoading: (loading: boolean) => void;
  setRoleMap: (data: RoleOutput[]) => void;
  setLoadedRole: (data: boolean) => void;
};

const useApp = create<AppType & AppAction>()(
  devtools(
    persist(
      (set) => ({
        user: StorageHelper.getItem(LocalStorageKeyEnum.auth) ?? null,
        collapsed: false,
        language: 'vi' as Language,
        loading: true,
        loadedRole: false,
        rolesEnable: initRolesEnable,
        setUser(user) {
          set(() => ({ user }));
          if (!user) {
            Auth.clearToken();
          }
        },
        setCollapsed(collapsed) {
          set(() => ({
            collapsed
          }));
        },
        setLanguage(language) {
          set(() => ({ language }));
        },
        setLoading(loading) {
          set(() => ({ loading }));
        },
        setRoleMap(data) {
          const _data = data.map((item) => ({ ...item, permission: item.permission.split(',') }));
          const rolesEnable: RoleEnableType = initRolesEnable;
          console.log("Data", _data);
          _data.forEach((item) => {
            rolesEnable[item.code] = {
              enable: true,
              permissions: item.permission
            };
            set(() => ({
              rolesEnable: { ...rolesEnable }
            }));
          });
        },
        setLoadedRole(data) {
          set({ loadedRole: data });
        }
      }),
      {
        name: 'app',
        partialize(state) {
          return { language: state.language };
        }
      }
    )
  )
);

export default useApp;
