import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, message, Table, TablePaginationConfig } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import axios from 'axios';

import { MainLayout } from '@/core/layout';
import { Order, FilterItem } from '@/core/types';
import {
  operationCol,
  courtCol,
  addressCol,
  bookingDateCol,
  customerCol,
  phoneCol,
  orderStatusCol,
  orderTypeCol,
  paymentStatusCol,
  amountCol,
  paymentAmountCol,
  createdAtCol,
  OrderDetailWrapper,
  useCourts
} from './columns';
import { orderStatusSearch, paymentStatusSearch, orderTypeSearch, startDateSearch, endDateSearch, validateDateRange } from './search';
import { CURRENT_ENV } from '@/core/configs/env';
import { useApp } from '@/store';
import SearchPageCoreFilter from '@/core/components/base/SearchPageCore/SearchPageCoreFilter';
import { Form } from 'antd';

interface FetchParams {
  current?: number;
  pageSize?: number;
  [key: string]: any;
}

const OrderManage = () => {
  const { t } = useTranslation(['common']);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useApp();
  const { showOrderDetail, OrderDetailModal } = OrderDetailWrapper();
  const { courts, loading: loadingCourts } = useCourts();
  const [totalAmount, setTotalAmount] = useState(0);
  const [refundAmount, setRefundAmount] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
    showSizeChanger: true,
    showTotal: (total) => `Tổng ${total} đơn hàng`
  });

  const onEdit = useCallback(
    (record: Order) => {
      console.log('Edit order:', record);
    },
    []
  );

  const onDelete = useCallback(
    (record: Order) => {
      console.log('Delete order:', record);
    },
    []
  );

  const fetchData = async (params: FetchParams = {}) => {
    try {
      setLoading(true);
      const { current, pageSize, ...restParams } = params;
      
      // Xử lý định dạng ngày tháng
      const formattedParams = { ...restParams };
      if (formattedParams.startDate) {
        formattedParams.startDate = dayjs(formattedParams.startDate).format('YYYY-MM-DD');
      }
      if (formattedParams.endDate) {
        formattedParams.endDate = dayjs(formattedParams.endDate).format('YYYY-MM-DD');
      }
      
      const queryParams = new URLSearchParams();
      Object.entries({ ...formattedParams, page: current, size: pageSize }).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      
      const response = await axios.get(
        `${CURRENT_ENV.API_URL}/identity/admin/dashboard/orders?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${user?.result.token}`
          }
        }
      );
      
      const { orders, totalElements, totalAmount = 0, refundAmount = 0, netAmount = 0 } = response.data;
      
      // Xử lý định dạng ngày tạo
      const formattedOrders = orders?.map((order: Order) => ({
        ...order,
        createdAt: order.createdAt ? dayjs(order.createdAt).format('DD/MM/YYYY HH:mm:ss') : ''
      })) || [];
      
      setData(formattedOrders);
      setPagination({
        ...pagination,
        current: current || 1,
        total: totalElements || 0,
        pageSize: pageSize || 20
      });
      
      setTotalAmount(totalAmount);
      setRefundAmount(refundAmount);
      setNetAmount(netAmount);
    } catch (error) {
      console.error('Fetch data error:', error);
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ current: 1, pageSize: 20 });
  }, []);

  const handleTableChange = (newPagination: TablePaginationConfig, filters: Record<string, any>, sorter: any) => {
    fetchData({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      ...formValues,
      ...filters,
    });
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      
      const { courtId, orderType, orderStatus, paymentStatus, startDate, endDate } = searchParams as any;
      
      const queryParams = new URLSearchParams();
      if (courtId) queryParams.append('courtId', courtId);
      if (orderType) queryParams.append('orderType', orderType);
      if (orderStatus) queryParams.append('orderStatus', orderStatus);
      if (paymentStatus) queryParams.append('paymentStatus', paymentStatus);
      if (startDate) queryParams.append('startDate', dayjs(startDate).format('YYYY-MM-DD'));
      if (endDate) queryParams.append('endDate', dayjs(endDate).format('YYYY-MM-DD'));
      
      const token = user?.result.token;
      const response = await fetch(
        `${CURRENT_ENV.API_URL}/identity/admin/orders/export?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Xuất file không thành công');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('Xuất file Excel thành công');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Xuất file không thành công');
    } finally {
      setIsExporting(false);
    }
  };

  const courtSearchWithSelect: FilterItem = {
    name: 'courtId',
    placeholder: 'Tìm kiếm sân',
    type: 'select',
    options: courts.map(court => ({
      label: court.name,
      value: court.id
    })),
    allowClear: true
  };

  const handleFilter = () => {
    const values = form.getFieldsValue();
    
    // Kiểm tra ngày bắt đầu và ngày kết thúc
    if (values.startDate && values.endDate) {
      const startDateObj = dayjs(values.startDate);
      const endDateObj = dayjs(values.endDate);
      
      if (!validateDateRange(startDateObj, endDateObj)) {
        message.error('Ngày bắt đầu phải nhỏ hơn ngày kết thúc');
        return;
      }
    }
    
    setFormValues(values);
    setSearchParams(values);
    fetchData({ ...values, current: 1, pageSize: pagination.pageSize });
  };

  const filterItems = [courtSearchWithSelect, orderStatusSearch, paymentStatusSearch, orderTypeSearch, startDateSearch, endDateSearch].filter(Boolean);
  
  const columns = [
    courtCol,
    createdAtCol,
    customerCol,
    phoneCol,
    orderTypeCol,
    orderStatusCol,
    paymentStatusCol,
    amountCol,
    paymentAmountCol,
    operationCol(onEdit, onDelete, showOrderDetail),
  ].filter(Boolean).map(col => ({
    ...col!,
    title: col?.title
  }));

  const extraButtons = (
    <Button 
      type="primary" 
      icon={<DownloadOutlined />} 
      onClick={handleExportExcel}
      loading={isExporting}
    >
      Xuất Excel
    </Button>
  );

  return (
    <>
      {totalAmount !== 0 && refundAmount !== 0 && netAmount !== 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            { value: totalAmount, label: "Tổng doanh thu", color: "green" },
            { value: refundAmount, label: "Hoàn tiền", color: "red" },
            { value: netAmount, label: "Doanh thu thực", color: "blue" },
          ].map((card, index) => (
            <div
              key={index}
              className={`bg-white p-6 rounded-lg shadow-sm border-l-4 border-${card.color}-500`}
            >
              <div className="text-gray-500 text-sm font-medium mb-2">{card.label}</div>
              <div className="text-2xl font-bold text-gray-900">
                {card.value.toLocaleString()}
                <span className="text-sm text-gray-500 ml-1">VND</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      
      <MainLayout 
        filter={<SearchPageCoreFilter items={filterItems} onFilter={handleFilter} form={form} />} 
        extra={extraButtons}
      >
        <Table
          columns={columns}
          rowKey="id"
          dataSource={data}
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </MainLayout>
      {OrderDetailModal}
    </>
  );
};

export default OrderManage;
