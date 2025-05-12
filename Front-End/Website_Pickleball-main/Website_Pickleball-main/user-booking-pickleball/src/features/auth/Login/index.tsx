import { Image } from 'antd';
import React, { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

import { LocalStorageKeyEnum } from '@/core/enums';
import { AuthService } from '@/core/services';
import { AuthLogin } from '@/core/types';
import { useApp } from '@/store';
import { APP_VERSION } from '@/utils';
import { StorageHelper } from '@/utils/helpers';
import AuthForm from './components/AuthForm';

import { CURRENT_ENV } from '@/core/configs/env';
import axios from 'axios';

const Login: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { setUser, user } = useApp();

  if (user?.result.token) {
    return <Navigate to={'/'} replace />;
  }

  const onLogin = async (payload: AuthLogin) => {
    setIsLoading(true);
    try {
      const res = await AuthService.loginKong(payload);
      const response = await axios.get('/identity/users/my-info', {
        baseURL: process.env.REACT_APP_BASE_URL_SERVICE, 
        headers: {
          Authorization: `Bearer ${res.result.token}`,
        },
      });
      res.result.user = response.data.result;
      if (res) {
        setUser(res);
        StorageHelper.setItem(LocalStorageKeyEnum.auth, res);
        console.log(StorageHelper.getItem(LocalStorageKeyEnum.auth).result.token);
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex h-screen items-center justify-center bg-login">
      <div className="w-[480px] rounded-lg bg-white shadow-lg relative">
        <button
          type="button" 
          className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-700 z-10"
          onClick={(e) => {
            e.preventDefault();
            window.history.back();
          }}
        >
          <i className="fa-solid fa-times text-xl"></i>
        </button>
        <div className="p-8">
          <div className="flex flex-col items-center space-y-8">
            <div className="flex items-center justify-center">
              <Image
                src={`${CURRENT_ENV.LOGIN_LOGO}`}
                preview={false}
                width={200}
                className="object-contain"
              />
            </div>
            <AuthForm
              isLoading={isLoading}
              onLogin={onLogin}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
