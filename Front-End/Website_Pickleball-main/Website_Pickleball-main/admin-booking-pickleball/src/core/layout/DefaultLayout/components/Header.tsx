import { BellOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Badge, Button, Dropdown, Empty, Image, List, MenuProps, Modal, Select, Spin, Typography } from 'antd';
import type { TextProps } from 'antd/es/typography/Text';
import classNames from 'classnames';
import { US, VN } from 'country-flag-icons/react/3x2';
import i18next from 'i18next';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';

import { CURRENT_ENV } from '@/core/configs/env';
import { Language } from '@/core/types';
import { useApp } from '@/store';
import { ActionKeyEnum } from '@/utils/enums';

import styles from '../DefaultLayout.module.scss';

interface HeaderProps {}

interface Notification {
  id: string;
  title: string;
  description: string;
  createAt: string;
  status: string;
  notificationData: {
    orderId?: string;
  };
}

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

const { Text } = Typography;

const Header: React.FC<HeaderProps> = () => {
  const { t } = useTranslation(['common']);
  const { collapsed, setCollapsed, language, setLanguage } = useApp();
  const { user, setUser } = useApp();
  const [items, setItems] = useState<MenuProps['items']>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key === ActionKeyEnum.Logout) {
      setUser();
    }
  };

  useEffect(() => {
    setItems([
      {
        label: t(['logout']),
        key: ActionKeyEnum.Logout,
        icon: <i className="fa-regular fa-arrow-right-from-bracket" />
      }
    ]);
  }, [t]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Cập nhật mỗi phút
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    // Kiểm tra xem URL có chứa orderId không
    const searchParams = new URLSearchParams(location.search);
    const orderId = searchParams.get('orderId');
    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [location]);

  const fetchNotifications = async () => {
    const key = user?.result?.user?.id || localStorage.getItem('userPhone');
    if (key) {
      try {
        setLoading(true);
        const response = await axios.get(
          `${CURRENT_ENV.API_URL}/identity/public/notification/getNotifications?value=${key}`
        );
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setOrderLoading(true);
      const response = await axios.get(
        `${CURRENT_ENV.API_URL}/identity/public/getOrderById?orderId=${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.result.token}`
          }
        }
      );
      setSelectedOrder(response.data);
      setOrderModalVisible(true);
    } catch (error) {
      console.error('Lỗi khi tải thông tin đơn hàng:', error);
    } finally {
      setOrderLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      await axios.put(
        `${CURRENT_ENV.API_URL}/identity/public/notification/read?id=${notification.id}`
      );
      
      if (notification.status !== 'read') {
        setUnreadCount(prev => prev - 1);
      }
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? {...n, status: 'read'} : n)
      );

      if (notification.notificationData?.orderId) {
        setNotificationOpen(false);
        fetchOrderDetails(notification.notificationData.orderId);
      } else {
        console.log('Thông báo này không chứa thông tin đơn hàng');
      }
    } catch (error) {
      console.error('Lỗi khi xử lý thông báo:', error);
    }
  };

  const menuProps = {
    items,
    onClick: handleMenuClick
  };

  const onChangeLanguage = (value: Language) => {
    setLanguage(value);
    i18next.changeLanguage(value);
  };

  const toggleMenu = () => {
    setCollapsed(!collapsed);
  };

  const getStatusColor = (status: string): TextProps['type'] => {
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

  const getOrderStatusColor = (status: string): TextProps['type'] => {
    if (status.includes('Hủy')) return 'error';
    if (status.includes('Đã xác nhận')) return 'success';
    if (status.includes('Chờ xác nhận')) return 'processing';
    return 'default';
  };

  const notificationContent = (
    <div className="w-92 max-h-96 overflow-auto bg-white shadow-lg rounded">
      <div className="p-3 border-b bg-gray-50">
        <Text strong>Thông báo</Text>
      </div>
      {loading ? (
        <div className="p-4 flex justify-center bg-white">
          <Spin />
        </div>
      ) : notifications.length > 0 ? (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item 
              className={`cursor-pointer hover:bg-gray-100 ${item.status === 'unread' ? 'bg-blue-50' : 'bg-white'}`}
              onClick={() => handleNotificationClick(item)}
            >
              <div className="p-2 w-full">
                <div className="flex justify-between items-start">
                  <Text strong className="mb-1">{item.title}</Text>
                  <Text type="secondary" className="text-xs">
                    {dayjs(item.createAt).format('DD/MM/YYYY HH:mm')}
                  </Text>
                </div>
                <Text className="text-sm block">{item.description}</Text>
                {item.notificationData?.orderId && (
                  <Text className="text-xs text-blue-500 mt-1">Nhấn để xem chi tiết đơn hàng</Text>
                )}
              </div>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="Không có thông báo" className="py-4 bg-white" />
      )}
    </div>
  );

  return (
    <div className="fixed inset-x-0 top-0">
      <header className={classNames('h-16 bg-gradient-to-r from-header-from to-header-to shadow-sm')}>
        <div className="h-full px-4">
          <div className="flex h-full items-stretch justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-x-6">
              <div className="cursor-pointer text-xl text-white" onClick={toggleMenu} onKeyDown={toggleMenu}>
                <i className="fa-solid fa-bars" />
              </div>
              <div className="flex min-w-0 flex-1 items-center">
                <Link to="/admin">
                  <Image
                    src={`${CURRENT_ENV.HEADER_LOGO}`}
                    alt="Logo"
                    height={80}
                    preview={false}
                    className="cursor-pointer"
                  />
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <Select
                value={language}
                onChange={onChangeLanguage}
                variant={'borderless'}
                popupMatchSelectWidth={false}
                suffixIcon={<i className="fa-solid fa-caret-down text-sm text-white" />}
                className={`[&>.ant-select-selector>.ant-select-selection-item]:flex`}
              >
                <Select.Option value="vi" className={styles.language}>
                  <VN title="VN" width={22} />
                </Select.Option>
                <Select.Option value="en" className={styles.language}>
                  <US title="US" width={22} />
                </Select.Option>
              </Select>
              
              {!user?.result.user.roles.some(role => role.name === 'ADMIN') && (
                <Dropdown 
                  open={notificationOpen}
                  onOpenChange={setNotificationOpen}
                  dropdownRender={() => notificationContent}
                  trigger={['click']}
                >
                  <Button type="text" size="large">
                    <Badge count={unreadCount} className="!text-white" size="small">
                      <BellOutlined style={{ fontSize: '18px' }} />
                    </Badge>
                  </Button>
                </Dropdown>
              )}
              <Dropdown menu={menuProps}>
                <Button type="text" className="!text-white" size="large">
                  <div className="flex h-full items-center gap-x-2">
                    <Avatar icon={<UserOutlined />} />
                    <span>{user?.result.user.username}</span>
                  </div>
                </Button>
              </Dropdown>
            </div>
          </div>
        </div>
      </header>

      <Modal
        title="Chi tiết đơn hàng"
        open={orderModalVisible}
        onCancel={() => setOrderModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setOrderModalVisible(false)}>
            Đóng
          </Button>,
          !user?.result.user.roles.some(role => role.name === 'STAFF') && (
            <Button 
              key="view" 
              type="primary" 
              onClick={() => {
                setOrderModalVisible(false);
                navigate(`/staff-order-service`);
              }}
            >
              Xem chi tiết
            </Button>
          )
        ]}
        width={700}
      >
        {orderLoading ? (
          <div className="flex justify-center p-10">
            <Spin size="large" />
          </div>
        ) : selectedOrder ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text strong>Mã đơn hàng:</Text> <Text>{selectedOrder.id}</Text>
              </div>
              <div>
                <Text strong>Ngày tạo:</Text> <Text>{dayjs(selectedOrder.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
              </div>
              <div>
                <Text strong>Khách hàng:</Text> <Text>{selectedOrder.customerName}</Text>
              </div>
              <div>
                <Text strong>Số điện thoại:</Text> <Text>{selectedOrder.phoneNumber}</Text>
              </div>
              <div>
                <Text strong>Sân:</Text> <Text>{selectedOrder.courtName}</Text>
              </div>
              <div>
                <Text strong>Địa chỉ:</Text> <Text>{selectedOrder.address}</Text>
              </div>
              <div>
                <Text strong>Trạng thái đơn hàng:</Text> <Text type={getOrderStatusColor(selectedOrder.orderStatus)}>{selectedOrder.orderStatus}</Text>
              </div>
              <div>
                <Text strong>Trạng thái thanh toán:</Text> <Text type={getStatusColor(selectedOrder.paymentStatus)}>{selectedOrder.paymentStatus}</Text>
              </div>
              <div>
                <Text strong>Tổng tiền:</Text> <Text>{selectedOrder.totalAmount.toLocaleString()} VND</Text>
              </div>
              <div>
                <Text strong>Đã thanh toán:</Text> <Text>{(selectedOrder.amountPaid || 0).toLocaleString()} VND</Text>
              </div>
            </div>
            
            <div>
              <Text strong>Thời gian đặt sân:</Text>
              <div className="mt-2">
                {selectedOrder.orderDetails.map((detail, index) => (
                  <div key={index} className="mb-2 p-2 bg-gray-50 rounded">
                    <div><Text strong>{detail.courtSlotName}</Text></div>
                    <div>Thời gian: {detail.startTime} - {detail.endTime}</div>
                    <div>Ngày: {detail.bookingDates.join(', ')}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {selectedOrder.serviceDetails.length > 0 && (
              <div>
                <Text strong>Dịch vụ:</Text>
                <div className="mt-2">
                  {selectedOrder.serviceDetails.map((service, index) => (
                    <div key={index} className="mb-2 p-2 bg-gray-50 rounded">
                      <div>{service.courtServiceName}</div>
                      <div>Số lượng: {service.quantity}</div>
                      <div>Giá: {service.price.toLocaleString()} VND</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {selectedOrder.note && (
              <div>
                <Text strong>Ghi chú:</Text>
                <div className="p-2 bg-gray-50 rounded mt-1">{selectedOrder.note}</div>
              </div>
            )}
          </div>
        ) : (
          <Empty description="Không tìm thấy thông tin đơn hàng" />
        )}
      </Modal>
    </div>
  );
};

export default Header;
