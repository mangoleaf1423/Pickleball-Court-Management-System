import { Tabs } from 'antd';
import { Tab } from 'rc-tabs/lib/interface';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';

import QuotaPartner from '@/core/components/sessions/QuotaPartner';
import { quotaRemainMap } from '@/core/constants/partner.constant';
import { Partner, SearchParamsValue } from '@/core/types';
import { useApp } from '@/store';
import { QuotaService } from '@/core/services';

interface QuotaTabProps {
  data: Partner | null;
  getData: () => void;
}

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
  DC_V: QuotaService.getQuotaDecodeChipVerifyList,
  GD: QuotaService.getQuotaGtinDetailList,
  TC_ADV: QuotaService.getQuotaTaxCodeAdvancedList,
  TC_BASIC: QuotaService.getQuotaTaxCodeBasicList
};

const QuotaTab: React.FC<QuotaTabProps> = ({ data, getData }) => {
  const [searchParams, setSearchParams] = useSearchParams([]);
  const [activeKey, setActiveKey] = useState<ServiceCode>((searchParams.get('service') ?? 'V') as ServiceCode);

  const { servicesEnable } = useApp();

  const { t } = useTranslation(['partner']);

  const handleLoadData = useCallback(
    (params: SearchParamsValue, item: ServiceCode) => {
      return quotaTypeMapAPIGet[item]!(data?.id ?? -1, params);
    },
    [data]
  );
  const quotaRemain = useCallback(
    (service: ServiceCode) => {
      const quotaRemain = quotaRemainMap[service]?.filter(
        (item) => servicesEnable[service].enable && servicesEnable[service].quotaTypes.includes(item.transactionType)
      );
      return quotaRemain?.map((item) => ({
        title: t([item.title as any]),
        total: Number(data?.[item.total] ?? 0),
        remain: Number(data?.[item.remain] ?? 0)
      }));
    },
    [data, t, servicesEnable]
  );

  const items: Tab[] = useMemo(() => {
    const allTabs: ServiceCode[] = ['V', 'C', 'O', 'F', 'L', 'EL', 'DC', 'T', 'GV', 'DC_V', 'GD', 'TC_ADV', 'TC_BASIC'];
    const tabs = allTabs.filter((item) => servicesEnable[item].enable);
    return tabs.map((item) => ({
      label: t([`tab.${item}` as any]),
      key: item,
      children: (
        <QuotaPartner
          loadData={(params) => handleLoadData(params, item)}
          quotaType={item}
          quotaRemain={quotaRemain(item)}
          fetchData={getData}
        />
      )
    }));
  }, [t, handleLoadData, getData, quotaRemain, servicesEnable]);

  const handleChangeTab = (activeKey: string) => {
    setActiveKey(activeKey as ServiceCode);
    searchParams.set('service', activeKey);
    setSearchParams(searchParams, { replace: true });
  };

  return <Tabs className={'partner-tabs'} items={items} type="card" activeKey={activeKey} onChange={handleChangeTab} />;
};

export default QuotaTab;
