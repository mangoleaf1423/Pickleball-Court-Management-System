import { Avatar, Button, Dropdown, Image, Input, MenuProps, Select } from 'antd';
import classNames from 'classnames';
import { US, VN } from 'country-flag-icons/react/3x2';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';

import { CURRENT_ENV } from '@/core/configs/env';
import { Language } from '@/core/types';
import { useApp } from '@/store';
import { ActionKeyEnum } from '@/utils/enums';

import styles from '../DefaultLayout.module.scss';
import Sidebar from './Sidebar';

interface HeaderProps {}

const Header: React.FC<HeaderProps> = () => {
  const { t } = useTranslation(['common']);
  const { collapsed, setCollapsed, language, setLanguage } = useApp();
  const { user, setUser } = useApp();
  const [items, setItems] = useState<MenuProps['items']>([]);
  const [searchValue, setSearchValue] = useState<string>('');
  const [locationKeyword, setLocationKeyword] = useState<string>('');
  const navigate = useNavigate();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === ActionKeyEnum.Logout) {
      setUser();
    }
  };

  useEffect(() => {
    setItems([
      {
        label: t(['logout']),
        key: ActionKeyEnum.Logout,
        icon: <i className="fa-regular fa-arrow-right-from-bracket" />
      }
    ]);
  }, [t]);
  const menuProps = {
    items,
    onClick: handleMenuClick
  };

  const onChangeLanguage = (value: Language) => {
    setLanguage(value);
    i18next.changeLanguage(value);
  };

  const toggleMenu = () => {
    setCollapsed(!collapsed);
  };

  const handleSearch = () => {
    navigate('/list', { state: { searchQuery: searchValue, locationKeyword: locationKeyword } });
  };

  return (
    <div className="fixed inset-x-0 top-0 z-40">
      <header className={classNames('h-16 bg-gradient-to-r from-header-from to-header-to shadow-sm')}>
        <div className="h-full px-14 pt-10">
          <div className="flex h-full items-stretch justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-x-6">
              <div className="flex min-w-0 flex-1 items-center">
                <Link to="/">
                  <Image
                    src={`${CURRENT_ENV.HEADER_LOGO}`}
                    alt="Logo"
                    height={150}
                    preview={false}
                    className="cursor-pointer"
                  />
                </Link>

                <div className="relative w-full flex items-center">
                  <input
                    type="text"
                    placeholder={t('common:search')}
                    className="w-full h-[50px] rounded-full bg-white/50 backdrop-blur-sm border border-none pl-4 pr-4 text-white text-lg placeholder:text-white placeholder:text-lg"
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                  />
                  <button 
                    className="ml-2 px-4 py-3 rounded-full bg-white/50 backdrop-blur-sm border border-none cursor-pointer"
                    onClick={handleSearch}
                  >
                    <i className="fa-solid fa-magnifying-glass text-white text-lg"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Select
                value={language}
                onChange={onChangeLanguage}
                variant={'borderless'}
                popupMatchSelectWidth={false}
                suffixIcon={<i className="fa-solid fa-caret-down text-sm text-white" />}
                className={`[&>.ant-select-selector>.ant-select-selection-item]:flex`}
              >
                <Select.Option value="vi" className={styles.language}>
                  <VN title="VN" width={22} />
                </Select.Option>
                <Select.Option value="en" className={styles.language}>
                  <US title="US" width={22} />
                </Select.Option>
              </Select>
            </div>
          </div>
        </div>
        <Sidebar />
      </header>
    </div>
  );
};

export default Header;
