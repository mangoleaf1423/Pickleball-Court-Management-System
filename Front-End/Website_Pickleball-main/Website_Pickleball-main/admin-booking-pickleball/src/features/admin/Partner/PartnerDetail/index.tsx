import { Button, Tabs } from 'antd';
import { Tab } from 'rc-tabs/lib/interface';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { AppPageHeader } from '@/core/components';
import { PartnerService } from '@/core/services';
import { Partner } from '@/core/types';
import { usePartner } from '@/store';
import APIKey from './components/APIKey';
import PartnerInfo from './components/PartnerInfo';
import QuotaPartnerTable from './components/QuotaPartnerTable/QuotaPartnerTable';
import PartnerSchedule from './components/PartnerSchedule';

export interface InfoProps {
  label: string;
  dataIndex: keyof Partner;
  render?: ([key]: any) => any;
}
type ActiveKey = 'info' | 'key' | 'quota';

const PartnerDetail = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [activeKey, setActiveKey] = useState<ActiveKey>((searchParams.get('tab') ?? 'info') as ActiveKey);

  const { t } = useTranslation('partner');
  const { setPartnerData } = usePartner();

  const fetchPartnerById = useCallback(async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const res = await PartnerService.getPartnerById(id);
      if (res.success) {
        setPartnerData(res.data);
        setPartner(res.data || null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, setPartnerData]);

  useEffect(() => {
    fetchPartnerById();
  }, [fetchPartnerById]);

  const items: Tab[] = useMemo(() => {
    const items = [
      {
        label: (
          <div className="flex items-center gap-x-2">
            <i className="fa-solid fa-circle-info" />
            <div>{t(['tab.detail'])}</div>
          </div>
        ),
        key: 'info',
        children: <PartnerInfo data={partner} isLoading={isLoading} />
      },
      {
        label: (
          <div className="flex items-center gap-x-2">
            <i className="fa-solid fa-calendar-days" />
            <div>{t(['tab.schedule'])}</div>
          </div>
        ),
        key: 'schedule',
        children: <PartnerSchedule />
      },
      {
        label: (
          <div className="flex items-center gap-x-2">
            <i className="fa-sharp fa-solid fa-key" />
            <div>{t(['tab.api_key'])}</div>
          </div>
        ),
        key: 'key',
        children: <APIKey data={partner} />
      }
    ];
    if (partner?.partner_type === 'pre_paid_agent') {
      items.splice(1, 0, {
        label: (
          <div className="flex items-center gap-x-2">
            <i className="fa-solid fa-chart-pie-simple" />
            <div>{t(['tab.quota'])}</div>
          </div>
        ),
        key: 'quota',
        children: <QuotaPartnerTable fetchPartnerData={fetchPartnerById} />
      });
    }
    return items;
  }, [t, partner, fetchPartnerById, isLoading]);

  const handleChangeTab = (activeKey: string) => {
    setActiveKey(activeKey as ActiveKey);
    searchParams.set('tab', activeKey);
    setSearchParams(searchParams, { replace: true });
  };

  const handleBack = () => {
    const canGoBack = window.history.state.idx !== 0;
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate('/partners');
    }
    console.log('state: ', window.history.state);
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-y-4 pb-4">
      <div className="flex items-center justify-between">
        <AppPageHeader onBack={() => handleBack()}>{t(['header'])}</AppPageHeader>

        <Button type="primary" ghost onClick={() => navigate(`/partners/edit/${id}`)}>
          <i className="fa-solid fa-pen-to-square pr-2" />
          {t(['edit_partner'])}
        </Button>
      </div>
      <Tabs className={'partner-tabs'} items={items} type="card" activeKey={activeKey} onChange={handleChangeTab} />
    </div>
  );
};

export default PartnerDetail;
