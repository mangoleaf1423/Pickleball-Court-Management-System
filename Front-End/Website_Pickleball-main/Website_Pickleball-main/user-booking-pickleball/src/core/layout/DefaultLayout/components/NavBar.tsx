import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import { useApp } from '@/store';
import { Menu, Dropdown, Badge, Modal, Spin, Descriptions, Tag, Button } from 'antd';
import type { MenuProps } from 'antd';
import { requestFCMToken } from '@/utils/firebaseUtils';
import axios from 'axios';
import { EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';
import QRCode from 'qrcode.react';

interface NavItem {
  key: string;
  label: string;
}

interface NavbarProps {
  className?: string;
  _items: NavItem[];
  selectedKeys: string[];
  onClickMenu: (item: { key: string }) => void;
}

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

interface UserKong {
  id: string;
  firstName: string;
  lastName: string;
  student: boolean;
  avatar?: string;
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

const Navbar: React.FC<NavbarProps> = ({ className, _items, selectedKeys, onClickMenu }) => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedBooking, setSelectedOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const { t } = useTranslation();
  const { user, setUser } = useApp();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleMoveToHistory = () => {
    setSelectedOrder(null);
    navigate('/history');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <Link to="/account">
          <i className="fa-solid fa-user mr-2"></i>
          Thông tin cá nhân
        </Link>
      ),
    },
    {
      key: 'history',
      label: (
        <Link to="/history">
          <i className="fa-solid fa-clock-rotate-left mr-2"></i>
          Lịch sử đặt lịch
        </Link>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      danger: true,
      label: (
        <div onClick={() => {
          setUser(undefined);
          navigate('/');
        }}>
          <i className="fa-solid fa-right-from-bracket mr-2"></i>
          Đăng xuất
        </div>
      ),
    },
  ];

  const fetchNotifications = async () => {
    const key = user?.result?.user?.id || localStorage.getItem('userPhone');
    if (key) {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BASE_URL_SERVICE}/identity/public/notification/getNotifications?value=${key}`
        );
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error('Lỗi khi tải thông báo:', error);
      }
    }
  };
  const fetchOrderDetails = async (orderId: string) => {
    setLoadingOrder(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BASE_URL_SERVICE}/identity/public/getOrderById?orderId=${orderId}`
      );
      setSelectedOrder(response.data);
    } catch (error) {
      console.error('Lỗi khi tải chi tiết đơn hàng:', error);
    } finally {
      setLoadingOrder(false);
    }
  };


  const handleNotificationClick = async (notification: Notification) => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BASE_URL_SERVICE}/identity/public/notification/read?id=${notification.id}`
      );
      
      // Chỉ giảm số lượng thông báo chưa đọc nếu thông báo có trạng thái chưa đọc
      if (notification.status !== 'read') {
        setUnreadCount(prev => prev - 1);
      }
      
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? {...n, status: 'read'} : n)
      );

      if (notification.notificationData?.orderId) {
        await fetchOrderDetails(notification.notificationData.orderId);
      }
    } catch (error) {
      console.error('Lỗi khi xử lý thông báo:', error);
    }
  };

  useEffect(() => {
    requestFCMToken().then(async (token) => {
      const key = user?.result?.user?.id || localStorage.getItem('userPhone');
      if (key && token) {
        console.log(key, token);
        try {
          await fetch(`${process.env.REACT_APP_BASE_URL_SERVICE}/identity/public/notification/save-token`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ key, token })
          });
        } catch (error) {
          console.error('Lỗi khi lưu FCM token:', error);
        }
      }
    });

    fetchNotifications();
  }, []);

  const notificationMenu: MenuProps['items'] = [
    ...notifications
      .slice(0, 5) // Chỉ lấy 5 thông báo mới nhất
      .map(notification => ({
        key: notification.id,
        label: (
          <div 
            className="p-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => handleNotificationClick(notification)}
          >
            <div className="font-semibold">{notification.title}</div>
            <div className="text-gray-600">{notification.description}</div>
            <div className="text-xs text-gray-400">
              {new Date(notification.createAt).toLocaleDateString()}
            </div>
          </div>
        )
      })),
    { type: 'divider' },
    {
      key: 'view-all',
      label: (
        <Link to="/notifications" className="flex items-center">
          <i className="fa-solid fa-list mr-2"></i>
          Xem tất cả
        </Link>
      ),
    }
  ];
  console.log(user?.result.user);
  return (
    <nav className={classNames(
      className,
      'h-32 w-full gradient-fade pt-3',
      'flex items-center justify-between px-4 sm:px-8 md:px-24'
    )}>
      {/* Hamburger Menu for Mobile */}
      <div className="sm:hidden">
        <button onClick={toggleMenu} className="text-white focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
          </svg>
        </button>
      </div>

      {/* Navigation Links */}
      <ul className={classNames(
        'flex flex-col sm:flex-row items-center justify-evenly w-full',
        'absolute sm:static top-24 left-',
        'transition-all duration-300 ease-in-out',
        isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible sm:opacity-100 sm:visible'
      )}>
        {_items.filter(Boolean).map((item) => (
          <li
            key={item.key}
            className={classNames(
              'flex flex-col items-center justify-center',
              'gap-y-0.5 sm:gap-y-1',
              'text-base sm:text-lg md:text-xl',
              'text-white text-center w-full sm:w-auto',
              'hover:text-white/80 cursor-pointer',
              'relative',
              selectedKeys.includes(item.key) && 'text-yellow-400 font-bold after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-white'
            )}
            onClick={() => onClickMenu({ key: item.key })}
          >
            <span className='mb-4'>{item.label}</span>
          </li>
        ))}

        {/* User Profile or Login/Register */}
        <li className={classNames(
          'flex flex-col items-center justify-center',
          'gap-y-0.5 sm:gap-y-1',
          'text-base sm:text-lg md:text-xl',
          'text-white text-center w-full sm:w-auto',
          'hover:text-white/80 cursor-pointer',
          'w-full'
        )}>
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div className="mb-4 flex items-center space-x-3 cursor-pointer">
                <img 
                  src={user?.result?.user?.avatar || '/images/dev/default-avatar.png'} 
                  alt="User avatar"
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <span className="text-white font-medium">{user?.result?.user?.firstName} {user?.result?.user?.lastName}</span>
                {user?.result?.user?.student ? (
                  <div className="p-1 w-12 h-6 border-2 bg-yellow-400 rounded-md flex items-center justify-center">
                    <i className="fa-solid fa-graduation-cap text-white text-lg"></i>
                  </div>
                ) : (
                  <div className="p-1 w-12 h-6 border-2 bg-yellow-400 rounded-md flex items-center justify-center">
                    <i className="fa-solid fa-user-tie text-white text-lg"></i>
                  </div>
                )}
              </div>
            </Dropdown>
          ) : (
            <div className="mb-4 flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                to="/login"
                style={{
                  width: '10rem',
                  padding: '0.5rem 1rem',
                  color: '#166534',
                  textAlign: 'center',
                  fontWeight: '600',
                  backgroundColor: 'white',
                  border: '1px solid white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s'
                }}
              >
                {t('button:login')}
              </Link>

              <Link
                to="/register"
                style={{
                  width: '10rem',
                  textAlign: 'center',
                  padding: '0.5rem 1rem',
                  color: 'white',
                  fontWeight: '600',
                  backgroundColor: 'transparent',
                  border: '2px solid white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s'
                }}
              >
                {t('button:register')}
              </Link>
            </div>
            
          )}
        </li>
      </ul>
      <div className="flex items-center space-x-4">

        <Dropdown 
          menu={{ items: notificationMenu }}
          trigger={['click']}
          placement="bottomRight"
          onOpenChange={visible => visible && fetchNotifications()}
        >
          <div className="mb-4 flex items-center space-x-2 text-white hover:text-gray-200 cursor-pointer">
            <Badge count={unreadCount}>
              <i className="fa-solid fa-bell text-white text-xl"></i>
            </Badge>
          </div>
        </Dropdown>
      </div>
      <Modal
        title="Chi tiết đơn đặt"
        open={!!selectedBooking}
        onCancel={() => setSelectedOrder(null)}
        footer={null}
        width={800}
        centered
      >
        <Spin spinning={loadingOrder}>
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
                <Descriptions.Item label="Trạng thái đơn">
                  <Tag color="purple">{selectedBooking.orderStatus}</Tag>
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
                <Descriptions.Item label="Dịch vụ đi kèm">
                  {selectedBooking?.serviceDetails?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedBooking.serviceDetails.map((service, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded flex justify-between">
                          <div>
                            <span className="font-medium">{service.courtServiceName || 'Dịch vụ không tên'}</span>
                            <span className="ml-2 text-gray-500">x{service.quantity}</span>
                          </div>
                          <div className="text-green-600 font-medium">
                            {service.price.toLocaleString()} VND
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">Không có dịch vụ đi kèm</div>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Ghi chú">
                  {selectedBooking.note || 'Không có'}
                </Descriptions.Item>
                <Descriptions.Item label="Thông tin thanh toán">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tổng tiền:</span>
                      <span className="font-medium">{selectedBooking.totalAmount?.toLocaleString()} VND</span>
                    </div>
                    {selectedBooking.amountPaid && (
                      <div className="flex justify-between">
                        <span>Đã thanh toán:</span>
                        <span className="font-medium text-green-600">{selectedBooking.amountPaid?.toLocaleString()} VND</span>
                      </div>
                    )}
                    {selectedBooking.amountRefund && (
                      <div className="flex justify-between">
                        <span>Hoàn tiền:</span>
                        <span className="font-medium text-orange-500">{selectedBooking.amountRefund?.toLocaleString()} VND</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Số tiền phải thanh toán:</span>
                      <span className="text-green-600">{selectedBooking.paymentAmount?.toLocaleString() || '0'} VND</span>
                    </div>
                  </div>
                </Descriptions.Item>
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
                <div className="flex justify-end gap-4">
                  <Button type="primary" onClick={() => handleMoveToHistory()}>
                    Vùi lòng vào lịch sử đặt sân để thao tác các chức năng khác.
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Spin>
      </Modal>
    </nav>
  );
};

export default Navbar;
