import React from 'react';
import colors from 'tailwindcss/colors';

import { AppStatus } from '@/core/components';
import { PartnerStatus } from '@/core/types';
import { PartnerStatusEnum } from '@/utils/enums';

interface PartnerStatusTagProps {
  status: PartnerStatus;
}

const PartnerStatusTag: React.FC<PartnerStatusTagProps> = ({ status }) => {
  return (
    <AppStatus
      type="badge"
      color={status === 'active' ? colors.green[500] : colors.red[500]}
      text={PartnerStatusEnum[status]}
    />
  );
};

export default PartnerStatusTag;
