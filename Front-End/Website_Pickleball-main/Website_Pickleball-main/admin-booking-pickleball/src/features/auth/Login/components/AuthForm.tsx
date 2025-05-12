import { Button, Form, Input } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { AuthLogin } from '@/core/types';

interface AuthFormProps {
  isLoading: boolean;
  onLogin: (payload: AuthLogin) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ isLoading, onLogin }) => {
  const [authForm] = Form.useForm<AuthLogin>();
  const { t } = useTranslation('auth');
  const { t: errors } = useTranslation('errors', { keyPrefix: 'auth' });

  const onFinish = (values: AuthLogin) => {
    onLogin && onLogin(values);
  };

  return (
    <div className="w-full">
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
            }
          ]}
          className="!mb-5 [&>.ant-form-item-row>.ant-form-item-label]:pb-0  [&>.ant-form-item-row>.ant-form-item-label]:font-bold"
        >
          <Input placeholder="Tài khoản" disabled={isLoading} prefix={<i className="fa-solid fa-user" />} />
        </Form.Item>
        <Form.Item
          name="password"
          label={t(['password'])}
          rules={[
            {
              required: true,
              message: errors('password')
            }
          ]}
          className="!mb-5 [&>.ant-form-item-row>.ant-form-item-label]:pb-0 [&>.ant-form-item-row>.ant-form-item-label]:font-bold"
        >
          <Input.Password placeholder="Mật khẩu" disabled={isLoading} prefix={<i className="fa-solid fa-lock" />} />
        </Form.Item>

        <Form.Item className="!pt-4">
          <Button htmlType="submit" block type="primary" className="bg-primary" loading={isLoading}>
            {t(['login'])}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AuthForm;
