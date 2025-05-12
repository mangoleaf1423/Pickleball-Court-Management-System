import { Layout } from 'antd';
import classNames from 'classnames/bind';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './components/Header';


import { useApp } from '@/store';
import styles from './DefaultLayout.module.scss';
import Footer from './components/Footer';
const { Content } = Layout;
const cx = classNames.bind(styles);

const DefaultLayout: React.FC = () => {
  const { collapsed } = useApp();
  const [transition] = useState('!transition-all !duration-[0.3s] !ease-linear');

  return (
    <Layout className="min-h-screen !bg-white overflow-hidden">
      <Header />
      <Content className="!bg-white">
        <div className="mx-auto w-full max-w-[1740px] px-4 pt-48 custom-scrollbar">
          <Outlet />
        </div>
      </Content>
      <Footer />
    </Layout>
  );
};

export default DefaultLayout;
