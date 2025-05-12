import { Menu } from 'antd';
import classNames from 'classnames';
import { MenuInfo, SelectInfo } from 'rc-menu/lib/interface';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ItemType, MenuDividerType, MenuItemGroupType, MenuItemType, SubMenuType } from 'antd/es/menu/interface';

import getItems from '@/core/constants/menu.constant';
import { useRole } from '@/core/hooks';
import { useLocalStorage } from '@/core/hooks/useLocalStorage';
import { MenuItem } from '@/core/types';
import { useApp } from '@/store';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { t } = useTranslation('sidebar');
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKeys, setSelectedKeys] = useLocalStorage<string[]>('selectedKey', ['/dashboard']);
  const [openKeys, setOpenKeys] = useLocalStorage<string[]>('openKeys', []);
  const { pathname } = location;
  const { role } = useRole();

  const { servicesEnable } = useApp();

  const isDividerMenu = (item: any): item is MenuDividerType => item.type === 'divider';
  const isMenuItem = (item: any): item is MenuItemType => !item.children;

  const isMenuGroupItemOrSubMenu = (item: any): item is SubMenuType | MenuItemGroupType => !!item.children;

  useEffect(() => {
    const pathnames = pathname
      .split('/')
      .filter((item: string) => item)
      .join('/');
    if (pathnames === '') {
      setSelectedKeys(['dashboard']);
      return;
    }
    setSelectedKeys([pathnames]);
  }, [pathname, setSelectedKeys]);

  const mapMenuItem = useCallback(
    (item: MenuItem): ItemType => {
      if (isDividerMenu(item) || !item) return item;
      if (isMenuItem(item)) {
        const { show, ...restItem } = item;
        return {
          ...restItem,
          label: t([item?.label as any]),
          className: classNames({ '!hidden': (item?.roles && !item?.roles?.includes(role)) || !show })
        };
      }
      if (isMenuGroupItemOrSubMenu(item)) {
        delete item?.show;
        return {
          ...item,
          label: t([item?.label as any]),
          children: item?.children?.map((el) => mapMenuItem(el)) ?? []
        };
      }
      return item;
    },
    [t, role]
  );

  const _items = useMemo(() => {
    const itemsFromService = getItems(servicesEnable);
    const menuItems = itemsFromService.map((item) => {
      return mapMenuItem(item);
    });
    return menuItems;
  }, [servicesEnable, mapMenuItem]);

  const onClickMenu = ({ key }: MenuInfo) => {
    navigate(`/${key}`);
  };

  const onSelect = ({ selectedKeys }: SelectInfo) => {
    setSelectedKeys(selectedKeys);
  };
  const onOpenChange = (openKeys: string[]) => {
    setOpenKeys(openKeys);
  };
  return (
    <Menu
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      mode="inline"
      items={_items}
      onClick={onClickMenu}
      onSelect={onSelect}
      onOpenChange={onOpenChange}
      rootClassName={classNames(className, 'overflow-y-auto')}
    />
  );
};

export default Sidebar;
