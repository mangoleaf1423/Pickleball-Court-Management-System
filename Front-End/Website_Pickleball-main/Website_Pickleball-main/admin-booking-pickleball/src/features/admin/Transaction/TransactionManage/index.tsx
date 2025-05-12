import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, message, Table, TablePaginationConfig, Form } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';

import { MainLayout } from '@/core/layout';
import SearchPageCoreFilter from '@/core/components/base/SearchPageCore/SearchPageCoreFilter';
import { Partner, FilterItem } from '@/core/types';
import {
  courtCol,
  billCodeCol,
  ftCodeCol,
  paymentStatusCol,
  statusCol,
  amountCol,
  createDateCol
} from './columns';
import { paymentStatusSearch, startDateSearch, endDateSearch, orderIdSearch, validateDateRange } from './search';
import { CURRENT_ENV } from '@/core/configs/env';
import { useApp } from '@/store';
import { AuthHelper, CommonHelper } from '@/utils/helpers';

const TransactionManage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [courts, setCourts] = useState<any[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(false);
  const { user } = useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [refundAmount, setRefundAmount] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    total: 0,
    showSizeChanger: true,
    showTotal: (total) => `Tổng ${total} giao dịch`,
    showQuickJumper: true,
    pageSizeOptions: ['10', '20', '50', '100']
  });

  const fetchCourts = useCallback(async () => {
    if (!user?.result?.token) return;
    
    setLoadingCourts(true);
    try {
      const url = `${CURRENT_ENV.API_URL}/court/public/getAll`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${user.result.token}`
        }
      });
      
      // Lọc sân theo courtNames của user nếu user có role MANAGER
      let filteredCourts = response.data;
      if (user.result.user.roles.some((role: any) => role.name === 'MANAGER') && user.result.user.courtNames) {
        filteredCourts = response.data.filter((court: any) => 
          user.result.user.courtNames?.includes(court.name)
        );
      }
      
      setCourts(filteredCourts.map((court: any) => ({
        id: court.id,
        name: court.name,
        label: court.name,
        value: court.id
      })));
    } catch (error) {
      console.error('Lỗi khi gọi API:', error);
      message.error('Không thể tải danh sách sân');
    } finally {
      setLoadingCourts(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCourts();
  }, [fetchCourts]);

  const fetchData = async (params: any = {}) => {
    try {
      setLoading(true);
      const { current, pageSize, ...restParams } = params;
      
      // Xử lý định dạng ngày tháng
      const formattedParams = { ...restParams };
      if (formattedParams.startDate) {
        formattedParams.startDate = dayjs(formattedParams.startDate).format('YYYY-MM-DDTHH:mm:ss');
      }
      if (formattedParams.endDate) {
        formattedParams.endDate = dayjs(formattedParams.endDate).format('YYYY-MM-DDTHH:mm:ss');
      }
      
      const queryParams = new URLSearchParams();
      // Đảm bảo luôn có page và size trong params
      console.log(current, pageSize);
      const page = current !== 0 ? current : 1;
      const size = pageSize !== undefined ? pageSize : pagination.pageSize;
      
      Object.entries({ ...formattedParams, page, size }).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await axios.get(
        `${CURRENT_ENV.API_URL}/identity/admin/dashboard/transactions?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${user?.result.token}`
          }
        }
      );

      const { transactions, totalElements, number, size: responseSize } = response.data;
      
      // Cập nhật tổng số tiền
      if (response.data.totalAmount !== undefined) {
        setTotalAmount(response.data.totalAmount);
        setRefundAmount(response.data.refundAmount || 0);
        setNetAmount(response.data.netAmount || 0);
      }

      setData(transactions || []);
      setPagination({
        ...pagination,
        current: number + 1,
        pageSize: responseSize,
        total: totalElements
      });
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      message.error('Không thể tải dữ liệu giao dịch');
      const { response } = error as AxiosError;

      if (response && response.status === 401 && !!useApp.getState().user) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }

      CommonHelper.handleError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ current: 1, pageSize: 10 });
  }, []);

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    fetchData({
      current: newPagination.current ? newPagination.current - 1 : 0,
      pageSize: newPagination.pageSize,
      ...formValues
    });
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      
      const { paymentStatus, courtId, orderId, startDate, endDate } = searchParams as any;
      
      const queryParams = new URLSearchParams();
      if (paymentStatus) queryParams.append('paymentStatus', paymentStatus);
      if (courtId) queryParams.append('courtId', courtId);
      if (orderId) queryParams.append('orderId', orderId);
      if (startDate) queryParams.append('startDate', dayjs(startDate).format('YYYY-MM-DDTHH:mm:ss'));
      if (endDate) queryParams.append('endDate', dayjs(endDate).format('YYYY-MM-DDTHH:mm:ss'));
      
      const token = user?.result.token;
      const response = await fetch(
        `${CURRENT_ENV.API_URL}/identity/admin/transactions/export?${queryParams.toString()}`,
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
      a.download = `transactions_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
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
    fetchData({ ...values, current: 0, pageSize: pagination.pageSize });
  };

  const filterItems = [courtSearchWithSelect, paymentStatusSearch,  startDateSearch, endDateSearch].filter(Boolean);
  
  const columns = [
    courtCol,
    billCodeCol,
    ftCodeCol,
    paymentStatusCol,
    amountCol,
    createDateCol
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
    </>
  );
};

export default TransactionManage;
