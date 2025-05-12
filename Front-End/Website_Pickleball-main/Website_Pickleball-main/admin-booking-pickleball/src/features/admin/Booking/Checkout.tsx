import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Checkbox, Form, Spin } from 'antd';
import { CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import PathURL from '@/core/class/PathURL';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import axios from 'axios';
import { CURRENT_ENV } from '@/core/configs/env';
import { useApp } from '@/store';
import { toast } from 'react-toastify';

import { Phone } from 'lucide-react';
import { User } from 'lucide-react';

interface BookingSlot {
  courtSlotId: string;
  courtSlotName?: string;
  startTime: string;
  endTime: string;
  price: number;
}

interface OrderDetail {
  bookingDate: string;
  bookingSlots: BookingSlot[];
}

interface OrderPayload {
  courtId: string;
  courtName?: string;
  address?: string;
  userId: number | null;
  customerName: string;
  phoneNumber: string;
  totalAmount: number;
  discountCode: string | null;
  note: string | null;
  discountAmount: number;
  paymentAmount: number;
  paymentStatus: string;
  depositAmount: number;
  orderType: null;
  signature: string;
  orderDetails?: OrderDetail[];
}

const Checkout: React.FC = () => {
  const [form] = Form.useForm();
  const [isTermsVisible, setIsTermsVisible] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const {
    selectedTimeSlots,
    orderDetails,
    selectedUserType,
    totalPrice,
    id,
    paymentMethod,
    depositAmount,
    orderId,
    existingOrder,
    paymentAmount
  } = location.state;

  console.log(paymentAmount)
  const navigate = useNavigate();
  const { user } = useApp();
  const [amountToPay, setAmountToPay] = useState(paymentMethod === 'deposit' ? paymentAmount : paymentAmount);

  console.log(orderDetails, selectedTimeSlots);

  const showTerms = () => setIsTermsVisible(true);
  const handleTermsOk = () => setIsTermsVisible(false);
  const handleTermsCancel = () => setIsTermsVisible(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!user) {
        localStorage.setItem('userPhone', values.phone);
      }

      const signatureResponse = await axios.get(`${CURRENT_ENV.API_URL}/identity/public/getSignature`, {
        params: {
          totalAmount: totalPrice,
          paymentAmount: amountToPay,
          depositAmount: depositAmount,
          bookingDate: values.phone
        }
      });
      console.log(orderDetails)
      const payload: OrderPayload = {
        courtId: id,
        userId: user?.result?.user?.id ?? null,
        customerName: values.name,
        phoneNumber: values.phone,
        totalAmount: totalPrice,
        discountCode: null,
        note: values.note || null,
        discountAmount: 0,
        paymentAmount: amountToPay,
        paymentStatus: amountToPay === 0 ? "Đã thanh toán" : (paymentMethod === 'deposit' ? "Chưa đặt cọc" : "Chưa thanh toán"),
        depositAmount: depositAmount,
        orderType: null,
        signature: signatureResponse.data,
        orderDetails: orderDetails.map((detail: any) => ({
          bookingDate: detail.bookingDate,
          bookingSlots: detail.bookingSlots.map((slot: any) => ({
            courtSlotId: slot.courtSlotId,
            startTime: slot.startTime,
            endTime: slot.endTime,
            price: slot.price
          }))
        }))
      };



      let orderResponse;
      const endpoint = orderId
        ? `${CURRENT_ENV.API_URL}/identity/public/change_order?orderId=${orderId}`
        : `${CURRENT_ENV.API_URL}/identity/public/create_order`;

      try {
        orderResponse = await axios.post(endpoint, payload);
        if (orderResponse.data) {
          navigate(`/payment`, {
            state: {
              qrCode: orderResponse.data.qrcode,
              depositAmount: depositAmount,
              countdown: 360,
              orderId: orderId || orderResponse.data.id,
              customerName: values.name,
              phoneNumber: values.phone,
              paymentMethod: paymentMethod,
              totalAmount: totalPrice,
              paymentAmount: amountToPay,
              depositPrice: depositAmount
            }
          });
        }
      } catch (error) {
        toast.error(orderId ? 'Lỗi khi cập nhật đơn hàng' : 'Lỗi khi tạo đơn hàng mới');
        throw error;
      }

    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-400 text-gray-100">
      {/* Header Section */}
      <header className="sticky top-0 bg-gradient-to-b from-green-900 to-green-800 z-10">
        <div className="p-4 flex items-center">
          <Button
            type="text"
            onClick={() => navigate(-1)}
            icon={<ArrowLeftOutlined className="text-xl text-white" />}
            className="flex items-center justify-center"
          />
          <h1 className="text-center text-2xl font-bold text-white flex-grow">
            Đặt lịch hàng ngày
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 max-w-screen-2xl mx-auto pb-32">
        <Spin spinning={loading}>
          {/* Booking Information */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4">{orderId ? "Thông tin thay đổi đặt lịch" : "Thông tin đặt lịch"}</h2>
            <div className="bg-green-800 p-6 rounded-xl space-y-3 shadow-lg">
              <p className="text-green-100">Tên sân: <span className="text-yellow-300 font-medium">{location.state.courtName}</span></p>
              <p className="text-green-100">Địa chỉ: <span className="text-yellow-300 font-medium">Hòa Lạc</span></p>
              {orderDetails.map((detail: any, index: number) => (
                <div key={index} className="space-y-2">
                  <p className="text-green-100">Ngày đặt: <span className="text-yellow-300 font-medium">{detail.bookingDate}</span></p>
                  {detail.bookingSlots?.map((slot: any, slotIndex: number) => (
                    <div key={slotIndex} className="flex justify-between items-center">
                      <span className="text-green-200">{slot.courtSlotName}: {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}</span>
                      <span className="font-semibold text-yellow-400">
                        {slot.price.toLocaleString()} ₫
                      </span>
                    </div>
                  ))}
                </div>
              ))}
              <p className="text-green-100">Đối tượng: <span className="text-yellow-300 font-medium">{
                selectedUserType === 'student' ? 'Học sinh - sinh viên' :
                  selectedUserType === 'regular' ? 'Khách thường xuyên' :
                    'Khách hàng ngày'
              }</span></p>
              <div className="flex justify-between items-center pt-3 border-t border-green-700">
                <span className="font-medium text-green-200">Tổng tiền:</span>
                <span className="text-xl font-bold text-yellow-400">{totalPrice.toLocaleString()} ₫</span>
              </div>

              {/* Thêm phần hiển thị tiền cọc và thanh toán */}
              {paymentMethod === 'deposit' ? (
                <>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-200">Tiền cọc:</span>
                    <span className="text-yellow-400">
                      {depositAmount?.toLocaleString()} ₫
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-200">{amountToPay < 0 ? 'Số tiền hoàn:' : 'Số tiền thanh toán:'}</span>
                    <span className="text-yellow-400">
                      {Math.abs(amountToPay).toLocaleString()} ₫
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-green-200">{amountToPay < 0 ? 'Số tiền hoàn:' : 'Số tiền thanh toán:'}</span>
                  <span className="text-yellow-400">
                    {Math.abs(amountToPay).toLocaleString()} ₫
                  </span>
                </div>
              )}
            </div>
          </section>
          {/* User Information Section */}
          <Form
            form={form}
            layout="vertical"
            className="space-y-6 mt-4"
            initialValues={{
              name: existingOrder?.customerName || `${user?.result?.user?.firstName || ''} ${user?.result?.user?.lastName || ''}`.trim(),
              phone: existingOrder?.phoneNumber || user?.result?.user?.phoneNumber || ''
            }}
          >
            {/* Name Section */}
            <section>
              <h2 className="text-xl font-bold text-white mb-3">TÊN CỦA BẠN</h2>
              <Form.Item 
                name="name" 
                rules={[
                  { required: true, message: 'Vui lòng nhập tên' },
                  { min: 2, message: 'Tên phải có ít nhất 2 ký tự' },
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

            {/* Phone Number */}
            <section>
              <h2 className="text-xl font-bold text-white mb-3">SỐ ĐIỆN THOẠI</h2>
              <Form.Item 
                name="phone" 
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

            {/* Notes Section */}
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

            {/* Terms and Conditions */}
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
                      onClick={showTerms}
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
        {/* Payment Button */}
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
              onClick={handleSubmit}
            >
              XÁC NHẬN & THANH TOÁN
            </Button>
          </div>
        </div>
      </main>

      {/* Terms Modal */}
      <Modal
        title={<span className="text-2xl font-bold text-green-900">Điều khoản và điều kiện</span>}
        open={isTermsVisible}
        onOk={handleTermsOk}
        onCancel={handleTermsCancel}
        footer={[
          <Button
            key="submit"
            type="primary"
            onClick={handleTermsOk}
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

export default Checkout;