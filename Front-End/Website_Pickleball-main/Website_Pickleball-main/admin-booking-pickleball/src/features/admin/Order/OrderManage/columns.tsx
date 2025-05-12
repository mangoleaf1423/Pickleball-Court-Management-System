import { Button, Tooltip, Tag, Modal, Select } from 'antd';
import { t } from 'i18next';
import { ColumnTableType, Order } from '@/core/types';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useApp } from '@/store';
import dayjs from 'dayjs';

const ViewOrderDetailModal = ({ visible, order, onClose }: { visible: boolean; order: Order | null; onClose: () => void }) => {
  if (!order) return null;

  return (
    <Modal
      title="Chi tiết đơn hàng"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>
      ]}
      width={700}
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p><strong>Mã đơn:</strong> {order.id}</p>
          <p><strong>Sân:</strong> {order.courtName}</p>
          <p><strong>Địa chỉ:</strong> {order.address}</p>
          <p><strong>Khách hàng:</strong> {order.customerName}</p>
          <p><strong>Số điện thoại:</strong> {order.phoneNumber}</p>
          <p><strong>Ngày đặt:</strong> {order.createdAt}</p>
        </div>
        <div>
          <p><strong>Loại đơn:</strong> {order.orderType}</p>
          <p><strong>Trạng thái đơn:</strong> <Tag color={order.orderStatus.includes('Hủy') ? 'red' : 'blue'}>{order.orderStatus}</Tag></p>
          <p><strong>Trạng thái thanh toán:</strong> <Tag color={order.paymentStatus === 'Chưa thanh toán' ? 'orange' : 'green'}>{order.paymentStatus}</Tag></p>
          <p><strong>Tổng tiền:</strong> {order.totalAmount.toLocaleString()} VND</p>
          <p><strong>Giảm giá:</strong> {order.discountAmount?.toLocaleString() || '0'} VND</p>
          <p><strong>Thành tiền:</strong> {order.paymentAmount.toLocaleString()} VND</p>
        </div>
      </div>
      {order.note && (
        <div className="mt-4">
          <p><strong>Ghi chú:</strong></p>
          <p>{order.note}</p>
        </div>
      )}
    </Modal>
  );
};

// Hook để lấy danh sách sân
const useCourts = () => {
  const [courts, setCourts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useApp();

  useEffect(() => {
    const fetchCourts = async () => {
      setLoading(true);
      try {
        const res = await axios.get('https://picklecourt.id.vn/api/court/public/getAll', {
          headers: {
            Authorization: `Bearer ${user?.result.token}`
          }
        });
        
        let filteredCourts = res.data;
        if (user?.result.user.roles.some((role: any) => role.name === 'MANAGER') && user?.result.user.courtNames) {
          filteredCourts = res.data.filter((court: any) => 
            user.result.user.courtNames?.includes(court.name)
          );
          console.log("NEW DATA")
        } else {
          filteredCourts = res.data;
        }
        
        setCourts(filteredCourts.map((court: any) => ({
          id: court.id,
          name: court.name
        })));
        
        console.log('Tổng số sân đã lấy:', filteredCourts.length);
      } catch (error) {
        console.error('Lỗi khi gọi API:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourts();
  }, [user]);

  return { courts, loading };
};

const CourtSelect = ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => {
  const { courts, loading } = useCourts();
  
  return (
    <Select
      placeholder="Chọn sân"
      loading={loading}
      value={value}
      onChange={onChange}
      style={{ width: '100%' }}
      allowClear
    >
      {courts.map(court => (
        <Select.Option key={court.id} value={court.id}>
          {court.name}
        </Select.Option>
      ))}
    </Select>
  );
};

const courtCol: ColumnTableType<any> = {
  title: 'Sân',
  key: 'courtName',
  dataIndex: 'courtName',
  ellipsis: true,
  width: 200
};

const addressCol: ColumnTableType<any> = {
  title: 'Địa chỉ',
  key: 'address',
  dataIndex: 'address',
  width: 200
};

const bookingDateCol: ColumnTableType<any> = {
  title: 'Ngày đặt',
  key: 'bookingDate',
  dataIndex: 'bookingDate',
  width: 150
};

const customerCol: ColumnTableType<any> = {
  title: 'Khách hàng',
  key: 'customerName',
  dataIndex: 'customerName',
  width: 150
};

const phoneCol: ColumnTableType<any> = {
  title: 'SĐT',
  key: 'phoneNumber',
  dataIndex: 'phoneNumber',
  width: 120
};

const orderTypeCol: ColumnTableType<any> = {
  title: 'Loại đơn',
  key: 'orderType',
  dataIndex: 'orderType',
  width: 120
};

const orderStatusCol: ColumnTableType<any> = {
  title: 'Trạng thái đơn',
  key: 'orderStatus',
  dataIndex: 'orderStatus',
  render: (status: string) => (
    <Tag color={status?.includes('Hủy') ? 'red' : 'blue'}>{status}</Tag>
  ),
  width: 200
};

const paymentStatusCol: ColumnTableType<any> = {
  title: 'TT thanh toán',
  key: 'paymentStatus',
  dataIndex: 'paymentStatus',
  render: (status: string) => (
    <Tag color={status === 'Chưa thanh toán' ? 'orange' : 'green'}>{status}</Tag>
  ),
  width: 150
};

const amountCol: ColumnTableType<any> = {
  title: 'Tổng tiền',
  key: 'totalAmount',
  dataIndex: 'totalAmount',
  render: (amount: number) => `${amount?.toLocaleString() || '0'} VND`,
  width: 150
};

const paymentAmountCol: ColumnTableType<any> = {
  title: 'Thành tiền',
  key: 'paymentAmount',
  dataIndex: 'paymentAmount', 
  render: (amount: number) => `${amount?.toLocaleString() || '0'} VND`,
  width: 150
};

const createdAtCol: ColumnTableType<any> = {
  title: 'Ngày tạo',
  key: 'createdAt',
  dataIndex: 'createdAt',
  render: (date: string) => {
    if (!date) return '';
    try {
      const dateObj = dayjs(date);
      return dateObj.isValid() ? dateObj.format('DD-MM-YYYY') : '';
    } catch (error) {
      console.error('Lỗi khi định dạng ngày:', error, date);
      return '';
    }
  },
  width: 180
};

const OrderDetailWrapper = () => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const showOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedOrder(null);
  };

  return {
    showOrderDetail,
    OrderDetailModal: (
      <ViewOrderDetailModal 
        visible={modalVisible} 
        order={selectedOrder} 
        onClose={closeModal} 
      />
    )
  };
};

const operationCol: (onEdit: any, onDelete: any, onViewDetail: (record: Order) => void) => ColumnTableType<any> = 
  (onEdit, onDelete, onViewDetail) => ({
    title: '',
    key: 'action',
    render(_, record) {
      return (
        <>
          <Tooltip title="Xem chi tiết">
            <Button 
              icon={<i className="fal fa-eye" />} 
              onClick={() => onViewDetail(record)} 
              type="text" 
              shape="circle" 
            />
          </Tooltip>
        </>
      );
    },
    align: 'center',
    width: 150,
    fixed: 'right'
  });

export {
  courtCol,
  addressCol,
  bookingDateCol,
  customerCol,
  phoneCol,
  orderTypeCol,
  orderStatusCol,
  paymentStatusCol,
  amountCol,
  paymentAmountCol,
  createdAtCol,
  operationCol,
  OrderDetailWrapper,
  ViewOrderDetailModal,
  CourtSelect,
  useCourts
};
