import { Button, Card, Col, message, Row, InputNumber, Spin, Typography, QRCode, Divider, Table, Modal, Select } from 'antd';
import { useEffect, useState } from 'react';
import { useApp } from '@/store';
import { CURRENT_ENV } from '@/core/configs/env';
import { toast } from 'react-toastify';
import { t } from 'i18next';
import { AuthHelper, CommonHelper } from '@/utils/helpers';
import axios, { AxiosError } from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

interface Service {
  id: string;
  category: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  description: string;
  image?: string;
}

interface OrderData {
  id: string;
  paymentAmount: number;
  qrcode: string;
  createdAt: string;
  serviceDetails: Array<{
    courtServiceId: string;
    courtServiceName: string;
    quantity: number;
    price: number;
  }>;
}

interface CartItem {
  serviceId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  key: string;
}

interface CourtDetail {
  id: string;
  name: string;
  address: string;
  phone: string;
  openTime: string;
  email: string;
}

interface Court {
  id: string;
  name: string;
  active: boolean;
}

const Sells = () => {
  const [originalServices, setOriginalServices] = useState<Service[]>([]);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [courtDetail, setCourtDetail] = useState<CourtDetail | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourtId, setSelectedCourtId] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(300); // 5 phút
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const { user }= useApp();

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        let url = `${CURRENT_ENV.API_URL}/court/public/getAll`;
        
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${user?.result.token}`
          }
        });
        
        // Lọc sân theo courtNames của user nếu user có role STAFF
        let filteredCourts = response.data;
        if (user?.result.user.roles.some((role: any) => role.name === 'STAFF') && user?.result.user.courtNames) {
          filteredCourts = response.data.filter((court: any) => 
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
    const fetchServices = async () => {
      if (!selectedCourtId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(
          `${CURRENT_ENV.API_URL}/court/public/getServices?courtId=${selectedCourtId}`
        );
        setOriginalServices(response.data);

        // Fetch court details
        const courtResponse = await axios.get(
          `${CURRENT_ENV.API_URL}/court/courtDetail/${selectedCourtId}`, {
            headers: { Authorization: `Bearer ${user?.result.token}` }
          }
        );
        setCourtDetail(courtResponse.data);
      } catch (error) {
        setError('Không thể tải danh sách dịch vụ');
        message.error('Lỗi khi tải dịch vụ');
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
    };

    fetchServices();
  }, [selectedCourtId]);

  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + item.total, 0);
    setTotalAmount(total);
  }, [cartItems]);

  useEffect(() => {
    if (isModalVisible && orderData) {
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
          setIsModalVisible(false);
          
          // Cập nhật số lượng dịch vụ sau khi thanh toán thành công
          updateServiceQuantities();
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
  }, [isModalVisible, orderData]);

  const updateServiceQuantities = async () => {
    if (!orderData || !selectedCourtId) return;
    
    try {
      // Tải lại danh sách dịch vụ để cập nhật số lượng
      const response = await axios.get(
        `${CURRENT_ENV.API_URL}/court/public/getServices?courtId=${selectedCourtId}`
      );
      setOriginalServices(response.data);
    } catch (error) {
      console.error('Lỗi khi cập nhật số lượng dịch vụ:', error);
    }
  };

  const handleTimeout = () => {
    setPaymentStatus('failed');
    message.error('Hết thời gian thanh toán');
    setIsModalVisible(false);
  };

  const handleCourtChange = (value: string) => {
    setSelectedCourtId(value);
    setCartItems([]);
  };

  const handleServiceClick = (service: Service) => {
    const originalService = originalServices.find(s => s.id === service.id);
    
    if (!originalService) return;

    const existingItem = cartItems.find(item => item.serviceId === service.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      const availableQuantity = originalService.quantity - newQuantity;
      
      if (availableQuantity < 0) {
        message.warning('Sản phẩm đã hết hàng');
        return;
      }

      const updatedItems = cartItems.map(item => 
        item.serviceId === service.id 
          ? {...item, quantity: newQuantity, total: newQuantity * item.price}
          : item
      );
      setCartItems(updatedItems);
    } else {
      const currentCartQuantity = cartItems
        .filter(item => item.serviceId === service.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      const availableQuantity = originalService.quantity - currentCartQuantity;
      
      if (availableQuantity <= 0) {
        message.warning('Sản phẩm đã hết hàng');
        return;
      }

      const newItem: CartItem = {
        serviceId: service.id,
        name: service.name,
        quantity: 1,
        price: service.price,
        total: service.price,
        key: `${service.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      
      setCartItems(prevItems => [...prevItems, newItem]);
    }
  };

  const handleQuantityChange = (serviceId: string, value: number, key: string) => {
    const originalService = originalServices.find(s => s.id === serviceId);
    const currentCartItem = cartItems.find(item => item.key === key);
    
    if (!originalService || !currentCartItem) return;

    const otherItemsQuantity = cartItems
      .filter(item => item.serviceId === serviceId && item.key !== key)
      .reduce((sum, item) => sum + item.quantity, 0);

    const availableQuantity = originalService.quantity - otherItemsQuantity;

    if (value > availableQuantity) {
      message.warning(`Số lượng tối đa có thể thêm: ${availableQuantity}`);
      return;
    }

    if (value <= 0) {
      setCartItems(prevItems => prevItems.filter(item => item.key !== key));
    } else {
      const updatedItems = cartItems.map(item => {
        if (item.key === key) {
          return {...item, quantity: value, total: value * item.price};
        }
        return item;
      });
      setCartItems(updatedItems);
    }
  };

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      const serviceDetails = cartItems.map(item => ({
        courtServiceId: item.serviceId,
        // courtServiceName: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      const payload = {
        courtId: selectedCourtId,
        // name: courtDetail?.name,
        // address: courtDetail?.address,
        userId: user?.result.user.id,
        paymentAmount: totalAmount,
        serviceDetails
      };

      const response = await axios.post(
        `${CURRENT_ENV.API_URL}/identity/public/order/service`,
        payload
      );

      setOrderData(response.data);
      setCartItems([]);
      message.success('Tạo đơn hàng thành công');
      setIsModalVisible(true);
      setPaymentStatus('pending');
    } catch (error) {
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
  };

  const cartColumns = [
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_: any, record: CartItem) => (
        <InputNumber
          min={0}
          max={originalServices.find(s => s.id === record.serviceId)?.quantity}
          value={record.quantity}
          onChange={(value) => handleQuantityChange(record.serviceId, value || 0, record.key)}
          style={{ width: 80 }}
        />
      ),
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `${price.toLocaleString()} VND`,
    },
    {
      title: 'Thành tiền',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => `${total.toLocaleString()} VND`,
    },
  ];

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (error) return <div>{error}</div>;

  return (
    <div className="p-4">
      <Card className="mb-4">
        <Title level={4}>Chọn sân</Title>
        <Select
          style={{ width: '100%' }}
          value={selectedCourtId}
          onChange={handleCourtChange}
          placeholder="Chọn sân"
        >
          {courts.map(court => (
            <Option key={court.id} value={court.id}>{court.name}</Option>
          ))}
        </Select>
      </Card>
        <br />
      <Row gutter={16}>
        <Col span={16}>
          <Card title="Danh sách sản phẩm">
            {loading ? (
              <div className="flex justify-center items-center p-10">
                <Spin size="large" />
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {originalServices.length > 0 ? (
                  originalServices.map(service => {
                    const totalInCart = cartItems
                      .filter(item => item.serviceId === service.id)
                      .reduce((sum, item) => sum + item.quantity, 0);
                    const available = service.quantity - totalInCart;

                    return (
                      <Col span={6} key={service.id}>
                        <Card
                          hoverable
                          cover={service.image && <img alt={service.name} src={service.image} />}
                          onClick={() => handleServiceClick(service)}
                          className={available <= 0 ? 'opacity-50' : ''}
                        >
                          <Card.Meta
                            title={service.name}
                            description={
                              <>
                                <div>{service.price.toLocaleString()} VND</div>
                                <div className={available <= 0 ? 'text-red-500' : 'text-gray-400'}>
                                  {available <= 0 ? 'Hết hàng' : `Còn lại: ${available}`}
                                </div>
                              </>
                            }
                          />
                        </Card>
                      </Col>
                    );
                  })
                ) : (
                  <Col span={24}>
                    <div className="text-center p-5">
                      <Text>Không có sản phẩm nào cho sân này</Text>
                    </div>
                  </Col>
                )}
              </Row>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Giỏ hàng">
            <Table
              dataSource={cartItems}
              columns={cartColumns}
              pagination={false}
              rowKey="key"
              locale={{ emptyText: 'Chưa có sản phẩm nào trong giỏ hàng' }}
            />
            
            <div className="mt-4 text-right">
              <Text strong className="text-lg">
                Tổng tiền: {totalAmount.toLocaleString()} VND
              </Text>
            </div>

            <Button 
              type="primary" 
              onClick={handleCreateOrder}
              disabled={cartItems.length === 0}
              className="mt-4 w-full"
              loading={loading}
            >
              Tạo đơn hàng
            </Button>

            <Modal
              title="Thông tin thanh toán"
              open={isModalVisible}
              onOk={() => setIsModalVisible(false)}
              onCancel={() => setIsModalVisible(false)}
              footer={[
                <Button key="submit" type="primary" onClick={() => setIsModalVisible(false)}>
                  Đóng
                </Button>
              ]}
            >
              {orderData && (
                <div className="flex flex-col items-center">
                  <QRCode
                    value={orderData.qrcode}
                    size={200}
                    className="mx-auto block"
                  />
                  <div className="mt-4 text-center">
                    <p className="text-red-500 font-bold">Thời gian còn lại: {formatTime(countdown)}</p>
                    <p><strong>Mã đơn hàng:</strong> {orderData.id}</p>
                    <p><strong>Tổng tiền:</strong> {orderData.paymentAmount.toLocaleString()} VND</p>
                    <p><strong>Thời gian:</strong> {new Date(orderData.createdAt).toLocaleString()}</p>
                    <p className={`text-lg font-bold ${paymentStatus === 'pending' ? 'text-yellow-300' :
                                    paymentStatus === 'success' ? 'text-green-400' :
                                        'text-red-400'
                                }`}>
                                {paymentStatus === 'pending' && 'Đang chờ xác nhận thanh toán...'}
                                {paymentStatus === 'success' && 'Thanh toán thành công'}
                                {paymentStatus === 'failed' && 'Thanh toán thất bại'}
                            </p>
                  </div>
                </div>
              )}
            </Modal>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Sells;
