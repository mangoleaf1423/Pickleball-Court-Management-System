import React, { useEffect, useState } from 'react';
import { Card, DatePicker, Table, Select, Row, Col, Statistic } from 'antd';
import { useApp } from '@/store';
import axios, { AxiosError } from 'axios';
import dayjs from 'dayjs';
import { AuthHelper, CommonHelper } from '@/utils/helpers';
import { Bar } from 'react-chartjs-2';
import ChartJS from 'chart.js/auto';
import { CategoryScale } from 'chart.js';

ChartJS.register(CategoryScale);

const { RangePicker } = DatePicker;
const { Option } = Select;

interface PeakHourData {
  timeRange: string | null;
  dayOfWeek?: string;
  date?: string;
  bookingCount: number;
  occupancyRate: number;
}

interface OccupancyData {
  timeRange: string | null;
  dayOfWeek?: string;
  date?: string;
  totalSlots: number;
  bookedSlots: number;
  occupancyRate: number;
}

interface AnalysisStats {
  totalSlots: number;
  bookedSlots: number;
  occupancyRate: number;
}

const Analysis = () => {
  const { user } = useApp();
  const [peakData, setPeakData] = useState<PeakHourData[]>([]);
  const [occupancyData, setOccupancyData] = useState<OccupancyData[]>([]);
  const [dateRange, setDateRange] = useState<[string, string]>(() => {
    const today = dayjs();
    const startDate = today.subtract(10, 'day').format('YYYY-MM-DD');
    const endDate = today.format('YYYY-MM-DD');
    return [startDate, endDate];
  });
  const [analysisTarget, setAnalysisTarget] = useState<'TOP_HOURS' | 'TOP_DAYS' | 'TOP_DAYS_OF_WEEK'>('TOP_HOURS');
  const [topCount, setTopCount] = useState<number>(3);
  const [analysisType, setAnalysisType] = useState<'BY_HOUR' | 'BY_DAY_OF_WEEK'>('BY_HOUR');
  const [overallStats, setOverallStats] = useState<AnalysisStats>({
    totalSlots: 0,
    bookedSlots: 0,
    occupancyRate: 0
  });

  const fetchPeakHours = async () => {
    try {
      const response = await axios.post('https://picklecourt.id.vn/api/identity/admin/peak-hours-analysis', {
        courtId: null,
        dateRange: {
          startDate: dateRange[0],
          endDate: dateRange[1]
        },
        analysisTarget,
        topCount
      }, {
        headers: {
          Authorization: `Bearer ${user?.result.token}`
        }
      });
      setPeakData(response.data.peakResults);
    } catch (error) {
      CommonHelper.handleError(error);
      const { response } = error as AxiosError;
      if (response?.status === 401) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }
    }
  };

  const fetchOccupancy = async () => {
    try {
      const response = await axios.post('https://picklecourt.id.vn/api/identity/admin/occupancy-analysis', {
        courtId: null,
        dateRange: {
          startDate: dateRange[0],
          endDate: dateRange[1]
        },
        analysisType
      }, {
        headers: {
          Authorization: `Bearer ${user?.result.token}`
        }
      });
      setOccupancyData(response.data.analysisDetails);
      setOverallStats({
        totalSlots: response.data.totalSlots,
        bookedSlots: response.data.bookedSlots,
        occupancyRate: response.data.occupancyRate
      });
    } catch (error) {
      CommonHelper.handleError(error);
      const { response } = error as AxiosError;
      if (response?.status === 401) {
        AuthHelper.clearToken();
        window.location.href = `/login?source=${window.location.pathname}`;
      }
    }
  };

  useEffect(() => {
    fetchPeakHours();
    fetchOccupancy();
  }, [dateRange, analysisTarget, topCount, analysisType]);

  const getPeakColumns = () => {
    if (analysisTarget === 'TOP_DAYS_OF_WEEK') {
      return [
        {
          title: 'Ngày trong tuần',
          dataIndex: 'dayOfWeek',
          key: 'dayOfWeek',
          render: (day: string) => {
            const dayTranslation: Record<string, string> = {
              'MONDAY': 'Thứ Hai',
              'TUESDAY': 'Thứ Ba',
              'WEDNESDAY': 'Thứ Tư',
              'THURSDAY': 'Thứ Năm',
              'FRIDAY': 'Thứ Sáu',
              'SATURDAY': 'Thứ Bảy',
              'SUNDAY': 'Chủ Nhật'
            };
            return dayTranslation[day] || day;
          }
        },
        {
          title: 'Số lượt đặt',
          dataIndex: 'bookingCount',
          key: 'bookingCount'
        },
        {
          title: 'Tỉ lệ chiếm dụng',
          dataIndex: 'occupancyRate',
          key: 'occupancyRate',
          render: (rate: number) => `${rate.toFixed(2)}%`
        }
      ];
    } else if (analysisTarget === 'TOP_DAYS') {
      return [
        {
          title: 'Ngày',
          dataIndex: 'date',
          key: 'date'
        },
        {
          title: 'Số lượt đặt',
          dataIndex: 'bookingCount',
          key: 'bookingCount'
        },
        {
          title: 'Tỉ lệ chiếm dụng',
          dataIndex: 'occupancyRate',
          key: 'occupancyRate',
          render: (rate: number) => `${rate.toFixed(2)}%`
        }
      ];
    } else {
      return [
        {
          title: 'Khung giờ',
          dataIndex: 'timeRange',
          key: 'timeRange'
        },
        {
          title: 'Số lượt đặt',
          dataIndex: 'bookingCount',
          key: 'bookingCount'
        },
        {
          title: 'Tỉ lệ chiếm dụng',
          dataIndex: 'occupancyRate',
          key: 'occupancyRate',
          render: (rate: number) => `${rate.toFixed(2)}%`
        }
      ];
    }
  };

  const getChartLabels = () => {
    if (analysisType === 'BY_HOUR') {
      return occupancyData.map(item => item.timeRange);
    } else {
      // Chuyển đổi tên ngày từ tiếng Anh sang tiếng Việt
      const dayTranslation: Record<string, string> = {
        'MONDAY': 'Thứ Hai',
        'TUESDAY': 'Thứ Ba',
        'WEDNESDAY': 'Thứ Tư',
        'THURSDAY': 'Thứ Năm',
        'FRIDAY': 'Thứ Sáu',
        'SATURDAY': 'Thứ Bảy',
        'SUNDAY': 'Chủ Nhật'
      };
      return occupancyData.map(item => dayTranslation[item.dayOfWeek || ''] || item.dayOfWeek);
    }
  };

  const occupancyChartData = {
    labels: getChartLabels(),
    datasets: [
      {
        label: 'Tỉ lệ lấp đầy',
        data: occupancyData.map(item => item.occupancyRate),
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      }
    ]
  };

  return (
    <div className="p-4">
      <Row gutter={[16, 16]} className="mb-4">
        <Col span={24}>
          <Card title="Lọc dữ liệu">
            <RangePicker
              defaultValue={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={(_, dateStrings) => setDateRange(dateStrings as [string, string])}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mb-4">
        <Col span={8}>
          <Card>
            <Statistic 
              title="Tổng số khung giờ" 
              value={overallStats.totalSlots} 
              precision={0}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Số khung giờ đã đặt" 
              value={overallStats.bookedSlots} 
              precision={0}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Tỉ lệ lấp đầy tổng thể" 
              value={overallStats.occupancyRate} 
              precision={2}
              suffix="%" 
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card 
            title="Phân tích giờ cao điểm" 
            extra={
              <>
                <Select
                  value={analysisTarget}
                  onChange={value => {
                    setAnalysisTarget(value);
                    setPeakData([]); // Clear previous data to prevent accumulation
                  }}
                  className="mr-2"
                >
                  <Option value="TOP_HOURS">Theo giờ</Option>
                  <Option value="TOP_DAYS">Theo ngày</Option>
                  <Option value="TOP_DAYS_OF_WEEK">Theo ngày trong tuần</Option>
                </Select>
                <Select
                  value={topCount}
                  onChange={value => {
                    setTopCount(value);
                    setPeakData([]); // Clear previous data to prevent accumulation
                  }}
                >
                  <Option value={3}>Top 3</Option>
                  <Option value={5}>Top 5</Option>
                  <Option value={10}>Top 10</Option>
                </Select>
              </>
            }
          >
            <Table
              columns={getPeakColumns()}
              dataSource={peakData}
              rowKey={record => record.timeRange || record.dayOfWeek || record.date || ''}
              pagination={false}
            />
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title="Phân tích tỉ lệ lấp đầy"
            extra={
              <Select
                value={analysisType}
                onChange={value => {
                  setAnalysisType(value);
                  setOccupancyData([]); // Clear previous data to prevent accumulation
                }}
              >
                <Option value="BY_HOUR">Theo giờ</Option>
                <Option value="BY_DAY_OF_WEEK">Theo ngày</Option>
              </Select>
            }
          >
            <Bar
              data={occupancyChartData}
              options={{
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Tỉ lệ %'
                    }
                  }
                }
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analysis;
