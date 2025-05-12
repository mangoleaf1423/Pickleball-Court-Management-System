import { DownOutlined } from '@ant-design/icons';
import { Dropdown, DropdownProps, MenuProps } from 'antd';
import React, { useEffect, useState } from 'react';

import { ReactComponent as CloseIcon } from '@/assets/images/close.svg';
import AppButton from './AppButton';

type DropdownItemProps = DropdownProps & {
  value?: string;
  onChange?: (value?: string) => void;
  placeholder?: string;
  text?: string;
  textRender?: (value?: string) => string | undefined;
};

const DropdownItem = React.forwardRef(
  ({ value, onChange, menu, placeholder, textRender, ...props }: DropdownItemProps) => {
    const [selectedKey, setSelectedKey] = useState<string | undefined>(value);
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
      return () => {
        setSelectedKey(undefined);
        // onChange?.(undefined);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleClickItem: MenuProps['onClick'] = ({ key }) => {
      setSelectedKey(key);
      onChange?.(key);
    };
    const handleMouseEnter = () => {
      setHovered(true);
    };

    const handleMouseLeave = () => {
      setHovered(false);
    };

    const handleClearDropdown = () => {
      onChange?.(undefined);
      setSelectedKey(undefined);
    };
    return (
      <Dropdown
        menu={{ selectedKeys: [value ?? selectedKey ?? ''], selectable: true, ...menu, onClick: handleClickItem }}
        {...props}
      >
        <AppButton onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="w-full">
          <div className="flex w-full items-center justify-between">
            <span className="flex-1 text-left">
              {textRender?.(selectedKey) ?? value ?? (
                <span className="text-gray-300">{placeholder ?? 'Placeholder'}</span>
              )}
            </span>
            {hovered && selectedKey ? (
              <CloseIcon className="text-gray-300 hover:cursor-pointer" onClick={handleClearDropdown} height={12} />
            ) : (
              <DownOutlined className="text-xs text-gray-300" />
            )}
          </div>
        </AppButton>
      </Dropdown>
    );
  }
);

DropdownItem.displayName = 'DropdownItem';

export default DropdownItem;
