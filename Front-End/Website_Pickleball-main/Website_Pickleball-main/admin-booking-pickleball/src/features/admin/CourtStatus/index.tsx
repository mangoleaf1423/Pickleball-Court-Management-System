import React, { useState, useEffect } from 'react';
import { Button, Table, Modal, Input, TimePicker, InputNumber, Select, Form, Pagination } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useApp } from '@/store';
import axios, { AxiosError } from 'axios';
import { CURRENT_ENV } from '@/core/configs/env';
import { toast } from 'react-toastify';
import { t } from 'i18next';
import dayjs from 'dayjs';
import { AuthHelper, CommonHelper } from '@/utils/helpers';

const { Option } = Select;

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  regularPrice: number;
  dailyPrice: number;
  studentPrice: number;
}

interface CourtTimeSlots {
  weekdayTimeSlots: TimeSlot[];
  weekendTimeSlots: TimeSlot[];
}

interface CourtData {
  id: string;
  name: string;
  active: boolean;
}

const CourtStatus = () => {
  const { user } = useApp();
  const [courts, setCourts] = useState<CourtData[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [courtTimeSlots, setCourtTimeSlots] = useState<CourtTimeSlots>({ weekdayTimeSlots: [], weekendTimeSlots: [] });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCourtSlotModalVisible, setIsCourtSlotModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [courtSlotModalType, setCourtSlotModalType] = useState<'add' | 'edit'>('add');
  const [form] = Form.useForm();
  const [courtSlotForm] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [dayType, setDayType] = useState<'weekday' | 'weekend'>('weekday');
  const [editingTimeSlot, setEditingTimeSlot] = useState<TimeSlot | null>(null);
  const [weekdayTimeSlots, setWeekdayTimeSlots] = useState<TimeSlot[]>([]);
  const [weekendTimeSlots, setWeekendTimeSlots] = useState<TimeSlot[]>([]);
  const [editingCourtSlot, setEditingCourtSlot] = useState<CourtData | null>(null);
  const [courtSlots, setCourtSlots] = useState<CourtData[]>([]);

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
    const fetchData = async () => {
      if (selectedCourtId) {
        try {
          const [timeSlotsResponse, courtSlotsResponse] = await Promise.all([
            axios.get(`${CURRENT_ENV.API_URL}/court/public/court_price/getByCourtId/${selectedCourtId}`, {
              headers: { Authorization: `Bearer ${user?.result.token}` }
            }),
            axios.get(`${CURRENT_ENV.API_URL}/court/public/court_slot/getByCourtId/${selectedCourtId}`, {
              headers: { Authorization: `Bearer ${user?.result.token}` }
            })
          ]);

          setCourtTimeSlots({
            weekdayTimeSlots: timeSlotsResponse.data.weekdayTimeSlots,
            weekendTimeSlots: timeSlotsResponse.data.weekendTimeSlots
          });
          setWeekdayTimeSlots(timeSlotsResponse.data.weekdayTimeSlots);
          setWeekendTimeSlots(timeSlotsResponse.data.weekendTimeSlots);
          setCourtSlots(courtSlotsResponse.data);
          setCurrentPage(1);
        } catch (error) {
          toast.error(t('common:message.error'));
        }
      }
    };
    fetchData();
  }, [selectedCourtId]);

  const columns: ColumnsType<TimeSlot> = [
    {
      title: t('admin:court.timeSlot'),
      dataIndex: 'timeRange',
      render: (_, record) => `${record.startTime.slice(0, 5)} - ${record.endTime.slice(0, 5)}`
    },
    {
      title: t('admin:court.regularPrice'),
      dataIndex: 'regularPrice',
      render: value => `${value.toLocaleString()} ${t('common:vnd')}`
    },
    {
      title: t('admin:court.dailyPrice'),
      dataIndex: 'dailyPrice',
      render: value => `${value.toLocaleString()} ${t('common:vnd')}`
    },
    {
      title: t('admin:court.studentPrice'),
      dataIndex: 'studentPrice',
      render: value => `${value.toLocaleString()} ${t('common:vnd')}`
    },
    {
      title: t('common:button.actions'),
      render: (_, record) => (
        <>
          <Button onClick={() => handleEdit(record)}>{t('common:button.edit')}</Button>
        </>
      )
    }
  ];

  const courtSlotColumns: ColumnsType<CourtData> = [
    { title: t('admin:court.courtName'), dataIndex: 'name' },
    {
      title: t('admin:court.status'),
      render: (_, record) => (
        <Button 
          type={record.active ? 'primary' : 'default'} 
          onClick={() => handleToggleActive(record.id)}
        >
          {record.active ? t('common:active') : t('common:inactive')}
        </Button>
      )
    },
    {
      title: t('common:actions'),
      render: (_, record) => (
        <>
          <Button onClick={() => handleEditCourtSlot(record)}>{t('common:button.edit')}</Button>
        </>
      )
    }
  ];

  const handleAddTimeSlot = () => {
    form.resetFields();
    form.setFieldsValue({ slots: [{ dayType: 'weekday' }] }); // Initialize with default dayType
    setModalType('add');
    setIsModalVisible(true);
  };

  const handleAddCourtSlot = () => {
    courtSlotForm.resetFields();
    setCourtSlotModalType('add');
    setEditingCourtSlot(null); // Reset editing court slot when adding new one
    setIsCourtSlotModalVisible(true);
  };

  const handleEdit = (record: TimeSlot) => {
    setModalType('edit');
    setEditingTimeSlot(record);
    
    // Determine if the record is from weekday or weekend based on the current table
    const isWeekend = courtTimeSlots.weekendTimeSlots.some(slot => slot.id === record.id);
    setDayType(isWeekend ? 'weekend' : 'weekday');
    
    form.setFieldsValue({
      ...record,
      dayType: isWeekend ? 'weekend' : 'weekday',
      timeRange: [dayjs(record.startTime, 'HH:mm'), dayjs(record.endTime, 'HH:mm')]
    });
    setIsModalVisible(true);
  };

  const handleToggleActive = async (id: string) => {
    try {
      const slot = courtSlots.find(slot => slot.id === id);
      const isCurrentlyActive = slot?.active;
      
      await axios.put(
        `${CURRENT_ENV.API_URL}/court/court_slot/${isCurrentlyActive ? 'disable' : 'active'}/${id}`, 
        {}, 
        {
          headers: { Authorization: `Bearer ${user?.result.token}` }
        }
      );

      toast.success(t('common:message.success'));
      setCourtSlots(prev => prev.map(slot => 
        slot.id === id ? { ...slot, active: !isCurrentlyActive } : slot
      ));
    } catch (error) {
      toast.error(t('common:message.error'));
      const { response } = error as AxiosError;

      if (response && response.status === 401 && !!useApp.getState().user) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }

      CommonHelper.handleError(error);
      return Promise.reject(error);
    }
  };

  const handleEditCourtSlot = (record: CourtData) => {
    setCourtSlotModalType('edit');
    setEditingCourtSlot(record);
    courtSlotForm.setFieldsValue({
      name: record.name
    });
    setIsCourtSlotModalVisible(true);
  };

  // Validate time range
  const validateTimeRange = (_: any, value: any) => {
    if (!value) return Promise.resolve();
    
    const [startTime, endTime] = value;
    if (startTime && endTime && startTime.isAfter(endTime)) {
      return Promise.reject(new Error(t('admin:court.errors.invalidTimeRange')));
    }
    return Promise.resolve();
  };

  // Check for overlapping time slots
  const checkOverlappingTimeSlots = (newSlot: any, existingSlots: TimeSlot[], editingId?: string) => {
    const newStart = dayjs(newSlot.startTime, 'HH:mm:ss');
    const newEnd = dayjs(newSlot.endTime, 'HH:mm:ss');
    
    return existingSlots.some(slot => {
      // Skip the current slot being edited
      if (editingId && slot.id === editingId) return false;
      
      const slotStart = dayjs(slot.startTime, 'HH:mm:ss');
      const slotEnd = dayjs(slot.endTime, 'HH:mm:ss');
      
      // Check if the new slot overlaps with existing slot
      return (
        (newStart.isAfter(slotStart) && newStart.isBefore(slotEnd)) ||
        (newEnd.isAfter(slotStart) && newEnd.isBefore(slotEnd)) ||
        (newStart.isSame(slotStart) || newEnd.isSame(slotEnd)) ||
        (newStart.isBefore(slotStart) && newEnd.isAfter(slotEnd))
      );
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (modalType === 'add') {
        const newWeekdaySlots = values.slots
          .filter((slot: any) => slot.dayType === 'weekday')
          .map((slot: any) => ({
            startTime: slot.timeRange[0].format('HH:mm:ss'),
            endTime: slot.timeRange[1].format('HH:mm:ss'),
            regularPrice: slot.regularPrice,
            dailyPrice: slot.dailyPrice,
            studentPrice: slot.studentPrice
          }));

        const newWeekendSlots = values.slots
          .filter((slot: any) => slot.dayType === 'weekend')
          .map((slot: any) => ({
            startTime: slot.timeRange[0].format('HH:mm:ss'),
            endTime: slot.timeRange[1].format('HH:mm:ss'),
            regularPrice: slot.regularPrice,
            dailyPrice: slot.dailyPrice,
            studentPrice: slot.studentPrice
          }));

        // Check for overlapping time slots
        let hasOverlap = false;
        let overlappingSlotInfo = '';
        
        for (const slot of newWeekdaySlots) {
          if (checkOverlappingTimeSlots(slot, weekdayTimeSlots)) {
            hasOverlap = true;
            overlappingSlotInfo = `${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)} (${t('common:weekday')})`;
            break;
          }
        }
        
        if (!hasOverlap) {
          for (const slot of newWeekendSlots) {
            if (checkOverlappingTimeSlots(slot, weekendTimeSlots)) {
              hasOverlap = true;
              overlappingSlotInfo = `${slot.startTime.slice(0, 5)} - ${slot.endTime.slice(0, 5)} (${t('common:weekend')})`;
              break;
            }
          }
        }
        
        if (hasOverlap) {
          toast.error(`${t('admin:court.errors.overlappingTimeSlots')}: ${overlappingSlotInfo}`);
          return;
        }

        // Combine existing time slots with new ones
        const combinedWeekdayTimeSlots = [...weekdayTimeSlots, ...newWeekdaySlots];
        const combinedWeekendTimeSlots = [...weekendTimeSlots, ...newWeekendSlots];

        await axios.post(`${CURRENT_ENV.API_URL}/court/court-price`, {
          courtId: selectedCourtId,
          weekdayTimeSlots: combinedWeekdayTimeSlots,
          weekendTimeSlots: combinedWeekendTimeSlots
        }, {
          headers: { Authorization: `Bearer ${user?.result.token}` }
        });
      } else {
        
        const slot = values;
        console.log(slot);
        const isWeekend = slot.dayType === 'weekend';
        
        const newSlot = {
          id: slot.id,
          startTime: slot.timeRange[0].format('HH:mm:ss'),
          endTime: slot.timeRange[1].format('HH:mm:ss'),
          regularPrice: slot.regularPrice,
          dailyPrice: slot.dailyPrice,
          studentPrice: slot.studentPrice
        };
        
        // Check for overlapping time slots
        let hasOverlap = false;
        let overlappingSlotInfo = '';
        
        if (isWeekend) {
          if (checkOverlappingTimeSlots(newSlot, weekendTimeSlots, slot.id)) {
            hasOverlap = true;
            overlappingSlotInfo = `${newSlot.startTime.slice(0, 5)} - ${newSlot.endTime.slice(0, 5)} (${t('common:weekend')})`;
          }
        } else {
          if (checkOverlappingTimeSlots(newSlot, weekdayTimeSlots, slot.id)) {
            hasOverlap = true;
            overlappingSlotInfo = `${newSlot.startTime.slice(0, 5)} - ${newSlot.endTime.slice(0, 5)} (${t('common:weekday')})`;
          }
        }
        
        if (hasOverlap) {
          toast.error(`${t('admin:court.errors.overlappingTimeSlots')}: ${overlappingSlotInfo}`);
          return;
        }
        
        const weekday = !isWeekend ? [newSlot] : [];
        const weekend = isWeekend ? [newSlot] : [];
        
        const weekdaySlots = weekdayTimeSlots.map(slot => {
          const matchingValue = weekday?.find((v: any) => v.id === slot.id);
          
          return matchingValue ? {
            ...slot,
            startTime: matchingValue.startTime,
            endTime: matchingValue.endTime,
            regularPrice: matchingValue.regularPrice,
            dailyPrice: matchingValue.dailyPrice,
            studentPrice: matchingValue.studentPrice
          } : slot;
        });

        const weekendSlots = weekendTimeSlots.map(slot => {
          const matchingValue = weekend?.find((v: any) => v.id === slot.id);
          
          return matchingValue ? {
            ...slot,
            startTime: matchingValue.startTime,
            endTime: matchingValue.endTime,
            regularPrice: matchingValue.regularPrice,
            dailyPrice: matchingValue.dailyPrice,
            studentPrice: matchingValue.studentPrice
          } : slot;
        });

        await axios.post(`${CURRENT_ENV.API_URL}/court/court-price`, {
          courtId: selectedCourtId,
          weekdayTimeSlots: weekdaySlots,
          weekendTimeSlots: weekendSlots
        }, {
          headers: { Authorization: `Bearer ${user?.result.token}` }
        });
      }

      toast.success(t('common:message.success'));
      setIsModalVisible(false);
      const response = await axios.get(
        `${CURRENT_ENV.API_URL}/court/public/court_price/getByCourtId/${selectedCourtId}`,
        { headers: { Authorization: `Bearer ${user?.result.token}` } }
      );
      setCourtTimeSlots(response.data);
      setWeekdayTimeSlots(response.data.weekdayTimeSlots);
      setWeekendTimeSlots(response.data.weekendTimeSlots);
    } catch (error) {
      toast.error(t('common:message.error'));
      const { response } = error as AxiosError;

      if (response && response.status === 401 && !!useApp.getState().user) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }

      CommonHelper.handleError(error);
      return Promise.reject(error);
    }
  };

  const handleCourtSlotSubmit = async (values: any) => {
    try {
      if (courtSlotModalType === 'add') {
        // Add new court slot
        await axios.post(`${CURRENT_ENV.API_URL}/court/court_slot`, {
          ...values,
          courtId: selectedCourtId,
        }, {
          headers: { Authorization: `Bearer ${user?.result.token}` }
        });
      } else {
        // Update existing court slot
        await axios.put(`${CURRENT_ENV.API_URL}/court/court_slot`, {
          ...values,
          courtId: selectedCourtId,
          id: editingCourtSlot?.id,
          active: true,
        }, {
          headers: { Authorization: `Bearer ${user?.result.token}` }
        });
      }

      toast.success(t('common:message.success'));
      setIsCourtSlotModalVisible(false);
      
      // Refresh court slots data
      const response = await axios.get(
        `${CURRENT_ENV.API_URL}/court/public/court_slot/getByCourtId/${selectedCourtId}`,
        { headers: { Authorization: `Bearer ${user?.result.token}` } }
      );
      setCourtSlots(response.data);
    } catch (error) {
      toast.error(t('common:message.error'));
      const { response } = error as AxiosError;

      if (response && response.status === 401 && !!useApp.getState().user) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }

      CommonHelper.handleError(error);
      return Promise.reject(error);
    }
  };
  console.log(selectedCourtId);

  return (
    <div className="p-4">
      <div className="mb-4 flex gap-4 items-center">
        <Select
          placeholder={t('admin:court.selectMainCourt')}
          style={{ width: 300 }}
          onChange={value => setSelectedCourtId(value)}
          value={selectedCourtId}
        >
          {courts.map(court => (
            <Option key={court.id} value={court.id}>{court.name}</Option>
          ))}
        </Select>

        <Button type="primary" onClick={handleAddTimeSlot}>
          {t('admin:court.addTimeSlot')}
        </Button>
        <Button type="primary" onClick={handleAddCourtSlot}>
          {t('admin:court.addSubCourt')}
        </Button>
      </div>

      {selectedCourtId && (
        <div className="mb-8 border p-4 rounded-lg">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{t('admin:court.subCourtList')}</h3>
            <Table
              columns={courtSlotColumns}
              dataSource={courtSlots}
              rowKey="id"
              pagination={false}
            />
          </div>

          <div className="mb-6" 
               onMouseOver={() => setDayType('weekday')}
               onClick={() => setDayType('weekday')}
               style={{ cursor: 'pointer' }}>
            <h3 className="text-lg font-semibold mb-2">{t('admin:court.weekdaySlots')}</h3>
            <Table
              columns={columns}
              dataSource={courtTimeSlots.weekdayTimeSlots}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </div>

          <div className="mb-6" 
               onMouseOver={() => setDayType('weekend')}
               onClick={() => setDayType('weekend')}
               style={{ cursor: 'pointer' }}>
            <h3 className="text-lg font-semibold mb-2">{t('admin:court.weekendSlots')}</h3>
            <Table
              columns={columns}
              dataSource={courtTimeSlots.weekendTimeSlots}
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </div>
        </div>
      )}

      <Modal
        title={modalType === 'add' ? t('admin:court.addTimeSlot') : t('admin:court.editTimeSlot')}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          {modalType === 'edit' && (
            <Form.Item
              label={t('admin:court.dayType')}
              name="dayType"
              rules={[{ required: true, message: t('admin:court.dayType') }]}
              initialValue="weekday"
            >
              <Select
                placeholder={t('admin:court.selectDayType')}
                onChange={value => setDayType(value)}
                disabled={modalType === 'edit'}
              >
                <Option value="weekday">{t('common:weekday')}</Option>
                <Option value="weekend">{t('common:weekend')}</Option>
              </Select>
            </Form.Item>
          )}

          {modalType === 'add' ? (
            <Form.List name="slots">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <div key={field.key} className="mb-4 border-b pb-4">
                      <div className="font-medium mb-2">
                        {form.getFieldValue(['slots', field.name, 'dayType']) === 'weekend' 
                          ? t('common:weekend') 
                          : t('common:weekday')}
                      </div>

                      <Form.Item
                        {...field}
                        name={[field.name, 'dayType']}
                        hidden
                      >
                        <Input />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label={t('admin:court.timeRange')}
                        name={[field.name, 'timeRange']}
                        rules={[
                          { required: true, message: t('admin:court.timeRange') },
                          { validator: validateTimeRange }
                        ]}
                      >
                        <TimePicker.RangePicker format="HH:mm" className="w-full" />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label={t('admin:court.regularPrice')}
                        name={[field.name, 'regularPrice']}
                        rules={[
                          { required: true, message: t('admin:court.regularPrice') },
                          { type: 'number', min: 2000, message: t('admin:court.errors.minPrice', { min: 2000 }) }
                        ]}
                      >
                        <InputNumber 
                          className="w-full" 
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          min={2000}
                        />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label={t('admin:court.dailyPrice')}
                        name={[field.name, 'dailyPrice']}
                        rules={[
                          { required: true, message: t('admin:court.dailyPrice') },
                          { type: 'number', min: 2000, message: t('admin:court.errors.minPrice', { min: 2000 }) }
                        ]}
                      >
                        <InputNumber 
                          className="w-full" 
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          min={2000}
                        />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        label={t('admin:court.studentPrice')}
                        name={[field.name, 'studentPrice']}
                        rules={[
                          { required: true, message: t('admin:court.studentPrice') },
                          { type: 'number', min: 2000, message: t('admin:court.errors.minPrice', { min: 2000 }) }
                        ]}
                      >
                        <InputNumber 
                          className="w-full" 
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          min={2000}
                        />
                      </Form.Item>

                      {fields.length > 1 && (
                        <Button 
                          type="dashed" 
                          onClick={() => remove(field.name)} 
                          className="w-full mb-4"
                        >
                          {t('common:button.removeSlot')}
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button 
                      type="dashed" 
                      onClick={() => add({ dayType: 'weekday' })}
                      className="flex-1"
                    >
                      {t('admin:court.addWeekdaySlot')}
                    </Button>
                    <Button 
                      type="dashed" 
                      onClick={() => add({ dayType: 'weekend' })}
                      className="flex-1"
                    >
                      {t('admin:court.addWeekendSlot')}
                    </Button>
                  </div>
                </>
              )}
            </Form.List>
          ) : (
            <>
              <Form.Item
                hidden
                name="id"
              >
                <Input />
              </Form.Item>
              <Form.Item
                label={t('admin:court.timeRange')}
                name="timeRange"
                rules={[
                  { required: true, message: t('admin:court.timeRange') },
                  { validator: validateTimeRange }
                ]}
              >
                <TimePicker.RangePicker format="HH:mm" className="w-full" />
              </Form.Item>

              <Form.Item
                label={t('admin:court.regularPrice')}
                name="regularPrice"
                rules={[
                  { required: true, message: t('admin:court.regularPrice') },
                  { type: 'number', min: 2000, message: t('admin:court.errors.minPrice', { min: 2000 }) }
                ]}
              >
                <InputNumber 
                  className="w-full" 
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  min={2000}
                />
              </Form.Item>

              <Form.Item
                label={t('admin:court.dailyPrice')}
                name="dailyPrice"
                rules={[
                  { required: true, message: t('admin:court.errors.dailyPrice') },
                  { type: 'number', min: 2000, message: t('admin:court.errors.minPrice', { min: 2000 }) }
                ]}
              >
                <InputNumber 
                  className="w-full" 
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  min={2000}
                />
              </Form.Item>

              <Form.Item
                label={t('admin:court.studentPrice')}
                name="studentPrice"
                rules={[
                  { required: true, message: t('admin:court.errors.studentPrice') },
                  { type: 'number', min: 2000, message: t('admin:court.errors.minPrice', { min: 2000 }) }
                ]}
              >
                <InputNumber 
                  className="w-full" 
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  min={2000}
                />
              </Form.Item>
            </>
          )}

          <Button type="primary" htmlType="submit" className="w-full" style={{ marginTop: 16 }}>
            {modalType === 'add' ? t('common:button.add') : t('common:button.update')}
          </Button>
        </Form>
      </Modal>

      <Modal
        title={courtSlotModalType === 'add' ? t('admin:court.addSubCourt') : t('admin:court.editSubCourt')}
        open={isCourtSlotModalVisible}
        onCancel={() => setIsCourtSlotModalVisible(false)}
        footer={null}
      >
        <Form form={courtSlotForm} onFinish={handleCourtSlotSubmit} layout="vertical">
          <Form.Item
            label={t('admin:court.courtName')}
            name="name"
            rules={[{ required: true, message: t('admin:court.errors.courtName') }]}
          >
            <Input />
          </Form.Item>

          <Button type="primary" htmlType="submit" className="w-full">
            {courtSlotModalType === 'add' ? t('common:button.add') : t('common:button.update')}
          </Button>
        </Form>
      </Modal>
    </div>
  );
};

export default CourtStatus;