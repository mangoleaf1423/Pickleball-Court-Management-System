import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, DatePicker, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/store';
import PathURL from '@/core/class/PathURL';
import { CURRENT_ENV } from '@/core/configs/env';

const UpgradeAccount: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate(`/${PathURL.login}`);
    }
  }, [user, navigate]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        dob: values.dob.format('YYYY-MM-DD'),
        phoneNumber: values.phoneNumber,
        username: values.studentId,
        email: values.email,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password
      };

      const response = await fetch(`${CURRENT_ENV.API_URL}/identity/users/registerForStudent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${user?.result?.token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      if (response.ok) {
        message.success(t('common:upgrade_success'));
        navigate(`/${PathURL.home}`);
      } else {
        message.error(data.message || t('common:upgrade_failed'));
      }
    } catch (error) {
      message.error(t('common:network_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">{t('button:upgrade_account')}</h2>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          username: user?.result?.user?.username,
          phoneNumber: user?.result?.user?.phoneNumber,
          email: user?.result?.user?.email,
          firstName: user?.result?.user?.firstName,
          lastName: user?.result?.user?.lastName,
          dob: ""
        }}
      >
        <Form.Item
          label={t('common:student_id')}
          name="username"
          rules={[
            { required: true, message: t('common:student_id_required') },
            { pattern: /^[a-zA-Z0-9]+$/, message: t('common:invalid_student_id') }
          ]}
        >
          <Input placeholder="FPT12345" />
        </Form.Item>

        <Form.Item
          label={t('common:phone_number')}
          name="phoneNumber"
          rules={[
            { required: true, message: t('common:phone_required') },
            { pattern: /^[0-9]{10,11}$/, message: t('common:invalid_phone') }
          ]}
        >
          <Input placeholder="0987654321" />
        </Form.Item>

        <Form.Item
          label={t('common:password')}
          name="password"
          rules={[
            { required: true, message: t('common:password_required') },
            { min: 8, message: t('common:password_min_length') },
            { pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, message: t('common:password_complexity') }
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          label={t('common:email')}
          name="email"
          rules={[
            { required: true, message: t('common:email_required') },
            { type: 'email', message: t('common:invalid_email') }
          ]}
        >
          <Input placeholder="example@fpt.edu.vn" />
        </Form.Item>

        <Form.Item
          label={t('common:full_name')}
          style={{ marginBottom: 0 }}
        >
          <Form.Item
            name="firstName"
            rules={[{ required: true, message: t('common:first_name_required') }]}
            style={{ display: 'inline-block', width: '48%', marginRight: '4%' }}
          >
            <Input placeholder={t('common:first_name')} />
          </Form.Item>
          <Form.Item
            name="lastName"
            rules={[{ required: true, message: t('common:last_name_required') }]}
            style={{ display: 'inline-block', width: '48%' }}
          >
            <Input placeholder={t('common:last_name')} />
          </Form.Item>
        </Form.Item>

        <Form.Item
          label={t('common:dob')}
          name="dob"
          rules={[{ required: true, message: t('common:dob_required') }]}
        >
          <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            className="bg-blue-600 hover:bg-blue-700 h-10 font-semibold"
          >
            {t('button:upgrade_account')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default UpgradeAccount;
