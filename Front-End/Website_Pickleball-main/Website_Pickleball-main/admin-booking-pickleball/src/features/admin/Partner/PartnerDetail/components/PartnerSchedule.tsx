import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';

import ExportSettingTable from '@/core/components/sessions/Reconcile/ExportSettingTable';
import { ScheduleType } from '@/core/schemas/partner.schema';
import { PartnerService } from '@/core/services';
import { SearchParamsValue } from '@/core/types';
import { Card } from 'antd';

type PartnerScheduleProps = {};

const PartnerSchedule: React.FC<PartnerScheduleProps> = () => {
  const { id } = useParams();
  const handleUpdateType = useCallback(
    async (serviceCode: ServiceCode, value: ScheduleType) => {
      await PartnerService.createSchedule(id!, { service_code: serviceCode, type: value });
    },
    [id]
  );

  const handleLoadData = useCallback((params: SearchParamsValue) => PartnerService.getScheduleList(id!, params), [id]);
  return (
    <Card>
      <ExportSettingTable onEdit={handleUpdateType} fetchData={handleLoadData} />
    </Card>
  );
};

export default PartnerSchedule;
