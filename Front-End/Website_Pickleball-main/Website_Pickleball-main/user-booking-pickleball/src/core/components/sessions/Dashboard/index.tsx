import { Typography } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCancelToken, useRole } from '@/core/hooks';
import { Dashboard, DashboardKPI, DashboardTopRevenue, MonthlyChart, ResponseCommon } from '@/core/types';
import BoxList from './components/BoxList';
import DashboardChartComponent from './components/DashboardChart';
import RevenueTop from './components/RevenueTop';
import { LabelChart } from './constants';

export type ViewChartType = keyof typeof LabelChart;

export type DashboardType = 'verify';

const dashboardAPIInitial: DashboardKPI = {
  total_transaction: 0,
  total_last_transaction: 0,
  total_success_transaction: 0,
  total_last_success_transaction: 0,
  total_fail_transaction: 0,
  total_last_fail_transaction: 0,
  total_revenue: 0,
  total_last_revenue: 0,
  remain: 0,
  quota: 0,
  used: 0
};

const { Title } = Typography;

type DashboardProps = {
  dashboardType: DashboardType;
  loadData: () => Promise<ResponseCommon<Dashboard>>;
};

const DashboardPage: React.FC<DashboardProps> = ({ dashboardType, loadData }) => {
  const { t } = useTranslation(['dashboard']);

  const [dashboardKPI, setDashboardKPI] = useState<DashboardKPI>(dashboardAPIInitial);
  const [dashboardChart, setDashboardChart] = useState<MonthlyChart[]>([]);
  const [topRevenues, setTopRevenues] = useState<DashboardTopRevenue[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cancelToken, isCancel] = useCancelToken();
  const { isAdmin } = useRole();

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const res = await loadData();
        if (res?.success && res?.data) {
          const { top_revenues, ...dashboardAPI } = res.data;
          setDashboardKPI(dashboardAPI || dashboardAPIInitial);
          setDashboardChart(res.data.monthly_charts || []);
          setTopRevenues(top_revenues);
        }
      } catch (error) {
        if (isCancel(error)) return;
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [loadData, cancelToken, isCancel, dashboardType]);

  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center justify-between">
        <Title level={3}>Dashboard {t([`dashboard:${dashboardType}`])}</Title>
      </div>
      <div className="flex w-full flex-col gap-y-4">
        <BoxList data={dashboardKPI} isLoading={isLoading} />
        <DashboardChartComponent data={dashboardChart} dataDashboardKPI={dashboardKPI} />
        {isAdmin && <RevenueTop data={topRevenues} isLoading={isLoading} />}
      </div>
    </div>
  );
};

export default DashboardPage;
