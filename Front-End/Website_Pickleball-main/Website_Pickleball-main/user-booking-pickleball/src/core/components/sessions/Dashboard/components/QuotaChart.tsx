import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from 'chart.js';
import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import { Chart } from 'chart.js/dist';
import colors from 'tailwindcss/colors';

import { DashboardKPI } from '@/core/types';

import BoxContainer from './BoxContainer';

interface QuotaChartProps {
  dataDashboardKPI: DashboardKPI;
}

ChartJS.register(ArcElement, Title, Tooltip, Legend);

const QuotaChart: React.FC<QuotaChartProps> = ({ dataDashboardKPI }) => {
  const { t } = useTranslation(['dashboard']);
  const options: any = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: {
          display: true,
          position: 'bottom' as const,
          onClick: (e: any) => e.stopPropagation()
        },
        datalabels: {
          display: false
        },
        centerLabel: {
          display: true,
          text: 'Total',
          fontSize: 16,
          fontStyle: 'bold'
        },
        title: {
          display: true,
          text: t(['quota_chart']),
          align: 'start' as const,
          color: colors['blue']['500'],
          font: {
            size: 20,
            weight: 500
          },
          padding: {
            bottom: 30
          }
        },
        tooltip: {
          callbacks: {
            label: function (context: any) {
              let label = context.dataset.label || '';
              const total = context.dataset.data.reduce((res: number, current: number) => res + current, 0);

              if (label) {
                label += `: ${context.parsed || 0} - `;
              }
              if (context.parsed !== null) {
                label += `${((context.parsed / total) * 100).toFixed(2)} %`;
              }
              return label;
            }
          }
        }
      }
    }),
    [t]
  );
  const CenterLabelPlugin: any = {
    id: 'center-label',
    beforeDatasetsDraw: (chart: Chart) => {
      if (chart.options.plugins.centerLabel.display) {
        const totalData = chart?.data?.datasets[0].data.reduce((acc: number, value: number) => acc + value, 0);

        const ctx = chart.ctx;
        const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
        const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

        const centerLabel = chart.options.plugins.centerLabel;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${centerLabel.fontStyle} ${centerLabel.fontSize}px Open Sans`;
        ctx.fillStyle = centerLabel.color;

        ctx.fillText(t('total') || 'Total', centerX, centerY - 10);
        ctx.fillText(totalData, centerX, centerY + 15);
      }
    }
  };
  const labels = useMemo(() => [t(['legend.success']), t(['legend.fail'])], [t]);
  const dataChart = useMemo(() => {
    const data = [dataDashboardKPI.total_success_transaction, dataDashboardKPI.total_fail_transaction];
    return {
      labels,
      datasets: [
        {
          label: t(['legend.quota']),
          data,
          backgroundColor: ['#4BC0C0', '#FF6384'],
          borderColor: ['#4BC0C0', '#FF6384'],
          borderWidth: 1,
          cubicInterpolationMode: 'monotone' as const,
          datalabels: {
            anchor: 'center' as const,
            backgroundColor: null,
            color: '#ffffff',
            borderWidth: 0,
            formatter: function (value: any) {
              return Math.round(value);
            }
          },
          hoverOffset: 20,
          spacing: 4
        }
      ]
    };
  }, [labels, dataDashboardKPI, t]);

  return (
    <BoxContainer className="chart">
      <Doughnut options={options} data={dataChart} plugins={[CenterLabelPlugin]} />
    </BoxContainer>
  );
};

export default QuotaChart;
