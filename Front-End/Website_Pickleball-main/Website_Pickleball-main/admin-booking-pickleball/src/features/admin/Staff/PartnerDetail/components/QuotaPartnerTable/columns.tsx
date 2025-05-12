import { Button } from 'antd';
import dayjs from 'dayjs';
import { t } from 'i18next';

import { ColumnTableType, QuotaStatus } from '@/core/types';
import { formatNumber } from '@/utils';
import { DateFormat } from '@/utils/enums';
import QuotaStatusTag from '@/core/components/sessions/QuotaPartner/QuotaStatusTag';

const contractCodeCol: ColumnTableType<any> = {
  title: 'partner:contract_code',
  dataIndex: 'contract_code',
  width: 150,
  ellipsis: true
};

const contractNameCol: ColumnTableType<any> = {
  title: 'partner:contract_name',
  dataIndex: 'contract_name',
  width: 180,
  ellipsis: true
};

const contractAtCol: ColumnTableType<any> = {
  title: 'partner:contract_at',
  dataIndex: 'contract_at',
  width: 120,
  ellipsis: true,
  render(value: number) {
    const date = dayjs(value, DateFormat.YYYYMMDD);
    if (!date.isValid()) return '';
    return date.format(DateFormat['DD/MM/YYYY']);
  }
};

const contractExpireCol: ColumnTableType<any> = {
  title: 'partner:contract_expire',
  dataIndex: 'expired_at',
  width: 120,
  ellipsis: true,
  render(value: number, record: any) {
    if (record.status === 'active' || record.rank === 'custom' || record.type === 'user_quota') {
      const date = dayjs(value, DateFormat.YYYYMMDD);
      if (!date.isValid()) return '';
      return date.format(DateFormat['DD/MM/YYYY']);
    }
    return '';
  }
};

const providerCol: ColumnTableType<any> = {
  title: 'partner:provider',
  dataIndex: 'provider_config_name',
  width: 150,
  ellipsis: true
};

const quotaUnitCol: ColumnTableType<any> = {
  title: 'partner:quota_unit',
  dataIndex: 'quota',
  width: 150,
  render(value: number) {
    return formatNumber(value);
  },
  ellipsis: true
};

const quotaUsedCol: ColumnTableType<any> = {
  title: 'partner:quota_used',
  dataIndex: 'used',
  width: 150,
  ellipsis: true,
  render(value: number) {
    return formatNumber(value);
  }
};

const quotaRemainCol: ColumnTableType<any> = {
  title: 'partner:quota_remain',
  dataIndex: 'remain',
  width: 150,
  ellipsis: true,
  render(value: number) {
    return formatNumber(value);
  }
};

const statusCol: ColumnTableType<any> = {
  title: 'partner:status',
  dataIndex: 'status',
  width: 120,
  ellipsis: true,
  render(status: QuotaStatus) {
    return <QuotaStatusTag status={status} />;
  },
  fixed: 'right'
};

const operationCol: (onCancel: any) => ColumnTableType<any> = (onCancel: any) => ({
  title: '',
  dataIndex: 'operation',
  render: (_: any, record: any) => {
    return (
      <>
        {record.status !== 'cancelled' && (
          <Button
            icon={<i className="fa-regular fa-circle-xmark fa-lg" />}
            type="text"
            size="middle"
            onClick={() => onCancel(record)}
            title={t(['common:button.cancel'])}
          />
        )}
      </>
    );
  },
  width: 80,
  align: 'center',
  fixed: 'right'
});

export {
  contractAtCol,
  contractCodeCol,
  contractExpireCol,
  contractNameCol,
  operationCol,
  providerCol,
  quotaRemainCol,
  quotaUnitCol,
  quotaUsedCol,
  statusCol
};
