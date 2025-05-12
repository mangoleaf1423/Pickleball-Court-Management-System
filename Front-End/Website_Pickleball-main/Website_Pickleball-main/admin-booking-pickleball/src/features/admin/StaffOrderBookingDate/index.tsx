import { useState, useCallback, useEffect } from 'react';
import { Modal, Descriptions, Table, DatePicker, Button, Row, Col, Input, TimePicker, Card, Space, Typography, message } from 'antd';
import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';
import { useApp } from '@/store';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { CommonHelper } from '@/utils/helpers';
import { AuthHelper } from '@/utils/helpers';
import { SearchOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import QRCode from 'qrcode.react';

const { Title } = Typography;

interface Order {
  id: string;
  courtId: string;
  courtName: string;
  address: string;
  userId: string;
  customerName: string;
  phoneNumber: string;
  note: string | null;
  orderType: string;
  orderStatus: string;
  paymentStatus: string;
  discountCode: string | null;
  totalAmount: number;
  discountAmount: number;
  paymentAmount: number;
  amountPaid: number;
  amountRefund: number | null;
  createdAt: string;
}

const StaffOrderBookingDate = () => {
  const { user } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [data, setData] = useState<Order[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [searchValue, setSearchValue] = useState<string | null>(dayjs().format('YYYY-MM-DD'));
  const [loading, setLoading] = useState(false);
  const [phoneFilter, setPhoneFilter] = useState('');
  const [customerNameFilter, setCustomerNameFilter] = useState('');
  const [startTimeFilter, setStartTimeFilter] = useState('');
  const [endTimeFilter, setEndTimeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Đã hoàn thành');
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);
  const [orderData, setOrderData] = useState<Order | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [countdown, setCountdown] = useState(300);
  const [qrCodeData, setQrCodeData] = useState<string>('');

  const handleTimeout = () => {
    setIsQRModalVisible(false);
    message.error('Hết thời gian thanh toán');
  };

  const handleCheckIn = useCallback(async (orderId: string, order: Order) => {
    if (order.paymentStatus === 'Đã đặt cọc' || order.amountPaid < order.totalAmount) {
      setOrderData(order);
      setIsQRModalVisible(true);
      setPaymentStatus('pending');
      
      try {
        const response = await axios.post(`https://picklecourt.id.vn/api/identity/public/paymentOrder?orderId=${orderId}`, null, {
          headers: { Authorization: `Bearer ${user?.result.token}` }
        });
        console.log(response.data);
        setQrCodeData(response.data);
      } catch (error) {
        console.error('Lỗi lấy mã QR:', error);
        toast.error('Không thể lấy mã QR thanh toán');
      }
    } else {
      try {
        await axios.post('https://picklecourt.id.vn/api/identity/manage/order/checkin', null, {
          params: { orderId },
          headers: { Authorization: `Bearer ${user?.result.token}` }
        });
        toast.success('Check-in thành công');
        fetchData();
      } catch (error) {
        console.error('Check-in thất bại:', error);
        toast.error('Check-in thất bại');
      }
    }
  }, [user]);

  const columns: ColumnsType<Order> = [
    {
      title: 'Sân',
      dataIndex: 'courtName',
      key: 'courtName',
      ellipsis: true
    },
    {
      title: 'Địa chỉ', 
      dataIndex: 'address',
      key: 'address',
      ellipsis: true
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      ellipsis: true
    },
    {
      title: 'SĐT',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: (status) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'Đã thanh toán' ? 'bg-green-100 text-green-800' : 
          status === 'Chờ thanh toán' ? 'bg-yellow-100 text-yellow-800' : 
          status === 'Đã đặt cọc' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      )
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'Đã thanh toán' ? 'bg-green-100 text-green-800' : 
          status === 'Chưa thanh toán' ? 'bg-red-100 text-red-800' : 
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </span>
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedOrder(record);
              setModalVisible(true);
            }}
          >
            Chi tiết
          </Button>
          {((record.orderStatus === 'Đã thanh toán' || record.orderStatus === 'Thay đổi lịch đặt thành công' || record.paymentStatus === 'Đã đặt cọc') && 
            !(record.orderStatus === 'Đã đặt cọc' || record.paymentStatus === 'Thanh toán sau đặt cọc thất bại' || record.amountPaid < record.totalAmount)) && (
            <Button
              type="primary"
              className="bg-green-500 hover:bg-green-600"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCheckIn(record.id, record)}
            >
              Check-in
            </Button>
          )}
          {((record.orderStatus === 'Đã đặt cọc' || record.paymentStatus === 'Thanh toán sau đặt cọc thất bại' || record.amountPaid < record.totalAmount)) && (
            <Button
              type="primary"
              className="bg-blue-500 hover:bg-blue-600"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCheckIn(record.id, record)}
            >
              Thanh toán & Check-in
            </Button>
          )}
        </Space>
      )
    }
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        size: pageSize
      };

      if (searchValue) {
        params.bookingDate = searchValue;
      }

      if (startTimeFilter) {
        params.startTime = startTimeFilter;
      }

      if (endTimeFilter) {
        params.endtime = endTimeFilter;
      }

      if (phoneFilter && phoneFilter !== '') {
        params.phoneNumber = phoneFilter;
      }

      if (customerNameFilter && customerNameFilter !== '') {
        params.customerName = customerNameFilter;
      }
      
      const response = await axios.get('https://picklecourt.id.vn/api/identity/manage/getByStaff', {
        params,
        headers: { Authorization: `Bearer ${user?.result.token}` }
      });
      
      setData(response?.data.orders);
      setTotal(response?.data.totalElements);
    } catch (error) {
      console.error('Lỗi tải danh sách:', error);
      toast.error('Lỗi tải dữ liệu');
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
  }, [currentPage, pageSize, searchValue, phoneFilter, customerNameFilter, startTimeFilter, endTimeFilter, statusFilter, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isQRModalVisible && orderData) {
      // Khởi tạo WebSocket khi modal hiển thị
      const ws = new WebSocket(`wss://picklecourt.id.vn/identity/ws/notifications?key=${orderData.id}`);

      ws.onopen = () => {
        console.log('Connected to WebSocket server');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(data);
        if (data.resCode === '200') {
          setPaymentStatus('success');
          message.success('Thanh toán thành công');
          setIsQRModalVisible(false);
          fetchData();
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('Disconnected from WebSocket server');
      };

      // Đếm ngược 5 phút
      setCountdown(300);
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
    }
  }, [isQRModalVisible, orderData, fetchData]);

  const handleSearch = (date: any) => {
    setSearchValue(date ? date.format('YYYY-MM-DD') : null);
    setCurrentPage(1);
  };

  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const resetFilters = () => {
    setPhoneFilter('');
    setCustomerNameFilter('');
    setStartTimeFilter('');
    setEndTimeFilter('');
    setSearchValue(dayjs().format('YYYY-MM-DD'));
    setCurrentPage(1);
  };

  return (
    <>
      <Card className="mb-4">
        <Title level={4} className="mb-4">Quản lý đặt sân</Title>
        
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={6} lg={6}>
            <DatePicker 
              placeholder="Chọn ngày đặt sân" 
              format="DD/MM/YYYY" 
              onChange={handleSearch} 
              className="w-full"
              value={searchValue ? dayjs(searchValue) : null}
              defaultValue={dayjs()}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <TimePicker
              placeholder="Thời gian bắt đầu"
              format="HH:mm"
              className="w-full"
              value={startTimeFilter ? dayjs(startTimeFilter, 'HH:mm') : null}
              onChange={(time) => setStartTimeFilter(time ? time.format('HH:mm') : '')}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <TimePicker
              placeholder="Thời gian kết thúc" 
              format="HH:mm"
              className="w-full"
              value={endTimeFilter ? dayjs(endTimeFilter, 'HH:mm') : null}
              onChange={(time) => setEndTimeFilter(time ? time.format('HH:mm') : '')}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Input
              placeholder="Số điện thoại"
              value={phoneFilter}
              onChange={e => setPhoneFilter(e.target.value)}
              prefix={<SearchOutlined className="text-gray-400" />}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Input
              placeholder="Tên khách hàng"
              value={customerNameFilter}
              onChange={e => setCustomerNameFilter(e.target.value)}
              prefix={<SearchOutlined className="text-gray-400" />}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={2}>
            <Space>
              <Button onClick={fetchData} type="primary" icon={<SearchOutlined />}>
                Tìm
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Tổng ${total} bản ghi`
          }}
          onChange={handleTableChange}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          bordered
        />
      </Card>

      <Modal
        title={<Title level={4}>Chi tiết đơn hàng</Title>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {selectedOrder && (
          <Descriptions column={{ xs: 1, sm: 1, md: 1 }} bordered layout="vertical">
            <Descriptions.Item label="Sân">{selectedOrder.courtName}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ">{selectedOrder.address}</Descriptions.Item>
            <Descriptions.Item label="Khách hàng">{selectedOrder.customerName}</Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">{selectedOrder.phoneNumber}</Descriptions.Item>
            <Descriptions.Item label="Loại đơn">{selectedOrder.orderType}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                selectedOrder.orderStatus === 'Đã thanh toán' ? 'bg-green-100 text-green-800' : 
                selectedOrder.orderStatus === 'Chờ thanh toán' ? 'bg-yellow-100 text-yellow-800' : 
                selectedOrder.orderStatus === 'Đã đặt cọc' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedOrder.orderStatus}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái thanh toán">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                selectedOrder.paymentStatus === 'Đã thanh toán' ? 'bg-green-100 text-green-800' : 
                selectedOrder.paymentStatus === 'Chưa thanh toán' ? 'bg-red-100 text-red-800' : 
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedOrder.paymentStatus}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              <span className="font-semibold">{(selectedOrder?.totalAmount || 0).toLocaleString()} VND</span>
            </Descriptions.Item>
            <Descriptions.Item label="Giảm giá">
              <span className="text-red-500">{(selectedOrder?.discountAmount || 0).toLocaleString()} VND</span>
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền phải trả">
              <span className="font-semibold text-blue-600">{(selectedOrder?.paymentAmount || 0).toLocaleString()} VND</span>
            </Descriptions.Item>
            <Descriptions.Item label="Đã thanh toán">
              <span className="font-semibold text-green-600">{(selectedOrder?.amountPaid || 0).toLocaleString()} VND</span>
            </Descriptions.Item>
            {selectedOrder.amountRefund && (
              <Descriptions.Item label="Hoàn tiền">
                <span className="font-semibold text-orange-600">{(selectedOrder?.amountRefund || 0).toLocaleString()} VND</span>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Ngày tạo">
              {dayjs(selectedOrder.createdAt).format('DD/MM/YYYY HH:mm:ss')}
            </Descriptions.Item>
            {selectedOrder.note && (
              <Descriptions.Item label="Ghi chú">{selectedOrder.note}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      <Modal
        title={<Title level={4}>Thanh toán đơn hàng</Title>}
        open={isQRModalVisible}
        onCancel={() => setIsQRModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsQRModalVisible(false)}>
            Hủy
          </Button>
        ]}
        width={500}
      >
        {orderData && (
          <div className="text-center">
            <div className="mb-4">
              {qrCodeData ? (
                <div className="mx-auto" style={{ width: 250, height: 250, backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd' }}>
                  <QRCode
                    value={qrCodeData}
                    size={200}
                    className="rounded-lg mx-auto"
                  />
                </div>
              ) : (
                <div className="mx-auto flex items-center justify-center" style={{ width: 250, height: 250, backgroundColor: '#f5f5f5' }}>
                  <p>Đang tải mã QR...</p>
                </div>
              )}
            </div>
            <div className="mb-4">
              <p className="text-lg font-semibold">Quét mã QR để thanh toán</p>
              <p className="text-md">Số tiền: <span className="font-bold text-red-500">{(orderData.totalAmount - orderData.amountPaid).toLocaleString()} VND</span></p>
            </div>
            <div className="mb-4">
              <p className="text-sm">Thời gian còn lại: <span className="font-bold">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span></p>
            </div>
            {paymentStatus === 'pending' ? (
              <p className="text-yellow-500">Đang chờ thanh toán...</p>
            ) : paymentStatus === 'success' ? (
              <p className="text-green-500">Thanh toán thành công!</p>
            ) : (
              <p className="text-red-500">Thanh toán thất bại!</p>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default StaffOrderBookingDate;
