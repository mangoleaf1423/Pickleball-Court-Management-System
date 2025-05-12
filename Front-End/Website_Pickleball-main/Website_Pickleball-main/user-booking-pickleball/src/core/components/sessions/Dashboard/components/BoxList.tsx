import { Col, Row } from 'antd';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useRole } from '@/core/hooks';
import { DashboardKPI } from '@/core/types';
import { calculatePercent, formatNumber } from '@/utils';
import BoxItem from './BoxItem';
import BoxSkeleton from './BoxSkeleton';

interface BoxListProps {
  data: DashboardKPI;
  isLoading: boolean;
}

const BoxList: React.FC<BoxListProps> = ({ data, isLoading }) => {
  const { t } = useTranslation('dashboard');
  const { isAdmin, isPrePaidAgent } = useRole();

  const {
    total_fail_transaction,
    total_last_fail_transaction,
    total_last_revenue,
    total_last_success_transaction,
    total_last_transaction,
    total_revenue,
    total_success_transaction,
    total_transaction,
    quota,
    remain
  } = data;

  const boxList = useMemo(() => {
    const ratioRequestTotal = calculatePercent(total_transaction, total_last_transaction);
    const ratioRequestSuccess = calculatePercent(total_success_transaction, total_last_success_transaction);
    const _base = [
      {
        label: t(['request_total']),
        value: formatNumber(total_transaction),
        icon: <i className="fa-solid fa-credit-card text-xl text-green-500" />,
        ratioCompare: ratioRequestTotal
      },
      {
        label: t(['request_success']),
        value: formatNumber(total_success_transaction),
        icon: <i className="fa-solid fa-circle-check text-xl text-green-500" />,
        ratioCompare: ratioRequestSuccess
      }
    ];
    if (isPrePaidAgent) {
      return [
        {
          label: t(['quota_total']),
          value: formatNumber(quota),
          icon: <i className="fa-sharp fa-solid fa-chart-pie-simple text-xl text-green-500" />,
          isRatioCompare: false
        },
        {
          label: t(['quota_remain']),
          value: formatNumber(remain),
          icon: <i className="fa-duotone fa-chart-pie-simple text-xl text-green-500" />,
          isRatioCompare: false
        },
        ..._base
      ];
    } else {
      const ratioCost = calculatePercent(total_revenue || 0, total_last_revenue || 0);
      const ratioRequestFail = calculatePercent(total_fail_transaction, total_last_fail_transaction);
      return [
        {
          label: isAdmin ? t(['monthly_revenue']) : t(['expected_cost']),
          value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND' }).format(total_revenue || 0),
          icon: <i className="fa-solid fa-sack-dollar text-xl text-green-500" />,
          ratioCompare: ratioCost
        },
        ..._base,
        {
          label: t(['request_fail']),
          value: formatNumber(total_fail_transaction),
          icon: <i className="fa-sharp fa-regular fa-rectangle-xmark text-xl text-rose-500" />,
          ratioCompare: ratioRequestFail
        }
      ];
    }
  }, [
    isAdmin,
    isPrePaidAgent,
    total_fail_transaction,
    total_last_fail_transaction,
    total_last_revenue,
    total_last_success_transaction,
    total_last_transaction,
    total_revenue,
    total_success_transaction,
    total_transaction,
    quota,
    remain,
    t
  ]);

  return (
    <Row gutter={[12, 12]} align={'stretch'} justify={'space-between'}>
      {isLoading &&
        Array(4)
          .fill(1)
          .map((_, index) => (
            <Col key={index} span={6}>
              <BoxSkeleton />
            </Col>
          ))}
      {!isLoading &&
        boxList.map((box, index) => (
          <Col key={index} xl={6} md={12} sm={24}>
            <BoxItem {...box} />
          </Col>
        ))}
    </Row>
  );
};

export default BoxList;
