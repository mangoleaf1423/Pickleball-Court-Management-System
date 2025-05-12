import { Avatar, Card, Col, Divider, Row, Skeleton, Typography } from 'antd';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import avatar from '@/assets/images/avatar.avif';
import { useRole } from '@/core/hooks';
import { Partner, Size } from '@/core/types';
import { useApp } from '@/store';
import { PARTNER_RANKS, PARTNER_TYPES, formatNumber, getAddressPartner } from '@/utils';
import PartnerStatusTag from '../../components/PartnerStatusTag';

interface PartnerInfoProps {
  data: Partner | null;
  isLoading: boolean;
}

interface Info {
  icon?: JSX.Element;
  label?: string;
  dataIndex: keyof Partner;
  render?(data?: Partner, value?: any): React.ReactNode;
  size?: Size;
}

const infosCommon: Info[] = [
  {
    icon: <i className="fa-regular fa-envelope" />,
    dataIndex: 'email',
    render(data) {
      return <Link to={`mailto:${data?.email}`}>{data?.email}</Link>;
    }
  },
  {
    icon: <i className="fa-light fa-phone" />,
    dataIndex: 'phone_number'
  },
  {
    icon: <i className="fa-regular fa-location-dot" />,
    dataIndex: 'address',
    render(data) {
      return getAddressPartner(data!);
    }
  }
];

const { Text } = Typography;

export const quotaTypeMapQuotaRemain: Record<ServiceCode, { [key in TransactionType]?: keyof Partner }> = {
  V: {
    T: 'transaction_quota_remain',
    R: 'user_quota_remain'
  },
  C: {
    T: 'ceca_remain'
  },
  DC: {
    T: 'decode_chip_transaction_quota_remain'
  },
  F: {
    T: 'ekyc_remain'
  },
  O: {
    T: 'ocr_id_remain'
  },
  L: {
    T: 'liveness_remain'
  },
  EL: {
    T: 'emotion_liveness_remain'
  },
  T: {
    T: 'tax_code_remain'
  },
  GV: {
    T: 'gtin_verify_transaction_quota_remain'
  },
  DC_V: {
    T: 'decode_chip_verify_transaction_quota_remain'
  },
  GD: {
    T: 'gtin_detail_remain'
  },
  TC_ADV: {
    T: 'tax_code_adv_remain'
  },
  TC_BASIC: {
    T: 'tax_code_basic_remain'
  },
  OX: {
    T: 'ocrx_remain'
  },
  SA: {
    T: 'ssn_advanced_remain'
  },
  SB: {
    T: 'ssn_basic_remain'
  }
};

const PartnerInfo: React.FC<PartnerInfoProps> = ({ data, isLoading }) => {
  const [activeTabKey, setActiveTabKey] = useState('general');
  const { t } = useTranslation(['partner', 'errors', 'common']);
  const tabList = useMemo(
    () => [
      {
        key: 'general',
        tab: t(['general'])
      },
      {
        key: 'service',
        tab: t(['services'])
      }
    ],
    [t]
  );
  if (!data) return null;

  const cardContent: Record<string, React.ReactNode> = {
    general: <PartnerGeneralInformation data={data} />,
    service: <PartnerServices data={data} />
  };

  return (
    <Row gutter={[24, 12]}>
      <Col xl={6} md={8} xs={24}>
        <div className="rounded-lg border border-slate-200 bg-white p-5 pt-0">
          <div className="flex flex-col items-center">
            {isLoading && (
              <div className="mt-4 flex w-4/5 flex-col items-center gap-y-4">
                <Skeleton.Avatar active size={80} />
                <Skeleton active paragraph={{ width: ['100%', '100%', '100%', '100%'] }} title={{ width: '100%' }} />
              </div>
            )}
            {!isLoading && (
              <>
                <Avatar src={avatar} size={120} />
                <h2 className="mt-1 text-base font-semibold">{data?.username || ''}</h2>
                <p className="mb-1">Partner</p>
                <PartnerStatusTag status={data?.status ?? 'active'} />
                <Divider />
                <div className="flex w-full flex-col gap-y-2">
                  {infosCommon.map(({ dataIndex, icon, render }) => {
                    const value = render && data ? render(data) : data?.[dataIndex];
                    return (
                      <div key={dataIndex} className="flex items-center gap-x-2">
                        <span>{icon}</span>
                        <span
                          className="min-w-0 flex-1 truncate"
                          title={(dataIndex !== 'email' ? value : '') as string}
                        >
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </Col>
      <Col xl={18} md={16} xs={24}>
        <Card tabList={tabList} activeTabKey={activeTabKey} onTabChange={setActiveTabKey}>
          {cardContent[activeTabKey]}
        </Card>
      </Col>
    </Row>
  );
};

export default PartnerInfo;

type PartnerGeneralInformationProps = {
  data: Partner;
};

const PartnerGeneralInformation: React.FC<PartnerGeneralInformationProps> = ({ data }) => {
  const { t } = useTranslation(['partner']);
  const { isAdmin } = useRole();
  const infos = useMemo<Info[]>(() => {
    return [
      {
        label: t(['company_name']),
        dataIndex: 'name',
        size: { xl: 12, lg: 24, md: 12, sm: 24, xs: 24 }
      },
      {
        label: t(['code']),
        dataIndex: 'code',
        size: { xl: 12, lg: 24, md: 12, sm: 24, xs: 24 }
      },
      {
        label: t('tax_number'),
        dataIndex: 'tax_number',
        size: { xl: 12, lg: 24, md: 12, sm: 24, xs: 24 }
      },
      {
        label: t('phone_number'),
        dataIndex: 'phone_number',
        size: { xl: 12, lg: 24, md: 12, sm: 24, xs: 24 }
      },
      isAdmin
        ? {
            label: t('email'),
            dataIndex: 'email',
            render(data) {
              return <Link to={`mailto:${data?.email}`}>{data?.email}</Link>;
            },
            size: { xl: 12, lg: 24, md: 12, sm: 24, xs: 24 }
          }
        : {
            label: t('code'),
            dataIndex: 'code',
            size: { xl: 12, lg: 24, md: 12, sm: 24, xs: 24 }
          },
      {
        label: t(['partner_rank']),
        dataIndex: 'partner_rank',
        render(data) {
          return PARTNER_RANKS.find((item) => item.value === data?.partner_rank)?.label ?? '';
        },
        size: { xl: 12, lg: 24, md: 12, sm: 24, xs: 24 }
      },
      {
        label: t(['partner_type']),
        dataIndex: 'partner_type',
        render(data) {
          return PARTNER_TYPES.find((item) => item.value === data?.partner_type)?.label ?? '';
        },
        size: { xl: 12, lg: 24, md: 12, sm: 24, xs: 24 }
      },
      {
        label: t('representative'),
        dataIndex: 'representative',
        size: { xl: 12, lg: 24, md: 12, sm: 24, xs: 24 }
      },
      {
        label: t('address'),
        dataIndex: 'district_id',
        render(data: Partner) {
          return getAddressPartner(data);
        },
        size: { xl: 12, lg: 24, md: 12, sm: 24, xs: 24 }
      }
    ];
  }, [isAdmin, t]);
  return (
    <Row gutter={[24, 12]}>
      {infos.map(({ dataIndex, label, size, render }) => (
        <Col key={dataIndex} {...(size ?? { xxl: 12, lg: 24, md: 12, sm: 24, xs: 24 })}>
          <div className="flex flex-col border-0 border-b border-solid border-gray-200 py-1">
            <Text className="mb-0.5 !text-sm font-bold !text-gray-600">{label}</Text>
            <Text className="!min-h-[20px] !text-sm !text-slate-500">
              {(render ? render(data) : data?.[dataIndex]) as string}
            </Text>
          </div>
        </Col>
      ))}
    </Row>
  );
};

type PartnerServicesProps = {
  data: Partner;
};

const PartnerServices: React.FC<PartnerServicesProps> = ({ data }) => {
  const { t } = useTranslation(['partner']);
  const { servicesEnable } = useApp();
  const _quotaDetailMap = (Object.keys(servicesEnable) as ServiceCode[]).filter((item) => servicesEnable[item].enable);
  const infoDetail = _quotaDetailMap.reduce<Info[]>((res, current) => {
    servicesEnable[current].quotaTypes.forEach((quotaType) => {
      if (quotaTypeMapQuotaRemain[current]?.[quotaType]) {
        res.push({
          label: t([`quota_detail.${current}.${quotaType}` as any]),
          dataIndex: quotaTypeMapQuotaRemain[current][quotaType],
          render(_, value) {
            return formatNumber(value ?? 0);
          },
          size: { xl: 12, lg: 24, md: 12, sm: 24, xs: 24 }
        });
      }
    });
    return res;
  }, []);
  return (
    <Row gutter={[24, 12]}>
      {infoDetail.map(({ dataIndex, label, size, render }) => (
        <Col key={dataIndex} {...(size ?? { xxl: 12, lg: 24, md: 12, sm: 24, xs: 24 })}>
          <div className="flex flex-col border-0 border-b border-solid border-gray-200 py-1">
            <Text className="mb-0.5 !text-sm font-bold !text-gray-600">{label}</Text>
            <Text className="!min-h-[20px] !text-sm !text-slate-500">
              {(render ? render(data, data[dataIndex]) : data?.[dataIndex]) as string}
            </Text>
          </div>
        </Col>
      ))}
    </Row>
  );
};
