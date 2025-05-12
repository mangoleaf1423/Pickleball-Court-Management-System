import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Modal, Spin } from 'antd';
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import QRCode from 'qrcode.react';
import { CURRENT_ENV } from '@/core/configs/env';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useApp } from '@/store';

const PaymentScheduleAuto: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { orderData, bookingDetails, information } = location.state || {};
    const { user } = useApp();
    
    const [countdown, setCountdown] = useState<number>(300); // 5 phút = 300 giây
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
    const [isTimeoutModalVisible, setIsTimeoutModalVisible] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [cancelSuccess, setCancelSuccess] = useState(false);
    
    useEffect(() => {
        if (!orderData) {
            toast.error('Không tìm thấy thông tin đơn hàng');
            navigate(-1);
            return;
        }

        // Kiểm tra trạng thái thanh toán khi trang được tải
        checkPaymentStatus();

        const ws = new WebSocket(`wss://picklecourt.id.vn/identity/ws/notifications?key=${orderData.orderId}`);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
            if (data.resCode === '200') {
                setPaymentStatus('success');
                localStorage.clear();
                history.replaceState({}, document.title);
                setPaymentSuccess(true);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('Disconnected from WebSocket server');
        };

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            ws.close();
        };
    }, [orderData]);

    const checkPaymentStatus = async () => {
        if (!orderData?.orderId) return;
        
        try {
            const response = await axios.get(`${CURRENT_ENV.API_URL}/identity/public/check-payment-status?orderId=${orderData.orderId}`);
            if (response.data && response.data.status === 'PAID') {
                setPaymentStatus('success');
                setPaymentSuccess(true);
            }
        } catch (error) {
            console.error('Lỗi khi kiểm tra trạng thái thanh toán:', error);
        }
    };

    const handleTimeout = () => {
        setPaymentStatus('failed');
        localStorage.clear();
        toast.error('Hết thời gian thanh toán. Vui lòng thực hiện đặt lịch lại');
        navigate(-1);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCancelOrder = async () => {
        try {
            setLoading(true);
            const response = await axios.put(`${CURRENT_ENV.API_URL}/identity/public/cancelOrder?orderId=${orderData.orderId}`);
            if (response.status === 200) {
                toast.success('Hủy đặt sân thành công');
                history.replaceState({}, document.title);
                setCancelSuccess(true);
            } else {
                toast.error('Có lỗi xảy ra khi hủy đặt sân');
            }
        } catch (error) {
            console.error('Error canceling order:', error);
            toast.error('Có lỗi xảy ra khi hủy đặt sân');
        } finally {
            setLoading(false);
        }
    };

    // Hiển thị màn hình hủy thành công
    if (cancelSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 text-white flex flex-col items-center justify-center p-4">
                <div className="bg-green-800 border-green-600 rounded-xl p-6 border max-w-md w-full text-center">
                    <h2 className="text-white text-xl font-bold mb-4">Hủy đặt sân thành công</h2>
                    <p className="text-emerald-200 mb-6">Bạn đã hủy đặt sân thành công!</p>
                    <div className="flex justify-center space-x-4">
                        <Button 
                            type="primary" 
                            onClick={() => navigate('/staff-order-service')}
                            style={{ 
                                backgroundColor: '#ca8a04',
                                border: 'none',
                                color: 'white',
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                        >
                            Xem lịch sử đặt sân
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Hiển thị màn hình thành công thay vì modal
    if (paymentSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 text-white flex flex-col items-center justify-center p-4">
                <div className="bg-green-800 border-green-600 rounded-xl p-6 border max-w-md w-full text-center">
                    <h2 className="text-white text-xl font-bold mb-4">Thanh toán thành công</h2>
                    <p className="text-emerald-200 mb-6">Thanh toán của bạn đã được xác nhận thành công!</p>
                    <div className="flex justify-center space-x-4">
                        <Button 
                            type="primary" 
                            onClick={() => navigate('/history')}
                            style={{ 
                                backgroundColor: '#ca8a04',
                                border: 'none',
                                color: 'white',
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                        >
                            Xem lịch sử đặt sân
                        </Button>
                        <Button 
                            type="primary" 
                            onClick={() => navigate('/')}
                            style={{ 
                                backgroundColor: '#047857',
                                border: 'none',
                                color: 'white',
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                            }}
                        >
                            Quay lại trang chủ
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 text-white">
            <div className="p-4 flex items-center bg-gradient-to-b from-green-900 to-green-800 border-b border-emerald-700">
                <Button
                    type="text"
                    onClick={() => navigate(-1)}
                    icon={<ArrowLeftOutlined className="text-xl text-white" />}
                    className="flex items-center justify-center"
                />
                <h1 className="text-white text-xl font-bold ml-2 mb-0">Thanh toán lịch cố định</h1>
            </div>

            <Spin spinning={loading} tip="Đang xử lý...">
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-800 border-green-600 rounded-xl p-6 border">
                        <div className="space-y-3">

                            <div className="bg-emerald-700 p-4 rounded-lg mt-4">
                                <p className="text-emerald-100 font-semibold mb-2">
                                    Vui lòng chuyển khoản số tiền {orderData?.amount?.toLocaleString()} ₫
                                </p>
                                <p className="text-emerald-200 text-sm">
                                    Nội dung chuyển khoản: <span className="font-bold text-yellow-300">#{orderData?.orderId}</span>
                                </p>
                                <p className="text-emerald-200 text-sm">
                                    Sau khi thanh toán thành công, bạn sẽ được chuyển đến trang xác nhận
                                </p>

                                <hr className="border-emerald-600 my-4" />

                                <div className="text-center">
                                    <p className="text-emerald-200 mb-2">Thời gian thanh toán còn lại</p>
                                    <div className="inline-block relative">
                                        <div className="w-24 h-24 rounded-full border-4 border-green-600 flex items-center justify-center">
                                            <span className={`text-lg font-semibold ${countdown <= 60 ? 'text-red-400' : 'text-emerald-100'}`}>
                                                {formatTime(countdown)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 text-center">
                                <p className={`text-lg font-bold ${paymentStatus === 'pending' ? 'text-yellow-300' :
                                        paymentStatus === 'success' ? 'text-green-400' :
                                            'text-red-400'
                                    }`}>
                                    {paymentStatus === 'pending' && 'Đang chờ xác nhận thanh toán...'}
                                    {paymentStatus === 'success' && 'Thanh toán thành công'}
                                    {paymentStatus === 'failed' && 'Thanh toán thất bại'}
                                </p>

                                <Button
                                    danger
                                    type="primary"
                                    onClick={handleCancelOrder}
                                    className="mt-4"
                                    disabled={loading || paymentStatus === 'success'}
                                >
                                    Hủy đặt sân
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-800 border-green-600 rounded-xl p-6 border">
                        <h2 className="text-white text-lg font-bold mb-4">Thông tin đơn hàng</h2>
                        <div className="text-center mb-6">
                            <QRCode
                                value={orderData?.qrCode || `${orderData?.orderId}-${orderData?.amount}`}
                                size={300}
                                level="H"
                                className="rounded-lg mx-auto"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-emerald-200">Tên:</span>
                                <span className="text-emerald-100">{information?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-emerald-200">SĐT:</span>
                                <span className="text-emerald-100">{information?.phone}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-emerald-200">Mã đơn:</span>
                                <span className="text-emerald-100">#{orderData?.orderId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-emerald-200">Thời gian đặt:</span>
                                <span className="text-emerald-100">
                                    {new Date(bookingDetails?.startDate).toLocaleDateString()} -{' '}
                                    {bookingDetails?.startTime} đến {bookingDetails?.endTime}
                                </span>
                            </div>
                            <hr className="border-emerald-600 my-4" />
                            <div className="flex justify-between">
                                <span className="text-emerald-200">Tổng tiền:</span>
                                <span className="text-amber-400 font-bold">{orderData?.amount?.toLocaleString()} ₫</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Spin>
        </div>
    );
};

export default PaymentScheduleAuto;
