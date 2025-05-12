import classNames from 'classnames';
import { MenuInfo, SelectInfo } from 'rc-menu/lib/interface';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ItemType, MenuDividerType, MenuItemGroupType, MenuItemType, SubMenuType } from 'antd/es/menu/interface';

import getItems from '@/core/constants/menu.constant';
import { useRole } from '@/core/hooks';
import { useLocalStorage } from '@/core/hooks/useLocalStorage';
import { MenuItem } from '@/core/types';
import Navbar from './NavBar';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { t } = useTranslation('sidebar');
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKeys, setSelectedKeys] = useLocalStorage<string[]>('selectedKey', ['/dashboard']);
  const { pathname } = location;
  const { role } = useRole();

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
    const itemsFromService = getItems();
    const menuItems = itemsFromService.map((item) => {
      return mapMenuItem(item);
    });
    return menuItems;
  }, [mapMenuItem]);

  const onClickMenu = ({ key }: MenuInfo) => {
    navigate(`/${key}`);
  };

  return (
    <Navbar className={className} _items={_items} selectedKeys={selectedKeys} onClickMenu={onClickMenu} />
  );
};

export default Sidebar;


