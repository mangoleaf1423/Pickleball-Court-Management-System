import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Modal, Button, Upload, Select, Radio, Card, Space, Image, Tag } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { t } from 'i18next';
import axios from 'axios';
import { CURRENT_ENV } from '@/core/configs/env';
import { useApp } from '@/store';
import type { UploadFile } from 'antd/es/upload/interface';

interface CourtImage {
  id: string;
  url: string;
  isMap: boolean;
  createdAt: string;
}

const CourtImagesManage = () => {
  const navigate = useNavigate();
  const { user } = useApp();
  const [courts, setCourts] = useState<any[]>([]);
  const [images, setImages] = useState<CourtImage[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string>('');
  const [isMap, setIsMap] = useState<boolean>(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

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
          filteredCourts = response.data.filter((court: any) => 
            user.result.user.courtNames?.includes(court.name)
          );
        }
        
        setCourts(filteredCourts);
        if (filteredCourts.length > 0) {
          setSelectedCourt(filteredCourts[0].id);
        }
      } catch (error) {
        toast.error(t('common:message.error'));
      }
    };
    fetchCourts();
  }, [user]);

  const fetchImages = useCallback(async () => {
    if (!selectedCourt) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${CURRENT_ENV.API_URL}/court/public/court-images/list`, {
        params: { courtId: selectedCourt, isMap }
      });
      setImages(response.data);
    } catch (error) {
      toast.error(t('common:message.error'));
    } finally {
      setLoading(false);
    }
  }, [selectedCourt, isMap]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUpload = useCallback(async () => {
    if (!selectedCourt || !fileList.length || !user) return;

    const formData = new FormData();
    const file = fileList[0]?.originFileObj as File;
    
    formData.append('courtId', selectedCourt);
    formData.append('file', file);
    formData.append('isMap', isMap.toString());

    try {
      await axios.post(`${CURRENT_ENV.API_URL}/court/court-images/upload`, formData, {
        headers: {
          Authorization: `Bearer ${user.result.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success(t('common:success.create'));
      setFileList([]);
      fetchImages();
    } catch (error) {
      toast.error(axios.isAxiosError(error) 
        ? error.response?.data?.message || t('common:message.error')
        : t('common:message.error'));
    }
  }, [selectedCourt, fileList, isMap, user, fetchImages]);

  const handleDelete = useCallback(async (imageId: string) => {
    if (!selectedCourt || !user) return;

    Modal.confirm({
      title: t('common:message.confirm_delete'),
      okText: t('common:button.ok'),
      cancelText: t('common:button.cancel'),
      centered: true,
      onOk: async () => {
        try {
          await axios.delete(`${CURRENT_ENV.API_URL}/court/court-images/delete`, {
            params: { 
              imageId,
              courtId: selectedCourt 
            },
            headers: { Authorization: `Bearer ${user.result.token}` }
          });
          toast.success(t('common:success.delete'));
          fetchImages();
        } catch (error) {
          toast.error(t('common:message.error'));
        }
      }
    });
  }, [selectedCourt, user, fetchImages]);

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await URL.createObjectURL(file.originFileObj as Blob);
    }
    setPreviewImage(file.url || file.preview || '');
    setPreviewVisible(true);
  };

  const columns = [
    {
      title: t('common:image'),
      dataIndex: 'imageUrl',
      render: (imageUrl: string) => (
        <Image
          src={imageUrl}
          width={150}
          height={100}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          preview={{
            mask: <EyeOutlined style={{ fontSize: 18, color: '#fff' }} />,
          }}
        />
      )
    },
    {
      title: t('common:type'),
      dataIndex: 'mapImage',
      render: (isMap: boolean) => (
        <Tag color={isMap ? 'geekblue' : 'green'}>
          {isMap ? t('common:map') : t('common:slot')}
        </Tag>
      )
    },
    {
      title: t('common:action'),
      render: (_: any, record: CourtImage) => (
        <Button
          danger
          type="primary"
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        />
      )
    }
  ];

  return (
    <Card title={t('sidebar:court_images')} bordered={false}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Space wrap>
          <Select
            placeholder={t('common:select_court')}
            style={{ width: 250 }}
            onChange={setSelectedCourt}
            options={courts.map(court => ({ label: court.name, value: court.id }))}
          />

          <Radio.Group
            value={isMap}
            onChange={e => setIsMap(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value={false}>{t('common:slot_images')}</Radio.Button>
            <Radio.Button value={true}>{t('common:map_images')}</Radio.Button>
          </Radio.Group>
        </Space>

        <Space wrap>
          <Upload
            fileList={fileList}
            beforeUpload={file => {
              setFileList([{
                uid: file.uid,
                name: file.name,
                status: 'done',
                originFileObj: file,
                url: URL.createObjectURL(file)
              }]);
              return false;
            }}
            listType="picture"
            maxCount={1}
            onRemove={() => setFileList([])}
            onPreview={handlePreview}
            accept="image/*"
          >
            <Button icon={<UploadOutlined />} type="primary">
              {t('common:select_file')}
            </Button>
          </Upload>
          
          <Button
            type="primary"
            onClick={handleUpload}
            disabled={!fileList.length || !selectedCourt}
            loading={loading}
          >
            {t('common:upload')}
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={images}
          loading={loading}
          rowKey="id"
          pagination={false}
          scroll={{ x: true }}
        />
      </Space>

      <Modal
        visible={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </Card>
  );
};

export default CourtImagesManage;
