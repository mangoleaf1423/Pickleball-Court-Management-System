import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import colors from 'tailwindcss/colors';

import AppStatus from '../../base/AppStatus';

type BaseTransactionStatusProps = {
  transactionType?: 'status' | 'authenticate' | 'ekyc';
  success?: boolean;
  type?: 'badge' | 'tag';
};

const BaseTransactionStatus: React.FC<BaseTransactionStatusProps> = ({
  transactionType = 'status',
  success,
  type = 'badge'
}) => {
  const { t } = useTranslation(['status']);

  const text = useMemo(() => {
    switch (transactionType) {
      case 'status':
        return success ? t(['status:success']) : t(['status:fail']);
      case 'authenticate':
        return success ? t(['status:verify_success']) : t(['status:verify_fail']);
      case 'ekyc':
        return success ? t(['status:ekyc_success']) : t(['status:ekyc_fail']);

      default:
        return success ? t(['status:success']) : t(['status:fail']);
    }
  }, [transactionType, success, t]);
  if (type === 'badge') {
    return <AppStatus type={type} text={text} color={success ? colors.green[500] : colors.red[500]} />;
  }
  return (
    <AppStatus type={type} color={success ? colors.green[500] : colors.red[500]}>
      {text}
    </AppStatus>
  );
};

export default BaseTransactionStatus;
