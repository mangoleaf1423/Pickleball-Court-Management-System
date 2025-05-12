import { useCallback, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Input, Pagination, Modal, Button, Upload, Dropdown, Menu, Space, Drawer, Card, Tag, Typography, Tooltip, Divider, Image } from 'antd';
import { SearchOutlined, UploadOutlined, PictureOutlined, CheckOutlined, EyeOutlined, EditOutlined, StopOutlined, PlayCircleOutlined } from '@ant-design/icons';
import axios from 'axios';
import { AxiosError } from 'axios';
import { toast } from 'react-toastify';

import { AppButton } from '@/core/components';
import { MainLayout } from '@/core/layout';
import { CURRENT_ENV } from '@/core/configs/env';
import { useApp } from '@/store';
import { CourtService } from '@/core/services';
import { CourtManage } from '@/core/types/court';
import { AuthHelper, CommonHelper } from '@/utils/helpers';
import {
  companyCol,
  operationCol,
  partnerNameCol,
  phoneNumberCol,
  representativeCol,
  statusCol,
  backgroundCol,
  logoCol
} from './columns';

const { Title, Text } = Typography;

const PartnerManage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useApp();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<CourtManage | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState<'logo' | 'background'>('logo');
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [courtDetail, setCourtDetail] = useState<CourtManage | null>(null);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  
  // Phân trang và tìm kiếm
  const [courts, setCourts] = useState<CourtManage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchCourts();
  }, [pagination.current, pagination.pageSize, searchText]);

  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        size: pagination.pageSize,
        search: searchText
      };
      
      const response = await CourtService.getCourtList(params);
      setCourts(response || []);
      setPagination({
        ...pagination,
        total: response.totalElements || 0
      });
    } catch (error) {
      console.error('Error fetching courts:', error);
      toast.error(t('common:message.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (page: number, pageSize?: number) => {
    setPagination({
      ...pagination,
      current: page,
      pageSize: pageSize || pagination.pageSize
    });
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination({
      ...pagination,
      current: 1
    });
  };

  const onEdit = useCallback(
    (record: CourtManage) => {
      navigate(`/court-prices/edit/${record.id}`);
    },
    [navigate]
  );

  const showCourtDetail = useCallback((record: CourtManage) => {
    setCourtDetail(record);
    setDetailVisible(true);
  }, []);

  const handleUploadImage = useCallback(
    async (record: CourtManage, file: File | null) => {
      if (!file) return;

      const formData = new FormData();
      formData.append('courtId', record.id);
      formData.append('file', file);

      try {
        if (!user) {
          toast.error("Bạn không có quyền truy cập.");
          return;
        }

        const endpoint = uploadType === 'logo' 
          ? 'upload-logo' 
          : 'upload-background';

        await axios.post(`${CURRENT_ENV.API_URL}/court/${endpoint}`, formData, {
          headers: {
            Authorization: `Bearer ${user.result.token}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        toast.success(t('common:message.success'));
        setSelectedFile(null);
        setSelectedRecord(null);
        setPreviewImage(null);
        fetchCourts();
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = axios.isAxiosError(error)
          ? error.response?.data?.message || t('common:message.error')
          : t('common:message.error');
        
        toast.error(errorMessage);
        const { response } = error as AxiosError;

        if (response && response.status === 401 && !!useApp.getState().user) {
          AuthHelper.clearToken();
          window.location.href = `/login?source=${window.location.pathname}`;
        }
  
        CommonHelper.handleError(error);
        return Promise.reject(error);
      }
    },
    [user, t, navigate, uploadType]
  );

  const handleToggleStatus = useCallback(
    async (record: CourtManage) => {
      Modal.confirm({
        title: record.active
            ? "Bạn có chắc chắn muốn vô hiệu hóa sân này không?" 
            : "Bạn có chắc chắn muốn kích hoạt sân này không?",
        okText: "Đồng ý",
        cancelText: "Hủy bỏ",
        centered: true,
        okButtonProps: { danger: record.active },
        cancelButtonProps: { type: 'primary' },
        onOk: async () => {
          try {
            if (!user) return;

            const endpoint = record.active ? "disable" : "active";
            await axios.put(`${CURRENT_ENV.API_URL}/court/${endpoint}/${record.id}`, {}, {
              headers: {
                Authorization: `Bearer ${user.result.token}`
              }
            });

            toast.success(t('common:message.success'));
            fetchCourts();
          } catch (error) {
            console.error('Status change error:', error);
            const errorMessage = axios.isAxiosError(error)
              ? error.response?.data?.message || t('common:message.error')
              : t('common:message.error');
            
            toast.error(errorMessage);
          }
        }
      });
    },
    [t, user]
  );

  const onAddPartner = useCallback(() => {
    navigate('/court-prices/add');
  }, [navigate]);

  const handlePreview = (file: File) => {
    const preview = URL.createObjectURL(file);
    setPreviewImage(preview);
  };

  const showImagePreview = (imageUrl: string, title: string) => {
    setPreviewImage(imageUrl);
    setPreviewTitle(title);
    setPreviewVisible(true);
  };

  const uploadMenu = (
    <Menu 
      onClick={({ key }) => setUploadType(key as 'logo' | 'background')}
      items={[
        {
          key: 'logo',
          icon: <UploadOutlined />,
          label: "Tải lên logo",
        },
        {
          key: 'background',
          icon: <PictureOutlined />,
          label: "Tải lên ảnh nền",
        },
      ]}
    />
  );

  const columns = [
    logoCol,
    companyCol,
    phoneNumberCol,
    backgroundCol,
    statusCol,
    {
      width: 200,
      title: 'Hình ảnh',
      key: 'images',
      render: (record: CourtManage) => (
        <Card className="shadow-sm border rounded-lg overflow-hidden">
          <div className="flex flex-col gap-2">
            <Dropdown 
              overlay={uploadMenu} 
              trigger={['click']}
              className="w-full"
            >
              <Button 
                icon={<PictureOutlined />}
                type="default"
                className="w-full text-left bg-gray-50 hover:bg-gray-100 border-dashed"
              >
                {uploadType === 'logo' ? "Tải lên logo" : "Tải lên ảnh nền"}
              </Button>
            </Dropdown>
            
            <Upload
              accept="image/*"
              showUploadList={false}
              beforeUpload={(file) => {
                setSelectedFile(file);
                setSelectedRecord(record);
                handlePreview(file);
                return false;
              }}
            >
              <Button 
                type="primary" 
                icon={<UploadOutlined />}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                Chọn tệp
              </Button>
            </Upload>

            {previewImage && selectedRecord?.id === record.id && (
              <div className="flex flex-col gap-2 p-2 border rounded-lg bg-gray-50 mt-2">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full h-28 object-contain rounded border bg-white cursor-pointer"
                  onClick={() => showImagePreview(previewImage, uploadType === 'logo' ? 'Logo Preview' : 'Background Preview')}
                />
                <Button 
                  type="primary" 
                  icon={<CheckOutlined />}
                  onClick={() => handleUploadImage(record, selectedFile)}
                  className="mt-1 bg-green-500 hover:bg-green-600"
                  size="small"
                >
                  Xác nhận
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-2">
              {record.logo && (
                <div className="border rounded p-2 bg-gray-50">
                  <Text type="secondary" className="text-xs block mb-1">Logo hiện tại:</Text>
                  <img 
                    src={record.logo} 
                    alt="Logo" 
                    className="w-full h-16 object-contain bg-white border rounded cursor-pointer"
                    onClick={() => showImagePreview(record.logo, 'Logo')}
                  />
                </div>
              )}
              
              {record.background && (
                <div className="border rounded p-2 bg-gray-50">
                  <Text type="secondary" className="text-xs block mb-1">Ảnh nền hiện tại:</Text>
                  <img 
                    src={record.background} 
                    alt="Background" 
                    className="w-full h-16 object-contain bg-white border rounded cursor-pointer"
                    onClick={() => showImagePreview(record.background, 'Ảnh nền')}
                  />
                </div>
              )}
            </div>
          </div>
        </Card>
      )
    },
    {
      title: 'Thao tác',
      key: 'operation',
      render: (_: any, record: CourtManage) => (
        <Space size="small" wrap>
          <Tooltip title="Xem chi tiết">
            <Button 
              type="default" 
              icon={<EyeOutlined />} 
              onClick={() => showCourtDetail(record)}
              className="bg-blue-50 hover:bg-blue-100 border-blue-200"
            >
              Chi tiết
            </Button>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              className="bg-indigo-500 hover:bg-indigo-600"
            >
              Sửa
            </Button>
          </Tooltip>
          <Tooltip title={record.active ? "Vô hiệu hóa" : "Kích hoạt"}>
            <Button 
              type={record.active ? "default" : "primary"} 
              danger={record.active}
              icon={record.active ? <StopOutlined /> : <PlayCircleOutlined />}
              onClick={() => handleToggleStatus(record)}
              className={record.active ? "bg-red-50 hover:bg-red-100" : "bg-green-500 hover:bg-green-600"}
            >
              {record.active ? "Vô hiệu hóa" : "Kích hoạt"}
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <>
      <Card className="mb-4 shadow-sm">
        <div className="flex justify-between items-center">
          <div className="w-1/3">
          
          </div>
          <AppButton 
            type="primary" 
            onClick={onAddPartner} 
            iconType="add"
            className="shadow-md bg-green-500 hover:bg-green-600"
            size="large"
          >
            Thêm sân mới
          </AppButton>
        </div>
      </Card>

      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={courts}
          rowKey="id"
          loading={loading}
          pagination={false}
          rowClassName="hover:bg-blue-50"
          className="border rounded-lg overflow-hidden"
        />
        
        <div className="mt-4 flex justify-end">
          <Pagination
            current={pagination.current}
            pageSize={pagination.pageSize}
            total={pagination.total}
            onChange={handleTableChange}
            showSizeChanger
            showTotal={(total) => `Tổng cộng ${total} sân`}
          />
        </div>
      </Card>

      <Drawer
        title={
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-blue-700">Chi tiết sân</span>
            {courtDetail?.name && <Tag color="blue">{courtDetail.name}</Tag>}
          </div>
        }
        placement="right"
        onClose={() => setDetailVisible(false)}
        visible={detailVisible}
        width={520}
        className="court-detail-drawer"
        headerStyle={{ borderBottom: '1px solid #f0f0f0', padding: '16px 24px' }}
        bodyStyle={{ padding: '24px' }}
      >
        {courtDetail && (
          <div className="flex flex-col gap-4">
            <Card className="shadow-sm">
              <div className="grid grid-cols-1 gap-4">
                <div className="border-b pb-3">
                  <Text type="secondary" className="text-sm">Tên sân</Text>
                  <div className="font-medium text-base mt-1">{courtDetail.name}</div>
                </div>
                
                <div className="border-b pb-3">
                  <Text type="secondary" className="text-sm">Địa chỉ</Text>
                  <div className="font-medium text-base mt-1">{courtDetail.address}</div>
                </div>
                
                <div className="border-b pb-3">
                  <Text type="secondary" className="text-sm">Số điện thoại</Text>
                  <div className="font-medium text-base mt-1">{courtDetail.phone}</div>
                </div>
                
                <div className="border-b pb-3">
                  <Text type="secondary" className="text-sm">Email</Text>
                  <div className="font-medium text-base mt-1">{courtDetail.email}</div>
                </div>
                
                <div className="border-b pb-3">
                  <Text type="secondary" className="text-sm">Giờ mở cửa</Text>
                  <div className="font-medium text-base mt-1">{courtDetail.openTime}</div>
                </div>
                
                <div className="border-b pb-3">
                  <Text type="secondary" className="text-sm">Liên kết</Text>
                  <div className="font-medium text-base mt-1">
                    <a 
                      href={courtDetail.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 hover:underline"
                    >
                      {courtDetail.link}
                    </a>
                  </div>
                </div>
                
                <div className="pb-2">
                  <Text type="secondary" className="text-sm">Trạng thái</Text>
                  <div className="font-medium text-base mt-1">
                    {courtDetail.active ? 
                      <Tag color="success" className="px-3 py-1 text-sm">Đang hoạt động</Tag> : 
                      <Tag color="error" className="px-3 py-1 text-sm">Không hoạt động</Tag>
                    }
                  </div>
                </div>
              </div>
            </Card>
            
            <div className="flex justify-end mt-4">
              <Button 
                type="primary" 
                onClick={() => setDetailVisible(false)}
                className="bg-blue-500 hover:bg-blue-600"
                size="large"
              >
                Quay lại
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        visible={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
        width={800}
      >
        <div className="flex justify-center">
          <img
            alt={previewTitle}
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
            src={previewImage || ''}
          />
        </div>
      </Modal>
    </>
  );
};

export default PartnerManage;
