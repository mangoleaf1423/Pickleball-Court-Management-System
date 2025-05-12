import { Pagination, PaginationProps } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface AppPaginationProps extends PaginationProps {}

const AppPagination: React.FC<AppPaginationProps> = ({ ...props }) => {
  const { t } = useTranslation(['common']);
  return (
    <div className="flex justify-end">
      <Pagination
        className="w-max"
        {...props}
        showTotal={(total, range) => t('pagination', { from: range[0], to: range[1], total: total })}
      />
    </div>
  );
};

export default AppPagination;
