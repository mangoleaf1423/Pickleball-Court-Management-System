import { useCallback, useState, useEffect } from 'react';
import { Button, Form, Input, Modal, Tag, message, Table, Space, Card } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ColumnTableType } from '@/core/types';
import axios, { AxiosError } from 'axios';
import type { PaginationProps } from 'antd/es/pagination';
import type { SorterResult } from 'antd/es/table/interface';
import { useApp } from '@/store';
import { CURRENT_ENV } from '@/core/configs/env';
import { AuthHelper, CommonHelper } from '@/utils/helpers';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface RoleType {
  name: string;
  description: string;
}

const Role = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [createVisible, setCreateVisible] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleType | null>(null);
  const [data, setData] = useState<RoleType[]>([]);
  const { user } = useApp();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRoles();
  }, [t]);

  const columns: ColumnTableType<RoleType>[] = [
    {
      title: t('role:name'),
      dataIndex: 'name',
      key: 'name',
      width: 400,
      sorter: true,
    },
    {
      title: t('role:description'),
      dataIndex: 'description',
      key: 'description',
      width: 800,
    },
    {
      title: t('common:action'),
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => handleEdit(record)} icon={<EditOutlined style={{ fontSize: 16, color: '#000' }} />} />
          <Button type="link" danger onClick={() => handleDelete(record)} icon={<DeleteOutlined style={{ fontSize: 16 }} />} />
        </Space>
      ),
    }
  ];

  const loadRoles = async (params: any = {}) => {
    setLoading(true);
    try {
        const response = await axios.get(`${CURRENT_ENV.API_URL}/identity/roles`, { 
            headers: {
                Authorization: `Bearer ${user?.result.token}`
            },
            params: {
                page: pagination.current,
                pageSize: pagination.pageSize,
                ...params
            }
      });
      
      setData(response.data.result);
      setPagination({
        ...pagination,
        total: response.data.total,
      });
    } catch (error) {
      message.error(t('common:error.load_data'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(async (record: RoleType) => {
    try {
      await axios.delete(`${CURRENT_ENV.API_URL}/identity/roles/${record.name}`,{
        headers: {
            Authorization: `Bearer ${user?.result.token}`
        }
      });
      message.success(t('common:success.delete'));
      loadRoles();
      return true;
    } catch (error) {
      message.error(t('common:error.delete'));
      return false;
    }
  }, [t]);

  const handleCreate = async (values: RoleType) => {
    try {
      await axios.post(`${CURRENT_ENV.API_URL}/identity/roles`, values,{
        headers: {
            Authorization: `Bearer ${user?.result.token}`
        }
      });
      message.success(t('common:success.create'));
      setCreateVisible(false);
      form.resetFields();
      loadRoles();
      return true;
    } catch (error) {
      message.error(t('common:error.create'));
      return false;
    }
  };

  const handleEdit = (record: RoleType) => {
    setCurrentRole(record);
    editForm.setFieldsValue(record);
    setEditVisible(true);
  };

  const handleUpdate = async (values: RoleType) => {
    try {
      await axios.put(`${CURRENT_ENV.API_URL}/identity/roles`, values, {
        headers: {
          Authorization: `Bearer ${user?.result.token}`
        }
      });
      message.success(t('common:success.update'));
      setEditVisible(false);
      editForm.resetFields();
      loadRoles();
      return true;
    } catch (error) {
      message.error(t('common:error.update'));
      return false;
    }
  };

  const handleTableChange = (
    pagination: PaginationProps,
    filters: any,
    sorter: SorterResult<RoleType>
  ) => {
    setPagination(pagination);
    loadRoles({
      sortField: sorter.field,
      sortOrder: sorter.order,
    });
  };

  return (
    <div>
      <Card style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button 
              type="primary" 
              onClick={() => setCreateVisible(true)}
            >
              {t('common:button.add_role')}
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="name"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: true }}
        />
      </Card>

      <Modal
        title={t('role:create_title')}
        open={createVisible}
        onCancel={() => setCreateVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="name"
            label={t('role:name')}
            rules={[{ required: true, message: t('common:required') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('role:description')}
            rules={[{ required: true, message: t('common:required') }]}
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('role:edit_title')}
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        onOk={() => editForm.submit()}
      >
        <Form form={editForm} onFinish={handleUpdate} layout="vertical">
          <Form.Item
            name="name"
            label={t('role:name')}
            rules={[{ required: true, message: t('common:required') }]}
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('role:description')}
            rules={[{ required: true, message: t('common:required') }]}
          >
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Role;