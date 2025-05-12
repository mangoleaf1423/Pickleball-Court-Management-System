import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Upload, Modal } from 'antd';
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import QRCode from 'qrcode.react';
import { CURRENT_ENV } from '@/core/configs/env';
import { toast } from 'react-toastify';
import axios from 'axios';

const PaymentScreen: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Kiểm tra nếu location.state không tồn tại, hiển thị màn hình thông báo
    if (!location.state) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 text-white flex flex-col items-center justify-center p-4">
                <div className="bg-green-800 border-green-600 rounded-xl p-6 border max-w-md w-full text-center">
                    <h2 className="text-white text-xl font-bold mb-4">Không tìm thấy thông tin thanh toán</h2>
                    <p className="text-emerald-200 mb-6">Vui lòng quay lại trang chọn sân để tiếp tục.</p>
                    <Button 
                        type="primary" 
                        onClick={() => navigate('/')}
                        style={{ 
                            backgroundColor: '#ca8a04',
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
        );
    }

    const { qrCode, orderId, customerName, phoneNumber, totalAmount, depositAmount, paymentMethod, paymentAmount } = location.state;
    const isRefund = paymentAmount < 0;
    const isNoPayment = paymentAmount === 0;

    const [countdown, setCountdown] = useState<number>(300); // 5 phút
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [currentDateTime, setCurrentDateTime] = useState<string>('');
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        // Định dạng thời gian hiện tại
        const now = new Date();
        const formattedDate = now.toLocaleDateString('vi-VN');
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const formattedTime = `${hours}h${minutes < 10 ? '0' + minutes : minutes}`;
        const nextHour = `${(hours + 1)}h${minutes < 10 ? '0' + minutes : minutes}`;
        setCurrentDateTime(`${formattedDate} - ${formattedTime}-${nextHour}`);

        // Chỉ kết nối WebSocket nếu không phải trường hợp hoàn tiền hoặc không cần thanh toán
        if (!isRefund && !isNoPayment) {
            const ws = new WebSocket(`wss://picklecourt.id.vn/identity/ws/notifications?key=${orderId}`);

            ws.onopen = () => {
                console.log('Connected to WebSocket server');
            };

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log(data);
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
        } else {
            // Nếu là trường hợp hoàn tiền hoặc không cần thanh toán, không cần đếm ngược
            setPaymentStatus('success');
        }
    }, [isRefund, isNoPayment, orderId]);

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

    const handleCancel = () => setPreviewOpen(false);

    const handleCancelOrder = async () => {
        try {
            const response = await axios.put(`${CURRENT_ENV.API_URL}/identity/public/cancelOrder?orderId=${orderId}`);
            if (response.status === 200) {
                toast.success('Hủy đặt sân thành công');
                history.replaceState({}, document.title);
                navigate("/history");
            } else {
                toast.error('Có lỗi xảy ra khi hủy đặt sân');
            }
        } catch (error) {
            console.error('Error canceling order:', error);
            toast.error('Có lỗi xảy ra khi hủy đặt sân');
        }
    };

    const handleViewHistory = () => {
        history.replaceState({}, document.title);
        navigate('/history');
    };

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

    // Hiển thị màn hình thông báo khi paymentAmount là số âm (hoàn tiền) hoặc bằng 0 (không cần thanh toán)
    if (isRefund || isNoPayment) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 text-white">
                {/* Header */}
                <div className="p-4 flex items-center bg-gradient-to-b from-green-900 to-green-800 border-b border-emerald-700">
                    <Button
                        type="text"
                        onClick={() => navigate(-1)}
                        icon={<ArrowLeftOutlined className="text-xl text-white" />}
                        className="flex items-center justify-center"
                    />
                    <h1 className="text-white text-xl font-bold ml-2 mb-0">Thay đổi lịch thành công</h1>
                </div>

                <div className="p-4 flex flex-col items-center justify-center">
                    <div className="bg-green-800 border-green-600 rounded-xl p-6 border max-w-md w-full">
                        <h2 className="text-white text-xl font-bold mb-4 text-center">Quý khách đã thay đổi lịch thành công</h2>
                        {isRefund && (
                            <p className="text-emerald-200 mb-6 text-center">Vui lòng đợi để tiền có thể hoàn lại vào tài khoản của quý khách.</p>
                        )}
                        
                        <div className="space-y-3 bg-emerald-700 p-4 rounded-lg">
                            <div className="flex justify-between">
                                <span className="text-emerald-200">Tên:</span>
                                <span className="text-emerald-100">{customerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-emerald-200">SĐT:</span>
                                <span className="text-emerald-100">{phoneNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-emerald-200">Mã đơn:</span>
                                <span className="text-emerald-100">#{orderId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-emerald-200">Thời gian:</span>
                                <span className="text-emerald-100">{currentDateTime}</span>
                            </div>
                            {isRefund && (
                                <>
                                    <hr className="border-emerald-600 my-4" />
                                    <div className="flex justify-between">
                                        <span className="text-emerald-200">Số tiền hoàn lại:</span>
                                        <span className="text-amber-400 font-bold">{Math.abs(paymentAmount).toLocaleString()} ₫</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-6 flex justify-center space-x-4">
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
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-600 text-white">
            {/* Header */}
            <div className="p-4 flex items-center bg-gradient-to-b from-green-900 to-green-800 border-b border-emerald-700">
                <Button
                    type="text"
                    onClick={() => navigate(-1)}
                    icon={<ArrowLeftOutlined className="text-xl text-white" />}
                    className="flex items-center justify-center"
                />
                <h1 className="text-white text-xl font-bold ml-2 mb-0">Thanh toán</h1>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Panel */}
                <div className="bg-green-800 border-green-600 rounded-xl p-6 border ">
                    <h2 className="text-white text-lg font-bold mb-4">Thông tin thanh toán</h2>

                    <div className="space-y-3">
                        <div className="bg-emerald-700 p-4 rounded-lg mt-4">
                            <p className="text-emerald-100 font-semibold mb-2">
                                {paymentMethod !== "full" ? `Vui lòng chuyển khoản cọc ${depositAmount.toLocaleString()} ₫` : `Vui lòng chuyển khoản số tiền ${paymentAmount.toLocaleString()} ₫`}
                            </p>
                            <p className="text-yellow-300 text-sm font-bold">
                                Lưu ý: Vui lòng chuyển tiền cọc trước để xác nhận đặt sân
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
                            >
                                Hủy đặt sân
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleViewHistory}
                                style={{ 
                                    marginLeft: '8px',
                                    backgroundColor: '#ca8a04',
                                    border: 'none',
                                    color: 'white',
                                    fontWeight: 600,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}
                            >
                                Xem lịch sử
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="bg-green-800 border-green-600 rounded-xl p-6 border ">
                    <h2 className="text-white text-lg font-bold mb-4">Thông tin đơn hàng</h2>

                    <div className="text-center mb-6">
                        <QRCode
                            value={qrCode}
                            size={300}
                            level="H"
                            className="rounded-lg mx-auto"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-emerald-200">Tên:</span>
                            <span className="text-emerald-100">{customerName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-emerald-200">SĐT:</span>
                            <span className="text-emerald-100">{phoneNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-emerald-200">Mã đơn:</span>
                            <span className="text-emerald-100">#{orderId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-emerald-200">Thời gian:</span>
                            <span className="text-emerald-100">{currentDateTime}</span>
                        </div>
                        <hr className="border-emerald-600 my-4" />
                        <div className="flex justify-between">
                            <span className="text-emerald-200">Tổng tiền:</span>
                            <span className="text-amber-400 font-bold">{totalAmount ? totalAmount.toLocaleString() : depositAmount.toLocaleString()} ₫</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentScreen;