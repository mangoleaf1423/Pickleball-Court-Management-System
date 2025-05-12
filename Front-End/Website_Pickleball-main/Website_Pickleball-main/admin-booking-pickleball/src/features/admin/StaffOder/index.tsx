import { Button, Card, Col, message, Row, Table, Typography, Tag, Input, Space, Collapse, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useApp } from '@/store';
import { CURRENT_ENV } from '@/core/configs/env';
import { toast } from 'react-toastify';
import { t } from 'i18next';
import { AuthHelper, CommonHelper } from '@/utils/helpers';
import axios, { AxiosError } from 'axios';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Panel } = Collapse;

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
  note: string;
  orderType: string;
  orderStatus: string;
  paymentStatus: string;
  discountCode: string | null;
  totalAmount: number;
  discountAmount: number | null;
  paymentAmount: number;
  depositAmount: number | null;
  amountPaid: number | null;
  amountRefund: number | null;
  paymentTimeout: string | null;
  orderDetails: OrderDetail[];
  serviceDetails: ServiceDetail[];
  qrcode: string | null;
  createdAt: string;
}

const StaffOrder = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const { user } = useApp();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchValue, orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${CURRENT_ENV.API_URL}/identity/public/getOrders${user?.result.user.id ? `?value=${user?.result.user.id}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${user?.result.token}`
          }
        }
      );
      setOrders(response.data);
      setFilteredOrders(response.data);
    } catch (error) {
      toast.error(t('common:message.error'));
      const { response } = error as AxiosError;

      if (response && response.status === 401 && !!useApp.getState().user) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }

      CommonHelper.handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    if (!searchValue.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const searchTerm = searchValue.toLowerCase().trim();
    const filtered = orders.filter(order => {
      return (
        (order.id && order.id.toLowerCase().includes(searchTerm)) ||
        (order.customerName && order.customerName.toLowerCase().includes(searchTerm)) ||
        (order.phoneNumber && order.phoneNumber.toLowerCase().includes(searchTerm)) ||
        (order.courtName && order.courtName.toLowerCase().includes(searchTerm)) ||
        (order.orderStatus && order.orderStatus.toLowerCase().includes(searchTerm)) ||
        (order.paymentStatus && order.paymentStatus.toLowerCase().includes(searchTerm))
      );
    });
    
    setFilteredOrders(filtered);
  };

  const handleSearch = () => {
    filterOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Đã thanh toán':
        return 'success';
      case 'Chưa thanh toán':
        return 'warning';
      case 'Hủy đặt lịch do quá giờ thanh toán':
        return 'error';
      default:
        return 'default';
    }
  };

  const getOrderStatusColor = (status: string) => {
    if (status.includes('Hủy')) return 'error';
    if (status.includes('Đã xác nhận')) return 'success';
    if (status.includes('Chờ xác nhận')) return 'processing';
    return 'default';
  };

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <Text copyable>{id.substring(0, 8)}...</Text>,
    },
    {
      title: 'Sân',
      dataIndex: 'courtName',
      key: 'courtName',
    },
    {
      title: 'Loại đơn',
      dataIndex: 'orderType',
      key: 'orderType',
    },
    {
      title: 'Trạng thái đơn',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      render: (status: string) => (
        <Tag color={getOrderStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Trạng thái thanh toán',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'paymentAmount',
      key: 'paymentAmount',
      render: (amount: number) => `${amount.toLocaleString()} VND`,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
  ];

  const expandedRowRender = (record: Order) => (
    <Collapse defaultActiveKey={['1', '2', '3']}>
      <Panel header="Thông tin chi tiết" key="1">
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Text strong>Địa chỉ:</Text> {record.address}
          </Col>
          <Col span={8}>
            <Text strong>Ghi chú:</Text> {record.note || 'Không có'}
          </Col>
          <Col span={8}>
            <Text strong>Mã giảm giá:</Text> {record.discountCode || 'Không có'}
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
          <Col span={8}>
            <Text strong>Tổng tiền:</Text> {record.totalAmount.toLocaleString()} VND
          </Col>
          <Col span={8}>
            <Text strong>Giảm giá:</Text> {record.discountAmount ? record.discountAmount.toLocaleString() + ' VND' : 'Không có'}
          </Col>
          <Col span={8}>
            <Text strong>Thanh toán:</Text> {record.paymentAmount.toLocaleString()} VND
          </Col>
        </Row>
      </Panel>
      
      {record.orderDetails.length > 0 && (
        <Panel header="Chi tiết đặt sân" key="2">
          {record.orderDetails.map((detail, index) => (
            <Card key={index} style={{ marginBottom: 8 }}>
              <Row gutter={[16, 8]}>
                <Col span={8}>
                  <Text strong>Sân:</Text> {detail.courtSlotName}
                </Col>
                <Col span={8}>
                  <Text strong>Thời gian:</Text> {detail.startTime.substring(0, 5)} - {detail.endTime.substring(0, 5)}
                </Col>
              </Row>
              <Row style={{ marginTop: 8 }}>
                <Col span={24}>
                  <Text strong>Ngày đặt:</Text>
                  <div style={{ marginTop: 4 }}>
                    {detail.bookingDates.map((date, i) => (
                      <Tag key={i} style={{ marginBottom: 4 }}>{dayjs(date).format('DD/MM/YYYY')}</Tag>
                    ))}
                  </div>
                </Col>
              </Row>
            </Card>
          ))}
        </Panel>
      )}
      
      {record.serviceDetails && record.serviceDetails.length > 0 && (
        <Panel header="Chi tiết dịch vụ" key="3">
          <Table
            dataSource={record.serviceDetails.map((service, index) => ({
              ...service,
              key: index,
              total: service.quantity * service.price
            }))}
            columns={[
              {
                title: 'Dịch vụ',
                dataIndex: 'courtServiceName',
                key: 'courtServiceName',
                render: (name: string | null, record: any) => name || record.courtServiceId
              },
              {
                title: 'Số lượng',
                dataIndex: 'quantity',
                key: 'quantity',
              },
              {
                title: 'Đơn giá',
                dataIndex: 'price',
                key: 'price',
                render: (price: number) => `${price.toLocaleString()} VND`
              },
              {
                title: 'Thành tiền',
                dataIndex: 'total',
                key: 'total',
                render: (total: number) => `${total.toLocaleString()} VND`
              }
            ]}
            pagination={false}
          />
        </Panel>
      )}
    </Collapse>
  );

  return (
    <div style={{ padding: '20px' }}>
      
      <Card style={{ marginBottom: 20 }}>
        <Space direction="horizontal">
          <Input
            placeholder="Tìm kiếm theo tên, số điện thoại, mã đơn..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{ width: 300 }}
            onPressEnter={handleSearch}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            Tìm kiếm
          </Button>
        </Space>
      </Card>
      
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredOrders.map(order => ({ ...order, key: order.id }))}
          expandable={{
            expandedRowRender,
          }}
          pagination={{ pageSize: 10 }}
        />
      </Spin>
    </div>
  );
};

export default StaffOrder;
