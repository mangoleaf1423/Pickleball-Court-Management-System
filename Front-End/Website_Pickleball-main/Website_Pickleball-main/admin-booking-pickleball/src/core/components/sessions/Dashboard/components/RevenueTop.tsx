import { Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import classNames from 'classnames/bind';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { DashboardTopRevenue } from '@/core/types';
import { formatNumber } from '@/utils';
import BoxContainer from './BoxContainer';

import styles from '../dashboard.module.scss';

const cx = classNames.bind(styles);

interface RevenueTopProps {
  data: DashboardTopRevenue[];
  isLoading: boolean;
}

const RevenueTop: React.FC<RevenueTopProps> = ({ data, isLoading }) => {
  const { t } = useTranslation(['dashboard', 'common']);
  const columns: ColumnsType<DashboardTopRevenue> = useMemo(
    () => [
      {
        title: t(['columns.partner_name']),
        key: 'partner_name',
        dataIndex: 'partner_name'
      },
      {
        title: t(['columns.email']),
        key: 'email',
        dataIndex: 'email'
      },
      {
        title: t(['columns.phone_number']),
        key: 'phone_number',
        dataIndex: 'phone_number'
      },
      {
        title: t(['columns.total_success_transaction']),
        key: 'total_success_transaction',
        dataIndex: 'total_success_transaction',
        render(value) {
          return formatNumber(value);
        },
        align: 'right'
      },
      {
        title: t(['columns.total_cost']),
        key: 'total_revenue',
        dataIndex: 'total_revenue',
        render(value) {
          return formatNumber(value);
        },
        align: 'right'
      }
    ],
    [t]
  );
  return (
    <BoxContainer>
      <div className="flex flex-col gap-y-4">
        <h3 className="select-none text-xl font-semibold text-blue-500">{t(['top_revenue'])}</h3>
        <Table
          pagination={false}
          columns={columns}
          dataSource={data}
          loading={isLoading}
          rowKey={'partner_id'}
          className={cx('revenue-table')}
        />
      </div>
    </BoxContainer>
  );
};

export default RevenueTop;
