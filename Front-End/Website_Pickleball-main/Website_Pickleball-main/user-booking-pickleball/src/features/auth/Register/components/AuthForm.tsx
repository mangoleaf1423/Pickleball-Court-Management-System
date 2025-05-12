import { Button, Col, DatePicker, Form, Input, Row } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import { AuthLogin, AuthRegister } from '@/core/types';
import { Link } from 'react-router-dom';

interface AuthFormProps {
  isLoading: boolean;
  onRegister: (payload: AuthRegister) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ isLoading, onRegister }) => {
  const [authForm] = Form.useForm<AuthRegister>();
  const { t } = useTranslation('auth');
  const { t: errors } = useTranslation('errors', { keyPrefix: 'auth' });

  const onFinish = (values: AuthRegister) => {
    onRegister && onRegister(values);
  };

  // Kiểm tra tuổi phải lớn hơn 18
  const disabledDate = (current: Dayjs) => {
    return current && current > dayjs().subtract(18, 'year');
  };

  // Regex patterns và thông báo lỗi tương ứng
  const usernameRegex = /^[a-zA-Z0-9]{4,}$/;
  const usernameError = 'Tài khoản phải có ít nhất 4 ký tự và chỉ chứa chữ cái hoặc số';
  
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  const passwordError = 'Mật khẩu phải chứa ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt';
  
  const phoneRegex = /^[0-9]{10}$/;
  const phoneError = 'Số điện thoại phải có đúng 10 chữ số';

  return (
    <div className="w-full relative">
      <Form
        size="large"
        form={authForm}
        onFinish={onFinish}
        initialValues={{
          username: '',
          password: '',
          firstName: '',
          lastName: '',
          dob: '',
          email: '',
          phoneNumber: ''
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
              pattern: usernameRegex,
              message: usernameError
            }
          ]}
          className="!mb-5 [&>.ant-form-item-row>.ant-form-item-label]:pb-0 [&>.ant-form-item-row>.ant-form-item-label]:font-bold"
        >
          <Input
            placeholder="Tài khoản"
            disabled={isLoading}
            prefix={<i className="fa-solid fa-user" />}
          />
        </Form.Item>

        {/* Họ và Tên trên cùng một hàng */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label={t(['lastName'])}
              rules={[
                {
                  required: true,
                  message: errors('lastName')
                }
              ]}
              className="!mb-5 [&>.ant-form-item-row>.ant-form-item-label]:pb-0 [&>.ant-form-item-row>.ant-form-item-label]:font-bold"
            >
              <Input
                placeholder="Họ"
                disabled={isLoading}
                prefix={<i className="fa-solid fa-user" />}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label={t(['firstName'])}
              rules={[
                {
                  required: true,
                  message: errors('firstName')
                }
              ]}
              className="!mb-5 [&>.ant-form-item-row>.ant-form-item-label]:pb-0 [&>.ant-form-item-row>.ant-form-item-label]:font-bold"
            >
              <Input
                placeholder="Tên"
                disabled={isLoading}
                prefix={<i className="fa-solid fa-user" />}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="dob"
          label={t(['dob'])}
          rules={[
            {
              required: true,
              message: errors('dob')
            },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                if (dayjs().diff(value, 'year') < 18) {
                  return Promise.reject('Bạn phải đủ 18 tuổi trở lên');
                }
                return Promise.resolve();
              }
            }
          ]}
          className="!mb-5 [&>.ant-form-item-row>.ant-form-item-label]:pb-0 [&>.ant-form-item-row>.ant-form-item-label]:font-bold"
        >
          <DatePicker
            placeholder="Ngày sinh"
            disabled={isLoading}
            style={{ width: '100%' }}
            disabledDate={disabledDate}
          />
        </Form.Item>

        {/* Email và Số điện thoại trên cùng một hàng */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label={t(['email'])}
              rules={[
                {
                  required: true,
                  message: errors('email')
                },
                {
                  type: 'email',
                  message: 'Email không đúng định dạng'
                }
              ]}
              className="!mb-5 [&>.ant-form-item-row>.ant-form-item-label]:pb-0 [&>.ant-form-item-row>.ant-form-item-label]:font-bold"
            >
              <Input
                placeholder="Email"
                disabled={isLoading}
                prefix={<i className="fa-solid fa-envelope" />}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phoneNumber"
              label={t(['phone'])}
              rules={[
                {
                  required: true,
                  message: errors('phone')
                },
                {
                  pattern: phoneRegex,
                  message: phoneError
                }
              ]}
              className="!mb-5 [&>.ant-form-item-row>.ant-form-item-label]:pb-0 [&>.ant-form-item-row>.ant-form-item-label]:font-bold"
            >
              <Input
                placeholder="Số điện thoại"
                disabled={isLoading}
                prefix={<i className="fa-solid fa-phone" />}
              />
            </Form.Item>
          </Col>
        </Row>

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
            },
            {
              pattern: passwordRegex,
              message: passwordError
            }
          ]}
          className="!mb-5 [&>.ant-form-item-row>.ant-form-item-label]:pb-0 [&>.ant-form-item-row>.ant-form-item-label]:font-bold"
        >
          <Input.Password
            placeholder="Nhập mật khẩu"
            disabled={isLoading}
            prefix={<i className="fa-solid fa-lock" />}
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label={t(['confirmPassword'])}
          dependencies={['password']}
          rules={[
            {
              required: true,
              message: errors('confirmPassword')
            },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu nhập lại không khớp'));
              },
            }),
          ]}
          className="!mb-5 [&>.ant-form-item-row>.ant-form-item-label]:pb-0 [&>.ant-form-item-row>.ant-form-item-label]:font-bold"
        >
          <Input.Password
            placeholder="Nhập lại mật khẩu"
            disabled={isLoading}
            prefix={<i className="fa-solid fa-lock" />}
          />
        </Form.Item>

        <Form.Item className="!pt-4">
          <Button htmlType="submit" block type="primary" className="bg-[#016D39] hover:bg-[#015d31]" loading={isLoading}>
            ĐĂNG KÝ
          </Button>
        </Form.Item>

        <div className="text-center mt-4">
          <span className="text-sm text-gray-500">
            Bạn có tài khoản?{" "}
            <Link to="/login" style={{ color: '#016D39', fontWeight: 500 }}>
              Đăng nhập
            </Link>
          </span>
        </div>
      </Form>
    </div>
  );
};

export default AuthForm;
