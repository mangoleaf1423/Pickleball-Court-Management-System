import { Button, Form, Input, Modal, message } from 'antd';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

import { AuthLogin } from '@/core/types';
import { Link } from 'react-router-dom';

interface AuthFormProps {
  isLoading: boolean;
  onLogin: (payload: AuthLogin) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ isLoading, onLogin }) => {
  const [authForm] = Form.useForm<AuthLogin>();
  const { t } = useTranslation('auth');
  const { t: errors } = useTranslation('errors', { keyPrefix: 'auth' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);

  const onFinish = (values: AuthLogin) => {
    onLogin && onLogin(values);
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail) {
      message.error('Vui lòng nhập email');
      return;
    }

    if (!validateEmail(forgotPasswordEmail)) {
      message.error('Vui lòng nhập email hợp lệ');
      return;
    }

    try {
      setIsForgotPasswordLoading(true);
      await axios.post('https://picklecourt.id.vn/api/identity/auth/forgetPassword', {
        key: forgotPasswordEmail
      });
      message.success('Yêu cầu đặt lại mật khẩu đã được gửi thành công');
      setIsModalOpen(false);
    } catch (error) {
      message.error('Gửi yêu cầu thất bại. Vui lòng thử lại');
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  return (
    <div className="w-full relative">
      <Form
        size="large"
        form={authForm}
        onFinish={onFinish}
        initialValues={{
          username: '',
          password: ''
        }}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="username"
          label={t(['username'])}
          rules={[
            {
              required: true,
              message: errors('username')
            },
            {
              pattern: /^(?:\d{10}|[^\s@]+@[^\s@]+\.[^\s@]+|[a-zA-Z0-9_]+)$/,
              message: 'Vui lòng nhập số điện thoại, email hoặc tên đăng nhập hợp lệ'
            }
          ]}
          className="!mb-5 [&>.ant-form-item-row>.ant-form-item-label]:pb-0 [&>.ant-form-item-row>.ant-form-item-label]:font-bold"
        >
          <Input
            placeholder="Tên đăng nhập, email hoặc số điện thoại"
            disabled={isLoading}
            prefix={<i className="fa-solid fa-user" />}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={t(['password'])}
          rules={[
            {
              required: true,
              message: errors('password')
            },
            {
              min: 8,
              message: 'Mật khẩu phải có ít nhất 8 ký tự'
            }
            // },
            // {
            //   pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            //   message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'
            // }
          ]}
          className="!mb-5 [&>.ant-form-item-row>.ant-form-item-label]:pb-0 [&>.ant-form-item-row>.ant-form-item-label]:font-bold"
        >
          <Input.Password
            placeholder="Nhập mật khẩu"
            disabled={isLoading}
            prefix={<i className="fa-solid fa-lock" />}
          />
        </Form.Item>

        <div className="flex justify-end mb-4">
          <span 
            onClick={() => setIsModalOpen(true)}
            className="text-[#016D39] font-medium hover:text-[#015d31] transition-colors cursor-pointer"
          >
            Quên mật khẩu?
          </span>
        </div>
        <Form.Item className="!pt-4">
          <Button htmlType="submit" block type="primary" className="bg-[#016D39] hover:bg-[#015d31]" loading={isLoading}>
            ĐĂNG NHẬP
          </Button>
        </Form.Item>
        <Modal
          title={<span className="text-xl font-bold text-[#016D39]">Quên mật khẩu</span>}
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          centered
          className="[&_.ant-modal-content]:rounded-2xl"
        >
          <div className="py-4">
            <p className="mb-6 text-gray-600">Vui lòng nhập email đã đăng ký để đặt lại mật khẩu</p>
            
            <Form.Item
              label={<span className="font-medium">Email đăng ký</span>}
              className="!mb-6"
            >
              <Input
                placeholder="Nhập email đã đăng ký"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                prefix={<i className="fa-solid fa-envelope text-gray-400 mr-2" />}
                className="rounded-lg py-2 hover:border-[#016D39] focus:border-[#016D39] focus:shadow-sm"
              />
            </Form.Item>

            <div className="flex justify-end gap-3">
              <Button 
                onClick={() => setIsModalOpen(false)}
                className="h-10 px-6 rounded-lg border-gray-300 hover:border-[#016D39] hover:text-[#016D39]"
              >
                Hủy bỏ
              </Button>
              <Button 
                type="primary"
                loading={isForgotPasswordLoading}
                onClick={handleForgotPassword}
                className="h-10 px-6 rounded-lg bg-[#016D39] hover:bg-[#015d31] border-none"
              >
                Xác nhận
              </Button>
            </div>
          </div>
        </Modal>

        <div className="text-center mt-4 space-y-2">
          <p className="text-sm text-gray-500">
            Bạn chưa có tài khoản?{" "}
            <Link to="/register" className="text-[#016D39] font-medium hover:underline">
              Đăng ký ngay
            </Link>
          </p>
          <p className="text-sm text-gray-500">
            <Link to="/register-student" className="text-[#016D39] font-medium hover:underline">
              Đăng ký tài khoản sinh viên
            </Link>
          </p>
        </div>
      </Form>
    </div>
  );
};

export default AuthForm;
