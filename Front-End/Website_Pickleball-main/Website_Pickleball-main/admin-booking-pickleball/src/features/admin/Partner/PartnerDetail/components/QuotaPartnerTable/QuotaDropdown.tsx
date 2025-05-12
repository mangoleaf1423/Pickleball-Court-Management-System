import { DownOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps } from 'antd';
import React, { useState } from 'react';

import { AppButton } from '@/core/components';
import { ServiceEnum } from '@/core/enums';
import { AppHelper } from '@/utils/helpers';

type QuotaDropdownProps = {
  serviceActive: ServiceCode;
  setServiceActive: (key: ServiceCode) => void;
};

const QuotaDropdown: React.FC<QuotaDropdownProps> = ({ serviceActive, setServiceActive }) => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([serviceActive]);
  const handleClickItem: MenuProps['onClick'] = ({ key }) => {
    setSelectedKeys([key]);
    setServiceActive(key as ServiceCode);
  };

  return (
    <Dropdown
      menu={{ items: AppHelper.getQuotaItems(), selectable: true, onClick: handleClickItem, selectedKeys }}
      className="w-[250px]"
    >
      <AppButton>
        <div className="flex w-full justify-between">
          {ServiceEnum[serviceActive]}
          <DownOutlined />
        </div>
      </AppButton>
    </Dropdown>
  );
};

export default QuotaDropdown;
