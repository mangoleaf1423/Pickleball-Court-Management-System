import { useState, useEffect } from 'react';
import { Table, Tag, Modal, Button, Descriptions, Spin, QRCode } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ClockCircleOutlined, EnvironmentOutlined, DollarOutlined } from '@ant-design/icons';
import { useApp } from '@/store';
import { CURRENT_ENV } from '@/core/configs/env';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

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

const BookingHistory: React.FC = () => {
  const [selectedBooking, setSelectedBooking] = useState<Order | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 5 });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const { user } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const phoneNumber = localStorage.getItem('userPhone') ?? '';
        const userId = user?.result?.user?.id;

        const queryParams = new URLSearchParams();
        if (userId) {
          queryParams.append('value', userId.toString())
        } else {
          queryParams.append('value', phoneNumber);
        }

        const response = await fetch(`${CURRENT_ENV.API_URL}/identity/public/getOrders?${queryParams}`);
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);

  useEffect(() => {
    if (selectedBooking) {
      const ws = new WebSocket(`wss://picklecourt.id.vn/identity/ws/notifications?key=${selectedBooking.id}`);

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
          fetchOrderDetail(selectedBooking.id);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('Disconnected from WebSocket server');
      };

      return () => {
        ws.close();
      };
    }
  }, [selectedBooking]);

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
  }

  const isWithin24Hours = (createdAt: string) => {
    const orderDate = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - orderDate.getTime();
    return diff <= 24 * 60 * 60 * 1000;
  };

  const handleChangeOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
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

  const columns: ColumnsType<Order> = [
    {
      title: 'Ngày đặt',
      key: 'bookingDate',
      render: (_, record) => {
        const allDates = record.orderDetails.flatMap(detail =>
          detail.bookingDates.map(date => new Date(date))
        ).sort((a, b) => a.getTime() - b.getTime());

        const startDate = allDates[0];
        const endDate = allDates[allDates.length - 1];

        return (
          (startDate && endDate) ? (
            <div className="text-green-600">
              {record.createdAt.slice(0, 10)}
            </div>
          ) : (
            <div className="text-yellow-600">
              {record.createdAt.slice(0, 10)}
            </div>
          )
        );
      },
      sorter: (a, b) => new Date(a.orderDetails[0].bookingDates[0]).getTime() - new Date(b.orderDetails[0].bookingDates[0]).getTime(),
    },
    {
      title: 'Tên sân',
      dataIndex: 'courtName',
      key: 'courtName',
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, record) => (
        <div className="space-y-2">
          {record.orderDetails.map((detail, index) => (
            <div key={index} className="flex items-center gap-1">
              <ClockCircleOutlined />
              <span>
                {detail.startTime.slice(0, 5)} - {detail.endTime.slice(0, 5)} ({detail.courtSlotName})
              </span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'orderStatus',
      dataIndex: 'orderStatus',
      render: (status) => {
        let color = '';
        switch (status) {
          case 'Đặt lịch thành công':
            color = 'green';
            break;
          case 'Hủy đặt lịch do quá giờ thanh toán':
          case 'Hủy đặt lịch':
            color = 'red';
            break;
          case 'Chờ xác nhận':
            color = 'orange';
            break;
          case 'Đang xử lý':
          case 'Thay đổi lịch đặt':
            color = 'blue';
            break;
          case 'Thay đổi lịch đặt thành công':
            color = 'green';
            break;
          case 'Đổi lịch thất bại':
            color = 'orange';
            break;
          case 'Đã hoàn thành':
            color = 'purple';
            break;
          case 'Không hoàn thành':
            color = 'volcano';
            break;
          default:
            color = 'gray';
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Trạng thái thanh toán',
      key: 'paymentStatus',
      dataIndex: 'paymentStatus',
      render: (status) => {
        let color = '';
        switch (status) {
          case 'Đã thanh toán':
            color = 'green';
            break;
          case 'Chưa thanh toán':
            color = 'red';
            break;
          case 'Đã đặt cọc':
            color = 'blue';
            break;
          case 'Đã hoàn tiền':
            color = 'orange';
            break;
          default:
            color = 'gray';
        }
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Tiền thanh toán',
      dataIndex: 'paymentAmount',
      key: 'paymentAmount',
      render: (amount, record) => {
        // Sử dụng amountPaid nếu có, nếu không thì dùng paymentAmount
        const displayAmount = record.amountPaid !== null ? record.amountPaid : (amount || 0);
        const hasRefund = record.amountRefund !== null && record.amountRefund > 0;

        return (
          <div className={`flex items-center gap-1 ${hasRefund ? 'text-orange-600' : 'text-green-600'} font-medium`}>
            <DollarOutlined />
            {Math.abs(displayAmount).toLocaleString()} VND
            {hasRefund && <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Hoàn {record.amountRefund?.toLocaleString()} VND</span>}
          </div>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          className="text-blue-500"
          onClick={() => fetchOrderDetail(record.id)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-10xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Lịch sử đặt sân</h1>

      <Table
        columns={columns}
        dataSource={orders}
        pagination={{
          ...pagination,
          total: orders.length,
          showSizeChanger: true,
          pageSizeOptions: ['5', '10', '20'],
          showTotal: (total) => `Tổng ${total} đơn đặt`,
        }}
        onChange={(pagination) => setPagination({
          current: pagination.current || 1,
          pageSize: pagination.pageSize || 5
        })}
        bordered
        rowClassName="hover:bg-gray-50 transition-colors"
      />

      <Modal
        title="Chi tiết đơn đặt"
        open={!!selectedBooking}
        onCancel={() => setSelectedBooking(null)}
        footer={null}
        width={800}
        centered
      >
        <Spin spinning={loadingDetail}>
          {selectedBooking && (
            <div className="p-4">
              <Descriptions column={1} bordered>
                <Descriptions.Item label="Mã đặt sân">
                  {selectedBooking.id}
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
                    {/* {selectedBooking.depositAmount !== null && selectedBooking.depositAmount > 0 && (
                      <span className="text-sm text-blue-600">
                        Đặt cọc: {selectedBooking.depositAmount.toLocaleString()} VND
                      </span>
                    )} */}
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <Button onClick={() => setSelectedBooking(null)}>
                    Đóng
                  </Button>
                  {((selectedBooking.paymentStatus === 'Đã đặt cọc' || selectedBooking.paymentStatus === 'Thanh toán sau đặt cọc thất bại') || 
                    (selectedBooking.amountPaid ?? 0) < selectedBooking.totalAmount) && (
                    <Button
                      type="primary"
                      onClick={async () => {
                        try {
                          const response = await axios.post(`${CURRENT_ENV.API_URL}/identity/public/paymentOrder?orderId=${selectedBooking.id}`, {
                            headers: {
                              'Authorization': `Bearer ${user?.result?.token}`
                            }
                          });
                          if (response.data) {
                            // Hiển thị QR code thanh toán phần tiền còn lại
                            const modal = Modal.info({
                              title: 'Thanh toán phần còn lại',
                              content: (
                                <div className="flex flex-col items-center">
                                  {paymentSuccess ? (
                                    <div className="text-center">
                                      <div className="text-green-500 text-xl mb-2">✓ Thanh toán thành công!</div>
                                      <p>Cảm ơn bạn đã hoàn tất thanh toán.</p>
                                    </div>
                                  ) : (
                                    <>
                                      <QRCode
                                        value={response.data}
                                        size={250}
                                        className="my-4"
                                      />
                                      <p className="text-center text-gray-600">Quét mã QR để thanh toán số tiền còn lại</p>
                                    </>
                                  )}
                                </div>
                              ),
                              okText: 'Đóng',
                              width: 400,
                            });

                            // Cập nhật nội dung modal khi trạng thái thanh toán thay đổi
                            if (paymentSuccess) {
                              modal.update({
                                content: (
                                  <div className="text-center">
                                    <div className="text-green-500 text-xl mb-2">✓ Thanh toán thành công!</div>
                                    <p>Cảm ơn bạn đã hoàn tất thanh toán.</p>
                                  </div>
                                )
                              });
                            }
                          }
                        } catch (error) {
                          console.error('Error fetching payment QR code:', error);
                          toast.error('Không thể tạo mã QR thanh toán');
                        }
                      }}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Thanh toán bổ sung
                    </Button>
                  )}
                  {(selectedBooking.orderStatus === 'Đổi lịch thất bại' ||
                    selectedBooking.paymentStatus === 'Đã đặt cọc' ||
                    (selectedBooking.paymentStatus === 'Đã thanh toán' && selectedBooking.orderType === 'Đơn ngày')) &&
                    selectedBooking.orderStatus !== 'Hủy đặt lịch' &&
                    selectedBooking.orderStatus !== 'Thay đổi lịch đặt thành công' && 
                    selectedBooking.orderType !== 'Đơn giờ' && (
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

export default BookingHistory;