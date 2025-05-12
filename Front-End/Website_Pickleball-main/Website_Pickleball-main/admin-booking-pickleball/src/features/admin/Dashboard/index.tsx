import React, { useEffect, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import ChartJS from 'chart.js/auto';
import { CategoryScale } from 'chart.js';
import { useApp } from '@/store';
import { DatePicker, Select, Button, Alert } from 'antd';
import dayjs from 'dayjs';
import axios, { AxiosError } from 'axios';
import { AuthHelper, CommonHelper } from '@/utils/helpers';

const { RangePicker } = DatePicker;
const { Option } = Select;

ChartJS.register(CategoryScale);

interface ChartData {
  courtName: string;
  period?: string;
  totalRevenue: number;
  depositAmount: number;
  refundAmount: number;
  paidAmount: number;
}

interface Court {
  id: string;
  name: string;
}

interface Filters {
  groupBy: string[];
  orderStatus: string[] | null;
  paymentStatus: string[] | null;
  courtIds: string[] | null;
  orderTypes: string[] | null;
}

const Dashboard = () => {
  const [data, setData] = useState<any>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [dateRange, setDateRange] = useState<[string, string]>(['2025-03-01', '2025-04-30']);
  const [filters, setFilters] = useState<Filters>({
    groupBy: ['courtId'],
    orderStatus: null,
    paymentStatus: null,
    courtIds: null,
    orderTypes: null
  });
  const { user } = useApp();
  const isStaff = user?.result.user.roles.some((role: any) => role.name === 'STAFF');

  const groupByOptions = [
    { value: 'courtId', label: 'Theo sân' },
    { value: 'day', label: 'Theo ngày' },
    { value: 'month', label: 'Theo tháng' }
  ];

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        const response = await axios.get('https://picklecourt.id.vn/api/court/public/getAll', {
          headers: {
            Authorization: `Bearer ${user?.result.token}`
          }
        });
        
        let filteredCourts = response.data;
        if (user?.result.user.roles.some((role: any) => role.name === 'MANAGER') && user?.result.user.courtNames) {
          filteredCourts = response.data.filter((court: any) => 
            user.result.user.courtNames?.includes(court.name)
          );
        }
        
        setCourts(filteredCourts);
      } catch (error) {
        console.error('Lỗi khi gọi API:', error);
      }
    };

    if (!isStaff) {
      fetchCourts();
    }
  }, [user, isStaff]);

  const fetchData = async () => {
    try {
      const response = await axios.post('https://picklecourt.id.vn/api/identity/admin/revenue/summary', {
        dateRange: {
          startDate: dateRange[0],
          endDate: dateRange[1]
        },
        groupBy: filters.groupBy,
        filters: {
          orderStatus: filters.orderStatus?.length === 0 ? null : filters.orderStatus,
          paymentStatus: filters.paymentStatus?.length === 0 ? null : filters.paymentStatus,
          courtIds: filters.courtIds?.length === 0 ? null : filters.courtIds,
          orderTypes: filters.orderTypes?.length === 0 ? null : filters.orderTypes
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.result.token}`
        }
      });
      console.log(response.data);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      const { response } = error as AxiosError;

      if (response && response.status === 401 && !!useApp.getState().user) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }

      CommonHelper.handleError(error);
      return Promise.reject(error);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await axios.post('https://picklecourt.id.vn/api/identity/admin/revenue/export', {
        dateRange: {
          startDate: dateRange[0],
          endDate: dateRange[1]
        },
        groupBy: filters.groupBy,
        filters: {
          orderStatus: filters.orderStatus?.length === 0 ? null : filters.orderStatus,
          paymentStatus: filters.paymentStatus?.length === 0 ? null : filters.paymentStatus,
          courtIds: filters.courtIds?.length === 0 ? null : filters.courtIds,
          orderTypes: filters.orderTypes?.length === 0 ? null : filters.orderTypes
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.result.token}`
        },
        responseType: 'blob'
      });
      
      // Tạo URL cho blob và tải xuống
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `revenue-report-${dateRange[0]}-to-${dateRange[1]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting data:', error);
      const { response } = error as AxiosError;

      if (response && response.status === 401 && !!useApp.getState().user) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }

      CommonHelper.handleError(error);
      return Promise.reject(error);
    }
  };

  useEffect(() => {
    if (!isStaff) {
      fetchData();
    }
  }, [dateRange, filters, isStaff]);

  const handleDateChange = (dates: any, dateStrings: [string, string]) => {
    setDateRange(dateStrings);
  };

  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getChartLabels = () => {
    const groupBy = filters.groupBy[0];
    if (groupBy === 'day' || groupBy === 'month') {
      return data?.data.map((item: ChartData) => item.period) || [];
    }
    return data?.data.map((item: ChartData) => item.courtName) || [];
  };

  const chartData = {
    labels: getChartLabels(),
    datasets: [
      {
        label: 'Doanh thu',
        data: data?.data.map((item: ChartData) => item.totalRevenue) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Tiền cọc',
        data: data?.data.map((item: ChartData) => item.depositAmount) || [],
        backgroundColor: 'rgba(255, 206, 86, 0.6)',
      },
      {
        label: 'Hoàn tiền',
        data: data?.data.map((item: ChartData) => item.refundAmount) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
      {
        label: 'Đã thanh toán',
        data: data?.data.map((item: ChartData) => item.paidAmount) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  const lineChartData = {
    labels: getChartLabels(),
    datasets: [
      {
        label: 'Tổng doanh thu',
        data: data?.data.map((item: ChartData) => item.totalRevenue) || [],
        borderColor: 'rgba(75, 192, 192, 1)',
        fill: false,
      },
      {
        label: 'Đã thanh toán',
        data: data?.data.map((item: ChartData) => item.paidAmount) || [],
        borderColor: 'rgba(54, 162, 235, 1)',
        fill: false,
      },
    ],
  };

  return (
    <div className="p-6">
      {isStaff ? (
        <Alert
          message="Chào mừng bạn. Chúc bạn một ngày làm việc tốt lành"
          type="success"
          showIcon
          className="mb-6"
        />
      ) : (
      <>
        <div className="mb-6 flex flex-wrap gap-4">
          <RangePicker 
            onChange={handleDateChange} 
            defaultValue={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
            className="w-64"
          />
          
          <Select
            placeholder="Nhóm theo"
            className="w-48"
            value={filters.groupBy[0]}
            onChange={value => handleFilterChange('groupBy', [value])}
          >
            {groupByOptions.map(option => (
              <Option key={option.value} value={option.value}>{option.label}</Option>
            ))}
          </Select>

          <Select
            placeholder="Trạng thái đơn"
            className="w-48"
            mode="multiple"
            allowClear
            onChange={value => handleFilterChange('orderStatus', value)}
          >
            <Option value="Đặt lịch thành công">Đặt lịch thành công</Option>
            <Option value="Thay đổi lịch đặt thành công">Thay đổi lịch đặt thành công</Option>
            <Option value="Đã hoàn thành">Đã hoàn thành</Option>
            <Option value="Đã sử dụng lịch đặt">Đã sử dụng lịch đặt</Option>
            <Option value="Không sử dụng lịch đặt">Không sử dụng lịch đặt</Option>
            <Option value="Đặt dịch vụ tại sân thành công">Đặt dịch vụ tại sân thành công</Option>
          </Select>

          <Select
            placeholder="Trạng thái thanh toán"
            className="w-48"
            mode="multiple"
            allowClear
            onChange={value => handleFilterChange('paymentStatus', value)}
          >
            <Option value="Đã thanh toán">Đã thanh toán</Option>
            <Option value="Đã đặt cọc">Đã đặt cọc</Option>
            <Option value="Đã hoàn tiền">Đã hoàn tiền</Option>
          </Select>

          <Select
            placeholder="Chọn sân"
            className="w-48"
            mode="multiple"
            allowClear
            onChange={value => handleFilterChange('courtIds', value)}
          >
            {courts.map(court => (
              <Option key={court.id} value={court.id}>{court.name}</Option>
            ))}
          </Select>

          <Select
            placeholder="Loại đơn"
            className="w-48"
            mode="multiple"
            allowClear
            onChange={value => handleFilterChange('orderTypes', value)}
          >
            <Option value="Đơn ngày">Đơn ngày</Option>
            <Option value="Đơn cố định">Đơn cố định</Option>
            {/* <Option value="Đơn dịch vụ">Đơn dịch vụ</Option> */}
          </Select>

          <Button 
            type="primary" 
            onClick={handleExportData}
            className="bg-blue-500"
          >
            Xuất báo cáo
          </Button>
        </div>

        {!data ? (
          <div>Loading...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-gray-500">Tổng doanh thu</h3>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('vi-VN').format(data.summary.totalRevenue)} VND
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-gray-500">Tổng tiền cọc</h3>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('vi-VN').format(data.summary.totalDeposit)} VND
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-gray-500">Tổng hoàn tiền</h3>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('vi-VN').format(data.summary.totalRefund)} VND
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-gray-500">Tổng đã thanh toán</h3>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('vi-VN').format(data.summary.totalPaid)} VND
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Biểu đồ doanh thu theo sân</h2>
                <Bar data={chartData} />
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Xu hướng thanh toán</h2>
                <Line data={lineChartData} />
              </div>
            </div>
          </>
        )}
      </>
      )}
    </div>
  );
};

export default Dashboard;