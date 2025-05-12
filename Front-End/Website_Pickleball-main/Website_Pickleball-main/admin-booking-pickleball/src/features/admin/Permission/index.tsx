import { CURRENT_ENV } from '@/core/configs/env';
import { useApp } from '@/store';
import { AuthHelper, CommonHelper } from '@/utils/helpers';
import { Button, Form, Input, message, Modal, Space, Table } from 'antd';
import axios, { AxiosError } from 'axios';
import { useEffect, useState } from 'react';

const Permission = () => {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const { user } = useApp();
  
  const columns = [
    {
      title: 'Tên quyền',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button 
            type="link" 
            danger 
            onClick={() => handleDelete(record.name)}
          >
            <i className="fa-solid fa-trash" />
          </Button>
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${CURRENT_ENV.API_URL}/identity/permissions`, {
        headers: {
          Authorization: `Bearer ${user?.result.token}`
        }
      });
      setPermissions(response?.data?.result);
    } catch (error) {
      message.error('Lỗi khi tải danh sách quyền');
      const { response } = error as AxiosError  ;

      if (response && response.status === 401 && !!useApp.getState().user) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }

      CommonHelper.handleError(error);
      return Promise.reject(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await axios.post(`${CURRENT_ENV.API_URL}/identity/permissions`, values, {
        headers: {
          Authorization: `Bearer ${user?.result.token}`
        }
      });
      message.success('Tạo quyền thành công');
      setIsModalOpen(false);
      form.resetFields();
      await fetchPermissions();
    } catch (error) {
      message.error('Lỗi khi tạo quyền');
    }
  };

  const handleDelete = async (permissionName: string) => {
    try {
      await axios.delete(`${CURRENT_ENV.API_URL}/identity/permissions/${permissionName}`, {
        headers: {
          Authorization: `Bearer ${user?.result.token}`
        }
      });
      message.success('Xóa quyền thành công');
      await fetchPermissions();
    } catch (error) {
      message.error('Lỗi khi xóa quyền');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          Thêm quyền mới
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={permissions} 
        loading={loading}
        rowKey="name"
      />

      <Modal
        title="Thêm quyền mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            label="Tên quyền"
            name="name"
            rules={[{ required: true, message: 'Vui lòng nhập tên quyền' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            name="description"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Permission;