import { FilterItem } from '@/core/types';
import dayjs from 'dayjs';

const ORDER_STATUS = [
  { label: 'Đang xử lý', value: 'Đang xử lý' },
  { label: 'Thay đổi lịch đặt', value: 'Thay đổi lịch đặt' },
  { label: 'Chờ xác nhận', value: 'Chờ xác nhận' },
  { label: 'Đặt lịch thành công', value: 'Đặt lịch thành công' },
  { label: 'Thay đổi lịch đặt thành công', value: 'Thay đổi lịch đặt thành công' },
  { label: 'Đổi lịch thất bại', value: 'Đổi lịch thất bại' },
  { label: 'Hủy đặt lịch', value: 'Hủy đặt lịch' },
  { label: 'Hủy đặt lịch do quá giờ thanh toán', value: 'Hủy đặt lịch do quá giờ thanh toán' },
  { label: 'Đã hoàn thành', value: 'Đã hoàn thành' },
  { label: 'Không hoàn thành', value: 'Không hoàn thành' }
];

const PAYMENT_STATUS = [
  { label: 'Đã đặt cọc', value: 'Đã đặt cọc' },
  { label: 'Chưa đặt cọc', value: 'Chưa đặt cọc' },
  { label: 'Đã thanh toán', value: 'Đã thanh toán' },
  { label: 'Chưa thanh toán', value: 'Chưa thanh toán' }
];

const ORDER_TYPE = [
  { label: 'Đơn ngày', value: 'Đơn ngày' },
  { label: 'Đơn cố định', value: 'Đơn cố định' },
  { label: 'Đơn dịch vụ', value: 'Đơn dịch vụ' }
];

const courtSearch: FilterItem = {
  name: 'courtId',
  placeholder: 'placeholder:search_court',
  type: 'input',
  allowClear: true
};

const orderStatusSearch: FilterItem = {
  name: 'orderStatus',
  placeholder: 'placeholder:order_status',
  type: 'select',
  options: ORDER_STATUS,
  allowClear: true
};

const paymentStatusSearch: FilterItem = {
  name: 'paymentStatus',
  placeholder: 'placeholder:payment_status',
  type: 'select', 
  options: PAYMENT_STATUS,
  allowClear: true
};

const orderTypeSearch: FilterItem = {
  name: 'orderType',
  placeholder: 'placeholder:order_type',
  type: 'select',
  options: ORDER_TYPE,
  allowClear: true
};

const startDateSearch: FilterItem = {
  name: 'startDate',
  placeholder: 'placeholder:start_date',
  type: 'date',
  allowClear: true
};

const endDateSearch: FilterItem = {
  name: 'endDate', 
  placeholder: 'placeholder:end_date',
  type: 'date',
  allowClear: true,
  disabledDate: (current: dayjs.Dayjs) => {
    const startDate = dayjs(startDateSearch.value);
    return startDate && current && current.isBefore(startDate);
  }
};

// Kiểm tra startDate < endDate
const validateDateRange = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
  if (startDate && endDate && startDate.isAfter(endDate)) {
    return false;
  }
  return true;
};

export { courtSearch, orderStatusSearch, paymentStatusSearch, orderTypeSearch, startDateSearch, endDateSearch, validateDateRange };
