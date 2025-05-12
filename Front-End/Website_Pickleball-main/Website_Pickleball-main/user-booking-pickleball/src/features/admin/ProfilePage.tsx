import React, { useState } from 'react';
import { BellOutlined, EllipsisOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { Menu, Dropdown, Badge, Avatar, Card, List, Button } from 'antd';
import { useApp } from '@/store';
import { useNavigate } from 'react-router-dom';


const ProfilePage = () => {
    const { user, setUser } = useApp();
    const navigate = useNavigate();
    const handleLogout = () => {
        setUser(undefined);
        navigate('/login');
    }

    const [bookings] = useState([
        {
          title: "CLB Cầu Lông TPT Sport - Làng đại học",
          details: "C: 11h30 - 12h | Ngày 14/02/2025",
          address: "Đ. Tôn Thất Tùng, Đông Hòa, Dĩ An, Bình Dương",
        },
        {
          title: "Tison Pickleball",
          details: "Pickleball 1: 12h - 16h | Ngày 22/01/2025",
          address: "84K Bùi Hữu Nghĩa KP. Bình Đáng, P, Thuận An, Bình Dương",
        },
      ]);
    
      const [notifications] = useState([
        { id: 1, message: "Bạn có lịch chơi cầu lông vào ngày 14/02/2025", isRead: false },
        { id: 2, message: "Hệ thống đã cập nhật lên phiên bản 2.6.6", isRead: true },
      ]);
    
    const notificationMenu = (
      <Menu>
        <Menu.ItemGroup title="Thông báo">
          {notifications.length === 0 ? (
            <Menu.Item disabled>Không có thông báo</Menu.Item>
          ) : (
            notifications.map((notification) => (
              <Menu.Item key={notification.id}>
                <div className="flex items-center gap-2">
                  {notification.isRead ? (
                    <CheckCircleOutlined className="text-green-500" />
                  ) : (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                  <span>{notification.message}</span>
                </div>
              </Menu.Item>
            ))
          )}
        </Menu.ItemGroup>
      </Menu>
    );
  
    const settingsMenu = (
      <Menu>
        <Menu.Item key="edit-info">
          <Button type="text" block className="text-left">
            Chỉnh sửa thông tin
          </Button>
        </Menu.Item>
        <Menu.Item key="change-password">
          <Button type="text" block className="text-left">
            Thay đổi mật khẩu
          </Button>
        </Menu.Item>
        <Menu.Item key="language">
          <Button type="text" block className="text-left">
            Ngôn ngữ
          </Button>
        </Menu.Item>
        <Menu.Item key="logout">
          <Button type="text" block className="text-left" onClick={() => handleLogout()}>
            Đăng xuất
          </Button>
        </Menu.Item>
        <Menu.Item key="version" disabled>
          Version: 2.6.6
        </Menu.Item>
        <Menu.Item key="whats-new">
          <Button type="text" block className="text-left">
            Ứng dụng có gì mới?
          </Button>
        </Menu.Item>
        <Menu.Item key="delete-account">
          <Button type="text" block className="text-left text-red-600 flex items-center gap-2">
            <DeleteOutlined />
            Xóa tài khoản
          </Button>
        </Menu.Item>
      </Menu>
    );
  
    return (
      <div className="min-h-screen">
        {/* Profile Header */}
        <div className="bg-green-700 text-white text-center py-6 relative">
          <div className="absolute top-4 left-4 flex items-center gap-4">
            {/* Notification Bell with Menu */}
            <Dropdown overlay={notificationMenu} trigger={['click']}>
              <Badge count={notifications.filter((n) => !n.isRead).length}>
                <BellOutlined className="w-6 h-6 text-xl text-white cursor-pointer" />
              </Badge>
            </Dropdown>
  
            <span className="text-sm">Bạn chưa cung cấp số điện thoại</span>
          </div>
  
          <div className="flex flex-col items-center">
            <Avatar size={80} icon="👩‍🎓" className="bg-white" />
            <h2 className="mt-2 text-lg font-semibold">Lê Bá Hà</h2>
          </div>
  
          {/* Settings Dropdown */}
          <Dropdown overlay={settingsMenu} trigger={['click']} className="absolute top-4 right-4">
            <EllipsisOutlined className="w-6 h-6 text-xl text-white cursor-pointer" />
          </Dropdown>
        </div>
  
        {/* Booking List */}
        <div className=" text-white py-4 px-6">
          <div className="text-center border-b border-white pb-2 mb-4">
            <span className="text-lg font-semibold">Lịch đặt của bạn</span>
          </div>
  
          <div className="space-y-4 mr-5">
            {[1, 2].map((index) => (
              <div key={index} className="p-4 bg-[#016d39] hover:bg-[#014d2a] transition duration-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-white px-3 py-1.5 bg-[#6DE3B1] text-base font-bold rounded-full">
                    Đơn ngày
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-[#FFEC88] text-lg">
                    Sân PicklePall - Long đại học
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#FFEC88] text-lg">
                      Hủy do quá giờ thanh toán
                    </span>
                    <img
                      src="https://storage.googleapis.com/tagjs-prod.appspot.com/v1/YsTbTFu/NIhEeYca8P9UGp6SHc8p.png"
                      alt="Status icon"
                      className="w-7 h-7 object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-white">
                  <p className="text-base">
                    Chi tiết: 13:00 - 14:00 [Ngày 01/02/2025]
                  </p>
                  <p className="text-lg">
                    Đảo chủ, Tôn Thất Tùng, Đông Hoà, Dĩ An, Bình Dương
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

export default ProfilePage;