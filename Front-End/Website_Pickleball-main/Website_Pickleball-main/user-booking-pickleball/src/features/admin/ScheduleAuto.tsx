import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button, Card, DatePicker, Form, Select, Tag, Spin, TimePicker, Modal } from 'antd';
import dayjs from 'dayjs';
import { useApp } from '@/store';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CalendarOutlined, ClockCircleOutlined, CloseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { ArrowLeft } from 'lucide-react';

const { Option } = Select;

interface ScheduleFormValues {
  daysOfWeek: string[];
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

const ScheduleAuto: React.FC = () => {
  const { control, handleSubmit, formState: { errors }, getValues, reset, watch } = useForm<ScheduleFormValues>({
    defaultValues: {
      daysOfWeek: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      startTime: '08:00',
      endTime: '20:00'
    }
  });
  const [scheduleResult, setScheduleResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedMode, setSelectedMode] = React.useState<'auto' | 'optimize'>();
  const [selectedDate, setSelectedDate] = React.useState<string>();
  const [selectedCourts, setSelectedCourts] = React.useState<string[]>([]);
  const [flexibleCourts, setFlexibleCourts] = React.useState<Record<string, string>>({});
  const [totalAmount, setTotalAmount] = React.useState<number>(0);
  const { user } = useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const courtId = id || '';
  const location = useLocation();

  React.useEffect(() => {
    const subscription = watch((value) => {
      localStorage.setItem('scheduleAutoState', JSON.stringify({
        formValues: value,
        selectedCourts,
        flexibleCourts,
        selectedMode,
        totalAmount,
        scheduleResult
      }));
    });
    return () => subscription.unsubscribe();
  }, [watch, selectedCourts, flexibleCourts, selectedMode, totalAmount, scheduleResult]);

  React.useEffect(() => {
    const savedState = localStorage.getItem('scheduleAutoState');
    if (savedState) {
      const state = JSON.parse(savedState);
      reset(state.formValues);
      setSelectedCourts(state.selectedCourts || []);
      setFlexibleCourts(state.flexibleCourts || {});
      setSelectedMode(state.selectedMode);
      setTotalAmount(state.totalAmount || 0);
      setScheduleResult(state.scheduleResult);
    }
  }, []); // Removed reset from dependencies

  React.useEffect(() => {
    if (selectedMode === 'auto' && scheduleResult?.availableCourtSlots) {  
      if (selectedCourts.length > 0) {
        // Chỉ tính số sân đã chọn, không cộng thêm sân không hợp lệ
        const totalSlots = selectedCourts.length;
        console.log('Tổng số sân đã chọn (auto):', totalSlots);
        calculateTotal(totalSlots);
      } else {
        setTotalAmount(0);
      }
    } else if (selectedMode === 'optimize') {
      // Tính tổng số sân đã chọn trong chế độ tối ưu
      const totalFlexibleCourts = Object.keys(flexibleCourts).length;
      const totalSelectedCourts = selectedCourts.length;
      const totalSlots = totalFlexibleCourts + totalSelectedCourts;
      
      if (totalSlots > 0) {
        console.log('Tổng số sân đã chọn (optimize):', totalSlots);
        calculateTotal(totalSlots);
      } else {
        setTotalAmount(0);
      }
    }
  }, [selectedMode, scheduleResult, selectedCourts, flexibleCourts]);

  const daysOfWeekOptions = [
    { value: 'MONDAY', label: 'Thứ 2' },
    { value: 'TUESDAY', label: 'Thứ 3' },
    { value: 'WEDNESDAY', label: 'Thứ 4' },
    { value: 'THURSDAY', label: 'Thứ 5' },
    { value: 'FRIDAY', label: 'Thứ 6' },
    { value: 'SATURDAY', label: 'Thứ 7' },
    { value: 'SUNDAY', label: 'Chủ nhật' },
  ];

  const calculateTotal = async (count: number) => {
    try {
      const formValues = getValues();
      const params = {
        courtId,
        daysOfWeek: formValues.daysOfWeek?.join(','),
        startDate: dayjs(formValues.startDate).isValid() ? dayjs(formValues.startDate).format('YYYY-MM-DD') : '',
        endDate: dayjs(formValues.endDate).isValid() ? dayjs(formValues.endDate).format('YYYY-MM-DD') : '',
        startTime: dayjs(formValues.startTime, 'HH:mm').isValid() 
          ? dayjs(formValues.startTime, 'HH:mm').format('HH:mm') : '',
        endTime: dayjs(formValues.endTime, 'HH:mm').isValid() 
          ? dayjs(formValues.endTime, 'HH:mm').format('HH:mm') : ''    
      };

      const paymentResponse = await axios.get('https://picklecourt.id.vn/api/identity/public/payment-value', { params });
      const total = paymentResponse.data;
      console.log(total);

      const calculatedTotal = total * count;
      setTotalAmount(calculatedTotal);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tính tổng số tiền');
    }
  };

  const handleCourtSelection = async (court: string, date?: string) => {
    if (date) {
      setFlexibleCourts(prev => {
        const newFlexibleCourts = { ...prev };
        if (newFlexibleCourts[date] === court) {
          delete newFlexibleCourts[date];
        } else {
          newFlexibleCourts[date] = court;
        }
        return newFlexibleCourts;
      });
    } else {
      const totalAvailable = scheduleResult?.availableCourtSlots?.length || 0;
      const maxSelect = totalAvailable > 1 ? totalAvailable - 1 : 0;

      const isAlreadyBooked = Object.values(scheduleResult.invalidCourtSlots).flat().includes(court);
      const isUsedInFlexible = Object.values(flexibleCourts).includes(court);
      
      if (selectedCourts.includes(court)) {
        const newSelected = selectedCourts.filter(c => c !== court);
        setSelectedCourts(newSelected);
      } else if (!isAlreadyBooked && !isUsedInFlexible && (selectedCourts.length < maxSelect || selectedMode === 'auto')) {
        const newSelected = [...selectedCourts, court];
        setSelectedCourts(newSelected);
      }
    }
  };
  const handleBooking = async (mode: 'auto' | 'optimize') => {
    try {
      setLoading(true);
      const formValues = getValues();

      const bookingData = {
        courtId,
        mode,
        selectedCourtSlots: selectedCourts,
        flexibleCourtSlotFixes: selectedMode === 'optimize' ? flexibleCourts : {},
        selectedDates: selectedMode === 'optimize' ? Object.keys(flexibleCourts) : [],
        startDate: dayjs(formValues.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(formValues.endDate).format('YYYY-MM-DD'),
        totalAmount
      };

      localStorage.setItem('scheduleAutoState', JSON.stringify({
        formValues,
        selectedCourts,
        flexibleCourts,
        selectedMode,
        totalAmount,
        scheduleResult
      }));

      navigate('/checkout-schedule-auto', {
        state: {
          bookingData: {
            ...bookingData,
            selectedDays: formValues.daysOfWeek.join(','),
            startTime: dayjs(formValues.startTime, 'HH:mm').format('HH:mm'),
            endTime: dayjs(formValues.endTime, 'HH:mm').format('HH:mm'),
            courtName: location?.state?.courtName,
            totalAmount
          }
        }
      });

      toast.success(`Chuyển đến trang thanh toán cho lịch ${mode === 'auto' ? 'tự động' : 'tối ưu'}`);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi chuyển đến trang thanh toán');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ScheduleFormValues) => {
    try {
      setLoading(true);
      // Reset previous results and selections when checking schedule again
      setSelectedMode(undefined);
      setSelectedCourts([]);
      setFlexibleCourts({});
      setTotalAmount(0);
      setScheduleResult(null);

      if (!data.startDate || !data.endDate || !data.startTime || !data.endTime) {
        toast.error('Vui lòng điền đầy đủ thông tin');
        return;
      }

      const requestBody = {
        courtId,
        daysOfWeek: data.daysOfWeek.join(','),
        startDate: dayjs(data.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(data.endDate).format('YYYY-MM-DD'),
        startTime: dayjs(data.startTime, 'HH:mm').format('HH:mm'),
        endTime: dayjs(data.endTime, 'HH:mm').format('HH:mm'),
      };

      const response = await axios.post('https://picklecourt.id.vn/api/identity/public/check-invalid-slots', requestBody);

      if (response.status === 200) {
        setScheduleResult(response.data);
      }
    } catch (error: any) {
      console.error('Lỗi hệ thống:', error);
      toast.error(`Lỗi: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    const formValues = getValues();
    localStorage.setItem('scheduleAutoState', JSON.stringify({
      formValues,
      selectedCourts,
      flexibleCourts,
      selectedMode,
      totalAmount,
      scheduleResult
    }));
    window.history.back();
  };

  return (
    <div className="p-6 bg-gradient-to-b from-green-800 to-green-400 min-h-screen flex flex-col text-[16px]">
      <Card
        title={
          <div className="flex items-center gap-4">
            <ArrowLeft
              onClick={handleGoBack}
              className="text-green-700 cursor-pointer hover:text-green-800 transition-colors"
              size={24}
            />
            <h1 className="text-2xl font-bold text-green-700 m-0">
              CẤU HÌNH ĐẶT LỊCH CỐ ĐỊNH
            </h1>
          </div>
        }
        className="rounded-xl shadow-sm hover:shadow-md transition-shadow"
        headStyle={{
          borderBottom: '2px solid #e8f5e9',
          backgroundColor: '#f8fff8',
          borderRadius: '12px 12px 0 0',
          padding: '24px'
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <Spin spinning={loading} tip="Đang xử lý..." indicator={<div className="animate-spin" />}>
          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 gap-8">
              <Form.Item
                label={<span className="text-base font-medium text-gray-800">Ngày trong tuần</span>}
                required
                className="mb-6"
                validateStatus={errors.daysOfWeek ? 'error' : ''}
                help={errors.daysOfWeek?.message}
              >
                <Controller
                  name="daysOfWeek"
                  control={control}
                  rules={{ required: "Vui lòng chọn ít nhất một ngày" }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      mode="multiple"
                      placeholder="Chọn các ngày"
                      className="w-full rounded-lg"
                      optionLabelProp="label"
                      tagRender={(props) => (
                        <Tag
                          color="geekblue"
                          closable={props.closable}
                          onClose={props.onClose}
                          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm"
                        >
                          {daysOfWeekOptions.find(d => d.value === props.value)?.label}
                        </Tag>
                      )}
                      dropdownStyle={{ padding: '12px', borderRadius: '12px' }}
                    >
                      {daysOfWeekOptions.map(day => (
                        <Option key={day.value} value={day.value} label={day.label}>
                          <div className="flex items-center gap-3 p-3 hover:bg-green-50 rounded-lg transition-colors">
                            <CalendarOutlined className="text-green-600 text-lg" />
                            <span className="text-gray-700 font-medium">{day.label}</span>
                          </div>
                        </Option>
                      ))}
                    </Select>
                  )}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-base font-medium text-gray-800">Ngày bắt đầu</span>}
                required
                validateStatus={errors.startDate ? 'error' : ''}
                help={errors.startDate?.message}
              >
                <Controller
                  name="startDate"
                  control={control}
                  rules={{ required: "Vui lòng chọn ngày bắt đầu" }}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date?.format('YYYY-MM-DD'))}
                      format="DD/MM/YYYY"
                      className="w-full rounded-lg h-12"
                      placeholder="Chọn ngày bắt đầu"
                      suffixIcon={<CalendarOutlined className="text-gray-500 text-lg" />}
                      disabledDate={(current) => current < dayjs().startOf('day')}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-base font-medium text-gray-800">Ngày kết thúc</span>}
                required
                validateStatus={errors.endDate ? 'error' : ''}
                help={errors.endDate?.message}
              >
                <Controller
                  name="endDate"
                  control={control}
                  rules={{ required: "Vui lòng chọn ngày kết thúc" }}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value ? dayjs(field.value) : null}
                      onChange={(date) => field.onChange(date?.format('YYYY-MM-DD'))}
                      format="DD/MM/YYYY"
                      className="w-full rounded-lg h-12"
                      placeholder="Chọn ngày kết thúc"
                      suffixIcon={<CalendarOutlined className="text-gray-500 text-lg" />}
                      disabledDate={(current) => current < dayjs().startOf('day')}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-base font-medium text-gray-800">Giờ bắt đầu</span>}
                required
                validateStatus={errors.startTime ? 'error' : ''}
                help={errors.startTime?.message}
              >
                <Controller
                  name="startTime"
                  control={control}
                  rules={{ 
                    required: "Vui lòng chọn giờ bắt đầu",
                    pattern: {
                      value: /^([01]\d|2[0-3]):([0-5]\d)$/,
                      message: "Định dạng giờ không hợp lệ (HH:mm)"
                    }
                  }}
                  render={({ field }) => (
                    <TimePicker
                      value={field.value ? dayjs(field.value, 'HH:mm') : dayjs('08:00', 'HH:mm')}
                      onChange={(time) => field.onChange(time?.format('HH:mm'))}
                      format="HH:mm"
                      className="w-full rounded-lg h-12"
                      placeholder="Chọn giờ bắt đầu"
                      suffixIcon={<ClockCircleOutlined className="text-gray-500 text-lg" />}
                      minuteStep={15}
                      showNow={false}
                    />
                  )}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-base font-medium text-gray-800">Giờ kết thúc</span>}
                required
                validateStatus={errors.endTime ? 'error' : ''}
                help={errors.endTime?.message}
              >
                <Controller
                  name="endTime"
                  control={control}
                  rules={{ 
                    required: "Vui lòng chọn giờ kết thúc",
                    pattern: {
                      value: /^([01]\d|2[0-3]):([0-5]\d)$/,
                      message: "Định dạng giờ không hợp lệ (HH:mm)"
                    },
                    validate: value => {
                      const start = dayjs(getValues().startTime, 'HH:mm');
                      const end = dayjs(value, 'HH:mm');
                      return end.isAfter(start) || "Giờ kết thúc phải sau giờ bắt đầu";
                    }
                  }}
                  render={({ field }) => (
                    <TimePicker
                      value={field.value ? dayjs(field.value, 'HH:mm') : dayjs('20:00', 'HH:mm')}
                      onChange={(time) => field.onChange(time?.format('HH:mm'))}
                      format="HH:mm"
                      className="w-full rounded-lg h-12"
                      placeholder="Chọn giờ kết thúc"
                      suffixIcon={<ClockCircleOutlined className="text-gray-500 text-lg" />}
                      minuteStep={15}
                      showNow={false}
                    />
                  )}
                />
              </Form.Item>

              <div className="flex justify-center mt-10">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  className="h-14 px-12 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  style={{ background: '#16a34a', borderColor: '#16a34a' }}
                >
                  <CheckCircleOutlined className="text-xl" />
                  KIỂM TRA LỊCH
                </Button>
              </div>
            </div>
          </Form>
        </Spin>
      </Card>

      {scheduleResult && !selectedMode && (
        <div className="flex flex-col items-center gap-6 mt-10">
          <Button
            onClick={() => setSelectedMode('auto')}
            className="h-16 px-16 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all"
            style={{
              background: 'linear-gradient(to bottom, #16a34a, #4ade80)',
              border: '2px solid #15803d',
              color: 'white'
            }}
          >
            ĐẶT LỊCH CỐ ĐỊNH
          </Button>
          {/* <Button
            onClick={() => setSelectedMode('optimize')}
            className="h-16 px-16 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all"
            style={{
              background: 'linear-gradient(to bottom, #EBDB25FF, #F7FA60FF)',
              border: '2px solid #AFAA1EFF',
              color: '#333'
            }}
          >
            ĐẶT LỊCH TỐI ƯU
          </Button> */}
        </div>
      )}

      {scheduleResult && selectedMode && (
        <div className="grid grid-cols-1 gap-8 mt-10">
          {selectedMode === 'optimize' && (
            <Card
              title={
                <div className="flex items-center gap-3 text-red-600">
                  <CloseCircleOutlined className="text-2xl" />
                  <span className="font-bold text-xl">SÂN ĐÃ ĐƯỢC ĐẶT</span>
                </div>
              }
              className="rounded-xl border-none shadow-sm"
              headStyle={{
                backgroundColor: '#fff5f5',
                borderBottom: '2px solid #fee2e2',
                padding: '24px'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              {Object.entries(scheduleResult.invalidCourtSlots).map(([courtName, dates]) => (
                <div key={courtName} className="mb-8">
                  <h4 className="text-lg font-semibold mb-4 text-gray-800">{courtName}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {(dates as string[]).map(date => {
                      const availableCourts = scheduleResult.availableCourtSlots || [];

                      return (
                        <div key={date} className="flex flex-col gap-1">
                          <Tag
                            color="red"
                            className="py-2 rounded-lg text-center text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={availableCourts.length > 0 ? () => setSelectedDate(date) : undefined}
                          >
                            {dayjs(date).format('DD/MM/YYYY')}
                          </Tag>
                          <div className="text-xs text-gray-500 text-center">
                            Sân có sẵn: {availableCourts.join(', ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Card>
          )}

      <Card
        title={
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircleOutlined className="text-2xl" />
            <span className="font-bold text-xl">SÂN CÓ SẴN</span>
          </div>
        }
        className="rounded-xl border-none shadow-sm"
        headStyle={{
          backgroundColor: '#f0fdf4',
          borderBottom: '2px solid #dcfce7',
          padding: '24px'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <div className="grid grid-cols-2 gap-3">
          {scheduleResult.availableCourtSlots
            ?.map((court: string) => (
              <Tag
                color={selectedCourts.includes(court) || Object.values(flexibleCourts).includes(court) ? 'blue' : 'green'}
                key={court}
                onClick={() => handleCourtSelection(court)}
                className="py-2 rounded-lg text-center text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
              >
                {court}
              </Tag>
            ))}
        </div>
      </Card>

          <Card 
            title="THANH TOÁN"
            className="rounded-xl border-none shadow-sm mt-8"
            headStyle={{
              backgroundColor: '#f0fdf4',
              borderBottom: '2px solid #dcfce7',
              padding: '16px 24px',
              fontWeight: 600,
              color: '#166534'
            }}
            bodyStyle={{ 
              padding: '24px',
              textAlign: 'center'
            }}
          >
            <div className="text-lg font-semibold flex items-center justify-center gap-2">
              <span className="text-green-700">Tổng cộng:</span>
              {totalAmount > 0 ? (
                <span className="text-green-600 text-xl tracking-wide">
                  {totalAmount.toLocaleString('vi-VN')} VNĐ
                </span>
              ) : (
                <span className="text-gray-500 text-xl">
                  Vui lòng chọn sân để xem giá
                </span>
              )}
            </div>
          </Card>

          <div className="flex gap-4 justify-end">
            <Button
              onClick={() => setSelectedMode(undefined)}
              className="h-12 px-8 rounded-lg font-medium bg-gray-100 text-gray-700 border-none shadow-sm hover:bg-gray-200 transition-colors"
            >
              Quay lại
            </Button>
            <Button
              onClick={() => handleBooking(selectedMode)}
              className="h-12 px-8 rounded-lg font-medium bg-green-600 text-white border-none shadow-md hover:bg-green-700 transition-colors"
              disabled={
                (selectedMode === 'optimize' && Object.keys(flexibleCourts).length === 0) || 
                (selectedMode === 'auto' && selectedCourts.length === 0) ||
                totalAmount === 0
              }
            >
              Xác nhận đặt lịch
            </Button>
          </div>
        </div>
      )}

      <Modal
        title={<span className="text-lg font-semibold">Chọn sân thay thế cho ngày {dayjs(selectedDate).format('DD/MM/YYYY')}</span>}
        open={!!selectedDate}
        onCancel={() => setSelectedDate(undefined)}
        footer={null}
        centered
        bodyStyle={{ padding: '24px' }}
      >
        <div className="grid grid-cols-2 gap-4">
          {scheduleResult?.availableCourtSlots
            ?.filter((court: string) => !Object.values(flexibleCourts).includes(court))
            ?.map((court: string) => (
              <Button
                key={court}
                type={flexibleCourts[selectedDate!] === court ? 'primary' : 'default'}
                onClick={() => handleCourtSelection(court, selectedDate)}
                disabled={Object.values(flexibleCourts).includes(court) || scheduleResult.availableCourtSlots.length === 1}
                className="h-12 rounded-lg font-medium transition-all"
                style={{
                  background: flexibleCourts[selectedDate!] === court ? '#16a34a' : '#f8fafc',
                  borderColor: flexibleCourts[selectedDate!] === court ? '#16a34a' : '#e2e8f0'
                }}
              >
                {court}
              </Button>
            ))}
        </div>
      </Modal>
    </div>
  );
};

export default ScheduleAuto;
