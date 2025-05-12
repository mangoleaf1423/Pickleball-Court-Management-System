import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, Spin, Typography, Tag, Divider, Button, Form, Input, Checkbox, Modal } from 'antd';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CheckCircleOutlined, CloseCircleOutlined, ArrowLeftOutlined, CalendarOutlined } from '@ant-design/icons';
import { ArrowLeft, Phone, User } from 'lucide-react';
import { useApp } from '@/store';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface OrderData {
  orderId: string;
  amount: number;
  paymentUrl: string;
  qrCode: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
}

const CheckoutScheduleAuto: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isTermsVisible, setIsTermsVisible] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const { user } = useApp();
  const [form] = Form.useForm();

  const { bookingData } = location.state || {};

  useEffect(() => {
    if (!bookingData) {
      setError('Thiếu thông tin đặt lịch');
    }
    
    // Tự động điền thông tin nếu người dùng đã đăng nhập
    if (user?.result?.user) {
      form.setFieldsValue({
        customerName: `${user.result.user.firstName || ''} ${user.result.user.lastName || ''}`.trim(),
        phoneNumber: user.result.user.phoneNumber || ''
      });
    }
  }, [bookingData, user, form]);

  const handleConfirmPayment = async () => {
    if (!bookingData) {
      setError('Thiếu thông tin đặt lịch');
      return;
    }

    if (!isAgreed) {
      toast.error('Vui lòng đồng ý với điều khoản và điều kiện');
      return;
    }

    try {
      const values = await form.validateFields();
      setLoading(true);

      if (!user) {
        localStorage.setItem('userPhone', values.phoneNumber);
      }
      
      const response = await axios.post('https://picklecourt.id.vn/api/identity/public/order-fixed', {
        ...values,
        courtId: bookingData.courtId,
        userId: user?.result?.user?.id || null,
        paymentStatus: "Chưa thanh toán",
        orderType: "Đơn cố định",
        startDate: bookingData.startDate,
        endDate: bookingData.endDate,
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        selectedDays: bookingData.selectedDays,
        selectedCourtSlots: bookingData.selectedCourtSlots,
        flexibleCourtSlotFixes: bookingData.flexibleCourtSlotFixes
      });
      console.log(response.data);

      
      if (response.data) {
        navigate('/payment-schedule-auto', {
          state: {
            orderData: {
              orderId: response.data.id,
              amount: response.data.paymentAmount,
              paymentUrl: response.data.paymentUrl,
              qrCode: response.data.qrcode,
              status: 'PENDING'
            },
            bookingDetails: bookingData,
            information: {
              name: values.customerName,
              phone: values.phoneNumber,
              note: values.note
            }
          }
        });
      }
    } catch (err: any) {
      toast.error('Lỗi khi tạo đơn hàng: ' + (err.response?.data?.message || err.message));
      setError('Không thể tạo đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-400 text-gray-100">
        <header className="sticky top-0 bg-gradient-to-b from-green-900 to-green-800 z-10 p-4">
          <Button
            type="text"
            onClick={() => navigate(-1)}
            icon={<ArrowLeft className="text-white" />}
          />
        </header>
        <div className="flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-green-800 border-green-700">
            <div className="text-center py-8">
              <CloseCircleOutlined className="text-red-500 text-4xl mb-4" />
              <Title level={3} className="text-white">{error}</Title>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-400 text-gray-100">
      <header className="sticky top-0 bg-gradient-to-b from-green-900 to-green-800 z-10 p-4">
        <Button
          type="text"
          onClick={() => navigate(-1)}
          icon={<ArrowLeftOutlined className="text-xl text-white" />}
        />
        <h1 className="text-center text-2xl font-bold text-white">Đặt lịch cố định</h1>
      </header>

      <main className="p-4 max-w-screen-2xl mx-auto pb-32">
        <Spin spinning={loading}>
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">Thông tin đặt lịch cố định</h2>
            <div className="bg-green-800 p-6 rounded-xl space-y-3 shadow-lg">
              <p className="text-green-100">Tên sân: <span className="text-yellow-300 font-medium">{bookingData?.courtName}</span></p>
              <p className="text-green-100">Địa chỉ: <span className="text-yellow-300 font-medium">Hòa Lạc</span></p>
              <p className="text-green-100">Ngày bắt đầu: <span className="text-yellow-300 font-medium">{bookingData?.startDate}</span></p>
              <p className="text-green-100">Ngày kết thúc: <span className="text-yellow-300 font-medium">{bookingData?.endDate}</span></p>
              <p className="text-green-100">Thời gian: <span className="text-yellow-300 font-medium">{bookingData?.startTime} - {bookingData?.endTime}</span></p>
              <p className="text-green-100">Các ngày trong tuần: <span className="text-yellow-300 font-medium">{bookingData?.selectedDays?.split(',').map((day: string) => {
                switch(day) {
                  case 'MONDAY': return 'Thứ 2';
                  case 'TUESDAY': return 'Thứ 3';
                  case 'WEDNESDAY': return 'Thứ 4';
                  case 'THURSDAY': return 'Thứ 5';
                  case 'FRIDAY': return 'Thứ 6';
                  case 'SATURDAY': return 'Thứ 7';
                  case 'SUNDAY': return 'Chủ nhật';
                  default: return day;
                }
              }).join(', ')}</span></p>
              
              <div className="text-green-100 mt-4">
                <p className="font-semibold mb-2">Sân được chọn:</p>
                <div className="ml-4 flex flex-wrap gap-2">
                  {bookingData?.selectedCourtSlots?.map((court: string, index: number) => (
                    <Tag key={index} color="green" className="text-sm py-1 px-2">
                      {court}
                    </Tag>
                  ))}
                  {(!bookingData?.selectedCourtSlots || bookingData?.selectedCourtSlots.length === 0) && (
                    <span className="text-green-200">Không có</span>
                  )}
                </div>
              </div>
              
              <div className="text-green-100 space-y-2 mt-4">
                <p className="font-semibold">Sân được thay thế:</p>
                <div className="ml-4">
                  {bookingData?.flexibleCourtSlotFixes && Object.keys(bookingData.flexibleCourtSlotFixes).length > 0 ? (
                    Object.entries(bookingData.flexibleCourtSlotFixes).map(([date, court]) => (
                      <div key={date} className="flex items-center mb-2">
                        <CalendarOutlined className="text-green-400 mr-2" />
                        <span className="text-green-200">{dayjs(date).format('DD/MM/YYYY')}:</span>
                        <Tag color="orange" className="ml-2">
                          {court as string}
                        </Tag>
                      </div>
                    ))
                  ) : (
                    <span className="text-green-200">Không có</span>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-green-700">
                <span className="text-green-200 font-medium">Tổng thanh toán:</span>
                <span className="text-yellow-400 text-xl font-bold">
                  {(bookingData?.totalAmount || 0).toLocaleString()} ₫
                </span>
              </div>
            </div>
          </section>

          <Form
            form={form}
            layout="vertical"
            className="space-y-6"
          >
            <section>
              <h2 className="text-xl font-bold text-white mb-3">TÊN CỦA BẠN</h2>
              <Form.Item 
                name="customerName" 
                rules={[
                  { required: true, message: 'Vui lòng nhập tên' },
                  { 
                    min: 2, 
                    message: 'Tên phải có ít nhất 2 ký tự' 
                  },
                  {
                    pattern: /^[^\d!@#$%^&*()_+={}\[\]|\\:;"'<>,.?/~`-]*$/,
                    message: 'Tên không được chứa ký tự đặc biệt hoặc số'
                  }
                ]}
              >
                <Input
                  prefix={<User className="text-green-500 mr-2" />}
                  placeholder="Nhập tên"
                  className="h-12 bg-green-800 border-green-600 rounded-xl text-green-100 placeholder-green-400 hover:border-yellow-400 focus:border-yellow-400 focus:shadow-lg"
                />
              </Form.Item>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">SỐ ĐIỆN THOẠI</h2>
              <Form.Item 
                name="phoneNumber" 
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại' },
                  {
                    pattern: /^(0|\+84)\d{9,10}$/,
                    message: 'Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)'
                  }
                ]}
              >
                <Input
                  prefix={<Phone className="text-green-500 mr-2" />}
                  placeholder="Nhập số điện thoại"
                  className="h-12 bg-green-800 border-green-600 rounded-xl text-green-100 placeholder-green-400 hover:border-yellow-400 focus:border-yellow-400 focus:shadow-lg"
                />
              </Form.Item>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">GHI CHÚ CHO CHỦ SÂN</h2>
              <Form.Item name="note">
                <Input.TextArea
                  rows={4}
                  placeholder="Nhập ghi chú"
                  className="bg-green-800 border-green-600 rounded-xl text-green-100 placeholder-green-400 hover:border-yellow-400 focus:border-yellow-400 focus:shadow-lg"
                />
              </Form.Item>
            </section>

            <section className="pt-6">
              <div className="flex items-center bg-green-800/50 p-4 rounded-xl">
                <Checkbox
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="mr-4 [&>.ant-checkbox-inner]:bg-green-800 [&>.ant-checkbox-inner]:border-green-500 hover:[&>.ant-checkbox-inner]:border-yellow-400"
                />
                <div>
                  <span className="text-green-100 pl-2">
                    Tôi đã đọc và đồng ý với{' '}
                    <Button
                      type="link"
                      onClick={() => setIsTermsVisible(true)}
                      style={{ fontSize: '14px', padding: '0px', color: 'yellow', fontWeight: 'bold' }}
                    >
                      điều khoản và điều kiện
                    </Button>
                  </span>
                </div>
              </div>
            </section>
          </Form>
        </Spin>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-b from-green-400 to-green-800 backdrop-blur-sm p-4 border-t border-green-700 shadow-2xl">
        <div className="max-w-screen-2xl mx-auto">
          <Button
            size="large"
            block
            style={{
              height: '56px',
              fontSize: '18px',
              fontWeight: 'bold',
              borderRadius: '12px',
              transition: 'all 0.3s',
              ...(isAgreed ? {
                background: 'linear-gradient(to right, #f59e0b, #fbbf24)',
                color: '#FFFFFFFF',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                ':hover': {
                  background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }
              } : {
                background: 'rgba(22, 101, 52, 0.5)',
                color: 'rgba(220, 252, 231, 0.5)',
                cursor: 'not-allowed',
                border: 'none'
              })
            }}
            disabled={!isAgreed}
            onClick={handleConfirmPayment}
          >
            XÁC NHẬN & CHUYỂN ĐẾN THANH TOÁN
          </Button>
        </div>
      </div>

      <Modal
        title={<span className="text-2xl font-bold text-green-900">Điều khoản và điều kiện</span>}
        open={isTermsVisible}
        onCancel={() => setIsTermsVisible(false)}
        footer={[
          <Button
            key="submit"
            type="primary"
            onClick={() => setIsTermsVisible(false)}
            className="bg-yellow-400 text-green-900 font-semibold hover:bg-yellow-500 border-none"
          >
            Đã hiểu
          </Button>,
        ]}
        centered
        bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
      >
        <div className="space-y-4 text-gray-700">
          <p>1. Điều khoản về thanh toán và hoàn tiền...</p>
          <p>2. Điều khoản về trách nhiệm của người dùng...</p>
          <p>3. Điều khoản về việc hủy lịch và thay đổi thông tin...</p>
          <p>4. Điều khoản về bảo mật thông tin cá nhân...</p>
          <p>5. Điều khoản về quyền lợi và nghĩa vụ của các bên...</p>
        </div>
      </Modal>
    </div>
  );
};

export default CheckoutScheduleAuto;
