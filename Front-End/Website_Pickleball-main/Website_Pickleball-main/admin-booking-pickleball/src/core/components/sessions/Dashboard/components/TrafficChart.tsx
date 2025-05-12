import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Title, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import colors from 'tailwindcss/colors';

import { DashboardChart } from '@/core/types';
import BoxContainer from './BoxContainer';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

interface TrafficChartProps {
  data: DashboardChart;
}

const TrafficChart: React.FC<TrafficChartProps> = ({ data }) => {
  const { t } = useTranslation('dashboard');

  const options: any = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          onClick: (e: any) => e.stopPropagation(),
          align: 'center' as const
        },
        datalabels: {
          display: false
        },
        title: {
          display: true,
          text: t(['visit_chart']),
          align: 'start' as const,
          color: colors['blue']['500'],
          font: {
            size: 20,
            weight: 500
          },
          padding: {
            bottom: 30
          }
        }
      },
      scales: {
        x: {
          // stacked: true,
          grid: {
            display: false // Hide x-axis grid lines
          }
        },
        y: {
          // stacked: true,
          grid: {
            display: true // Hide x-axis grid lines
          }
        }
      }
    }),
    [t]
  );
  const labels = useMemo(
    () =>
      data
        .slice()
        .reverse()
        .map((item) => `T${item.month_number}-${item.year_number}`) || [],
    [data]
  );
  const dataChart = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: t(['legend.request_success']),
          data: data
            .slice()
            .reverse()
            .map((item) => item.total_success_transaction),
          borderWidth: 0,
          borderColor: colors['blue']['500'],
          backgroundColor: colors['blue']['500'],
          cubicInterpolationMode: 'monotone' as const,
          datalabels: {
            align: 'center' as const,
            anchor: 'center' as const
          },
          borderRadius: 0,
          barThickness: 20,
          borderSkipped: false
        },
        {
          label: t(['legend.request_fail']),
          data: data
            .slice()
            .reverse()
            .map((item) => item.total_fail_transaction),
          borderColor: colors['red']['500'],
          backgroundColor: colors['red']['500'],
          cubicInterpolationMode: 'monotone' as const,
          datalabels: {
            align: 'end' as const,
            anchor: 'end' as const
          },
          borderRadius: 0,
          barThickness: 20,
          borderSkipped: false
        }
      ]
    }),
    [labels, data, t]
  );

  return (
    <BoxContainer className="chart">
      <Bar options={options} data={dataChart} plugins={[ChartDataLabels]} />
    </BoxContainer>
  );
};

export default TrafficChart;
