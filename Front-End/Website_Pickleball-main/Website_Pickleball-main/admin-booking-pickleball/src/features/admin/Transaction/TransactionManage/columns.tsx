import { Button, Tooltip, Tag } from 'antd';
import { t } from 'i18next';
import { ColumnTableType } from '@/core/types';
import dayjs from 'dayjs';

const courtCol: ColumnTableType<any> = {
  title: 'Mã giao dịch',
  key: 'id',
  dataIndex: 'id',
  ellipsis: true,
  width: 200
};

const billCodeCol: ColumnTableType<any> = {
  title: 'Mã đơn',
  key: 'billCode',
  dataIndex: 'billCode',
  width: 180,
  render: (code: string) => <span className="font-mono">{code}</span>
};

const ftCodeCol: ColumnTableType<any> = {
  title: 'Mã GD',
  key: 'ftCode',
  dataIndex: 'ftCode',
  width: 180,
  render: (code: string) => <span className="font-mono">{code}</span>
};

const paymentStatusCol: ColumnTableType<any> = {
  title: 'TT Thanh toán',
  key: 'paymentStatus',
  dataIndex: 'paymentStatus',
  render: (status: string) => (
    <Tag color={
      status === 'Đã đặt cọc' ? 'blue' : 
      status === 'Đã thanh toán' ? 'green' :
      status === 'Thành công' ? 'green' : 
      status === 'Hoàn tiền' ? 'orange' : 'red'
    }>
      {status}
    </Tag>
  ),
  width: 150
};

const statusCol: ColumnTableType<any> = {
  title: 'Trạng thái',
  key: 'status',
  dataIndex: 'status',
  render: (status: string) => (
    <Tag color={status === 'Thành công' ? 'green' : 'red'}>{status}</Tag>
  ),
  width: 150
};

const amountCol: ColumnTableType<any> = {
  title: 'Số tiền',
  key: 'amount',
  dataIndex: 'amount',
  render: (amount: number) => (
    <span className="text-green-600 font-medium">
      {amount ? amount.toLocaleString() : 0} VND
    </span>
  ),
  width: 150,
  align: 'right'
};

const createDateCol: ColumnTableType<any> = {
  title: 'Thời gian GD',
  key: 'createDate',
  dataIndex: 'createDate',
  render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
  width: 180
};



export {
  courtCol,
  billCodeCol,
  ftCodeCol,
  paymentStatusCol,
  statusCol,
  amountCol,
  createDateCol
};
