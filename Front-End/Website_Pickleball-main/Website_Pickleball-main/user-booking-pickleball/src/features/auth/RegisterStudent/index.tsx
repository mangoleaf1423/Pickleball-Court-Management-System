import React, { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

import { AuthService } from '@/core/services';
import { AuthRegister } from '@/core/types';
import { useApp } from '@/store';
import AuthForm from './components/AuthForm';

const RegisterStudent: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useApp();
  const navigate = useNavigate();

  if (user?.result.token) {
    const source = searchParams.get('source');
    return <Navigate to={source ?? '/'} replace />;
  }

  const onRegister = async (payload: AuthRegister) => {
    setIsLoading(true);
    try {
      const formattedPayload = {
        firstName: payload.firstName,
        lastName: payload.lastName,
        username: payload.username,
        password: payload.password,
        phoneNumber: payload.phoneNumber,
        email: payload.email,
        dob: payload.dob ? dayjs(payload.dob).format('YYYY-MM-DD') : payload.dob
      };
      
      const res = await AuthService.registerStudent(formattedPayload);
      console.log(res)
      if (res) {
        toast.success('Đăng ký thành công');
        navigate("/login");
      }
    } catch (error) {
      toast.error('Đăng ký thất bại. Vui lòng thử lại sau.');
      console.error('Lỗi đăng ký:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-login">
      <div className="w-[700px] rounded-lg bg-white shadow-lg relative">
        <button
          type="button" 
          className="absolute top-4 right-4 bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-700 z-10"
          onClick={() => window.history.back()}
        >
          <i className="fa-solid fa-times text-xl"></i>
        </button>
        <div className="p-8">
          <div className="flex flex-col items-center space-y-8">
            <div className="flex items-center justify-center">
              <h1 className="text-2xl font-bold">Đăng ký tài khoản sinh viên</h1>
            </div>
            <AuthForm
              isLoading={isLoading}
              onRegister={onRegister}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterStudent;
