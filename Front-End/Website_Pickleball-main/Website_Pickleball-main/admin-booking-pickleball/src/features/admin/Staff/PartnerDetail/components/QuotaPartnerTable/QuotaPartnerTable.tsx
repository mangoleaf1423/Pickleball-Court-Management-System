import { Card, Progress, Space, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import colors from 'tailwindcss/colors';

import { AppButton } from '@/core/components';
import SearchPageCore from '@/core/components/base/SearchPageCore';
import QuotaModalCancel from '@/core/components/sessions/QuotaPartner/QuotaModalCancel';
import QuotaModalForm from '@/core/components/sessions/QuotaPartner/QuotaModalForm';
import { quotaRemainMap } from '@/core/constants/partner.constant';
import { QuotaService } from '@/core/services';
import { Quota, QuotaRemain, SearchParamsValue } from '@/core/types';
import { useApp, usePartner } from '@/store';
import { formatNumber } from '@/utils';
import {
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
} from './columns';
import QuotaDropdown from './QuotaDropdown';

const quotaTypeMapAPIGet: { [type in ServiceCode]: any } = {
  V: QuotaService.getQuotaEIDList,
  C: QuotaService.getQuotaCecaList,
  O: QuotaService.getQuotaOCRList,
  F: QuotaService.getQuotaFaceMatchingList,
  L: QuotaService.getQuotaLivenessList,
  EL: QuotaService.getQuotaEmotionLivenessList,
  DC: QuotaService.getQuotaDecodeChipList,
  T: QuotaService.getQuotaTaxCodeList,
  GV: QuotaService.getQuotaGtinVerifyList,
  GD: QuotaService.getQuotaGtinDetailList,
  TC_ADV: QuotaService.getQuotaTaxCodeAdvancedList,
  TC_BASIC: QuotaService.getQuotaTaxCodeBasicList,
  DC_V: QuotaService.getQuotaDecodeChipVerifyList,
  OX: QuotaService.getQuotaOCRXList,
  SA: QuotaService.getQuotaSAList,
  SB: QuotaService.getQuotaSBList
};

type QuotaPartnerTableProps = {
  fetchPartnerData: () => void;
};
const { Title } = Typography;

const QuotaPartnerTable: React.FC<QuotaPartnerTableProps> = ({ fetchPartnerData }) => {
  const [open, setOpen] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [dataActive, setDataActive] = useState<Quota>();
  const [serviceActive, setServiceActive] = useState<ServiceCode>('V');
  const serviceRef = useRef<ServiceCode | null>(null);

  const { partnerData } = usePartner();
  const { servicesEnable } = useApp();

  const { t } = useTranslation(['partner']);

  useEffect(() => {
    serviceRef.current = serviceActive;
  }, [serviceActive]);

  const handleLoadData = useCallback(
    (params: SearchParamsValue) => {
      if (!partnerData) return;
      return quotaTypeMapAPIGet[serviceActive]!(partnerData.id, {
        ...params,
        page_number: serviceRef.current !== serviceActive ? 1 : params.page_number ?? 1
      });
    },
    [partnerData, serviceActive]
  );

  const quotaRemain = useMemo(() => {
    const quotaRemain = quotaRemainMap[serviceActive]?.filter(
      (item) =>
        servicesEnable[serviceActive].enable && servicesEnable[serviceActive].quotaTypes.includes(item.transactionType)
    );
    return quotaRemain?.map((item) => ({
      title: t([item.title as any]),
      total: Number(partnerData?.[item.total] ?? 0),
      remain: Number(partnerData?.[item.remain] ?? 0)
    }));
  }, [serviceActive, servicesEnable, t, partnerData]);

  const handleAddQuota = useCallback(() => {
    setOpen(true);
  }, []);

  const handleCancelQuota = useCallback((record: Quota) => {
    setDataActive(record);
    setOpenCancel(true);
  }, []);
  const handleCloseQuotaModalForm = () => {
    setOpen(false);
  };
  const handleCloseQuotaModalCancel = () => {
    setOpenCancel(false);
  };
  const _columns = useMemo(() => {
    return [
      contractCodeCol,
      contractNameCol,
      contractAtCol,
      contractExpireCol,
      providerCol,
      quotaUnitCol,
      quotaUsedCol,
      quotaRemainCol,
      statusCol,
      operationCol(handleCancelQuota)
    ];
  }, [handleCancelQuota]);
  return (
    <>
      <Card>
        <Title level={4}>{t([`tab.${serviceActive}` as any])}</Title>
        <div className="mb-2 flex flex-wrap justify-between gap-2">
          <Space>
            <QuotaDropdown serviceActive={serviceActive} setServiceActive={setServiceActive} />
            <AppButton type="primary" ghost onClick={handleAddQuota} iconType="add" size="middle">
              button:add_quota
            </AppButton>
          </Space>
          <div>
            {quotaRemain?.map((item) => (
              <QuotaRemainItem {...item} key={item.title} />
            ))}
          </div>
        </div>
        <SearchPageCore columns={_columns} loadData={handleLoadData} />
      </Card>
      <QuotaModalForm
        isOpen={open}
        onClose={handleCloseQuotaModalForm}
        service={serviceActive}
        getData={fetchPartnerData}
      />
      <QuotaModalCancel
        isOpen={openCancel}
        onClose={handleCloseQuotaModalCancel}
        data={dataActive}
        getData={fetchPartnerData}
        quotaType={serviceActive}
      />
    </>
  );
};

export default QuotaPartnerTable;

type QuotaRemainItemProps = QuotaRemain;

const QuotaRemainItem: React.FC<QuotaRemainItemProps> = ({ total = 0, remain = 0, title }) => {
  const percent = useMemo(() => {
    if (!total) return 0;
    return Number(((remain / total) * 100).toFixed(2));
  }, [remain, total]);

  const color = useMemo(() => {
    if (percent > 80) {
      return colors.green['600'];
    } else if (percent > 30) {
      return colors.blue['600'];
    } else if (percent > 0) {
      return colors.red[600];
    } else {
      return colors.zinc[600];
    }
  }, [percent]);
  return (
    <>
      <div className="flex flex-col gap-x-2 md:flex-row">
        <span className="flex-1 text-[13px]">{title}</span>
        <Progress percent={percent} strokeColor={color} showInfo={false} className="!mb-0 min-w-[300px] flex-1" />
      </div>
      <div className="text-right text-[13px]">
        {formatNumber(remain)}/{formatNumber(total)}
      </div>
    </>
  );
};
