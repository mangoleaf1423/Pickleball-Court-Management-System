import React, { useState, useEffect } from 'react';
import { Button, Table, Modal, Input, TimePicker, DatePicker, Select, Form, message, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useApp } from '@/store';
import axios, { AxiosError } from 'axios';
import { CURRENT_ENV } from '@/core/configs/env';
import { toast } from 'react-toastify';
import { t } from 'i18next';
import dayjs from 'dayjs';
import { AuthHelper, CommonHelper } from '@/utils/helpers';
import { Edit, Edit2Icon } from 'lucide-react';

const { Option } = Select;

interface MaintenanceHistory {
  id: string;
  courtSlotId: string;
  startTime: string;
  endTime: string;
  finishAt: string | null;
  description: string;
  status: string | null;
}

interface CourtData {
  id: string;
  name: string;
  active: boolean;
}

const Rackets = () => {
  const { user } = useApp();
  const [form] = Form.useForm();
  const [courts, setCourts] = useState<CourtData[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [selectedCourtSlotId, setSelectedCourtSlotId] = useState<string>('');
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceHistory[]>([]);
  const [courtSlots, setCourtSlots] = useState<CourtData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<MaintenanceHistory>>({});
  const [loading, setLoading] = useState(false);

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

  const fetchCourtSlots = async () => {
    if (selectedCourtId) {
      try {
        const response = await axios.get(
          `${CURRENT_ENV.API_URL}/court/public/court_slot/getByCourtId/${selectedCourtId}`,
          { headers: { Authorization: `Bearer ${user?.result.token} ` } }
        );
        setCourtSlots(response.data);
        if (response.data.length > 0) {
          setSelectedCourtSlotId(response.data[0].id);
        } else {
          setSelectedCourtSlotId('');
        }
      } catch (error) {
        toast.error(t('common:message.error'));
        
      }
    }
  };


  const fetchMaintenanceHistory = async () => {
    if (selectedCourtSlotId) {
      setLoading(true);
      try {
        const response = await axios.get(
          `${CURRENT_ENV.API_URL}/court/court_slot/maintenance-history?courtSlotId=${selectedCourtSlotId}`,
          { headers: { Authorization: `Bearer ${user?.result.token} ` } }
        );
        setMaintenanceHistory(response.data);
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
    }
  };

  useEffect(() => {
    fetchCourtSlots();
  }, [selectedCourtId]);

  useEffect(() => {
    fetchMaintenanceHistory();
  }, [selectedCourtSlotId]);

  const handleCreate = async () => {
    try {
      if (!selectedCourtSlotId) {
        toast.error('Vui lòng chọn khu vực sân trước khi tạo lịch bảo trì');
        return;
      }
      
      const values = await form.validateFields();
      // Sử dụng format ISO không có timezone để tránh lỗi deserialize
      const startTime = dayjs(values.timeRange[0]).format('YYYY-MM-DDTHH:mm:ss');
      const endTime = dayjs(values.timeRange[1]).format('YYYY-MM-DDTHH:mm:ss');
      
      await axios.post(
        `${CURRENT_ENV.API_URL}/court/court_slot/create-maintenance`,
        {
          courtSlotId: selectedCourtSlotId,
          startTime: startTime,
          endTime: endTime,
          description: values.description
        },
        {
          headers: {
            Authorization: `Bearer ${user?.result.token}`
          }
        }
      );
      toast.success('Tạo lịch bảo trì thành công');
      setIsModalOpen(false);
      fetchMaintenanceHistory();
      form.resetFields();
    } catch (error) {
      toast.error('Tạo lịch bảo trì thất bại');
      const { response } = error as AxiosError;

      if (response && response.status === 401 && !!useApp.getState().user) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }

      CommonHelper.handleError(error);
      return Promise.reject(error);
    }
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      
      // Chuẩn bị dữ liệu cập nhật theo API
      const updateData: any = {
        id: formData.id,
        courtSlotId: selectedCourtSlotId,
        startTime: formData.startTime,
        endTime: formData.endTime,
        description: formData.description,
        status: values.status
      };
      
      // Nếu trạng thái là "Hoàn thành", thêm finishAt
      if (values.status === "Hoàn thành") {
        updateData.finishAt = dayjs().format('YYYY-MM-DDTHH:mm:ss');
      } else {
        updateData.finishAt = null;
      }
      
      await axios.put(
        `${CURRENT_ENV.API_URL}/court/court_slot/update-maintenance`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${user?.result.token}`
          }
        }
      );
      toast.success('Cập nhật trạng thái bảo trì thành công');
      setIsModalOpen(false);
      fetchMaintenanceHistory();
      form.resetFields();
    } catch (error) {
      toast.error('Cập nhật trạng thái bảo trì thất bại');
      const { response } = error as AxiosError;

      if (response && response.status === 401 && !!useApp.getState().user) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }

      CommonHelper.handleError(error);
      return Promise.reject(error);
    }
  };

  const showModal = (record?: MaintenanceHistory) => {
    if (record) {
      // Chế độ chỉnh sửa
      setIsEditMode(true);
      setFormData(record);
      form.setFieldsValue({
        status: record.status
      });
    } else {
      // Chế độ thêm mới
      setIsEditMode(false);
      setFormData({});
      form.resetFields();
      form.setFieldsValue({
        timeRange: [dayjs(), dayjs().add(1, 'hour')]
      });
    }
    setIsModalOpen(true);
  };

  const columns: ColumnsType<MaintenanceHistory> = [
    {
      title: t('admin:maintenance.time'),
      dataIndex: 'startTime',
      render: (_, record) => (
        <div>
          <div>{dayjs(record.startTime).format('DD/MM/YYYY HH:mm')}</div>
          <div>{dayjs(record.endTime).format('DD/MM/YYYY HH:mm')}</div>
        </div>
      )
    },
    { title: t('admin:maintenance.description'), dataIndex: 'description' },
    {
      title: t('admin:maintenance.status'),
      dataIndex: 'status',
      render: status => status || t('common:inProgress')
    },
    {
      title: 'Thao tác',
      render: (_, record) => (
        <Button type="link" onClick={() => showModal(record)}>
          <Edit />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Bộ lọc</h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn sân tổng
            </label>
            <Select
              value={selectedCourtId}
              onChange={value => setSelectedCourtId(value)}
              className="w-full"
              dropdownClassName="rounded-lg shadow-lg"
              optionFilterProp="children"
            >
              {courts.map(court => (
                <Option
                  key={court.id}
                  value={court.id}
                  className="flex items-center px-4 py-2 hover:bg-gray-50"
                >
                  <span className="text-gray-700">{court.name}</span>
                </Option>
              ))}
            </Select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn khu vực sân
            </label>
            <Select
              value={selectedCourtSlotId}
              onChange={value => setSelectedCourtSlotId(value)}
              className="w-full"
              placeholder="Chọn khu vực sân"
              dropdownClassName="rounded-lg shadow-lg"
              optionFilterProp="children"
            >
              {courtSlots.map(slot => (
                <Option
                  key={slot.id}
                  value={slot.id}
                  className="flex items-center px-4 py-2 hover:bg-gray-50"
                >
                  <span className="text-gray-700">{slot.name}</span>
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Maintenance History Table */}
      {selectedCourtSlotId && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Lịch sử bảo trì</h3>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Tổng số bản ghi: {maintenanceHistory.length}
              </div>
              <Button type="primary" onClick={() => showModal()}>
                Thêm mới
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-100">
            {loading ? (
              <div className="py-10 text-center">Đang tải dữ liệu...</div>
            ) : maintenanceHistory.length > 0 ? (
              <Table
                columns={columns}
                dataSource={maintenanceHistory}
                rowKey="id"
                pagination={false}
                className="min-w-[800px]"
                scroll={{ x: true }}
                rowClassName="hover:bg-gray-50 transition-colors"
              />
            ) : (
              <Empty 
                description="Không có lịch sử bảo trì" 
                className="py-10"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </div>
      )}

      <Modal
        title={isEditMode ? 'Cập nhật trạng thái bảo trì' : 'Tạo mới lịch bảo trì'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        onOk={isEditMode ? handleUpdate : handleCreate}
      >
        <Form form={form} layout="vertical">
          {!isEditMode && (
            <>
              <Form.Item
                name="timeRange"
                label="Thời gian bảo trì"
                rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}
              >
                <DatePicker.RangePicker 
                  showTime={{ 
                    format: 'HH:mm',
                    minuteStep: 15,
                    hideDisabledOptions: true
                  }} 
                  format="DD/MM/YYYY HH:mm" 
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </Form.Item>

              <Form.Item
                name="description"
                label="Mô tả"
                rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
              >
                <Input.TextArea />
              </Form.Item>
            </>
          )}

          {isEditMode && (
            <Form.Item 
              name="status" 
              label="Trạng thái"
              rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
            >
              <Select>
                <Option value="Hoàn thành">Hoàn thành</Option>
                <Option value={null}>Đang thực hiện</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Rackets;