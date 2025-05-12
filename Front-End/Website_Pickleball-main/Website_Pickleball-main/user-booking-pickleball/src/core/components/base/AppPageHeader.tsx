import { Tooltip } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { twMerge } from 'tailwind-merge';

interface PageHeaderProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onBack?: () => void;
}

const AppPageHeader: React.FC<PageHeaderProps> = ({ children, className, onBack, icon }) => {
  const { t } = useTranslation(['common']);
  return (
    <div className={twMerge('flex items-center gap-x-4', className)}>
      <Tooltip title={t(['back'])}>
        <span className="flex h-6 w-6 cursor-pointer items-center justify-center" onClick={onBack}>
          {icon ?? <i className="fa-solid fa-arrow-left cursor-pointer text-xl" />}
        </span>
      </Tooltip>
      <h2 className="text-xl font-semibold">{children}</h2>
    </div>
  );
};

export default AppPageHeader;
