import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Pagination, Skeleton, Modal, Button, Descriptions, Tag, QRCode, Spin } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import { useApp } from '@/store';
import { EnvironmentOutlined } from '@ant-design/icons';
import { CURRENT_ENV } from '@/core/configs/env';
import { toast } from 'react-toastify';

interface OrderDetail {
  courtSlotName: string;
  startTime: string;
  endTime: string;
  bookingDates: string[];
}

interface ServiceDetail {
  courtServiceId: string;
  courtServiceName: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  courtId: string;
  courtName: string;
  address: string;
  userId: string | null;
  customerName: string;
  phoneNumber: string;
  note: string | null;
  orderType: string;
  orderStatus: string;
  paymentStatus: string;
  discountCode: string | null;
  totalAmount: number;
  discountAmount: number | null;
  paymentAmount: number | null;
  depositAmount: number | null;
  amountPaid: number | null;
  amountRefund: number | null;
  paymentTimeout: string | null;
  orderDetails: OrderDetail[];
  serviceDetails: ServiceDetail[];
  qrcode: string | null;
  createdAt: string;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  status: 'read' | 'unread';
  createAt: string;
  notificationData: any;
}

const Notification: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Order | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const pageSize = 10;
  const { user } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const key = user?.result?.user?.id || localStorage.getItem('userPhone');

      const response = await axios.get(
            `${process.env.REACT_APP_BASE_URL_SERVICE}/identity/public/notification/getNotifications?value=${key}`
        );

        
      setNotifications(response.data.notifications.map((n: any) => ({
        ...n,
        status: n.status.toLowerCase()
      })));
      setTotalItems(response.data.totalCount);
      setError('');
    } catch (err) {
      setError('Không thể tải thông báo. Vui lòng thử lại sau.');
      console.error('Lỗi tải thông báo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('HH:mm DD/MM/YYYY');
  };

  const fetchOrderDetail = async (orderId: string) => {
    try {
      setLoadingDetail(true);
      const response = await axios.get(`${CURRENT_ENV.API_URL}/identity/public/getOrderById`, {
        params: { orderId }
      });
      setSelectedBooking(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await axios.put(`${CURRENT_ENV.API_URL}/identity/public/cancelOrder?orderId=${orderId}`);
      if (response.status === 200) {
        toast.success('Hủy đặt sân thành công');
        navigate("/history");
      } else {
        toast.error('Có lỗi xảy ra khi hủy đặt sân');
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      toast.error('Có lỗi xảy ra khi hủy đặt sân');
    }
  };

  const isWithin24Hours = (createdAt: string) => {
    const orderDate = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - orderDate.getTime();
    return diff <= 24 * 60 * 60 * 1000;
  };

  const handleChangeOrder = async (orderId: string) => {
    const order = selectedBooking;
    if (order?.orderStatus === 'Đặt lịch thành công' && !isWithin24Hours(order.createdAt)) {
      alert('Đã quá thời hạn 1 ngày để đổi lịch');
      return;
    }
    
    // Xóa dữ liệu cũ trong localStorage
    localStorage.removeItem('selectedDate');
    localStorage.removeItem('selectedTimeSlots');
    localStorage.removeItem('selectedCourts');
    localStorage.removeItem('selectedUserType');
    localStorage.removeItem('paymentMethod');
    
    navigate(`/change-order/${order?.courtId}/order/${order?.id}`);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.notificationData?.orderId) {
      fetchOrderDetail(notification.notificationData.orderId);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg mx-4 my-6">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thông báo của bạn</h1>
      
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <>
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg transition-colors cursor-pointer ${
                  notification.status === 'unread' 
                    ? 'bg-green-50 border-green-200 hover:bg-green-100'  // Đổi màu xanh lá cho thông báo chưa đọc
                    : 'bg-gray-50/50 border-gray-200/50 hover:bg-gray-100' // Làm mờ màu xám cho thông báo đã đọc
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      {notification.status === 'unread' && (
                        <Badge color="red" /> 
                      )}
                      {notification.title}
                    </h3>
                    <p className={`mt-1 ${
                      notification.status === 'unread' 
                        ? 'text-gray-700 font-medium'  // Chữ đậm hơn cho chưa đọc
                        : 'text-gray-500' // Chữ nhạt màu hơn khi đã đọc
                    }`}>
                      {notification.description}
                    </p>
                    {notification.notificationData?.orderId && (
                      <p className="text-sm text-gray-400 mt-2">
                        Mã đơn: {notification.notificationData.orderId}
                      </p>
                    )}
                  </div>
                  <span className={`text-sm ${
                    notification.status === 'unread'
                      ? 'text-gray-600' // Màu thời gian đậm hơn cho chưa đọc
                      : 'text-gray-400' // Màu thời gian nhạt hơn cho đã đọc
                  } whitespace-nowrap`}>
                    {formatDate(notification.createAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {totalItems > 0 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalItems}
                onChange={handlePageChange}
                showSizeChanger={false}
                className="ant-pagination-custom"
              />
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Không có thông báo nào
            </div>
          )}
        </>
      )}

      <Modal
        open={selectedBooking !== null}
        onCancel={() => setSelectedBooking(null)}
        footer={null}
        width={800}
        title={
          <div className="text-xl font-semibold">
            Chi tiết đơn đặt sân
          </div>
        }
      >
        <Spin spinning={loadingDetail}>
          {selectedBooking && (
            <div className="p-4">
              <Descriptions bordered column={1} className="bg-white rounded-lg">
                <Descriptions.Item label="Mã đơn">
                  <span className="font-medium">{selectedBooking.id}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái đơn">
                  {selectedBooking.orderStatus === 'Đặt lịch thành công' ? (
                    <Tag color="green">{selectedBooking.orderStatus}</Tag>
                  ) : selectedBooking.orderStatus === 'Hủy đặt lịch' ? (
                    <Tag color="red">{selectedBooking.orderStatus}</Tag>
                  ) : selectedBooking.orderStatus === 'Thay đổi lịch đặt thành công' ? (
                    <Tag color="blue">{selectedBooking.orderStatus}</Tag>
                  ) : (
                    <Tag color="orange">{selectedBooking.orderStatus}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Tên sân">
                  <span className="font-medium">{selectedBooking.courtName}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Tên khách hàng">
                  {selectedBooking.customerName}
                </Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">
                  {selectedBooking.phoneNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  <div className="flex items-center gap-1">
                    <EnvironmentOutlined />
                    {selectedBooking.address}
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo đơn">
                  {new Date(selectedBooking.createdAt).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Loại đơn">
                  {selectedBooking.orderType === 'Đơn ngày' ? (
                    <Tag color="blue">📅 Đơn ngày</Tag>
                  ) : (
                    <Tag color="green">⏲️ Đơn giờ</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái thanh toán">
                  {selectedBooking.paymentStatus === 'Chưa thanh toán' ? (
                    <Tag color="red">{selectedBooking.paymentStatus}</Tag>
                  ) : selectedBooking.paymentStatus === 'Đã hoàn tiền' ? (
                    <Tag color="orange">{selectedBooking.paymentStatus}</Tag>
                  ) : (
                    <Tag color="green">{selectedBooking.paymentStatus}</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Chi tiết giờ đặt">
                  {selectedBooking?.orderDetails?.map((detail, index) => (
                    <div key={index} className="mb-4 p-2 bg-gray-50 rounded">
                      <div className="font-semibold text-blue-600">
                        {detail.courtSlotName}
                      </div>
                      <div className="ml-2">
                        <p>⏰ Thời gian: {detail.startTime.slice(0, 5)} - {detail.endTime.slice(0, 5)}</p>
                        <p>📅 Các ngày đã đặt:
                          {detail.bookingDates.map((date, dateIndex) => (
                            <span key={dateIndex} className="block ml-2">
                              • {new Date(date).toLocaleDateString()}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                  ))}
                </Descriptions.Item>
                {selectedBooking.serviceDetails && selectedBooking.serviceDetails.length > 0 && (
                  <Descriptions.Item label="Dịch vụ đi kèm">
                    {selectedBooking.serviceDetails.map((service, index) => (
                      <div key={index} className="mb-2 p-2 bg-gray-50 rounded">
                        <div className="font-semibold text-green-600">
                          {service.courtServiceName || 'Dịch vụ không tên'}
                        </div>
                        <div className="ml-2 flex justify-between">
                          <span>Số lượng: {service.quantity}</span>
                          <span className={`font-medium ${service.price < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {Math.abs(service.price).toLocaleString()} VND
                            {service.price < 0 && <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Hoàn tiền</span>}
                          </span>
                        </div>
                      </div>
                    ))}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Ghi chú">
                  {selectedBooking.note || 'Không có'}
                </Descriptions.Item>
                {selectedBooking.amountRefund && selectedBooking.amountRefund > 0 && (
                  <Descriptions.Item label="Số tiền hoàn trả">
                    <div className="text-orange-600 font-medium">
                      {selectedBooking.amountRefund.toLocaleString()} VND
                    </div>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="QR Code">
                  {selectedBooking.qrcode ? (
                    <QRCode
                      value={selectedBooking.qrcode}
                      size={200}
                      className="rounded-lg mx-auto"
                    />
                  ) : (
                    <div className="text-red-500 font-medium">
                      QR đã hết hạn, vui lòng đặt lại
                    </div>
                  )}
                </Descriptions.Item>
              </Descriptions>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Tổng thanh toán</h3>
                  <div className="flex flex-col items-end">
                    {selectedBooking.amountPaid !== null && (
                      <span className="text-xl font-bold text-green-600">
                        {selectedBooking.amountPaid.toLocaleString()} VND
                      </span>
                    )}
                    {selectedBooking.totalAmount !== null && (
                      <span className="text-sm text-gray-600">
                        Tổng tiền: {selectedBooking.totalAmount.toLocaleString()} VND
                      </span>
                    )}
                    {selectedBooking.depositAmount !== null && selectedBooking.depositAmount > 0 && (
                      <span className="text-sm text-blue-600">
                        Đặt cọc: {selectedBooking.depositAmount.toLocaleString()} VND
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button onClick={() => setSelectedBooking(null)}>
                    Đóng
                  </Button>
                  {(selectedBooking.orderStatus === 'Đổi lịch thất bại' ||
                    selectedBooking.paymentStatus === 'Đã đặt cọc' ||
                    selectedBooking.paymentStatus === 'Đã thanh toán') && 
                    selectedBooking.orderStatus !== 'Hủy đặt lịch' && (
                      <>
                        <Button
                          type="primary"
                          onClick={() => handleChangeOrder(selectedBooking.id)}
                          className="bg-blue-500"
                          disabled={selectedBooking.orderStatus === 'Đặt lịch thành công' && !isWithin24Hours(selectedBooking.createdAt)}
                        >
                          Đổi lịch
                        </Button>
                        <Button 
                          type="primary" 
                          onClick={() => {
                            Modal.confirm({
                              title: 'Xác nhận hủy đơn',
                              content: 'Bạn có chắc chắn muốn hủy đơn đặt này không?',
                              okText: 'Đồng ý',
                              cancelText: 'Hủy',
                              onOk: () => handleCancelOrder(selectedBooking.id)
                            });
                          }} 
                          danger
                        >
                          Hủy đơn đặt
                        </Button>
                      </>
                    )}
                  <Button type="primary" onClick={() => fetchOrderDetail(selectedBooking.id)}>
                    Tải lại
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  );
};

export default Notification;
