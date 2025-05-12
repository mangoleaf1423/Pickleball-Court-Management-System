import { Badge, BadgeProps, Tag, TagProps } from 'antd';
import React from 'react';

type AppStatusProps =
  | ({
      type: 'badge';
    } & BadgeProps)
  | ({
      type: 'tag';
    } & TagProps);

const AppStatus: React.FC<AppStatusProps> = ({ type, ...props }) => {
  if (type === 'badge') {
    return <Badge status="processing" {...props} />;
  }
  return <Tag {...props} />;
};

export default AppStatus;
