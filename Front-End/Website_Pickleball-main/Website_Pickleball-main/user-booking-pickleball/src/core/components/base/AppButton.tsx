import Button, { ButtonProps } from 'antd/es/button';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

type AppButtonProps = ButtonProps & {
  iconType?: 'add' | 'edit' | 'search' | 'download' | 'delete' | 'excel';
};

const AppButton: React.FC<AppButtonProps> = ({ children, icon, iconType, ...props }) => {
  const { t } = useTranslation();

  const _icon = useMemo(() => {
    if (icon) return icon;
    switch (iconType) {
      case 'add':
        return <i className="far fa-plus" />;
      case 'edit':
        return <i className="fa-solid fa-pen-to-square" />;
      case 'search':
        return <i className="fa-sharp fa-regular fa-magnifying-glass" />;
      case 'download':
        return <i className="fa-solid fa-download"></i>;
      case 'delete':
        return <i className="fa-solid fa-trash text-red-500" />;
      case 'excel':
        return <i className="fa-solid fa-file-excel" />;

      default:
    }
  }, [icon, iconType]);

  const _children = useMemo(() => {
    if (typeof children === 'string') return t([children as any]);
    return children;
  }, [children, t]);
  return (
    <Button {...props} icon={_icon}>
      {_children}
    </Button>
  );
};

export default AppButton;
