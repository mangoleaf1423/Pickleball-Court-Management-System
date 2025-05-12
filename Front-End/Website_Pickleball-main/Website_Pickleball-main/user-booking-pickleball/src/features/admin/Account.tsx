import { useApp } from '@/store';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Button, Card, Form, Input, Row, Col, Upload, Modal, DatePicker, Select } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, EditOutlined, SaveOutlined, CameraOutlined, LockOutlined, CalendarOutlined, ManOutlined, WomanOutlined } from '@ant-design/icons';
import axios from 'axios';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { AuthHelper } from '@/utils/helpers';

const { Option } = Select;

const ProfilePage = () => {
  const [editing, setEditing] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [form] = Form.useForm();
  const { user, setUser } = useApp();
  const [updating, setUpdating] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | undefined>(user?.result.user?.avatar);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const navigate = useNavigate();

  const handleUpload = async (file: File) => {
    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        'https://picklecourt.id.vn/api/identity/users/upload-avatar',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${user?.result.token}`
          }
        }
      );
      
      const userResponse = await axios.get('https://picklecourt.id.vn/api/identity/users/my-info', {
        headers: {
          'Authorization': `Bearer ${user?.result.token}`
        }
      });
      const newAvatarUrl = userResponse?.data?.result?.avatar;
      console.log('newAvatarUrl', newAvatarUrl);
      setImagePreview(newAvatarUrl);
      if (user) {
        setUser({
          ...user,
          result: {
            ...user.result,
            user: {
              ...user.result.user,
              avatar: newAvatarUrl
            }
          }
        });
      }
      toast.success('Cập nhật ảnh đại diện thành công');
    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      toast.error('Cập nhật ảnh đại diện thất bại');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePreview = async (file: any) => {
    if (!file.url && !file.preview) {
      file.preview = URL.createObjectURL(file.originFileObj);
    }
    setImagePreview(file.url || file.preview);
  };

  const onFinish = async (values: any) => {
    try {
      setUpdating(true);
      
      const payload = {
        id: user?.result.user?.id,
        username: user?.result.user?.username,
        firstName: values.firstName,
        lastName: values.lastName,
        email: user?.result.user?.email,
        phoneNumber: values.phone,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
        gender: values.gender
      };

      const response = await axios.put('https://picklecourt.id.vn/api/identity/users/update', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.result.token}`
        }
      });

      console.log('Cập nhật thành công:', response.data);
      toast.success('Cập nhật thông tin thành công');
      setEditing(false);
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      toast.error('Cập nhật thông tin thất bại');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    try {
      setChangingPassword(true);
      const response = await axios.put(
        'https://picklecourt.id.vn/api/identity/users/change-password',
        {
          password: values.currentPassword,
          newPassword: values.newPassword
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.result.token}`
          }
        }
      );

      console.log('Đổi mật khẩu thành công:', response.data);
      toast.success('Đổi mật khẩu thành công');
      setIsPasswordModalVisible(false);
      passwordForm.resetFields();
      AuthHelper.clearToken();
      navigate('/login');
    } catch (error) {
      console.error('Lỗi đổi mật khẩu:', error);
      toast.error('Đổi mật khẩu thất bại');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 text-lg">
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="text-2xl font-semibold">Thông tin cá nhân</span>
            {!editing && (
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => setEditing(true)}
              >
                Chỉnh sửa
              </Button>
            )}
          </div>
        }
        className="rounded-lg shadow-lg"
      >
        <Form
          form={form}
          initialValues={{
            ...user?.result.user,
            dob: user?.result.user?.dob ? dayjs(user?.result.user.dob) : null
          }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Row gutter={24}>
            <Col xs={24} md={8} className="text-center mb-6">
              <Upload
                showUploadList={false}
                disabled={!editing}
                className="cursor-pointer"
                beforeUpload={file => {
                  handleUpload(file);
                  return false;
                }}
                onChange={handlePreview}
              >
                <Avatar
                  size={150}
                  icon={<UserOutlined />}
                  src={imagePreview || user?.result.user?.avatar}
                  className="border-2 border-gray-200 mb-4"
                />
                {editing && (
                  <div className="text-primary">
                    <CameraOutlined className="text-xl" />
                    <p>Cập nhật ảnh</p>
                    {uploadingAvatar && <span className="text-sm text-gray-500">Đang tải lên...</span>}
                  </div>
                )}
              </Upload>
            </Col>

            <Col xs={24} md={16}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="lastName"
                    label="Họ"
                    rules={[{ required: true, message: 'Vui lòng nhập họ' }]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      disabled={!editing}
                      placeholder="Nguyễn"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="firstName"
                    label="Tên"
                    rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      disabled={!editing}
                      placeholder="Văn A"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                  >
                    <Input
                      prefix={<MailOutlined />}
                      disabled
                      placeholder="example@email.com"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="phoneNumber"
                    label="Số điện thoại"
                  >
                    <Input
                      prefix={<PhoneOutlined />}
                      disabled
                      placeholder="0987 654 321"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="dob"
                    label="Ngày sinh"
                  >
                    <DatePicker
                      format="DD/MM/YYYY"
                      disabled={!editing}
                      style={{ width: '100%' }}
                      placeholder="Chọn ngày sinh"
                      suffixIcon={<CalendarOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="gender"
                    label="Giới tính"
                  >
                    <Select
                      disabled={!editing}
                      placeholder="Chọn giới tính"
                    >
                      <Option value="MALE">
                        <ManOutlined /> Nam
                      </Option>
                      <Option value="FEMALE">
                        <WomanOutlined /> Nữ
                      </Option>
                      <Option value="OTHER">Khác</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {editing && (
                <div className="flex gap-4 justify-end mt-4">
                  <Button onClick={() => setEditing(false)}>Hủy bỏ</Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<SaveOutlined />}
                    loading={updating}
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              )}
            </Col>
          </Row>
        </Form>
      </Card>

      <Modal
        title="Đổi mật khẩu"
        visible={isPasswordModalVisible}
        onCancel={() => {
          setIsPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={600}
        centered
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
          className="p-4"
        >
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
            />
          </Form.Item>

          <div className="flex justify-end gap-4 mt-6">
            <Button onClick={() => setIsPasswordModalVisible(false)}>
              Hủy bỏ
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={changingPassword}
            >
              Xác nhận đổi mật khẩu
            </Button>
          </div>
        </Form>
      </Modal>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card
          title="Thông tin bảo mật"
          className="rounded-lg shadow-lg"
        >
          <div className="space-y-4">
            <div>
              <label className="text-gray-600">Mật khẩu:</label>
              <div className="flex justify-between items-center">
                <span>••••••••</span>
                <Button type="link" className="p-0" onClick={() => setIsPasswordModalVisible(true)}>
                  Đổi mật khẩu
                </Button>
              </div>
            </div>
            <div>
              <label className="text-gray-600">Xác thực 2 bước:</label>
              <div className="flex justify-between items-center">
                <span>Chưa kích hoạt</span>
                <Button type="link" className="p-0">
                  Kích hoạt
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card
          title="Liên kết mạng xã hội"
          className="rounded-lg shadow-lg"
        >
          <div className="space-y-4">
            <Button block className="text-left">
              Kết nối Facebook
            </Button>
            <Button block className="text-left">
              Kết nối Google
            </Button>
            <Button block className="text-left">
              Kết nối Zalo
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

const Account: React.FC = () => {
  const { user } = useApp();

  return (
    <div className="min-h-screen bg-gray-50">
      {user?.result.user ? (
        <ProfilePage />
      ) : (
        <div className="max-w-md mx-auto pt-20 text-center">
          <Card className="rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Vui lòng đăng nhập</h2>
            <p className="mb-6">Bạn cần đăng nhập để xem thông tin tài khoản</p>
            <Button type="primary" size="large">
              <Link to="/login">Đăng nhập ngay</Link>
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Account;