import { FilterItem } from '@/core/types';
import dayjs from 'dayjs';


const PAYMENT_STATUS = [
  { label: 'Đã đặt cọc', value: 'Đã đặt cọc' },
  { label: 'Đã thanh toán', value: 'Đã thanh toán' },
  { label: 'Hoàn tiền', value: 'Hoàn tiền' },
  
];

const courtSearch: FilterItem = {
  name: 'courtId',
  placeholder: 'placeholder:search_court',
  type: 'input',
  allowClear: true
};

const orderIdSearch: FilterItem = {
  name: 'orderId',
  placeholder: 'placeholder:search_order_id',
  type: 'input',
  allowClear: true
};

const paymentStatusSearch: FilterItem = {
  name: 'paymentStatus',
  placeholder: 'placeholder:payment_status',
  type: 'select',
  options: PAYMENT_STATUS,
  allowClear: true
};

const startDateSearch: FilterItem = {
  name: 'startDate',
  placeholder: 'placeholder:start_date',
  type: 'date'
};

const endDateSearch: FilterItem = {
  name: 'endDate',
  placeholder: 'placeholder:end_date',
  type: 'date'
};

const validateDateRange = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
  if (startDate && endDate && startDate.isAfter(endDate)) {
    return false;
  }
  return true;
};

export { courtSearch, orderIdSearch, paymentStatusSearch, startDateSearch, endDateSearch, validateDateRange };
