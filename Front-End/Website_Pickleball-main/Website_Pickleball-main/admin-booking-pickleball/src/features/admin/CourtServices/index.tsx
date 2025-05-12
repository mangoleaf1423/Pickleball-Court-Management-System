import { useEffect, useState } from 'react';
import { Table, Button, Space, Switch, Modal, Form, Input, InputNumber, message, Select, Upload, Image } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import axios, { AxiosError } from 'axios';
import { useApp } from '@/store';
import { AuthHelper, CommonHelper } from '@/utils/helpers';
import { CURRENT_ENV } from '@/core/configs/env';
import { toast } from 'react-toastify';
import { t } from 'i18next';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

interface CourtService {
  id: string;
  courtId: string;
  category: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  description: string;
  imageUrl: string | null;
  active: boolean;
  soldCount?: number;
}

interface Court {
  id: string;
  name: string;
  address: string;
  phone: string;
}

interface CourtData {
  id: string;
  name: string;
  active: boolean;
}

const CourtServices = () => {
  const [data, setData] = useState<CourtService[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<CourtService | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const { user } = useApp();
  const [form] = Form.useForm();

  const API_URL = 'https://picklecourt.id.vn/api/court';

  // Danh sách các loại dịch vụ
  const categoryOptions = [
    { label: 'Đồ uống', value: 'Đồ uống' },
    { label: 'Đồ ăn', value: 'Đồ ăn' },
    { label: 'Khác', value: 'Khác' }
  ];

  // Danh sách các đơn vị
  const unitOptions = [
    { label: 'Lon', value: 'Lon' },
    { label: 'Chai', value: 'Chai' },
    { label: 'Cái', value: 'Cái' },
    { label: 'Quả', value: 'Quả' },
    { label: 'Phần', value: 'Phần' },
    { label: 'Gói', value: 'Gói' },
    { label: 'Hộp', value: 'Hộp' }
  ];

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        let url = `${CURRENT_ENV.API_URL}/court/public/getAll`;
        
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${user?.result.token}`
          }
        });
        
        // Lọc sân theo courtNames của user nếu user có role MANAGER
        let filteredCourts = response.data;
        if (user?.result.user.roles.some((role: any) => role.name === 'MANAGER') && user?.result.user.courtNames) {
          filteredCourts = response.data.filter((court: CourtData) => 
            user.result.user.courtNames?.includes(court.name)
          );
        }
        
        setCourts(filteredCourts);
        if (filteredCourts.length > 0) {
          setSelectedCourtId(filteredCourts[0].id);
        }
      } catch (error) {
        toast.error(t('common:message.error'));
      }
    };
    fetchCourts();
  }, [user]);

  useEffect(() => {
    if (selectedCourtId) {
      fetchData();
    }
  }, [selectedCourtId]);

  const columns: ColumnsType<CourtService> = [
    { title: 'Tên dịch vụ', dataIndex: 'name', key: 'name' },
    { title: 'Danh mục', dataIndex: 'category', key: 'category' },
    { title: 'Giá', dataIndex: 'price', key: 'price', render: value => `${value.toLocaleString()} VND` },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Đơn vị', dataIndex: 'unit', key: 'unit' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    { 
      title: 'Hình ảnh', 
      dataIndex: 'imageUrl', 
      key: 'imageUrl',
      render: (imageUrl) => imageUrl ? (
        <Image 
          src={imageUrl} 
          alt="Hình ảnh dịch vụ" 
          style={{ width: 50, height: 50, objectFit: 'cover' }} 
          preview={{
            onVisibleChange: (visible) => {
              if (visible) {
                setPreviewImage(imageUrl);
                setPreviewVisible(true);
              } else {
                setPreviewVisible(false);
              }
            }
          }}
        />
      ) : 'Chưa có ảnh'
    },
    {
      title: 'Đã bán',
      dataIndex: 'soldCount',
      key: 'soldCount',
      render: (soldCount) => soldCount || 0
    },
    {
      title: 'Trạng thái',
      dataIndex: 'active',
      key: 'active',
      render: (_, record) => (
        <Switch 
          checked={record.active} 
          onChange={checked => handleStatusChange(record.id, checked)}
        />
      )
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleEdit(record)}>Sửa</Button>
          <Button onClick={() => handleUploadImage(record.id)}>Tải ảnh</Button>
        </Space>
      )
    }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${CURRENT_ENV.API_URL}/court/court-service/manage/getServices?courtId=${selectedCourtId}`, {
        headers: {
          Authorization: `Bearer ${user?.result?.token}`
        }
      });
      setData(response.data);
    } catch (error) {
      const { response } = error as AxiosError;

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

  const handleStatusChange = async (id: string, active: boolean) => {
    try {
      await axios.put(
        `${API_URL}/court-service/active?id=${id}&active=${active}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.result?.token}`
          }
        }
      );
      message.success('Cập nhật trạng thái thành công');
      fetchData();
    } catch (error) {
      const { response } = error as AxiosError;
      
      if (response && response.status === 401 && !!useApp.getState().user) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }
      
      message.error('Cập nhật trạng thái thất bại');
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setIsModalOpen(true);
    setEditingService(null);
  };

  const handleEdit = (record: CourtService) => {
    form.setFieldsValue(record);
    setIsModalOpen(true);
    setEditingService(record);
  };

  const handleUploadImage = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setFileList([]);
    setIsUploadModalOpen(true);
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.error('Vui lòng chọn ảnh để tải lên');
      return;
    }

    const formData = new FormData();
    formData.append('serviceId', selectedServiceId);
    formData.append('file', fileList[0] as any);

    setUploading(true);

    try {
      await axios.post(
        `${CURRENT_ENV.API_URL}/court/court-service/upload-image`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${user?.result?.token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setFileList([]);
      setIsUploadModalOpen(false);
      message.success('Tải ảnh lên thành công');
      fetchData();
    } catch (error) {
      message.error('Tải ảnh lên thất bại');
      const { response } = error as AxiosError;

      if (response && response.status === 401 && !!useApp.getState().user) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }

      CommonHelper.handleError(error);
    } finally {
      setUploading(false);
    }
  };

  const uploadProps: UploadProps = {
    onRemove: file => {
      setFileList([]);
    },
    beforeUpload: file => {
      setFileList([file]);
      return false;
    },
    fileList,
    maxCount: 1,
    listType: 'picture',
  };

  const handleSubmit = async (values: any) => {
    try {
      const url = editingService 
        ? `${API_URL}/court-service/update`
        : `${API_URL}/court-service`;

      const payload = editingService
        ? { ...values, id: editingService.id, courtId: selectedCourtId }
        : { ...values, courtId: selectedCourtId };

      await axios.request({
        method: editingService ? 'put' : 'post',
        url,
        data: payload,
        headers: {
          'Authorization': `Bearer ${user?.result?.token}`
        }
      });
      
      message.success(editingService ? 'Cập nhật thành công' : 'Tạo mới thành công');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      message.error('Xử lý thất bại');
      const { response } = error as AxiosError;

      if (response && response.status === 401 && !!useApp.getState().user) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }

      CommonHelper.handleError(error);
      return Promise.reject(error);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16 }}>
        <Select
          style={{ width: 300 }}
          value={selectedCourtId}
          onChange={value => setSelectedCourtId(value)}
          options={courts.map(court => ({
            label: court.name,
            value: court.id
          }))}
        />
        <Button type="primary" onClick={handleCreate}>
          Thêm dịch vụ mới
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        bordered
      />

      <Modal
        title={editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item 
            name="category" 
            label="Danh mục" 
            rules={[
              { required: true, message: 'Vui lòng chọn danh mục' }
            ]}
          >
            <Select options={categoryOptions} placeholder="Chọn loại dịch vụ" />
          </Form.Item>
          <Form.Item 
            name="name" 
            label="Tên dịch vụ" 
            rules={[
              { required: true, message: 'Vui lòng nhập tên dịch vụ' },
              { pattern: /^[a-zA-ZÀ-ỹ0-9\s]+$/, message: 'Tên dịch vụ chỉ được nhập chữ và số' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item 
            name="price" 
            label="Giá" 
            rules={[
              { required: true, message: 'Vui lòng nhập giá' },
              { type: 'number', message: 'Giá phải là số' }
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item 
            name="quantity" 
            label="Số lượng" 
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng' },
              { type: 'number', message: 'Số lượng phải là số' }
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item 
            name="unit" 
            label="Đơn vị" 
            rules={[
              { required: true, message: 'Vui lòng chọn đơn vị' }
            ]}
          >
            <Select options={unitOptions} placeholder="Chọn đơn vị" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tải ảnh lên cho dịch vụ"
        open={isUploadModalOpen}
        onCancel={() => setIsUploadModalOpen(false)}
        footer={[
          <Button key="back" onClick={() => setIsUploadModalOpen(false)}>
            Hủy
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={uploading}
            onClick={handleUpload}
          >
            {uploading ? 'Đang tải lên...' : 'Tải lên'}
          </Button>,
        ]}
      >
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
        </Upload>
      </Modal>
    </div>
  );
};

export default CourtServices;
