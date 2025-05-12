import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Plugin
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';
import colors from 'tailwindcss/colors';

import { DashboardChart } from '@/core/types';
import BoxContainer from './BoxContainer';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface RevenueChartProps {
  data: DashboardChart;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const { t } = useTranslation('dashboard');

  const options: any = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom' as const,
          onClick: (e: any) => e.stopPropagation()
        },
        datalabels: {
          display: false
        },
        title: {
          display: true,
          text: `${t(['cost_chart'])} (đ)`,
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
      animation: {
        duration: 1500,
        easing: 'easeOutQuart'
      },
      scales: {
        x: {
          grid: {
            drawBorder: false,
            lineWidth: 0
          },
          beginAtZero: true
        },
        y: {
          grid: {
            display: true // Hide x-axis grid lines
          },
          beginAtZero: true
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      hover: {
        mode: 'nearest',
        intersect: false
      }
    }),
    [t]
  );
  const labels = useMemo(
    () => [
      null,
      ...(data
        .slice()
        .reverse()
        .map((item) => `T${item.month_number}-${item.year_number}`) || [])
    ],
    [data]
  );
  const dataChart = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: t(['legend.cost']),
          data: [
            null,
            ...(data
              .slice()
              .reverse()
              .map((item) => item.total_revenue ?? 0) || [])
          ],
          borderColor: colors['blue']['500'],
          backgroundColor: colors['blue']['500'],
          cubicInterpolationMode: 'monotone' as const
        }
      ]
    }),
    [labels, data, t]
  );

  const hoverLinePlugin: Plugin = {
    id: 'verticalLine',
    beforeEvent(chart, args, options) {
      options.inChartArea = args.inChartArea;
    },
    afterDraw(chart, _, options) {
      const { ctx } = chart;
      if (chart.tooltip?.dataPoints?.length && options.inChartArea) {
        const x = chart.tooltip.dataPoints[0].element.x;
        const yAxis = chart.scales.y;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x, yAxis.top);
        ctx.lineTo(x, yAxis.bottom);
        ctx.lineWidth = 1;
        ctx.strokeStyle = colors['blue']['500'];
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  return (
    <BoxContainer className="chart">
      <Line options={options} data={dataChart} plugins={[ChartDataLabels, hoverLinePlugin]} />
    </BoxContainer>
  );
};

export default RevenueChart;
