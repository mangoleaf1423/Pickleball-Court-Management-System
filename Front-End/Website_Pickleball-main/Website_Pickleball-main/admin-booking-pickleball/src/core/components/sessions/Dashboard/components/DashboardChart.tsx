import React from 'react';

import { useRole } from '@/core/hooks';
import { DashboardChart, DashboardKPI } from '@/core/types';
import QuotaChart from './QuotaChart';
import RevenueChart from './RevenueChart';
import TrafficChart from './TrafficChart';

interface DashboardChartProps {
  data: DashboardChart;
  dataDashboardKPI: DashboardKPI;
}

const DashboardChartComponent: React.FC<DashboardChartProps> = ({ data, dataDashboardKPI }) => {
  const { isPrePaidAgent } = useRole();
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 ">
      <TrafficChart data={data} />
      {!isPrePaidAgent && <RevenueChart data={data} />}
      {isPrePaidAgent && <QuotaChart dataDashboardKPI={dataDashboardKPI} />}
    </div>
  );
};

export default DashboardChartComponent;
