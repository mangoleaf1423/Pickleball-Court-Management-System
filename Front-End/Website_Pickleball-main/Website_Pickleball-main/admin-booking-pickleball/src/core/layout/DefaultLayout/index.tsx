import { Layout } from 'antd';
import clsx from 'classnames';
import classNames from 'classnames/bind';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { APP_VERSION } from '@/utils';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

import { useApp } from '@/store';
import styles from './DefaultLayout.module.scss';

const { Content, Sider } = Layout;
const cx = classNames.bind(styles);
const DefaultLayout: React.FC = () => {
  const { collapsed } = useApp();
  const [transition] = useState('!transition-all !duration-[0.3s] !ease-linear');

  return (
    <Layout className="!bg-white">
      <Header />
      <Layout>
        <Sider
          className={cx(
            'sider-wrapper',
            '!fixed bottom-0 left-0 top-16 overflow-x-hidden border-r shadow-md',
            transition
            // '[&>div]:!relative'
          )}
          trigger={null}
          width={230}
          collapsedWidth={80}
          collapsed={collapsed}
        >
          <div className="flex h-full flex-col justify-between">
            <Sidebar className="min-h-0 flex-1" />
            <span className={clsx('bg-[#242527] py-1 text-center text-sm italic text-white')}>{APP_VERSION}</span>
          </div>
        </Sider>
        <Layout
          className={clsx(
            'h-screen overflow-y-auto overflow-x-hidden !bg-[#F0F1F7] pt-16',
            transition,
            collapsed ? 'pl-[80px]' : 'pl-[230px]'
          )}
        >
          <Content>
            <div className="custom-scrollbar h-full overflow-hidden overflow-y-auto bg-[#F0F1F7] px-4 py-6">
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default DefaultLayout;
